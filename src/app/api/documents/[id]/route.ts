import { NextRequest, NextResponse } from 'next/server';
import { setCorsHeaders } from '@/shared/lib/cors';
import { verifyAuth } from '@/shared/lib/api-client';
import { getDocumentByUID, getDocumentsByDAO } from '@/shared/lib/eas/queries';
import { decodeDocumentData } from '@/shared/lib/eas/schema';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import type { Document, DocumentType } from '@/features/document/types';
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

async function getVersionChain(documentId: string, daoId: string): Promise<Document[]> {
  // Get all documents for this DAO to build the version chain
  const allDocs = await getDocumentsByDAO(daoId);
  const docMap = new Map<string, Document>();

  for (const att of allDocs) {
    const parsed = parseDocument(att);
    docMap.set(parsed.id, parsed);
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

    const attestation = await getDocumentByUID(id);
    if (!attestation) {
      const body: ApiErrorResponse = { success: false, error: 'Document not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }));
    }

    const document = parseDocument(attestation);

    // Build version chain if document has a previousVersionId
    let versionChain: Document[] = [];
    if (document.previousVersionId || document.daoId) {
      try {
        versionChain = await getVersionChain(id, document.daoId);
      } catch {
        // Version chain retrieval is best-effort
      }
    }

    const body: ApiResponse<{ document: Document; versionChain: Document[] }> = {
      success: true,
      data: { document, versionChain },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const token = verifyAuth(request);
    if (!token) {
      const body: ApiErrorResponse = { success: false, error: 'Unauthorized' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNAUTHORIZED }));
    }

    // Verify document exists
    const attestation = await getDocumentByUID(id);
    if (!attestation) {
      const body: ApiErrorResponse = { success: false, error: 'Document not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }));
    }

    if (attestation.revoked) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Document is already revoked',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.CONFLICT }));
    }

    // On-chain revocation is handled client-side via EAS SDK.
    // This endpoint signals intent and returns the current document state.
    const document = parseDocument(attestation);

    const body: ApiResponse<{ document: Document; message: string }> = {
      success: true,
      data: {
        document,
        message: 'Document marked for revocation. Submit the on-chain revocation transaction.',
      },
    };

    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.OK }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}
