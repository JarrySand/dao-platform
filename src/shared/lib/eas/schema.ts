import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { CHAIN_CONFIG } from '@/config/chains';
import type { DecodedDAOData, DecodedDocumentData, SchemaVersion } from './types';

const schemas = CHAIN_CONFIG.sepolia.schemas;

// DAO schema encoder
const daoEncoder = new SchemaEncoder(schemas.dao.schema);

// Document schema encoders
const documentV1Encoder = new SchemaEncoder(schemas.documentV1.schema);
const documentV2Encoder = new SchemaEncoder(schemas.documentV2.schema);

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

export function encodeDocumentV1Data(data: {
  daoAttestationUID: string;
  documentTitle: string;
  documentType: string;
  documentHash: string;
  ipfsCid: string;
}): string {
  return documentV1Encoder.encodeData([
    { name: 'daoAttestationUID', value: data.daoAttestationUID, type: 'bytes32' },
    { name: 'documentTitle', value: data.documentTitle, type: 'string' },
    { name: 'documentType', value: data.documentType, type: 'string' },
    { name: 'documentHash', value: data.documentHash, type: 'bytes32' },
    { name: 'ipfsCid', value: data.ipfsCid, type: 'string' },
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
  const parsed: Array<{ name: string; value: unknown }> = JSON.parse(decodedDataJson);

  const hasV2Fields =
    parsed.some((item) => item.name === 'votingTxHash') ||
    parsed.some((item) => item.name === 'votingChainId');

  const schemaVersion: SchemaVersion = hasV2Fields ? 'v2' : 'v1';

  return {
    daoAttestationUID: extractField(parsed, 'daoAttestationUID'),
    documentTitle: extractField(parsed, 'documentTitle'),
    documentType: extractField(parsed, 'documentType'),
    documentHash: extractField(parsed, 'documentHash'),
    ipfsCid: extractField(parsed, 'ipfsCid'),
    version: extractField(parsed, 'version') || '1.0',
    previousVersionId: extractField(parsed, 'previousVersionId'),
    ...(schemaVersion === 'v2' && {
      votingTxHash: extractField(parsed, 'votingTxHash') || undefined,
      votingChainId: Number(extractField(parsed, 'votingChainId')) || undefined,
    }),
    schemaVersion,
  };
}
