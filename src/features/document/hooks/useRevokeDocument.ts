'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getEASInstance, getSignerFromBrowser, getDocumentByUID } from '@/shared/lib/eas';
import type { Document } from '../types';

export function useRevokeDocument() {
  const queryClient = useQueryClient();

  /** Sync a single attestation from EAS → Firestore, then refresh queries. */
  const syncDocument = async (uid: string): Promise<void> => {
    if (!uid.startsWith('0x')) return;
    await fetch(`/api/sync/${uid}`, { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  };

  return useMutation({
    mutationFn: async (attestationUID: string): Promise<string> => {
      // Fetch the attestation to get the correct schema UID (v1/v2/v3)
      const attestation = await getDocumentByUID(attestationUID);
      if (!attestation) {
        throw new Error('オンチェーンにアテステーションが見つかりません');
      }

      const signer = await getSignerFromBrowser();
      const eas = getEASInstance(signer);

      const tx = await eas.revoke({
        schema: attestation.schemaId,
        data: {
          uid: attestationUID,
          value: BigInt(0),
        },
      });

      await tx.wait();

      // Sync to Firestore immediately after on-chain confirmation
      await syncDocument(attestationUID);

      return typeof tx === 'object' && 'hash' in tx
        ? String((tx as Record<string, unknown>).hash)
        : '';
    },

    onSuccess: (_data, attestationUID) => {
      // Optimistically mark as revoked in cache for immediate UI feedback
      queryClient.setQueriesData<Document[]>({ queryKey: ['documents'] }, (old) =>
        old?.map((doc) =>
          doc.id === attestationUID ? { ...doc, status: 'revoked' as const } : doc,
        ),
      );

      // Retry sync after delay in case EAS indexer was slow on first attempt
      setTimeout(() => {
        syncDocument(attestationUID).catch(() => {});
      }, 8000);
    },

    onError: (error, attestationUID) => {
      const message = error instanceof Error ? error.message : String(error);

      // If the on-chain revocation already happened, sync Firestore to catch up
      if (attestationUID.startsWith('0x')) {
        syncDocument(attestationUID).catch(() => {});
      }

      window.alert(`失効に失敗しました: ${message}`);
    },
  });
}
