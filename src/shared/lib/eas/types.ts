export type SchemaVersion = 'v1' | 'v2';

export interface EASAttestation {
  id: string;
  attester: string;
  recipient: string;
  revocable: boolean;
  revoked: boolean;
  time: number;
  data: string;
  decodedDataJson: string;
  schemaId: string;
}

export interface DecodedDAOData {
  daoName: string;
  daoDescription: string;
  daoLocation: string;
  memberCount: number;
  daoSize: string;
  daoUID: string;
}

export interface DecodedDocumentData {
  daoAttestationUID: string;
  documentTitle: string;
  documentType: string;
  documentHash: string;
  ipfsCid: string;
  version: string;
  previousVersionId: string;
  votingTxHash?: string;
  votingChainId?: number;
  schemaVersion: SchemaVersion;
}
