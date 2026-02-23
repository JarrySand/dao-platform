import { NextRequest, NextResponse } from 'next/server';
import { getDocs, query, where, orderBy, collection } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDocumentData } from '@/shared/lib/firebase/types';
import { firestoreToDocument } from '@/shared/lib/firebase/converters';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import type { Document, DocumentType, DocumentStatus } from '@/features/document/types';

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

    const { searchParams } = request.nextUrl;
    const daoId = searchParams.get('daoId');
    const hashParam = searchParams.get('hash');

    // Hash-based search (for document verification) — daoId not required
    if (hashParam) {
      const hashQuery = query(collection(db, 'documents'), where('hash', '==', hashParam));
      const hashSnapshot = await getDocs(hashQuery);
      const results: Document[] = hashSnapshot.docs.map((docSnap) => {
        const fb = docSnap.data() as FirebaseDocumentData;
        return firestoreToDocument(docSnap.id, fb);
      });
      const body: ApiResponse<{ data: Document[]; nextCursor: string | null; hasMore: boolean }> = {
        success: true,
        data: { data: results, nextCursor: null, hasMore: false },
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
    }

    if (!daoId) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'daoId or hash query parameter is required',
        code: 'MISSING_PARAM',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.BAD_REQUEST }), request);
    }

    const typeFilter = searchParams.get('type') as DocumentType | null;
    const statusFilter = searchParams.get('status') as DocumentStatus | null;
    const txHashFilter = searchParams.get('txHash');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    // Query documents filtered by daoId at the Firestore level
    const q = query(
      collection(db, 'documents'),
      where('daoId', '==', daoId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    let documents: Document[] = [];
    for (const docSnap of snapshot.docs) {
      const fb = docSnap.data() as FirebaseDocumentData;
      documents.push(firestoreToDocument(docSnap.id, fb));
    }

    // Apply type filter
    if (typeFilter) {
      documents = documents.filter((d) => d.documentType === typeFilter);
    }

    // Apply status filter
    if (statusFilter) {
      documents = documents.filter((d) => d.status === statusFilter);
    }

    // Apply txHash filter
    if (txHashFilter) {
      documents = documents.filter((d) => d.votingTxHash === txHashFilter);
    }

    // Cursor-based pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = documents.findIndex((d) => d.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedDocs = documents.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < documents.length
        ? (paginatedDocs[paginatedDocs.length - 1]?.id ?? null)
        : null;

    const hasMore = startIndex + limit < documents.length;
    const body: ApiResponse<{ data: Document[]; nextCursor: string | null; hasMore: boolean }> = {
      success: true,
      data: { data: paginatedDocs, nextCursor, hasMore },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('documents_get_failed', {
      route: '/api/documents',
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
