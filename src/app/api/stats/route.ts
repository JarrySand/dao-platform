import { NextResponse } from 'next/server';
import { CHAIN_CONFIG } from '@/config/chains';
import { executeEASQuery } from '@/shared/lib/eas/graphql';
import { setCorsHeaders } from '@/shared/lib/cors';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

const schemas = CHAIN_CONFIG.sepolia.schemas;

interface StatsData {
  daoCount: number;
  documentV1Count: number;
  documentV2Count: number;
  totalDocuments: number;
}

// Server-side cache
let cachedStats: { data: StatsData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

async function fetchStats(): Promise<StatsData> {
  // Check cache first
  if (cachedStats && cachedStats.expiresAt > Date.now()) {
    return cachedStats.data;
  }

  const countQuery = `
    query GetCounts($daoSchemaId: String!, $docV1SchemaId: String!, $docV2SchemaId: String!) {
      daoCount: aggregateAttestation(
        where: { schemaId: { equals: $daoSchemaId }, revoked: { equals: false } }
      ) {
        _count { id }
      }
      docV1Count: aggregateAttestation(
        where: { schemaId: { equals: $docV1SchemaId }, revoked: { equals: false } }
      ) {
        _count { id }
      }
      docV2Count: aggregateAttestation(
        where: { schemaId: { equals: $docV2SchemaId }, revoked: { equals: false } }
      ) {
        _count { id }
      }
    }
  `;

  const result = await executeEASQuery<{
    daoCount: { _count: { id: number } };
    docV1Count: { _count: { id: number } };
    docV2Count: { _count: { id: number } };
  }>(countQuery, {
    daoSchemaId: schemas.dao.uid,
    docV1SchemaId: schemas.documentV1.uid,
    docV2SchemaId: schemas.documentV2.uid,
  });

  const stats: StatsData = {
    daoCount: result.daoCount._count.id,
    documentV1Count: result.docV1Count._count.id,
    documentV2Count: result.docV2Count._count.id,
    totalDocuments: result.docV1Count._count.id + result.docV2Count._count.id,
  };

  cachedStats = { data: stats, expiresAt: Date.now() + CACHE_TTL_MS };
  return stats;
}

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await fetchStats();

    const body: ApiResponse<StatsData> = { success: true, data: stats };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}
