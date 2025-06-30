'use client';

import { useState } from 'react';
import WalletConnectButton from '@/components/WalletConnectButton';
import EasStatus from '@/components/EasStatus';
import { useEas } from '@/contexts/EasContext';
import { FileHashCalculator } from '@/components/FileHashCalculator';
import FileAttestationCreator from '@/components/FileAttestationCreator';
import AttestationDisplay from '@/components/AttestationDisplay';

export default function WalletTestPage() {
  const { isConnected } = useEas();
  const [fileHash, setFileHash] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [attestationUID, setAttestationUID] = useState<string>('');
  
  const handleFileHashCalculated = (hash: string, formattedHash: string, name: string) => {
    setFileHash(formattedHash);
    setFileName(name);
    console.log(`ファイル "${name}" のハッシュ:`, formattedHash);
  };

  const handleAttestationSuccess = (uid: string) => {
    setAttestationUID(uid);
    console.log('アテステーション作成成功:', uid);
  };

  const handleAttestationError = (error: Error) => {
    console.error('アテステーション作成エラー:', error);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ウォレット接続テスト</h1>
      
      <div className="mb-8">
        <WalletConnectButton className="mb-4" />
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-800">
            このページでは、MetaMaskなどのウォレットとの接続を試すことができます。
            ウォレットを接続すると、EAS（Ethereum Attestation Service）にアクセスするための準備が整います。
          </p>
        </div>
        
        <EasStatus className="mb-6" />
      </div>
      
      {isConnected && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">ファイルハッシュ計算とアテステーション</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileHashCalculator 
              onHashCalculated={handleFileHashCalculated}
              className="shadow-sm"
            />
            
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">アテステーション作成</h3>
              
              {fileHash ? (
                <FileAttestationCreator
                  fileHash={fileHash}
                  fileName={fileName}
                  onSuccess={handleAttestationSuccess}
                  onError={handleAttestationError}
                />
              ) : (
                <p className="text-gray-500">
                  左側でファイルを選択し、ハッシュを計算してください。
                </p>
              )}
            </div>
          </div>
          
          {attestationUID && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">アテステーション情報</h2>
              <AttestationDisplay attestationUID={attestationUID} />
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-medium text-yellow-800 mb-2">開発メモ</h2>
        <ul className="list-disc pl-5 text-yellow-700 space-y-1">
          <li>MetaMaskが見つからない場合、インストールを促すメッセージが表示されます</li>
          <li>ネットワークはテストネット（Sepolia, Goerli, Arbitrum Goerli, Optimism Goerli）を使用することをお勧めします</li>
          <li>ブロックチェーンとの対話はすべて実際のトランザクションとなり、少量のETHが必要です</li>
          <li>ファイルハッシュはブロックチェーンに記録するためのフィンガープリントとして使用されます</li>
          <li>本番環境では、IPFSに文書そのものを保存し、そのCIDとハッシュをアテステーションとして記録します</li>
        </ul>
      </div>
    </main>
  );
} 