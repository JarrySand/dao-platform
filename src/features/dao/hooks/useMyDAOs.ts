'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDAOs } from '../api/daoApi';

export function useMyDAOs(address: string | undefined) {
  return useQuery({
    queryKey: ['myDaos', address],
    queryFn: async () => {
      const result = await fetchDAOs({ status: 'active' });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!address,
    staleTime: 60_000,
    select: (data) => ({
      ...data,
      data: data.data.filter((dao) => dao.adminAddress.toLowerCase() === address!.toLowerCase()),
    }),
  });
}
