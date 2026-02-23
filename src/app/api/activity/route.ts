import { NextRequest, NextResponse } from 'next/server';
import { getDocs, query, orderBy, limit, collection } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDAOData, FirebaseDocumentData } from '@/shared/lib/firebase/types';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { triggerLazySync } from '@/shared/lib/sync/syncService';
import { sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

interface ActivityItem {
  id: string;
  type: 'dao_created' | 'document_registered' | 'document_revoked';
  title: string;
  daoName?: string;
  attester: string;
  createdAt: string;
  link: string;
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

    const activities: ActivityItem[] = [];

    // Fetch only the 20 most recent DAOs and documents (sorted at Firestore level)
    const ACTIVITY_LIMIT = 20;
    const [daoSnap, docSnap] = await Promise.all([
      getDocs(query(collection(db, 'daos'), orderBy('createdAt', 'desc'), limit(ACTIVITY_LIMIT))),
      getDocs(
        query(collection(db, 'documents'), orderBy('createdAt', 'desc'), limit(ACTIVITY_LIMIT)),
      ),
    ]);

    for (const docSnapshot of daoSnap.docs) {
      const fb = docSnapshot.data() as FirebaseDAOData;
      activities.push({
        id: docSnapshot.id,
        type: 'dao_created',
        title: fb.name || 'Unnamed DAO',
        attester: fb.attester || fb.adminAddress || '',
        createdAt: fb.easTime ? new Date(fb.easTime * 1000).toISOString() : fb.createdAt,
        link: `/daos/${docSnapshot.id}`,
      });
    }

    for (const ds of docSnap.docs) {
      const fb = ds.data() as FirebaseDocumentData;
      activities.push({
        id: ds.id,
        type: fb.revoked ? 'document_revoked' : 'document_registered',
        title: fb.title || 'Untitled Document',
        attester: fb.attester || '',
        createdAt: fb.easTime ? new Date(fb.easTime * 1000).toISOString() : fb.createdAt,
        link: `/daos/${fb.daoId || ds.id}`,
      });
    }

    // Merge and sort the combined results, take top 20
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limited = activities.slice(0, ACTIVITY_LIMIT);

    const body: ApiResponse<{ items: ActivityItem[] }> = {
      success: true,
      data: { items: limited },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('activity_get_failed', {
      route: '/api/activity',
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
