import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  getDoc,
  updateDoc,
  getCountFromServer,
  query,
  where,
  collection,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDAOData } from '@/shared/lib/firebase/types';
import { firestoreToDAO } from '@/shared/lib/firebase/converters';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { authenticateRequest, sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import { updateDAOSchema } from '@/features/dao/types';
import type { DAO } from '@/features/dao/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const docRef = doc(db, 'daos', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      const body: ApiErrorResponse = { success: false, error: 'DAO not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }), request);
    }

    const fb = snapshot.data() as FirebaseDAOData;
    const dao = firestoreToDAO(id, fb);

    // Enrich with documentCount
    const countSnap = await getCountFromServer(
      query(collection(db, 'documents'), where('daoId', '==', id)),
    );
    const enriched = { ...dao, documentCount: countSnap.data().count };

    const body: ApiResponse<DAO> = { success: true, data: enriched };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('dao_detail_failed', {
      route: '/api/daos/[id]',
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Rate limit write operations
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 20, 60_000)) {
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

    const { id } = await params;

    // Verify DAO exists in Firestore
    const docRef = doc(db, 'daos', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      const body: ApiErrorResponse = { success: false, error: 'DAO not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }), request);
    }

    // Verify the authenticated user is the admin (EAS attester is the source of truth)
    const existingDAO = snapshot.data() as FirebaseDAOData;
    const ownerAddress = existingDAO.attester || existingDAO.adminAddress;
    if (!ownerAddress || ownerAddress.toLowerCase() !== auth.address.toLowerCase()) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Only the DAO admin can update this DAO',
        code: 'FORBIDDEN',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.FORBIDDEN }), request);
    }

    // Validate request body
    const rawBody: unknown = await request.json();
    const parsed = updateDAOSchema.safeParse(rawBody);

    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!details[key]) details[key] = [];
        details[key].push(issue.message);
      }
      const body: ApiErrorResponse = {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }),
        request,
      );
    }

    const now = new Date().toISOString();
    const updateData = { ...parsed.data, updatedAt: now };

    await updateDoc(docRef, updateData);

    // Re-read and return the updated DAO
    const updatedSnap = await getDoc(docRef);
    const fb = updatedSnap.data() as FirebaseDAOData;
    const dao = firestoreToDAO(id, fb);

    const body: ApiResponse<DAO> = { success: true, data: dao };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('dao_update_failed', {
      route: '/api/daos/[id]',
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
