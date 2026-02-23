'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDocument } from '../api/documentApi';

export function useDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      if (!documentId) return [];

      const result = await fetchDocument(documentId);
      if (!result.success) return [];
      return result.data.versionChain;
    },
    enabled: !!documentId,
    staleTime: 300_000,
  });
}
