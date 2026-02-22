'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type { ApiResult } from '@/shared/types';

export interface ActivityItem {
  id: string;
  type: 'dao_created' | 'document_registered' | 'document_revoked';
  title: string;
  daoName?: string;
  attester: string;
  createdAt: string;
  link: string;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const result = await apiClient.get<ApiResult<ActivityItem[]>>('/api/activity', {
        skipAuth: true,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}
