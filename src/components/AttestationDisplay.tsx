'use client';

import { useState, useEffect } from 'react';

interface AttestationDisplayProps {
  attestationUID: string;
  className?: string;
}

interface DecodedData {
  daoId: string;
  daoAttestationUID: string;
  documentId: string;
  documentTitle: string;
  documentHash: string;
  ipfsCid: string;
  ipfsGateway: string;
  timestamp: bigint;
  version: string;
  previousVersionId: string;
  creatorAddress: string;
  status: string;
}

// モックAPIの実装
const fetchAttestationData = async (uid: string) => {
  // 実際の実装では、サーバーサイドでEASに問い合わせる
  // ここではモックデータを返す
  return {
    uid,
    schema: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    data: '0x' + '0'.repeat(64),
    attester: '0xabcdef1234567890abcdef1234567890abcdef12',
    recipient: '0x0000000000000000000000000000000000000000',
    time: 1612345678,
    revocable: true,
    revoked: false,
  };
};

export default function AttestationDisplay({
  attestationUID,
  className = ''
}: AttestationDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [attestation, setAttestation] = useState<any>(null);
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null);

  useEffect(() => {
    if (attestationUID) {
      loadAttestationData();
    }
  }, [attestationUID]);

  const loadAttestationData = async () => {
    if (!attestationUID) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // モックAPIからデータを取得
      const attestationData = await fetchAttestationData(attestationUID);
      setAttestation(attestationData);

      if (attestationData) {
        // デコード処理
        try {
          // 実際にはスキーマに基づいてデコード
          const decodedResult = decodeAttestationData(attestationData);
          setDecodedData(decodedResult);
        } catch (decodeError) {
          console.error('Error decoding attestation data:', decodeError);
          setError('アテステーションデータの解析に失敗しました');
        }
      }
    } catch (err) {
      console.error('Error fetching attestation:', err);
      setError('アテステーションの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // This is a simplified decoder - in a real app, you'd need to get the schema structure first
  const decodeAttestationData = (data: any): DecodedData => {
    // For MVP, we'll just return a mock decoded structure
    return {
      daoId: 'mock-dao-id',
      daoAttestationUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
      documentId: 'mock-document-id',
      documentTitle: 'ドキュメントタイトル',
      documentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      ipfsCid: 'mock-ipfs-cid',
      ipfsGateway: 'https://ipfs.io',
      timestamp: BigInt(data.time || Math.floor(Date.now() / 1000)),
      version: '1.0',
      previousVersionId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      creatorAddress: data.attester || '0x0000000000000000000000000000000000000000',
      status: 'active'
    };
  };

  // Format timestamp to human-readable date
  const formatTimestamp = (timestamp: bigint) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString('ja-JP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format address to short form
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-md ${className}`}>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">アテステーション情報を取得中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 border rounded-md ${className}`}>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p className="font-medium">エラーが発生しました</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={loadAttestationData} 
            className="mt-3 px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!attestation || !decodedData) {
    return (
      <div className={`p-4 border rounded-md ${className}`}>
        <div className="text-center text-gray-500 py-8">
          <p>アテステーション情報がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-md ${className}`}>
      <h3 className="text-lg font-semibold mb-4">アテステーション詳細</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500 mb-1">アテステーションUID:</p>
          <p className="text-xs font-mono break-all">{attestationUID}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">基本情報</p>
            <div className="mt-2 bg-gray-50 p-3 rounded-md">
              <p className="text-sm"><span className="text-gray-500">スキーマ:</span> <span className="font-mono text-xs">{attestation.schema.substring(0, 10)}...</span></p>
              <p className="text-sm"><span className="text-gray-500">作成者:</span> <span className="font-mono text-xs">{formatAddress(decodedData.creatorAddress)}</span></p>
              <p className="text-sm"><span className="text-gray-500">作成日時:</span> {formatTimestamp(decodedData.timestamp)}</p>
              <p className="text-sm"><span className="text-gray-500">失効可能:</span> {attestation.revocable ? 'はい' : 'いいえ'}</p>
              <p className="text-sm"><span className="text-gray-500">失効済み:</span> {attestation.revoked ? 'はい' : 'いいえ'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium">ドキュメント情報</p>
            <div className="mt-2 bg-gray-50 p-3 rounded-md">
              <p className="text-sm"><span className="text-gray-500">タイトル:</span> {decodedData.documentTitle}</p>
              <p className="text-sm"><span className="text-gray-500">DAO ID:</span> {decodedData.daoId}</p>
              <p className="text-sm"><span className="text-gray-500">バージョン:</span> {decodedData.version}</p>
              <p className="text-sm"><span className="text-gray-500">ステータス:</span> {decodedData.status}</p>
            </div>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium">ハッシュ情報</p>
          <div className="mt-2 bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500 mb-1">ドキュメントハッシュ:</p>
            <p className="text-xs font-mono break-all">{decodedData.documentHash}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium">IPFS情報</p>
          <div className="mt-2 bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500 mb-1">IPFS CID:</p>
            <p className="text-xs font-mono break-all">{decodedData.ipfsCid}</p>
            {decodedData.ipfsCid && decodedData.ipfsGateway && (
              <a 
                href={`${decodedData.ipfsGateway}/ipfs/${decodedData.ipfsCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
              >
                IPFSでドキュメントを表示
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 