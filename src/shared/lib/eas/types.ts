export type SchemaVersion = 'v1' | 'v2' | 'v3';

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
  version?: string; // v1/v2 only; v3 derives from chain depth
  previousVersionId: string;
  votingTxHash?: string;
  votingChainId?: number;
  schemaVersion: SchemaVersion;
}

/**
 * Result of an EAS attestation transaction.
 * Extracts attestationUID and transactionHash from the EAS SDK's Transaction object.
 */
export interface EASAttestResult {
  attestationUID: string;
  transactionHash: string;
}

/**
 * Extract attestation UID and transaction hash from an EAS Transaction.
 *
 * EAS SDK v2's `Transaction<string>.wait()` returns the attestation UID directly.
 * The underlying ethers TransactionResponse is held privately, so we access `hash`
 * via property inspection as a fallback.
 */
export async function resolveEASTransaction(tx: {
  wait: (confirmations?: number) => Promise<string>;
}): Promise<EASAttestResult> {
  const attestationUID = await tx.wait();

  if (!attestationUID || !attestationUID.startsWith('0x')) {
    throw new Error('Attestation UID をトランザクションから取得できませんでした');
  }

  // The EAS SDK's Transaction wraps an ethers TransactionResponse.
  // Access the hash safely from the object.
  let transactionHash = '';
  const txObj = tx as Record<string, unknown>;
  if (typeof txObj.hash === 'string') {
    transactionHash = txObj.hash;
  } else if (txObj.tx && typeof txObj.tx === 'object') {
    const inner = txObj.tx as Record<string, unknown>;
    if (typeof inner.hash === 'string') {
      transactionHash = inner.hash;
    }
  }

  return { attestationUID, transactionHash };
}
