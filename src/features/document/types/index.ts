import { z } from 'zod';

// --- Category types ---

export type RegulationType =
  | 'articles'
  | 'assembly_rules'
  | 'operation_rules'
  | 'token_rules'
  | 'custom_rules';

export type OtherDocumentType = 'proposal' | 'minutes';

export type DocumentType = RegulationType | OtherDocumentType;

export const REGULATION_TYPES: RegulationType[] = [
  'articles',
  'assembly_rules',
  'operation_rules',
  'token_rules',
  'custom_rules',
];

export const OTHER_DOCUMENT_TYPES: OtherDocumentType[] = ['proposal', 'minutes'];

export function isRegulationType(type: string): type is RegulationType {
  return (REGULATION_TYPES as string[]).includes(type);
}

export function isOtherDocumentType(type: string): type is OtherDocumentType {
  return (OTHER_DOCUMENT_TYPES as string[]).includes(type);
}

// --- Document model ---

export type DocumentStatus = 'active' | 'revoked';

export interface Document {
  id: string; // EAS attestation UID
  daoId: string; // DAO attestation UID
  title: string;
  documentType: DocumentType;
  hash: string; // SHA-256 hash
  ipfsCid: string;
  version: number; // Derived from previousVersionId chain depth
  previousVersionId: string | null;
  status: DocumentStatus;
  attester: string; // wallet address
  votingTxHash: string | null;
  votingChainId: number | null;
  relatedDocumentIds: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Form validation ---

export const registerDocumentSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200),
  documentType: z.enum([
    'articles',
    'assembly_rules',
    'operation_rules',
    'token_rules',
    'custom_rules',
    'proposal',
    'minutes',
  ]),
  previousVersionId: z.string().optional().nullable(),
  votingTxHash: z.string().optional().nullable(),
  votingChainId: z.number().optional().nullable(),
});

export type RegisterDocumentFormData = z.infer<typeof registerDocumentSchema>;

export interface DocumentFilters {
  daoId: string;
  type?: DocumentType;
  status?: DocumentStatus;
  txHash?: string;
}

export interface ProposalDocumentFields {
  votingTxHash: string;
  votingChainId: number;
}

export interface DocumentRegistrationProgress {
  step: 'hashing' | 'uploading' | 'attesting' | 'caching' | 'complete';
  message: string;
  progress: number; // 0-100
}

export interface DocumentRegistrationResult {
  attestationUID: string;
  documentHash: string;
  ipfsCid: string;
  transactionHash: string;
}

export interface TransactionInfo {
  blockNumber: number;
  timestamp: number;
  txHash: string;
  chainId: number;
}
