import React, { useState, useRef, ChangeEvent } from 'react';
import { calculateFileHash, formatHashForBlockchain } from '@/utils/fileHash';

interface FileHashCalculatorProps {
  onHashCalculated?: (hash: string, formattedHash: string, fileName: string) => void;
  className?: string;
}

export const FileHashCalculator: React.FC<FileHashCalculatorProps> = ({ 
  onHashCalculated,
  className = ''
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [fileHash, setFileHash] = useState<string>('');
  const [formattedHash, setFormattedHash] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    setFileName(file.name);
    setErrorMessage('');
    setIsCalculating(true);
    
    try {
      // ファイルのハッシュを計算
      const hash = await calculateFileHash(file);
      const formatted = formatHashForBlockchain(hash);
      
      setFileHash(hash);
      setFormattedHash(formatted);
      
      // 親コンポーネントにハッシュを通知
      if (onHashCalculated) {
        onHashCalculated(hash, formatted, file.name);
      }
    } catch (error) {
      console.error('Error calculating file hash:', error);
      setErrorMessage('ファイルのハッシュ計算中にエラーが発生しました');
      setFileHash('');
      setFormattedHash('');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileName('');
    setFileHash('');
    setFormattedHash('');
    setErrorMessage('');
  };

  const handleClickInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">ファイルハッシュ計算</h3>
      
      <div className="flex flex-col space-y-4">
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div 
            onClick={handleClickInput}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {fileName ? (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600">選択されたファイル:</p>
                <p className="font-medium text-blue-600">{fileName}</p>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    handleClearFile();
                  }} 
                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                >
                  クリア
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-gray-500">クリックしてファイルを選択</p>
                <p className="text-sm text-gray-400">または、ここにファイルをドラッグ&ドロップ</p>
              </div>
            )}
          </div>
        </div>
        
        {isCalculating && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">ハッシュを計算中...</span>
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded">
            {errorMessage}
          </div>
        )}
        
        {fileHash && (
          <div className="bg-gray-50 p-3 rounded border">
            <div className="mb-2">
              <label className="text-sm font-medium text-gray-700">SHA-256 ハッシュ:</label>
              <div className="mt-1 break-all bg-white p-2 rounded border text-xs font-mono">
                {fileHash}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">ブロックチェーン用フォーマット:</label>
              <div className="mt-1 break-all bg-white p-2 rounded border text-xs font-mono">
                {formattedHash}
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => navigator.clipboard.writeText(formattedHash)}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
              >
                コピー
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 