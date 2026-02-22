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
}

export interface FirebaseDocumentData {
  title: string;
  documentType: string;
  hash: string;
  ipfsCid: string;
  version: string;
  status: 'active' | 'revoked';
  daoId: string;
  attestationUID: string;
  createdAt: string;
  updatedAt: string;
}
