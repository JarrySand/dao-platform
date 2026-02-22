'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type { ApiResult } from '@/shared/types';

export interface Stats {
  daoCount: number;
  documentV1Count: number;
  documentV2Count: number;
  totalDocuments: number;
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const result = await apiClient.get<ApiResult<Stats>>('/api/stats', {
        skipAuth: true,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
  });
}
