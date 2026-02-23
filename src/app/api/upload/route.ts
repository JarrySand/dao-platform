import { NextRequest, NextResponse } from 'next/server';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { uploadToIPFS } from '@/shared/lib/ipfs/client';
import { authenticateRequest, sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set(['application/pdf']);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit file uploads
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 10, 60_000)) {
      const body: ApiErrorResponse = { success: false, error: 'Too many requests' };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
        request,
      );
    }

    // Authenticate wallet
    const auth = authenticateRequest(request);
    if (!auth) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNAUTHORIZED }), request);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'No file provided. Send a "file" field in multipart/form-data.',
        code: 'MISSING_FILE',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.BAD_REQUEST }), request);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const body: ApiErrorResponse = {
        success: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        code: 'FILE_TOO_LARGE',
      };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }),
        request,
      );
    }

    // Validate MIME type
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      const body: ApiErrorResponse = {
        success: false,
        error: `Unsupported file type: ${file.type}`,
        code: 'INVALID_MIME_TYPE',
      };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }),
        request,
      );
    }

    // Validate PDF structure (magic bytes: %PDF-)
    const headerSlice = file.slice(0, 5);
    const headerBytes = new Uint8Array(await headerSlice.arrayBuffer());
    const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
    if (!PDF_MAGIC.every((b, i) => headerBytes[i] === b)) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'File is not a valid PDF (invalid header)',
        code: 'INVALID_PDF',
      };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }),
        request,
      );
    }

    const result = await uploadToIPFS(file);

    const body: ApiResponse<{ cid: string; gatewayUrl: string }> = {
      success: true,
      data: { cid: result.cid, gatewayUrl: result.gatewayUrl },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.CREATED }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('upload_post_failed', {
      route: '/api/upload',
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
