import { useQuery } from '@tanstack/react-query';
import { fetchDAOs } from '../api/daoApi';
import type { FetchDAOsParams } from '../api/daoApi';

export function useDAOs(params?: FetchDAOsParams) {
  return useQuery({
    queryKey: ['daos', params],
    queryFn: () => fetchDAOs(params),
    staleTime: 60_000,
  });
}
