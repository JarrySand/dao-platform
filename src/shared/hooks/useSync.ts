'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type { ApiResponse } from '@/shared/types/api';
import type { SyncMeta } from '@/shared/lib/firebase/types';

export function useSync() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['syncStatus'],
    queryFn: () => apiClient.get<ApiResponse<SyncMeta>>('/api/sync'),
    refetchInterval: false,
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<{ daoCount: number; documentCount: number }>>('/api/sync'),
    onSuccess: () => {
      // Invalidate all data queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['daos'] });
      queryClient.invalidateQueries({ queryKey: ['myDaos'] });
      queryClient.invalidateQueries({ queryKey: ['dao'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    },
  });

  const syncStatus = statusQuery.data?.success ? statusQuery.data.data : null;

  return {
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    lastSyncedAt: syncStatus?.syncedAt || null,
    syncStatus,
    error: syncMutation.error,
  };
}
