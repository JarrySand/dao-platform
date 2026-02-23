import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, getDocs, query, where, collection, updateDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDocumentData, FirebaseDAOData } from '@/shared/lib/firebase/types';
import { firestoreToDocument } from '@/shared/lib/firebase/converters';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { authenticateRequest, sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import type { Document } from '@/features/document/types';

async function getVersionChain(documentId: string, daoId: string): Promise<Document[]> {
  // Query only documents for this DAO instead of full collection scan
  const q = query(collection(db, 'documents'), where('daoId', '==', daoId));
  const snapshot = await getDocs(q);
  const docMap = new Map<string, Document>();

  for (const docSnap of snapshot.docs) {
    const fb = docSnap.data() as FirebaseDocumentData;
    docMap.set(docSnap.id, firestoreToDocument(docSnap.id, fb));
  }

  // Traverse backwards from current document
  const chain: Document[] = [];
  let currentId: string | null = documentId;

  while (currentId) {
    const current = docMap.get(currentId);
    if (!current || chain.some((d) => d.id === currentId)) break;
    chain.push(current);
    currentId = current.previousVersionId;
  }

  return chain.reverse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const docRef = doc(db, 'documents', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      const body: ApiErrorResponse = { success: false, error: 'Document not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }), request);
    }

    const fb = snapshot.data() as FirebaseDocumentData;
    const document = firestoreToDocument(id, fb);

    // Build version chain if document has a previousVersionId
    let versionChain: Document[] = [];
    if (document.previousVersionId || document.daoId) {
      try {
        versionChain = await getVersionChain(id, document.daoId);
      } catch (e) {
        logger.warn('version_chain_failed', {
          route: '/api/documents/[id]',
          documentId: id,
          error: e instanceof Error ? e.message : 'unknown',
        });
      }
    }

    const body: ApiResponse<{ document: Document; versionChain: Document[] }> = {
      success: true,
      data: { document, versionChain },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('document_detail_failed', {
      route: '/api/documents/[id]',
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

    // Verify document exists in Firestore
    const docRef = doc(db, 'documents', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      const body: ApiErrorResponse = { success: false, error: 'Document not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }), request);
    }

    const fb = snapshot.data() as FirebaseDocumentData;

    // Verify the authenticated user is the admin of the parent DAO (EAS attester is the source of truth)
    if (fb.daoId) {
      const daoRef = doc(db, 'daos', fb.daoId);
      const daoSnap = await getDoc(daoRef);
      if (daoSnap.exists()) {
        const daoData = daoSnap.data() as FirebaseDAOData;
        const ownerAddress = daoData.attester || daoData.adminAddress;
        if (!ownerAddress || ownerAddress.toLowerCase() !== auth.address.toLowerCase()) {
          const body: ApiErrorResponse = {
            success: false,
            error: 'Only the DAO admin can revoke documents',
            code: 'FORBIDDEN',
          };
          return setCorsHeaders(
            NextResponse.json(body, { status: HTTP_STATUS.FORBIDDEN }),
            request,
          );
        }
      }
    }

    if (fb.revoked) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Document is already revoked',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.CONFLICT }), request);
    }

    // C4: Only allow revoking the latest version in a chain
    try {
      const successorQuery = query(
        collection(db, 'documents'),
        where('previousVersionId', '==', id),
      );
      const successorSnap = await getDocs(successorQuery);
      const hasActiveSuccessor = successorSnap.docs.some((d) => {
        const data = d.data() as FirebaseDocumentData;
        return !data.revoked && data.status !== 'revoked';
      });
      if (hasActiveSuccessor) {
        const body: ApiErrorResponse = {
          success: false,
          error: 'Only the latest version can be revoked. A newer version exists.',
          code: 'NOT_LATEST_VERSION',
        };
        return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.CONFLICT }), request);
      }
    } catch {
      // best-effort: allow revoke if check fails
    }

    // Update Firestore to reflect the revocation
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      revoked: true,
      status: 'revoked',
      updatedAt: now,
    });

    const document = firestoreToDocument(id, {
      ...fb,
      revoked: true,
      status: 'revoked',
      updatedAt: now,
    });

    const body: ApiResponse<{ document: Document; message: string }> = {
      success: true,
      data: {
        document,
        message: 'Document revoked successfully.',
      },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('document_revoke_failed', {
      route: '/api/documents/[id]',
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
