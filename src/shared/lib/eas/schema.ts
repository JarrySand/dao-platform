import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { CHAIN_CONFIG } from '@/config/chains';
import type { DecodedDAOData, DecodedDocumentData, SchemaVersion } from './types';

const schemas = CHAIN_CONFIG.sepolia.schemas;

// DAO schema encoder
const daoEncoder = new SchemaEncoder(schemas.dao.schema);

// Document schema encoders
const documentV2Encoder = new SchemaEncoder(schemas.documentV2.schema);
const documentV3Encoder = new SchemaEncoder(schemas.documentV3.schema);

export function encodeDAOData(data: {
  daoName: string;
  description: string;
  adminAddress: string;
}): string {
  return daoEncoder.encodeData([
    { name: 'daoName', value: data.daoName, type: 'string' },
    { name: 'description', value: data.description, type: 'string' },
    { name: 'adminAddress', value: data.adminAddress, type: 'string' },
  ]);
}

export function encodeDocumentV2Data(data: {
  daoAttestationUID: string;
  documentTitle: string;
  documentType: string;
  documentHash: string;
  ipfsCid: string;
  version: string;
  previousVersionId: string;
  votingTxHash: string;
  votingChainId: number;
}): string {
  return documentV2Encoder.encodeData([
    { name: 'daoAttestationUID', value: data.daoAttestationUID, type: 'bytes32' },
    { name: 'documentTitle', value: data.documentTitle, type: 'string' },
    { name: 'documentType', value: data.documentType, type: 'string' },
    { name: 'documentHash', value: data.documentHash, type: 'bytes32' },
    { name: 'ipfsCid', value: data.ipfsCid, type: 'string' },
    { name: 'version', value: data.version, type: 'string' },
    { name: 'previousVersionId', value: data.previousVersionId, type: 'bytes32' },
    { name: 'votingTxHash', value: data.votingTxHash, type: 'bytes32' },
    { name: 'votingChainId', value: BigInt(data.votingChainId), type: 'uint256' },
  ]);
}

export function encodeDocumentV3Data(data: {
  daoAttestationUID: string;
  documentTitle: string;
  documentType: string;
  documentHash: string;
  ipfsCid: string;
  previousVersionId: string;
  votingTxHash: string;
  votingChainId: number;
}): string {
  return documentV3Encoder.encodeData([
    { name: 'daoAttestationUID', value: data.daoAttestationUID, type: 'bytes32' },
    { name: 'documentTitle', value: data.documentTitle, type: 'string' },
    { name: 'documentType', value: data.documentType, type: 'string' },
    { name: 'documentHash', value: data.documentHash, type: 'bytes32' },
    { name: 'ipfsCid', value: data.ipfsCid, type: 'string' },
    { name: 'previousVersionId', value: data.previousVersionId, type: 'bytes32' },
    { name: 'votingTxHash', value: data.votingTxHash, type: 'bytes32' },
    { name: 'votingChainId', value: BigInt(data.votingChainId), type: 'uint256' },
  ]);
}

function extractField(decodedData: Array<{ name: string; value: unknown }>, name: string): string {
  const field = decodedData.find((item) => item.name === name);
  if (!field) return '';
  const val = field.value;
  if (val && typeof val === 'object' && 'value' in val) {
    return String((val as { value: unknown }).value ?? '');
  }
  return String(val ?? '');
}

export function decodeDAOData(decodedDataJson: string): DecodedDAOData {
  if (!decodedDataJson || decodedDataJson.trim() === '') {
    throw new Error('decodedDataJson is empty');
  }
  const parsed: Array<{ name: string; value: unknown }> = JSON.parse(decodedDataJson);
  return {
    daoName: extractField(parsed, 'daoName'),
    daoDescription: extractField(parsed, 'description'),
    daoLocation: extractField(parsed, 'daoLocation'),
    memberCount: Number(extractField(parsed, 'memberCount')) || 0,
    daoSize: extractField(parsed, 'daoSize'),
    daoUID: extractField(parsed, 'daoUID'),
  };
}

export function decodeDocumentData(decodedDataJson: string): DecodedDocumentData {
  if (!decodedDataJson || decodedDataJson.trim() === '') {
    throw new Error('decodedDataJson is empty');
  }
  const parsed: Array<{ name: string; value: unknown }> = JSON.parse(decodedDataJson);

  const hasVotingFields =
    parsed.some((item) => item.name === 'votingTxHash') ||
    parsed.some((item) => item.name === 'votingChainId');
  const hasVersionField = parsed.some((item) => item.name === 'version');

  let schemaVersion: SchemaVersion;
  if (hasVotingFields && !hasVersionField) {
    schemaVersion = 'v3';
  } else if (hasVotingFields) {
    schemaVersion = 'v2';
  } else {
    schemaVersion = 'v1';
  }

  return {
    daoAttestationUID: extractField(parsed, 'daoAttestationUID'),
    documentTitle: extractField(parsed, 'documentTitle'),
    documentType: extractField(parsed, 'documentType'),
    documentHash: extractField(parsed, 'documentHash'),
    ipfsCid: extractField(parsed, 'ipfsCid'),
    ...(hasVersionField && { version: extractField(parsed, 'version') || '1.0' }),
    previousVersionId: extractField(parsed, 'previousVersionId'),
    ...(hasVotingFields && {
      votingTxHash: extractField(parsed, 'votingTxHash') || undefined,
      votingChainId: Number(extractField(parsed, 'votingChainId')) || undefined,
    }),
    schemaVersion,
  };
}
