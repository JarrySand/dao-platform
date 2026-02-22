import type { ApiResult } from '@/shared/types/api';
import type { Document, DocumentFilters } from '../types';

export async function fetchDocuments(filters: DocumentFilters): Promise<ApiResult<Document[]>> {
  const params = new URLSearchParams();
  params.set('daoId', filters.daoId);
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.txHash) params.set('txHash', filters.txHash);

  const response = await fetch(`/api/documents?${params}`);
  if (!response.ok) {
    return { success: false, error: `Failed to fetch documents: ${response.status}` };
  }
  return response.json();
}

export async function fetchDocument(id: string): Promise<ApiResult<Document>> {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}`);
  if (!response.ok) {
    return { success: false, error: `Failed to fetch document: ${response.status}` };
  }
  return response.json();
}

export async function registerDocument(data: FormData): Promise<ApiResult<Document>> {
  const response = await fetch('/api/documents', {
    method: 'POST',
    body: data,
  });
  if (!response.ok) {
    return { success: false, error: `Failed to register document: ${response.status}` };
  }
  return response.json();
}

export async function revokeDocument(id: string): Promise<ApiResult<{ txHash: string }>> {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'revoke' }),
  });
  if (!response.ok) {
    return { success: false, error: `Failed to revoke document: ${response.status}` };
  }
  return response.json();
}
