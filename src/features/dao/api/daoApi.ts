import { apiClient, createWalletAuthHeader } from '@/shared/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/shared/types';
import type { DAO, CreateDAOFormData, UpdateDAOFormData } from '../types';
import { useWalletStore } from '@/features/wallet/stores/walletStore';

export interface FetchDAOsParams {
  search?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

export async function fetchDAOs(
  params?: FetchDAOsParams,
): Promise<ApiResult<PaginatedResponse<DAO>>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  const url = qs ? `/api/daos?${qs}` : '/api/daos';
  return apiClient.get<ApiResult<PaginatedResponse<DAO>>>(url);
}

export async function fetchDAO(id: string): Promise<ApiResult<DAO>> {
  return apiClient.get<ApiResult<DAO>>(`/api/daos/${id}`);
}

export async function createDAO(data: CreateDAOFormData): Promise<ApiResult<DAO>> {
  return apiClient.post<ApiResult<DAO>>('/api/daos', data);
}

export async function updateDAO(id: string, data: UpdateDAOFormData): Promise<ApiResult<DAO>> {
  const address = useWalletStore.getState().address;
  if (!address) return { success: false, error: 'ウォレットが接続されていません' };
  const authorization = await createWalletAuthHeader(address);
  return apiClient.put<ApiResult<DAO>>(`/api/daos/${id}`, data, {
    headers: { Authorization: authorization },
  });
}

export async function deactivateDAO(id: string): Promise<ApiResult<DAO>> {
  return updateDAO(id, { status: 'inactive' });
}
