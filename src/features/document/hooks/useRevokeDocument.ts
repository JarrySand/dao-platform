'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getEASInstance, getSignerFromBrowser } from '@/shared/lib/eas';
import { CHAIN_CONFIG } from '@/config/chains';

export function useRevokeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attestationUID: string): Promise<string> => {
      const signer = await getSignerFromBrowser();
      const eas = getEASInstance(signer);
      const schemaUID = CHAIN_CONFIG.sepolia.schemas.documentV3.uid;

      const tx = await eas.revoke({
        schema: schemaUID,
        data: {
          uid: attestationUID,
          value: BigInt(0),
        },
      });

      await tx.wait();

      // Event-driven sync: sync the revocation state to Firestore
      if (attestationUID.startsWith('0x')) {
        try {
          await fetch(`/api/sync/${attestationUID}`, { method: 'POST' });
        } catch {
          // best-effort
        }
      }

      return typeof tx === 'object' && 'hash' in tx
        ? String((tx as Record<string, unknown>).hash)
        : '';
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}
