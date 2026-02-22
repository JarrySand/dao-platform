import { z } from 'zod';

export type DocumentType = 'articles' | 'meeting' | 'token' | 'operation' | 'voting' | 'other';

export type DocumentStatus = 'active' | 'revoked';

export interface Document {
  id: string; // EAS attestation UID
  daoId: string; // DAO attestation UID
  title: string;
  documentType: DocumentType;
  hash: string; // SHA-256 hash
  ipfsCid: string;
  version: string;
  previousVersionId: string | null;
  status: DocumentStatus;
  attester: string; // wallet address
  votingTxHash: string | null;
  votingChainId: number | null;
  schemaVersion: 'v1' | 'v2';
  createdAt: string;
  updatedAt: string;
}

export const registerDocumentSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200),
  documentType: z.enum(['articles', 'meeting', 'token', 'operation', 'voting', 'other']),
  version: z
    .string()
    .min(1, 'バージョンは必須です')
    .regex(/^\d+\.\d+(\.\d+)?$/, 'バージョン形式が不正です (例: 1.0, 1.0.0)'),
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

export interface VotingDocumentFields {
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
