import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase/client';
import type { FirebaseDAOData } from '@/shared/lib/firebase/types';
import { setCorsHeaders } from '@/shared/lib/cors';
import { verifyAuth } from '@/shared/lib/api-client';
import { getAllDAOs } from '@/shared/lib/eas/queries';
import { decodeDAOData } from '@/shared/lib/eas/schema';
import type { ApiResponse, ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';
import { createDAOSchema } from '@/features/dao/types';
import type { DAO } from '@/features/dao/types';

function parseDAO(
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') as 'active' | 'inactive' | 'pending' | null;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    const attestations = await getAllDAOs(200);

    // Batch read Firestore metadata (best-effort)
    const firebaseDataMap = new Map<string, FirebaseDAOData>();
    try {
      const daoCollectionRef = collection(db, 'daos');
      const snapshot = await getDocs(daoCollectionRef);
      for (const docSnap of snapshot.docs) {
        firebaseDataMap.set(docSnap.id, docSnap.data() as FirebaseDAOData);
      }
    } catch {
      // Firestore read is best-effort; continue with EAS-only data
    }

    let daos = attestations.map((att) => parseDAO(att, firebaseDataMap.get(att.id)));

    // Apply search filter
    if (search) {
      daos = daos.filter(
        (dao) =>
          dao.name.toLowerCase().includes(search) || dao.description.toLowerCase().includes(search),
      );
    }

    // Apply status filter
    if (status) {
      daos = daos.filter((dao) => dao.status === status);
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

    const body: ApiResponse<{ items: DAO[]; nextCursor: string | null }> = {
      success: true,
      data: { items: paginatedDAOs, nextCursor },
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
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }));
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

    // Generate a temporary ID; the real attestation UID comes from the client after on-chain tx
    const tempId = `pending_${Date.now()}`;
    const now = new Date().toISOString();

    const firebaseData: FirebaseDAOData = {
      name,
      description,
      location,
      memberCount,
      size,
      status: 'pending',
      logoUrl: logoUrl || '',
      website: website || '',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      adminAddress: '',
      attestationUID: tempId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'daos', tempId), firebaseData);

    const dao: DAO = {
      id: tempId,
      name,
      description,
      location,
      memberCount,
      size,
      status: 'pending',
      logoUrl: logoUrl || '',
      website: website || '',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      adminAddress: '',
      attestationUID: tempId,
      trustScore: 0,
      foundingDate: Math.floor(Date.now() / 1000),
      createdAt: now,
      updatedAt: now,
    };

    const body: ApiResponse<DAO> = { success: true, data: dao };
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
