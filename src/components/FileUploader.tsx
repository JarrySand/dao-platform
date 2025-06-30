'use client';

import { useState } from 'react';
import { uploadFileToIPFS } from '@/utils/ipfsStorage';
import { calculateFileHash } from '@/utils/fileHash';

interface FileUploaderProps {
  onUploadComplete?: (result: {
    ipfsCid: string;
    ipfsGateway: string;
    fileHash: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }) => void;
  onError?: (error: Error) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
  className?: string;
}

export default function FileUploader({
  onUploadComplete,
  onError,
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSizeMB = 10,
  className = ''
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<{
    ipfsCid: string;
    ipfsGateway: string;
    fileHash: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const selectedFile = e.target.files[0];
    
    // ファイルタイプの検証
    if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
      setError(`サポートされていないファイル形式です。サポート形式: ${allowedTypes.join(', ')}`);
      return;
    }
    
    // ファイルサイズの検証
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`ファイルサイズが大きすぎます。最大: ${maxSizeMB}MB`);
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setUploadResult(null);
  };

  const uploadFile = async () => {
    if (!file) {
      setError('ファイルが選択されていません');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // 進捗のシミュレーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 10;
          return next > 90 ? 90 : next;
        });
      }, 300);

      // ファイルハッシュの計算
      const hash = await calculateFileHash(file);
      const fileHash = `0x${hash}`;

      // IPFSへのアップロード
      const { ipfsCid, ipfsGateway } = await uploadFileToIPFS(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = {
        ipfsCid,
        ipfsGateway,
        fileHash,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

      setUploadResult({
        ipfsCid,
        ipfsGateway,
        fileHash
      });

      // 結果をコールバックで返す
      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (err) {
      console.error('File upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'ファイルのアップロードに失敗しました';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-3">ファイルアップロード</h3>
      
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                  <p className="mb-1 text-sm text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-gray-500">クリックして別のファイルを選択</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 mb-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-500">クリックしてファイルを選択</p>
                  <p className="text-xs text-gray-500">最大 {maxSizeMB}MB</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              accept={allowedTypes.join(',')}
            />
          </label>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{width: `${uploadProgress}%`}}
            ></div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {uploadProgress < 100 ? 'アップロード中...' : '処理中...'}
            </p>
          </div>
        )}
        
        {uploadResult && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
            <p className="text-sm font-medium">アップロード完了</p>
            <div className="mt-2">
              <p className="text-xs"><span className="font-medium">IPFS CID:</span> {uploadResult.ipfsCid}</p>
              <p className="text-xs"><span className="font-medium">ファイルハッシュ:</span> {uploadResult.fileHash}</p>
              <a 
                href={`${uploadResult.ipfsGateway}/ipfs/${uploadResult.ipfsCid}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              >
                IPFSで表示
              </a>
            </div>
          </div>
        )}
        
        <button
          onClick={uploadFile}
          disabled={!file || isUploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              アップロード中...
            </span>
          ) : (
            'IPFSにアップロード'
          )}
        </button>
      </div>
    </div>
  );
} 