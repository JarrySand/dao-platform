'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDAOs } from '../api/daoApi';

export function useMyDAOs(address: string | undefined) {
  return useQuery({
    queryKey: ['myDaos', address],
    queryFn: () => fetchDAOs({ status: 'active' }),
    enabled: !!address,
    staleTime: 60_000,
    select: (result) => {
      if (!result.success) return result;
      return {
        ...result,
        data: {
          ...result.data,
          data: result.data.data.filter(
            (dao) => dao.adminAddress.toLowerCase() === address!.toLowerCase(),
          ),
        },
      };
    },
  });
}
