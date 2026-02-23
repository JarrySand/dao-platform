'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateFileHash, formatHashForBlockchain } from '@/shared/utils/fileHash';
import { uploadToIPFS } from '@/shared/lib/ipfs';
import {
  getEASInstance,
  getSignerFromBrowser,
  encodeDocumentV3Data,
  resolveEASTransaction,
} from '@/shared/lib/eas';
import { apiClient, createWalletAuthHeader } from '@/shared/lib/api-client';
import { CHAIN_CONFIG } from '@/config/chains';
import { useWalletStore } from '@/features/wallet/stores/walletStore';
import { isOtherDocumentType, isRegulationType } from '../types';
import type {
  RegisterDocumentFormData,
  DocumentRegistrationProgress,
  DocumentRegistrationResult,
} from '../types';

interface RegisterDocumentParams {
  formData: RegisterDocumentFormData;
  file: File;
  daoId: string;
  onProgress?: (progress: DocumentRegistrationProgress) => void;
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function useRegisterDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formData,
      file,
      daoId,
      onProgress,
    }: RegisterDocumentParams): Promise<DocumentRegistrationResult> => {
      const updateProgress = (
        step: DocumentRegistrationProgress['step'],
        message: string,
        progress: number,
      ) => {
        onProgress?.({ step, message, progress });
      };

      // H3: Verify DAO membership (Phase 0: wallet address must match DAO attester)
      const walletAddress = useWalletStore.getState().address;
      if (!walletAddress) {
        throw new Error('ウォレットが接続されていません');
      }
      try {
        const daoResult = await apiClient.get<{
          success: boolean;
          data: { adminAddress?: string; attester?: string };
        }>(`/api/daos/${encodeURIComponent(daoId)}`);
        if (daoResult.success && daoResult.data) {
          const ownerAddress =
            ('attester' in daoResult.data ? daoResult.data.attester : null) ||
            daoResult.data.adminAddress;
          if (ownerAddress && ownerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error('この DAO のメンバーのみがドキュメントを登録できます');
          }
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('メンバー')) throw e;
        // best-effort: allow registration if DAO check fails
      }

      // C3: Duplicate prevention for standard regulation types
      if (
        isRegulationType(formData.documentType) &&
        formData.documentType !== 'custom_rules' &&
        !formData.previousVersionId
      ) {
        try {
          const checkRes = await fetch(
            `/api/documents?daoId=${encodeURIComponent(daoId)}&type=${formData.documentType}&status=active`,
          );
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.success && checkData.data?.data?.length > 0) {
              throw new Error(
                'この DAO にはすでに有効な規程が存在します。改定として登録してください。',
              );
            }
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes('改定')) throw e;
          // best-effort: allow if check fails
        }
      }

      // Step 1: Hash calculation
      updateProgress('hashing', 'ファイルハッシュを計算中...', 10);
      const hash = await calculateFileHash(file);
      const documentHash = formatHashForBlockchain(hash);

      // Step 2: IPFS upload
      updateProgress('uploading', 'ファイルをIPFSにアップロード中...', 30);
      const { cid: ipfsCid } = await uploadToIPFS(file);

      // Step 3: EAS attestation
      updateProgress('attesting', 'アテステーションを作成中...', 60);
      const signer = await getSignerFromBrowser();
      const eas = getEASInstance(signer);

      const schemaUID = CHAIN_CONFIG.sepolia.schemas.documentV3.uid;

      // For proposal/minutes (other document types), force previousVersionId to 0x0
      const previousVersionId = isOtherDocumentType(formData.documentType)
        ? ZERO_BYTES32
        : formData.previousVersionId || ZERO_BYTES32;

      const encodedData = encodeDocumentV3Data({
        daoAttestationUID: daoId,
        documentTitle: formData.title,
        documentType: formData.documentType,
        documentHash,
        ipfsCid,
        previousVersionId,
        votingTxHash: formData.votingTxHash || ZERO_BYTES32,
        votingChainId: formData.votingChainId || 0,
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

      // Step 4: Wait for transaction confirmation and extract attestation UID
      updateProgress('caching', 'トランザクション確認中...', 85);
      const { attestationUID, transactionHash } = await resolveEASTransaction(tx);

      // Event-driven sync: sync the new attestation to Firestore
      try {
        const address = await signer.getAddress();
        const authorization = await createWalletAuthHeader(address);
        await fetch(`/api/sync/${attestationUID}`, {
          method: 'POST',
          headers: { Authorization: authorization },
        });
      } catch {
        // best-effort
      }

      updateProgress('complete', '登録完了', 100);

      return { attestationUID, documentHash, ipfsCid, transactionHash };
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['documents', { daoId: variables.daoId }],
      });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
