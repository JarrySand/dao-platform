import { NextRequest, NextResponse } from 'next/server';
import { CHAIN_CONFIG } from '@/config/chains';
import { executeEASQuery } from '@/shared/lib/eas/graphql';
import { setCorsHeaders } from '@/shared/lib/cors';
import { verifyAuth } from '@/shared/lib/api-client';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import type { EASAttestation } from '@/shared/lib/eas/types';

const schemas = CHAIN_CONFIG.sepolia.schemas;

interface ActivityItem {
  id: string;
  type: 'dao_created' | 'document_registered';
  attester: string;
  time: number;
  schemaId: string;
  revoked: boolean;
}

function classifyActivity(attestation: EASAttestation): ActivityItem {
  const isDaoSchema = attestation.schemaId === schemas.dao.uid;
  return {
    id: attestation.id,
    type: isDaoSchema ? 'dao_created' : 'document_registered',
    attester: attestation.attester,
    time: attestation.time,
    schemaId: attestation.schemaId,
    revoked: attestation.revoked,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = verifyAuth(request);
    if (!token) {
      const body: ApiErrorResponse = { success: false, error: 'Unauthorized' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNAUTHORIZED }));
    }

    const schemaIds = [schemas.dao.uid, schemas.documentV1.uid, schemas.documentV2.uid].filter(
      (uid) => uid !== '0x0000000000000000000000000000000000000000000000000000000000000000',
    );

    const result = await executeEASQuery<{ attestations: EASAttestation[] }>(
      `query GetRecentActivity($schemaIds: [String!]!, $limit: Int!) {
        attestations(
          where: { schemaId: { in: $schemaIds } }
          orderBy: { time: desc }
          take: $limit
        ) {
          id
          attester
          recipient
          revocable
          revoked
          time
          data
          decodedDataJson
          schemaId
        }
      }`,
      { schemaIds, limit: 20 },
    );

    const activities = result.attestations.map(classifyActivity);

    const body: ApiResponse<{ items: ActivityItem[] }> = {
      success: true,
      data: { items: activities },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activity';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}
