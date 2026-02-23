import { NextRequest, NextResponse } from 'next/server';
import { syncOne } from '@/shared/lib/sync/syncService';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
  try {
    // Rate limit (auth not required — sync is a deterministic cache update from EAS)
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 30, 60_000)) {
      const body: ApiErrorResponse = { success: false, error: 'Too many requests' };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
        request,
      );
    }

    const { uid } = await params;

    if (!uid || !/^0x[a-fA-F0-9]{64}$/.test(uid)) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Invalid attestation UID',
        code: 'INVALID_PARAM',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.BAD_REQUEST }), request);
    }

    await syncOne(uid);

    const body: ApiResponse<{ uid: string }> = { success: true, data: { uid } };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('sync_post_failed', {
      route: '/api/sync/[uid]',
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
