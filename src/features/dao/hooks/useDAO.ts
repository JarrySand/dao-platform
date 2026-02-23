import { useQuery } from '@tanstack/react-query';
import { fetchDAO } from '../api/daoApi';

export function useDAO(id: string) {
  return useQuery({
    queryKey: ['dao', id],
    queryFn: () => fetchDAO(id),
    enabled: !!id,
  });
}
