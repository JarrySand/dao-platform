'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDocuments } from '../api/documentApi';
import type { DocumentFilters } from '../types';

export function useDocuments(filters: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const result = await fetchDocuments(filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!filters.daoId,
    staleTime: 60_000,
  });
}
