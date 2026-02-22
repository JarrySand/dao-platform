import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateDAO } from '../api/daoApi';

export function useDeactivateDAO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateDAO(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['dao', id] });
      queryClient.invalidateQueries({ queryKey: ['daos'] });
      queryClient.invalidateQueries({ queryKey: ['myDaos'] });
    },
  });
}
