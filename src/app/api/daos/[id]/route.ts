import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDAOData } from '@/shared/lib/firebase/types';
import { setCorsHeaders } from '@/shared/lib/cors';
import { verifyAuth } from '@/shared/lib/api-client';
import { getDAOByUID } from '@/shared/lib/eas/queries';
import { decodeDAOData } from '@/shared/lib/eas/schema';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import { updateDAOSchema } from '@/features/dao/types';
import type { DAO } from '@/features/dao/types';

function buildDAO(
  attestation: { id: string; attester: string; time: number; decodedDataJson: string },
  firebaseData?: FirebaseDAOData | null,
): DAO {
  const decoded = decodeDAOData(attestation.decodedDataJson);

  return {
    id: attestation.id,
    name: firebaseData?.name || decoded.daoName,
    description: firebaseData?.description || decoded.daoDescription,
    location: firebaseData?.location || decoded.daoLocation,
    memberCount: firebaseData?.memberCount ?? decoded.memberCount,
    size: firebaseData?.size || decoded.daoSize || 'small',
    status: firebaseData?.status || 'active',
    logoUrl: firebaseData?.logoUrl || '',
    website: firebaseData?.website || '',
    contactPerson: firebaseData?.contactPerson || '',
    contactEmail: firebaseData?.contactEmail || '',
    adminAddress: firebaseData?.adminAddress || attestation.attester,
    attestationUID: attestation.id,
    trustScore: 0,
    foundingDate: attestation.time,
    createdAt: firebaseData?.createdAt || new Date(attestation.time * 1000).toISOString(),
    updatedAt: firebaseData?.updatedAt || new Date(attestation.time * 1000).toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const attestation = await getDAOByUID(id);
    if (!attestation) {
      const body: ApiErrorResponse = { success: false, error: 'DAO not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }));
    }

    let firebaseData: FirebaseDAOData | null = null;
    try {
      const docRef = doc(db, 'daos', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        firebaseData = snapshot.data() as FirebaseDAOData;
      }
    } catch {
      // Firestore read is best-effort
    }

    const dao = buildDAO(attestation, firebaseData);
    const body: ApiResponse<DAO> = { success: true, data: dao };
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

    // Verify DAO exists on-chain
    const attestation = await getDAOByUID(id);
    if (!attestation) {
      const body: ApiErrorResponse = { success: false, error: 'DAO not found' };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND }));
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
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }));
    }

    const now = new Date().toISOString();
    const updateData = { ...parsed.data, updatedAt: now };

    const docRef = doc(db, 'daos', id);
    await updateDoc(docRef, updateData);

    // Re-read and return the updated DAO
    let updatedFirebaseData: FirebaseDAOData | null = null;
    try {
      const updatedSnap = await getDoc(docRef);
      if (updatedSnap.exists()) {
        updatedFirebaseData = updatedSnap.data() as FirebaseDAOData;
      }
    } catch {
      // best-effort
    }

    const dao = buildDAO(attestation, updatedFirebaseData);
    const body: ApiResponse<DAO> = { success: true, data: dao };
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
