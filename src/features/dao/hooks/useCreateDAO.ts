'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEASInstance,
  getSignerFromBrowser,
  encodeDAOData,
  resolveEASTransaction,
} from '@/shared/lib/eas';
import { createWalletAuthHeader } from '@/shared/lib/api-client';
import { CHAIN_CONFIG } from '@/config/chains';
import type { CreateDAOFormData, DAOCreationProgress, DAOCreationResult } from '../types';

interface CreateDAOParams {
  formData: CreateDAOFormData;
  onProgress?: (progress: DAOCreationProgress) => void;
}

export function useCreateDAO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, onProgress }: CreateDAOParams): Promise<DAOCreationResult> => {
      const updateProgress = (
        step: DAOCreationProgress['step'],
        message: string,
        progress: number,
      ) => {
        onProgress?.({ step, message, progress });
      };

      // Step 1: Get signer and create EAS attestation
      updateProgress('signing', 'ウォレットで署名してください...', 20);
      const signer = await getSignerFromBrowser();
      const eas = getEASInstance(signer);
      const signerAddress = await signer.getAddress();

      const schemaUID = CHAIN_CONFIG.sepolia.schemas.dao.uid;

      const encodedData = encodeDAOData({
        daoName: formData.name,
        description: formData.description,
        adminAddress: signerAddress,
      });

      const tx = await eas.attest({
        schema: schemaUID,
        data: {
          recipient: '0x0000000000000000000000000000000000000000',
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      });

      // Step 2: Wait for transaction confirmation and extract attestation UID
      updateProgress('confirming', 'トランザクション確認中...', 60);
      const { attestationUID, transactionHash } = await resolveEASTransaction(tx);

      // Step 3: Save to Firestore with the real attestation UID
      updateProgress('saving', 'データを保存中...', 85);
      const authHeader = await createWalletAuthHeader(signerAddress);
      const res = await fetch('/api/daos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          ...formData,
          attestationUID,
          adminAddress: signerAddress,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Firestore への保存に失敗しました');
      }

      // Fire-and-forget: sync EAS fields (attester, easTime, etc.)
      try {
        await fetch(`/api/sync/${attestationUID}`, { method: 'POST' });
      } catch {
        // best-effort
      }

      updateProgress('complete', 'DAO 作成完了', 100);

      return { attestationUID, transactionHash };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daos'] });
      queryClient.invalidateQueries({ queryKey: ['myDaos'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
