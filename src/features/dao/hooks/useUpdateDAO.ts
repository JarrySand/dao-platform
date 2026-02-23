import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDAO } from '../api/daoApi';
import type { UpdateDAOFormData } from '../types';

export function useUpdateDAO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDAOFormData }) => updateDAO(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dao', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['daos'] });
      queryClient.invalidateQueries({ queryKey: ['myDaos'] });
    },
  });
}
