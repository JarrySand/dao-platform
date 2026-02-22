import {
  getDocumentsByDAO,
  getDocumentByUID,
  filterByDAOUID,
  executeEASQuery,
} from '@/shared/lib/eas';
import type { EASAttestation } from '@/shared/lib/eas';
import { CHAIN_CONFIG } from '@/config/chains';
import { buildDocumentFromAttestation } from './documentService';
import type { Document, DocumentFilters, DocumentType } from '../types';

const schemas = CHAIN_CONFIG.sepolia.schemas;

const ATTESTATION_FIELDS = `
  id
  attester
  recipient
  revocable
  revoked
  time
  data
  decodedDataJson
  schemaId
`;

export async function queryDocumentsByDAO(
  daoUID: string,
  filters?: Omit<DocumentFilters, 'daoId'>,
): Promise<Document[]> {
  const v2Attestations = await getDocumentsByDAO(daoUID);

  // Also query v1 documents if the schema UID is available
  let v1Attestations: EASAttestation[] = [];
  if (schemas.documentV1.uid !== schemas.documentV2.uid) {
    try {
      const result = await executeEASQuery<{ attestations: EASAttestation[] }>(
        `query GetV1Documents($schemaId: String!, $limit: Int!) {
          attestations(
            where: {
              schemaId: { equals: $schemaId }
              revoked: { equals: false }
            }
            orderBy: { time: desc }
            take: $limit
          ) {
            ${ATTESTATION_FIELDS}
          }
        }`,
        { schemaId: schemas.documentV1.uid, limit: 100 },
      );
      v1Attestations = filterByDAOUID(result.attestations, daoUID);
    } catch {
      // v1 query failure is non-critical
    }
  }

  const merged = mergeV1V2Documents(
    v1Attestations.map(buildDocumentFromAttestation),
    v2Attestations.map(buildDocumentFromAttestation),
  );

  return applyFilters(merged, filters);
}

export async function queryDocumentByUID(uid: string): Promise<Document | null> {
  const attestation = await getDocumentByUID(uid);
  if (!attestation) return null;
  return buildDocumentFromAttestation(attestation);
}

export function mergeV1V2Documents(v1Docs: Document[], v2Docs: Document[]): Document[] {
  const seen = new Set<string>();
  const result: Document[] = [];

  // v2 takes precedence
  for (const doc of v2Docs) {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      result.push(doc);
    }
  }

  for (const doc of v1Docs) {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      result.push(doc);
    }
  }

  // Sort by createdAt descending
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return result;
}

function applyFilters(docs: Document[], filters?: Omit<DocumentFilters, 'daoId'>): Document[] {
  if (!filters) return docs;

  let result = docs;

  if (filters.type) {
    result = result.filter((doc) => doc.documentType === filters.type);
  }

  if (filters.status) {
    result = result.filter((doc) => doc.status === filters.status);
  }

  if (filters.txHash) {
    result = result.filter((doc) => doc.votingTxHash === filters.txHash);
  }

  return result;
}
