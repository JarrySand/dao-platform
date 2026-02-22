'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateFileHash, formatHashForBlockchain } from '@/shared/utils/fileHash';
import { uploadToIPFS } from '@/shared/lib/ipfs';
import { getEASInstance, getSignerFromBrowser, encodeDocumentV2Data } from '@/shared/lib/eas';
import { CHAIN_CONFIG } from '@/config/chains';
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

      const schemaUID = CHAIN_CONFIG.sepolia.schemas.documentV2.uid;

      const encodedData = encodeDocumentV2Data({
        daoAttestationUID: daoId,
        documentTitle: formData.title,
        documentType: formData.documentType,
        documentHash,
        ipfsCid,
        version: formData.version,
        previousVersionId: formData.previousVersionId || ZERO_BYTES32,
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

      updateProgress('caching', 'トランザクション確認中...', 85);
      const receipt = await tx.wait();

      let attestationUID = '';
      if (receipt && typeof receipt === 'object' && 'logs' in receipt) {
        const logs = (receipt as Record<string, unknown>).logs;
        if (Array.isArray(logs) && logs.length > 0) {
          const firstLog = logs[0] as Record<string, unknown>;
          if (firstLog && 'topics' in firstLog) {
            const topics = firstLog.topics;
            if (Array.isArray(topics) && topics.length > 1) {
              attestationUID = String(topics[1]);
            }
          }
        }
      }

      updateProgress('complete', '登録完了', 100);

      return {
        attestationUID,
        documentHash,
        ipfsCid,
        transactionHash:
          typeof tx === 'object' && 'hash' in tx
            ? String((tx as Record<string, unknown>).hash)
            : '',
      };
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['documents', { daoId: variables.daoId }],
      });
    },
  });
}
