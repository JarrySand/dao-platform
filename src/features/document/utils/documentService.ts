import { decodeDocumentData } from '@/shared/lib/eas';
import type { EASAttestation } from '@/shared/lib/eas';
import type { Document, DocumentType, DocumentStatus } from '../types';
import { REGULATION_TYPES, OTHER_DOCUMENT_TYPES } from '../types';

const ALL_DOCUMENT_TYPES: DocumentType[] = [...REGULATION_TYPES, ...OTHER_DOCUMENT_TYPES];

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

function normalizeDocumentType(raw: string): DocumentType {
  const lower = raw.toLowerCase() as DocumentType;
  if (ALL_DOCUMENT_TYPES.includes(lower)) return lower;
  return 'custom_rules';
}

function isZeroBytes32(value: string): boolean {
  return !value || value === ZERO_BYTES32;
}

export function buildDocumentFromAttestation(attestation: EASAttestation): Document {
  const decoded = decodeDocumentData(attestation.decodedDataJson);
  const status: DocumentStatus = attestation.revoked ? 'revoked' : 'active';
  const timestamp = new Date(attestation.time * 1000).toISOString();

  return {
    id: attestation.id,
    daoId: decoded.daoAttestationUID,
    title: decoded.documentTitle,
    documentType: normalizeDocumentType(decoded.documentType),
    hash: decoded.documentHash,
    ipfsCid: decoded.ipfsCid,
    version: 1, // placeholder; computed from chain depth when synced
    previousVersionId: isZeroBytes32(decoded.previousVersionId) ? null : decoded.previousVersionId,
    status,
    attester: attestation.attester,
    votingTxHash:
      decoded.votingTxHash && !isZeroBytes32(decoded.votingTxHash) ? decoded.votingTxHash : null,
    votingChainId: decoded.votingChainId || null,
    relatedDocumentIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
