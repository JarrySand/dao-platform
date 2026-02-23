import { NextRequest, NextResponse } from 'next/server';
import { syncAll, getSyncStatus } from '@/shared/lib/sync/syncService';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import type { SyncMeta } from '@/shared/lib/firebase/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = await getSyncStatus();
    const body: ApiResponse<SyncMeta> = { success: true, data: status };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('sync_status_failed', {
      route: '/api/sync',
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit (auth not required — sync is a deterministic cache update from EAS)
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 5, 60_000)) {
      const body: ApiErrorResponse = { success: false, error: 'Too many requests' };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
        request,
      );
    }

    const result = await syncAll();
    const body: ApiResponse<{ daoCount: number; documentCount: number }> = {
      success: true,
      data: result,
    };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('sync_trigger_failed', {
      route: '/api/sync',
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
