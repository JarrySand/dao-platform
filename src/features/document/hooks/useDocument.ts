'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDocument } from '../api/documentApi';

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) throw new Error('Document ID is required');
      const result = await fetchDocument(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.document;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
