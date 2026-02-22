import type { DAO } from '../types';
import type { DecodedDAOData } from '@/shared/lib/eas';

interface FirebaseDAOData {
  id?: string;
  description?: string;
  location?: string;
  size?: string;
  memberCount?: number;
  logoUrl?: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  trustScore?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  foundingDate?: string;
}

export function mergeDAOData(
  easData: {
    uid: string;
    decoded: DecodedDAOData;
    attester: string;
    time: number;
  },
  firebaseData: FirebaseDAOData | null,
): DAO {
  const now = new Date().toISOString();
  const attestationTime = new Date(easData.time * 1000).toISOString();

  return {
    id: easData.decoded.daoUID || easData.uid,
    name: easData.decoded.daoName,
    description: firebaseData?.description ?? easData.decoded.daoDescription ?? '',
    location: firebaseData?.location ?? easData.decoded.daoLocation ?? '',
    memberCount: firebaseData?.memberCount ?? easData.decoded.memberCount ?? 1,
    size: firebaseData?.size ?? easData.decoded.daoSize ?? 'medium',
    status: (firebaseData?.status as DAO['status']) ?? 'active',
    logoUrl: firebaseData?.logoUrl ?? '',
    website: firebaseData?.website ?? '',
    contactPerson: firebaseData?.contactPerson ?? '',
    contactEmail: firebaseData?.contactEmail ?? '',
    adminAddress: easData.attester,
    attestationUID: easData.uid,
    trustScore:
      firebaseData?.trustScore ??
      calculateTrustScore({
        attestationUID: easData.uid,
        documentCount: 0,
        memberCount: firebaseData?.memberCount ?? easData.decoded.memberCount ?? 1,
      }),
    foundingDate: easData.time,
    createdAt: firebaseData?.createdAt ?? attestationTime,
    updatedAt: firebaseData?.updatedAt ?? now,
  };
}

export function calculateTrustScore(params: {
  attestationUID: string;
  documentCount?: number;
  memberCount?: number;
}): number {
  let score = 0;

  // Has EAS attestation: base 50 points
  if (params.attestationUID) {
    score += 50;
  }

  // Document count bonus: up to 30 points
  const docCount = params.documentCount ?? 0;
  score += Math.min(docCount * 5, 30);

  // Member count bonus: up to 20 points
  const memberCount = params.memberCount ?? 0;
  if (memberCount >= 50) {
    score += 20;
  } else if (memberCount >= 10) {
    score += 15;
  } else if (memberCount >= 5) {
    score += 10;
  } else if (memberCount >= 1) {
    score += 5;
  }

  return Math.min(score, 100);
}
