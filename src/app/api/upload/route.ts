import { NextRequest, NextResponse } from 'next/server';
import { setCorsHeaders } from '@/shared/lib/cors';
import { verifyAuth } from '@/shared/lib/api-client';
import { uploadToIPFS } from '@/shared/lib/ipfs/client';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/json',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = verifyAuth(request);
    if (!token) {
      const body: ApiErrorResponse = { success: false, error: 'Unauthorized' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNAUTHORIZED }));
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'No file provided. Send a "file" field in multipart/form-data.',
        code: 'MISSING_FILE',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.BAD_REQUEST }));
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const body: ApiErrorResponse = {
        success: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        code: 'FILE_TOO_LARGE',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }));
    }

    // Validate MIME type
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      const body: ApiErrorResponse = {
        success: false,
        error: `Unsupported file type: ${file.type}`,
        code: 'INVALID_MIME_TYPE',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }));
    }

    const result = await uploadToIPFS(file);

    const body: ApiResponse<{ cid: string; gatewayUrl: string }> = {
      success: true,
      data: { cid: result.cid, gatewayUrl: result.gatewayUrl },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.CREATED }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}
