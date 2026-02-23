import type { FirebaseDAOData, FirebaseDocumentData } from './types';
import type { DAO } from '@/features/dao/types';
import type { Document, DocumentType } from '@/features/document/types';

export function firestoreToDAO(id: string, fb: FirebaseDAOData): DAO {
  return {
    id,
    name: fb.name,
    description: fb.description,
    location: fb.location,
    memberCount: fb.memberCount,
    size: fb.size || 'small',
    status: fb.status,
    logoUrl: fb.logoUrl || '',
    website: fb.website || '',
    contactPerson: fb.contactPerson || '',
    contactEmail: fb.contactEmail || '',
    adminAddress: fb.adminAddress || fb.attester || '',
    attestationUID: fb.attestationUID || id,
    trustScore: 0,
    foundingDate: fb.easTime || 0,
    createdAt: fb.createdAt || '',
    updatedAt: fb.updatedAt || '',
  };
}

export function firestoreToDocument(id: string, fb: FirebaseDocumentData): Document {
  return {
    id,
    daoId: fb.daoId,
    title: fb.title,
    documentType: fb.documentType as DocumentType,
    hash: fb.hash,
    ipfsCid: fb.ipfsCid,
    version: typeof fb.version === 'number' ? fb.version : Number(fb.version) || 1,
    previousVersionId: fb.previousVersionId ?? null,
    status: fb.revoked ? 'revoked' : (fb.status ?? 'active'),
    attester: fb.attester || '',
    votingTxHash: fb.votingTxHash ?? null,
    votingChainId: fb.votingChainId ?? null,
    relatedDocumentIds: fb.relatedDocumentIds ?? [],
    createdAt: fb.createdAt,
    updatedAt: fb.updatedAt,
  };
}
