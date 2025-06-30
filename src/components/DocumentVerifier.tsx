'use client';

import { useState } from 'react';
import { calculateFileHash } from '@/utils/fileHash';
import AttestationDisplay from './AttestationDisplay';

// バックエンド実装を想定したモックAPI
const fetchAttestation = async (uid: string) => {
  // 本来はサーバーサイドでEASとの通信を行います
  // ここではモックデータを返します
  const mockData = {
    uid,
    data: uid + '000000000000000000000000000000000000000000000000000000',
    // その他のアテステーション情報
  };
  
  return mockData;
};

interface DocumentVerifierProps {
  className?: string;
}

export default function DocumentVerifier({ className = '' }: DocumentVerifierProps) {
  const [attestationUID, setAttestationUID] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileHash, setFileHash] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    isMatch: boolean;
    attestationHash: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileHash('');
    setVerificationResult(null);
    
    try {
      // Calculate hash for the selected file
      setIsVerifying(true);
      const hash = await calculateFileHash(selectedFile);
      const formattedHash = `0x${hash}`;
      setFileHash(formattedHash);
    } catch (err) {
      console.error('Error calculating file hash:', err);
      setError('ファイルハッシュの計算に失敗しました');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAttestationUIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttestationUID(e.target.value);
    setVerificationResult(null);
  };

  const verifyDocument = async () => {
    if (!attestationUID || !fileHash) {
      setError('アテステーションUIDとファイルが必要です');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      // アテステーション情報を取得
      const attestation = await fetchAttestation(attestationUID);
      
      if (!attestation) {
        throw new Error('アテステーションが見つかりません');
      }

      // Mock extraction of document hash from attestation
      // 実際のアプリケーションでは、適切なスキーマデコーディングが必要
      const mockAttestationHash = attestation.data ? 
        `0x${attestation.data.substring(0, 64)}` : 
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      // Compare hashes
      const isMatch = fileHash.toLowerCase() === mockAttestationHash.toLowerCase();
      
      setVerificationResult({
        isMatch,
        attestationHash: mockAttestationHash
      });
      
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : '検証中にエラーが発生しました');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderVerificationResult = () => {
    if (!verificationResult) return null;

    if (verificationResult.isMatch) {
      return (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
          <p className="font-medium">検証に成功しました ✓</p>
          <p className="mt-1 text-sm">このファイルのハッシュは、アテステーションに記録されたハッシュと一致します。ドキュメントは改ざんされていません。</p>
        </div>
      );
    } else {
      return (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">検証に失敗しました ✗</p>
          <p className="mt-1 text-sm">このファイルのハッシュは、アテステーションに記録されたハッシュと一致しません。ドキュメントが変更されている可能性があります。</p>
          
          <div className="mt-2">
            <p className="text-sm font-medium">ファイルハッシュ:</p>
            <p className="text-xs font-mono break-all">{fileHash}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium">アテステーションのハッシュ:</p>
            <p className="text-xs font-mono break-all">{verificationResult.attestationHash}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`border rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">ドキュメント検証</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            アテステーションUID
          </label>
          <input
            type="text"
            value={attestationUID}
            onChange={handleAttestationUIDChange}
            placeholder="0x..."
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            検証するドキュメントのアテステーションUIDを入力してください
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ドキュメントファイル
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {fileName ? (
                  <>
                    <p className="mb-1 text-sm text-gray-700">{fileName}</p>
                    <p className="text-xs text-gray-500">クリックして別のファイルを選択</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 mb-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">クリックしてファイルを選択</p>
                    <p className="text-xs text-gray-500">PDFなどのドキュメントファイル</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </label>
          </div>
        </div>
        
        {fileHash && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700">ファイルハッシュ:</p>
            <p className="mt-1 text-xs font-mono break-all">{fileHash}</p>
          </div>
        )}
        
        <button
          onClick={verifyDocument}
          disabled={!attestationUID || !fileHash || isVerifying}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              検証中...
            </span>
          ) : (
            'ドキュメントを検証'
          )}
        </button>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {renderVerificationResult()}
        
        {attestationUID && attestationUID.startsWith('0x') && attestationUID.length > 40 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">アテステーション情報</h3>
            <AttestationDisplay attestationUID={attestationUID} />
          </div>
        )}
      </div>
    </div>
  );
} 