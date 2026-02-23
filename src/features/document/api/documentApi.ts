import { apiClient, createWalletAuthHeader } from '@/shared/lib/api-client';
import type { ApiResult } from '@/shared/types/api';
import type { Document, DocumentFilters } from '../types';
import { useWalletStore } from '@/features/wallet/stores/walletStore';

interface PaginatedDocuments {
  data: Document[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchDocuments(
  filters: DocumentFilters,
): Promise<ApiResult<PaginatedDocuments>> {
  const params = new URLSearchParams();
  params.set('daoId', filters.daoId);
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.txHash) params.set('txHash', filters.txHash);

  return apiClient.get<ApiResult<PaginatedDocuments>>(`/api/documents?${params}`);
}

interface DocumentDetail {
  document: Document;
  versionChain: Document[];
}

export async function fetchDocument(id: string): Promise<ApiResult<DocumentDetail>> {
  return apiClient.get<ApiResult<DocumentDetail>>(`/api/documents/${encodeURIComponent(id)}`);
}

export async function revokeDocument(id: string): Promise<ApiResult<{ txHash: string }>> {
  const address = useWalletStore.getState().address;
  if (!address) throw new Error('ウォレットが接続されていません');
  const authorization = await createWalletAuthHeader(address);
  return apiClient.put<ApiResult<{ txHash: string }>>(
    `/api/documents/${encodeURIComponent(id)}`,
    {
      action: 'revoke',
    },
    {
      headers: { Authorization: authorization },
    },
  );
}
