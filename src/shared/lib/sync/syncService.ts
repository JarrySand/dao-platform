import { doc, getDoc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDAOData, FirebaseDocumentData, SyncMeta } from '@/shared/lib/firebase/types';
import { COLLECTIONS } from '@/shared/lib/firebase/collections';
import { CHAIN_CONFIG } from '@/config/chains';
import { executeEASQuery } from '@/shared/lib/eas/graphql';
import { getDAOByUID } from '@/shared/lib/eas/queries';
import { decodeDAOData, decodeDocumentData } from '@/shared/lib/eas/schema';
import type { EASAttestation } from '@/shared/lib/eas/types';
import { logger } from '@/shared/utils/logger';

const schemas = CHAIN_CONFIG.sepolia.schemas;
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const SYNC_META_DOC = 'status';

// --- Sync Meta helpers ---

export async function getSyncStatus(): Promise<SyncMeta> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SYNC_META, SYNC_META_DOC));
    if (snap.exists()) return snap.data() as SyncMeta;
  } catch {
    // best-effort
  }
  return { syncedAt: '', status: 'idle', daoCount: 0, documentCount: 0 };
}

export async function shouldSync(): Promise<boolean> {
  const meta = await getSyncStatus();
  if (meta.status === 'running') return false;
  if (!meta.syncedAt) return true;
  const elapsed = Date.now() - new Date(meta.syncedAt).getTime();
  return elapsed > SYNC_INTERVAL_MS;
}

async function setSyncMeta(update: Partial<SyncMeta>): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.SYNC_META, SYNC_META_DOC), update, { merge: true });
}

// --- EAS -> Firestore conversion ---

function attestationToDAOData(att: EASAttestation): FirebaseDAOData {
  const decoded = decodeDAOData(att.decodedDataJson);
  return {
    name: decoded.daoName,
    description: decoded.daoDescription,
    location: decoded.daoLocation,
    memberCount: decoded.memberCount,
    size: decoded.daoSize || 'small',
    status: att.revoked ? 'inactive' : 'active',
    logoUrl: '',
    website: '',
    contactPerson: '',
    contactEmail: '',
    adminAddress: decoded.daoName ? att.attester : '', // fallback
    attestationUID: att.id,
    createdAt: new Date(att.time * 1000).toISOString(),
    updatedAt: new Date(att.time * 1000).toISOString(),
    attester: att.attester,
    easTime: att.time,
    revoked: att.revoked,
    source: 'eas',
  };
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

function attestationToDocumentData(att: EASAttestation): FirebaseDocumentData {
  const decoded = decodeDocumentData(att.decodedDataJson);
  const previousVersionId = decoded.previousVersionId || null;
  return {
    title: decoded.documentTitle,
    documentType: decoded.documentType,
    hash: decoded.documentHash,
    ipfsCid: decoded.ipfsCid,
    version: 1, // placeholder; computed during sync from chain depth
    status: att.revoked ? 'revoked' : 'active',
    daoId: decoded.daoAttestationUID,
    attestationUID: att.id,
    createdAt: new Date(att.time * 1000).toISOString(),
    updatedAt: new Date(att.time * 1000).toISOString(),
    attester: att.attester,
    easTime: att.time,
    revoked: att.revoked,
    source: 'eas',
    previousVersionId: previousVersionId === ZERO_BYTES32 ? null : previousVersionId,
    votingTxHash: decoded.votingTxHash ?? null,
    votingChainId: decoded.votingChainId ?? null,
  };
}

async function computeVersion(previousVersionId: string | null): Promise<number> {
  if (!previousVersionId || previousVersionId === ZERO_BYTES32) return 1;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.DOCUMENTS, previousVersionId));
    if (snap.exists()) {
      const prev = snap.data() as FirebaseDocumentData;
      const prevVersion = typeof prev.version === 'number' ? prev.version : 1;
      return prevVersion + 1;
    }
  } catch {
    // best-effort
  }
  return 1;
}

// --- EAS queries for sync (include revoked records) ---

async function getAllDAOAttestations(limit = 500): Promise<EASAttestation[]> {
  const result = await executeEASQuery<{ attestations: EASAttestation[] }>(
    `query GetAllDAOsForSync($schemaId: String!, $limit: Int!) {
      attestations(
        where: { schemaId: { equals: $schemaId } }
        orderBy: { time: desc }
        take: $limit
      ) {
        id attester recipient revocable revoked time data decodedDataJson schemaId
      }
    }`,
    { schemaId: schemas.dao.uid, limit },
  );
  return result.attestations;
}

