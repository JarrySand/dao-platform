'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDocument } from '../api/documentApi';
import type { Document } from '../types';

const MAX_VERSION_DEPTH = 20;

export function useDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      if (!documentId) return [];

      const versions: Document[] = [];
      let currentId: string | null = documentId;
      let depth = 0;

      while (currentId && depth < MAX_VERSION_DEPTH) {
        const result = await fetchDocument(currentId);
        if (!result.success) break;
        versions.push(result.data);
        currentId = result.data.previousVersionId;
        depth++;
      }

      return versions;
    },
    enabled: !!documentId,
    staleTime: 300_000,
  });
}
