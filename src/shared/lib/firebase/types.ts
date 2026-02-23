export interface FirebaseDAOData {
  name: string;
  description: string;
  location: string;
  memberCount: number;
  size: string;
  status: 'active' | 'inactive' | 'pending';
  logoUrl: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
  adminAddress: string;
  attestationUID: string;
  createdAt: string;
  updatedAt: string;
  // EAS sync fields
  attester?: string;
  easTime?: number;
  revoked?: boolean;
  source?: 'eas' | 'pending';
}

export interface FirebaseDocumentData {
  title: string;
  documentType: string;
  hash: string;
  ipfsCid: string;
  version: number; // Derived from previousVersionId chain depth
  status: 'active' | 'revoked';
  daoId: string;
  attestationUID: string;
  createdAt: string;
  updatedAt: string;
  // EAS sync fields
  attester?: string;
  easTime?: number;
  revoked?: boolean;
  source?: 'eas' | 'pending';
  previousVersionId?: string | null;
  votingTxHash?: string | null;
  votingChainId?: number | null;
  relatedDocumentIds?: string[];
}

export interface SyncMeta {
  syncedAt: string;
  status: 'idle' | 'running';
  daoCount: number;
  documentCount: number;
}
