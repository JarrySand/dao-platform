import { CHAIN_CONFIG } from '@/config/chains';
import { executeEASQuery } from './graphql';
import type { EASAttestation } from './types';

const schemas = CHAIN_CONFIG.sepolia.schemas;

const ATTESTATION_FIELDS = `
  id
  attester
  recipient
  revocable
  revoked
  time
  data
  decodedDataJson
  schemaId
`;

export async function getDAOByUID(uid: string): Promise<EASAttestation | null> {
  const result = await executeEASQuery<{ attestation: EASAttestation | null }>(
    `query GetAttestation($uid: String!) {
      attestation(where: { id: $uid }) {
        ${ATTESTATION_FIELDS}
      }
    }`,
    { uid },
  );
  return result.attestation;
}

export async function getDocumentByUID(uid: string): Promise<EASAttestation | null> {
  return getDAOByUID(uid);
}

export async function getDocumentsByDAO(daoUID: string, limit = 100): Promise<EASAttestation[]> {
  const result = await executeEASQuery<{ attestations: EASAttestation[] }>(
    `query GetDocumentsByDAO($schemaId: String!, $limit: Int!) {
      attestations(
        where: {
          schemaId: { equals: $schemaId }
          revoked: { equals: false }
        }
        orderBy: { time: desc }
        take: $limit
      ) {
        ${ATTESTATION_FIELDS}
      }
    }`,
    { schemaId: schemas.documentV3.uid, limit },
  );

  return filterByDAOUID(result.attestations, daoUID);
}

export async function getAllDAOs(limit = 100): Promise<EASAttestation[]> {
  const result = await executeEASQuery<{ attestations: EASAttestation[] }>(
    `query GetAllDAOs($schemaId: String!, $limit: Int!) {
      attestations(
        where: {
          schemaId: { equals: $schemaId }
          revoked: { equals: false }
        }
        orderBy: { time: desc }
        take: $limit
      ) {
        ${ATTESTATION_FIELDS}
      }
    }`,
    { schemaId: schemas.dao.uid, limit },
  );

  return result.attestations;
}

export function filterByDAOUID(attestations: EASAttestation[], daoUID: string): EASAttestation[] {
  const normalizedTarget = daoUID.toLowerCase().replace('0x', '');

  return attestations.filter((attestation) => {
    try {
      const decoded: Array<{ name: string; value: unknown }> = JSON.parse(
        attestation.decodedDataJson,
      );
      const field = decoded.find((item) => item.name === 'daoAttestationUID');
      if (!field) return false;

      const val = field.value;
      const actualValue =
        val && typeof val === 'object' && 'value' in val
          ? String((val as { value: unknown }).value ?? '')
          : String(val ?? '');

      return actualValue.toLowerCase().replace('0x', '') === normalizedTarget;
    } catch {
      return false;
    }
  });
}
