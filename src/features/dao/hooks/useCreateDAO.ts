import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDAO } from '../api/daoApi';
import type { CreateDAOFormData } from '../types';

export function useCreateDAO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDAOFormData) => createDAO(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daos'] });
      queryClient.invalidateQueries({ queryKey: ['myDaos'] });
    },
  });
}
