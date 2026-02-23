import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  setDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  collection,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDAOData } from '@/shared/lib/firebase/types';
import { firestoreToDAO } from '@/shared/lib/firebase/converters';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { triggerLazySync } from '@/shared/lib/sync/syncService';
import { authenticateRequest, sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import { createDAOSchema } from '@/features/dao/types';
import type { DAO } from '@/features/dao/types';

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

    triggerLazySync();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') as 'active' | 'inactive' | 'pending' | null;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    // Build Firestore query with server-side filtering where possible
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (status) {
      constraints.push(where('status', '==', status));
    }
    const q = query(collection(db, 'daos'), ...constraints);
    const snapshot = await getDocs(q);

    let daos: DAO[] = [];
    for (const docSnap of snapshot.docs) {
      const fb = docSnap.data() as FirebaseDAOData;
      daos.push(firestoreToDAO(docSnap.id, fb));
    }

    // Text search must be done client-side (Firestore lacks full-text search)
    if (search) {
      daos = daos.filter(
        (dao) =>
          dao.name.toLowerCase().includes(search) || dao.description.toLowerCase().includes(search),
      );
    }

    // Cursor-based pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = daos.findIndex((dao) => dao.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedDAOs = daos.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < daos.length
        ? (paginatedDAOs[paginatedDAOs.length - 1]?.id ?? null)
        : null;

    // Enrich each DAO with documentCount
    const docsCol = collection(db, 'documents');
    const enriched = await Promise.all(
      paginatedDAOs.map(async (dao) => {
        const countSnap = await getCountFromServer(query(docsCol, where('daoId', '==', dao.id)));
        return { ...dao, documentCount: countSnap.data().count };
      }),
    );

    const hasMore = startIndex + limit < daos.length;
    const body: ApiResponse<{ data: DAO[]; nextCursor: string | null; hasMore: boolean }> = {
      success: true,
      data: { data: enriched, nextCursor, hasMore },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('daos_get_failed', {
      route: '/api/daos',
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
    // Rate limit write operations
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

    const rawBody: unknown = await request.json();
    const parsed = createDAOSchema.safeParse(rawBody);

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

    const {
      name,
      description,
      location,
      memberCount,
      size,
      logoUrl,
      website,
      contactPerson,
      contactEmail,
    } = parsed.data;

    // Accept attestationUID and adminAddress from client (after EAS attestation)
    const raw = rawBody as Record<string, unknown>;
    const attestationUID =
      typeof raw.attestationUID === 'string' && /^0x[a-fA-F0-9]{64}$/.test(raw.attestationUID)
        ? raw.attestationUID
        : null;
    const adminAddress = auth.address;

    const id = attestationUID || `pending_${Date.now()}`;
    const now = new Date().toISOString();

    const firebaseData: FirebaseDAOData = {
      name,
      description,
      location,
      memberCount,
      size,
      status: attestationUID ? 'active' : 'pending',
      logoUrl: logoUrl || '',
      website: website || '',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      adminAddress,
      attestationUID: id,
      createdAt: now,
      updatedAt: now,
      source: attestationUID ? 'eas' : 'pending',
    };

    await setDoc(doc(db, 'daos', id), firebaseData);

    const dao: DAO = {
      id,
      name,
      description,
      location,
      memberCount,
      size,
      status: attestationUID ? 'active' : 'pending',
      logoUrl: logoUrl || '',
      website: website || '',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      adminAddress,
      attestationUID: id,
      trustScore: 0,
      foundingDate: Math.floor(Date.now() / 1000),
      createdAt: now,
      updatedAt: now,
    };

    logger.info('dao_created', { route: '/api/daos', daoId: id, by: auth.address });
    const body: ApiResponse<DAO> = { success: true, data: dao };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.CREATED }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('daos_post_failed', {
      route: '/api/daos',
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
