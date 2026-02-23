import { useQuery } from '@tanstack/react-query';
import { fetchDAOs } from '../api/daoApi';
import type { FetchDAOsParams } from '../api/daoApi';

export function useDAOs(params?: FetchDAOsParams) {
  return useQuery({
    queryKey: ['daos', params],
    queryFn: async () => {
      const result = await fetchDAOs(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
  });
}
