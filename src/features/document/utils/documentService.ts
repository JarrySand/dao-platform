import { decodeDocumentData } from '@/shared/lib/eas';
import type { EASAttestation } from '@/shared/lib/eas';
import { CHAIN_CONFIG } from '@/config/chains';
import type { Document, DocumentType, DocumentStatus } from '../types';

const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'articles',
  'meeting',
  'token',
  'operation',
  'voting',
  'other',
];

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

function normalizeDocumentType(raw: string): DocumentType {
  const lower = raw.toLowerCase() as DocumentType;
  if (VALID_DOCUMENT_TYPES.includes(lower)) return lower;
  return 'other';
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
    version: decoded.version || '1.0',
    previousVersionId: isZeroBytes32(decoded.previousVersionId) ? null : decoded.previousVersionId,
    status,
    attester: attestation.attester,
    votingTxHash:
      decoded.votingTxHash && !isZeroBytes32(decoded.votingTxHash) ? decoded.votingTxHash : null,
    votingChainId: decoded.votingChainId || null,
    schemaVersion: decoded.schemaVersion,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function determineSchemaVersion(schemaId: string): 'v1' | 'v2' {
  const schemas = CHAIN_CONFIG.sepolia.schemas;
  if (schemaId === schemas.documentV1.uid) return 'v1';
  if (schemaId === schemas.documentV2.uid) return 'v2';
  return 'v2';
}
