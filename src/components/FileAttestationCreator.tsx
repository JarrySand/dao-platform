'use client';

import { useState } from 'react';
import { useEas } from '@/contexts/EasContext';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers, TransactionReceipt } from 'ethers';
import { uploadFileToIPFS } from '@/utils/ipfsStorage';

interface FileAttestationCreatorProps {
  fileHash: string;
  fileName: string;
  onSuccess?: (attestationUID: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function FileAttestationCreator({
  fileHash,
  fileName,
  onSuccess,
  onError,
  className = ''
}: FileAttestationCreatorProps) {
  const { eas, isConnected, signer } = useEas();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [attestationUID, setAttestationUID] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  // EAS Contract addresses - get from env or use defaults for test
  const DOCUMENT_SCHEMA_UID = process.env.NEXT_PUBLIC_DOCUMENT_SCHEMA_UID || '0x0000000000000000000000000000000000000000000000000000000000000000';

  const createAttestation = async () => {
    if (!isConnected || !eas || !signer) {
      setError('ウォレットが接続されていないか、EASが初期化されていません');
      onError?.(new Error('Not connected to wallet or EAS not initialized'));
      return;
    }

    if (!fileHash) {
      setError('ファイルハッシュが指定されていません');
      return;
    }

    setIsCreating(true);
    setError('');
    setSuccess(false);
    setAttestationUID('');
    setTxHash('');

    try {
      // Get signer address
      const signerAddress = await signer.getAddress();
      
      // Generate mock values for demo
      const daoId = `demo-dao-${Date.now()}`;
      const daoAttestationUID = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const documentId = `doc-${daoId.slice(0, 10)}-file-${Date.now()}`;
      
      // 実際のIPFSアップロード（ファイルが提供されている場合）
      let ipfsCid = `mock-ipfs-${Date.now().toString(16)}`;
      let ipfsGateway = 'https://ipfs.io';
      
      // Create schema encoder with the document schema
      const schemaEncoder = new SchemaEncoder(
        'string daoId,bytes32 daoAttestationUID,string documentId,string documentTitle,bytes32 documentHash,string ipfsCid,string ipfsGateway,uint256 timestamp,string version,bytes32 previousVersionId,address creatorAddress,string status'
      );
      
      // Encode attestation data
      const encodedData = schemaEncoder.encodeData([
        { name: 'daoId', value: daoId, type: 'string' },
        { name: 'daoAttestationUID', value: daoAttestationUID, type: 'bytes32' },
        { name: 'documentId', value: documentId, type: 'string' },
        { name: 'documentTitle', value: fileName, type: 'string' },
        { name: 'documentHash', value: fileHash, type: 'bytes32' },
        { name: 'ipfsCid', value: ipfsCid, type: 'string' },
        { name: 'ipfsGateway', value: ipfsGateway, type: 'string' },
        { name: 'timestamp', value: BigInt(Math.floor(Date.now() / 1000)), type: 'uint256' },
        { name: 'version', value: '1.0', type: 'string' },
        { name: 'previousVersionId', value: '0x0000000000000000000000000000000000000000000000000000000000000000', type: 'bytes32' },
        { name: 'creatorAddress', value: signerAddress, type: 'address' },
        { name: 'status', value: 'active', type: 'string' }
      ]);

      // Create the attestation
      const tx = await eas.attest({
        schema: DOCUMENT_SCHEMA_UID,
        data: {
          recipient: '0x0000000000000000000000000000000000000000',
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData
        }
      });

      // In EAS SDK v1.0, tx is a Transaction object, but property names may vary
      // Use type assertion if needed after checking actual structure
      const transactionHash = typeof tx === 'object' && 'hash' in tx ? (tx as any).hash : '';
      setTxHash(transactionHash);
      console.log('Attestation tx sent:', transactionHash);
      
      // Wait for transaction confirmation and handle receipt
      const receiptResponse = await tx.wait();
      
      // アテステーションUIDを取得
      let uid = '';
      if (receiptResponse) {
        try {
          // まずlogsが配列かどうか確認
          const logs = Array.isArray(receiptResponse.logs) ? receiptResponse.logs : [];
          
          if (logs.length > 0) {
            const firstLog = logs[0];
            // topicsが配列かどうか確認
            const topics = Array.isArray(firstLog.topics) ? firstLog.topics : [];
            
            // 通常、最初のログの2番目のトピックにUIDが含まれる
            if (topics.length > 1) {
              uid = topics[1];
              setAttestationUID(uid);
              setSuccess(true);
              console.log('Attestation created with UID:', uid);
              onSuccess?.(uid);
            } else {
              throw new Error('アテステーションUIDを取得できませんでした');
            }
          } else {
            throw new Error('トランザクションレシートからイベントを取得できませんでした');
          }
        } catch (err) {
          console.error('Error extracting attestation UID:', err);
          throw new Error('アテステーションUIDの抽出に失敗しました');
        }
      } else {
        throw new Error('トランザクションレシートが取得できませんでした');
      }
    } catch (err) {
      console.error('Attestation creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'アテステーション作成中にエラーが発生しました';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsCreating(false);
    }
  };

  const renderStatus = () => {
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (isCreating) {
      return (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <p className="text-sm">
              {txHash ? 'トランザクション確認中...' : 'アテステーション作成中...'}
            </p>
          </div>
          {txHash && (
            <p className="text-xs mt-2">
              トランザクションハッシュ: <span className="font-mono break-all">{txHash}</span>
            </p>
          )}
        </div>
      );
    }

    if (success) {
      return (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <p className="text-sm font-medium">アテステーションが正常に作成されました！</p>
          <p className="text-xs mt-2">
            アテステーションUID: <span className="font-mono break-all">{attestationUID}</span>
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ファイル情報
        </label>
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm mb-1"><span className="font-medium">ファイル名:</span> {fileName || '未設定'}</p>
          <p className="text-sm mb-1"><span className="font-medium">ハッシュ:</span></p>
          <div className="bg-white p-2 rounded border text-xs font-mono break-all">
            {fileHash || '未計算'}
          </div>
        </div>
      </div>

      <button
        onClick={createAttestation}
        disabled={isCreating || !isConnected || !fileHash}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isCreating ? 'アテステーション作成中...' : 'アテステーションを作成'}
      </button>

      {renderStatus()}

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
          アテステーションを作成するには、まずウォレットを接続してください。
        </div>
      )}
    </div>
  );
} 