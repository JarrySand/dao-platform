import { useQuery } from '@tanstack/react-query';
import { fetchDAO } from '../api/daoApi';

export function useDAO(id: string) {
  return useQuery({
    queryKey: ['dao', id],
    queryFn: async () => {
      const result = await fetchDAO(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
  });
}
