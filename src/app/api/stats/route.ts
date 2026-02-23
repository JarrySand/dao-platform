import { NextRequest, NextResponse } from 'next/server';
import { getCountFromServer, query, collection } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { triggerLazySync } from '@/shared/lib/sync/syncService';
import { sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

interface StatsData {
  daoCount: number;
  totalDocuments: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 30, 60_000)) {
      const body: ApiErrorResponse = { success: false, error: 'Too many requests' };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
        request,
      );
    }

    // Trigger lazy sync in background (fire-and-forget)
    triggerLazySync();

    // Use server-side counting to avoid downloading all documents
    const [daoCount, totalDocCount] = await Promise.all([
      getCountFromServer(query(collection(db, 'daos'))),
      getCountFromServer(query(collection(db, 'documents'))),
    ]);

    const stats: StatsData = {
      daoCount: daoCount.data().count,
      totalDocuments: totalDocCount.data().count,
    };

    const body: ApiResponse<StatsData> = { success: true, data: stats };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('stats_get_failed', {
      route: '/api/stats',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    const body: ApiErrorResponse = { success: false, error: sanitizeErrorMessage(error) };
    return setCorsHeaders(
      NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
      request,
    );
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }), request);
}