async function getAllDocumentAttestations(limit = 500): Promise<EASAttestation[]> {
  const result = await executeEASQuery<{ attestations: EASAttestation[] }>(
    `query GetAllDocuments($schemaId: String!, $limit: Int!) {
      attestations(
        where: { schemaId: { equals: $schemaId } }
        orderBy: { time: desc }
        take: $limit
      ) {
        id attester recipient revocable revoked time data decodedDataJson schemaId
      }
    }`,
    { schemaId: schemas.documentV3.uid, limit },
  );

  return result.attestations;
}

export async function syncAll(): Promise<{ daoCount: number; documentCount: number }> {
  // Mark as running
  await setSyncMeta({ status: 'running' });

  try {
    // Read existing Firestore data to preserve user-edited fields
    const existingDAOs = new Map<string, FirebaseDAOData>();
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.DAOS));
      for (const d of snap.docs) {
        existingDAOs.set(d.id, d.data() as FirebaseDAOData);
      }
    } catch {
      // best-effort
    }

    const existingDocs = new Map<string, FirebaseDocumentData>();
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.DOCUMENTS));
      for (const d of snap.docs) {
        existingDocs.set(d.id, d.data() as FirebaseDocumentData);
      }
    } catch {
      // best-effort
    }

    // Fetch all from EAS (including revoked to update status)
    const [daoAttestations, docAttestations] = await Promise.all([
      getAllDAOAttestations(500),
      getAllDocumentAttestations(500),
    ]);

    // Batch write DAOs (Firestore limit: 500 per batch)
    let daoCount = 0;
    for (let i = 0; i < daoAttestations.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = daoAttestations.slice(i, i + 400);
      for (const att of chunk) {
        try {
          const easData = attestationToDAOData(att);
          const existing = existingDAOs.get(att.id);
          // Merge: preserve user-edited fields, update EAS fields
          const merged: FirebaseDAOData = existing
            ? {
                ...easData,
                name: existing.name || easData.name,
                description: existing.description || easData.description,
                location: existing.location || easData.location,
                memberCount: existing.memberCount || easData.memberCount,
                size: existing.size || easData.size,
                logoUrl: existing.logoUrl || '',
                website: existing.website || '',
                contactPerson: existing.contactPerson || '',
                contactEmail: existing.contactEmail || '',
                adminAddress: easData.adminAddress || existing.adminAddress,
                status: att.revoked
                  ? 'inactive'
                  : existing.status === 'inactive'
                    ? 'inactive'
                    : 'active',
              }
            : easData;
          batch.set(doc(db, COLLECTIONS.DAOS, att.id), merged);
          daoCount++;
        } catch (e) {
          logger.warn('sync_skip_dao', {
            id: att.id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      await batch.commit();
    }

    // Batch write Documents (compute version from chain depth)
    let documentCount = 0;

    // Build DAO owner lookup for attester verification
    const daoOwnerMap = new Map<string, string>();
    for (const att of daoAttestations) {
      daoOwnerMap.set(att.id, att.attester.toLowerCase());
    }

    // First pass: convert all attestations to document data (with attester verification)
    const docDataMap = new Map<string, FirebaseDocumentData>();
    for (const att of docAttestations) {
      try {
        const data = attestationToDocumentData(att);
        // Skip documents where attester doesn't match DAO admin
        const daoOwner = daoOwnerMap.get(data.daoId);
        if (!daoOwner || att.attester.toLowerCase() !== daoOwner) {
          logger.warn('sync_skip_unauthorized_document', {
            id: att.id,
            attester: att.attester,
            daoId: data.daoId,
          });
          continue;
        }
        docDataMap.set(att.id, data);
      } catch (e) {
        logger.warn('sync_skip_document', {
          id: att.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    // Second pass: compute versions using chain depth
    for (const [id, data] of docDataMap) {
      if (!data.previousVersionId || data.previousVersionId === ZERO_BYTES32) {
        data.version = 1;
      } else {
        const prev =
          docDataMap.get(data.previousVersionId) || existingDocs.get(data.previousVersionId);
        const prevVersion = prev ? (typeof prev.version === 'number' ? prev.version : 1) : 0;
        data.version = prevVersion + 1;
      }
    }
    // Third pass: batch write
    const docEntries = Array.from(docDataMap.entries());
    for (let i = 0; i < docEntries.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = docEntries.slice(i, i + 400);
      for (const [id, easData] of chunk) {
        try {
          const existing = existingDocs.get(id);
          const merged: FirebaseDocumentData = existing
            ? { ...easData, title: existing.title || easData.title }
            : easData;
          batch.set(doc(db, COLLECTIONS.DOCUMENTS, id), merged);
          documentCount++;
        } catch (e) {
          logger.warn('sync_skip_document', {
            id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      await batch.commit();
    }

    // Remove legacy (non-v3) documents from Firestore.
    // After sync, docDataMap contains only v3 documents that passed validation.
    // Any Firestore doc NOT in this set is a leftover from v1/v2 and should be deleted.
    const v3Ids = new Set(docDataMap.keys());
    const legacyIds = [...existingDocs.keys()].filter((id) => !v3Ids.has(id));
    for (let i = 0; i < legacyIds.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = legacyIds.slice(i, i + 400);
      for (const id of chunk) {
        batch.delete(doc(db, COLLECTIONS.DOCUMENTS, id));
      }
      await batch.commit();
      logger.info('sync_deleted_legacy_documents', { count: chunk.length });
    }

    // Update sync meta
    await setSyncMeta({
      syncedAt: new Date().toISOString(),
      status: 'idle',
      daoCount,
      documentCount,
    });

    return { daoCount, documentCount };
  } catch (error) {
    // Reset status on failure
    await setSyncMeta({ status: 'idle' }).catch(() => {});
    throw error;
  }
}

// --- Single record sync ---

export async function syncOne(uid: string): Promise<void> {
  const attestation = await getDAOByUID(uid);
  if (!attestation) return;

  const isDaoSchema = attestation.schemaId === schemas.dao.uid;

  if (isDaoSchema) {
    const easData = attestationToDAOData(attestation);
    // Preserve existing user-edited fields
    let existing: FirebaseDAOData | null = null;
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.DAOS, uid));
      if (snap.exists()) existing = snap.data() as FirebaseDAOData;
    } catch {
      // best-effort
    }

    const merged = existing
      ? {
          ...easData,
          name: existing.name || easData.name,
          description: existing.description || easData.description,
          location: existing.location || easData.location,
          memberCount: existing.memberCount || easData.memberCount,
          size: existing.size || easData.size,
          logoUrl: existing.logoUrl || '',
          website: existing.website || '',
          contactPerson: existing.contactPerson || '',
          contactEmail: existing.contactEmail || '',
          adminAddress: easData.adminAddress || existing.adminAddress,
        }
      : easData;
    await setDoc(doc(db, COLLECTIONS.DAOS, uid), merged);
  } else {
    const easData = attestationToDocumentData(attestation);

    // Verify attester matches DAO admin (reject unauthorized documents)
    let daoOwner: string | null = null;
    try {
      const daoSnap = await getDoc(doc(db, COLLECTIONS.DAOS, easData.daoId));
      if (daoSnap.exists()) {
        const daoData = daoSnap.data() as FirebaseDAOData;
        daoOwner = daoData.attester || daoData.adminAddress || null;
      }
    } catch {
      // best-effort
    }
    if (!daoOwner) {
      try {
        const daoAtt = await getDAOByUID(easData.daoId);
        if (daoAtt) daoOwner = daoAtt.attester;
      } catch {
        // best-effort
      }
    }
    if (!daoOwner || daoOwner.toLowerCase() !== attestation.attester.toLowerCase()) {
      logger.warn('sync_skip_unauthorized_document', {
        uid,
        attester: attestation.attester,
        daoId: easData.daoId,
        daoOwner,
      });
      return;
    }

    // Compute version from chain depth
    easData.version = await computeVersion(easData.previousVersionId ?? null);

    let existing: FirebaseDocumentData | null = null;
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.DOCUMENTS, uid));
      if (snap.exists()) existing = snap.data() as FirebaseDocumentData;
    } catch {
      // best-effort
    }

    const merged = existing ? { ...easData, title: existing.title || easData.title } : easData;
    await setDoc(doc(db, COLLECTIONS.DOCUMENTS, uid), merged);
  }
}

// --- Lazy sync (fire-and-forget) ---

let isSyncing = false;

export function triggerLazySync(): void {
  if (isSyncing) return;
  isSyncing = true;
  shouldSync()
    .then((needed) => {
      if (needed) return syncAll();
    })
    .catch((error) => {
      logger.error('lazy_sync_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    })
    .finally(() => {
      isSyncing = false;
    });
}
