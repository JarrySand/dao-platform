import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import { setCorsHeaders } from '@/shared/lib/cors';
import { verifyAuth } from '@/shared/lib/api-client';
import { getDocumentsByDAO } from '@/shared/lib/eas/queries';
import { decodeDocumentData } from '@/shared/lib/eas/schema';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import { registerDocumentSchema } from '@/features/document/types';
import type { Document, DocumentType, DocumentStatus } from '@/features/document/types';
import type { EASAttestation } from '@/shared/lib/eas/types';

function parseDocument(attestation: EASAttestation): Document {
  const decoded = decodeDocumentData(attestation.decodedDataJson);

  return {
    id: attestation.id,
    daoId: decoded.daoAttestationUID,
    title: decoded.documentTitle,
    documentType: decoded.documentType as DocumentType,
    hash: decoded.documentHash,
    ipfsCid: decoded.ipfsCid,
    version: decoded.version,
    previousVersionId: decoded.previousVersionId || null,
    status: attestation.revoked ? 'revoked' : 'active',
    attester: attestation.attester,
    votingTxHash: decoded.votingTxHash ?? null,
    votingChainId: decoded.votingChainId ?? null,
    schemaVersion: decoded.schemaVersion,
    createdAt: new Date(attestation.time * 1000).toISOString(),
    updatedAt: new Date(attestation.time * 1000).toISOString(),
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const daoId = searchParams.get('daoId');

    if (!daoId) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'daoId query parameter is required',
        code: 'MISSING_PARAM',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.BAD_REQUEST }));
    }

    const typeFilter = searchParams.get('type') as DocumentType | null;
    const statusFilter = searchParams.get('status') as DocumentStatus | null;
    const txHashFilter = searchParams.get('txHash');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    const attestations = await getDocumentsByDAO(daoId);

    let documents = attestations.map(parseDocument);

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

    const body: ApiResponse<{ items: Document[]; nextCursor: string | null }> = {
      success: true,
      data: { items: paginatedDocs, nextCursor },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = verifyAuth(request);
    if (!token) {
      const body: ApiErrorResponse = { success: false, error: 'Unauthorized' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNAUTHORIZED }));
    }

    const rawBody: unknown = await request.json();
    const parsed = registerDocumentSchema.safeParse(rawBody);

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
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }));
    }

    const { title, documentType, version, previousVersionId, votingTxHash, votingChainId } =
      parsed.data;

    const tempId = `pending_${Date.now()}`;
    const now = new Date().toISOString();

    // Save metadata to Firestore
    await setDoc(doc(db, 'documents', tempId), {
      title,
      documentType,
      hash: '',
      ipfsCid: '',
      version,
      status: 'active' as const,
      daoId: '',
      attestationUID: tempId,
      createdAt: now,
      updatedAt: now,
    });

    const document: Document = {
      id: tempId,
      daoId: '',
      title,
      documentType,
      hash: '',
      ipfsCid: '',
      version,
      previousVersionId: previousVersionId ?? null,
      status: 'active',
      attester: '',
      votingTxHash: votingTxHash ?? null,
      votingChainId: votingChainId ?? null,
      schemaVersion: 'v2',
      createdAt: now,
      updatedAt: now,
    };

    const body: ApiResponse<Document> = { success: true, data: document };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.CREATED }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}
