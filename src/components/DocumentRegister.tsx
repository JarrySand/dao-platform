'use client';

import { useState } from 'react';
import { Document, DocumentType } from '@/types';
import { 
  registerDocument,
  estimateDocumentRegistrationGas,
  getDocumentTypes,
  DocumentRegistrationProgress 
} from '@/services/documentService';
import { getIPFSFileUrl } from '@/utils/ipfsStorage';

// Add proper window ethereum type definition
declare global {
  interface Window {
    ethereum: any;
  }
}

interface DocumentRegisterProps {
  daoId: string;
  daoAttestationUID: string;
  onDocumentRegistered: (document: Document) => void;
}

export default function DocumentRegister({
  daoId,
  daoAttestationUID,
  onDocumentRegistered
}: DocumentRegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'articles' as DocumentType,
    fileContent: null as File | null,
    version: '1.0',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState<DocumentRegistrationProgress | null>(null);
  const [gasEstimate, setGasEstimate] = useState<{
    gas: string;
    costETH: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        fileContent: e.target.files[0]
      });
      // ファイル選択時にガス見積もりを取得
      estimateGas(e.target.files[0]);
    }
  };

  const estimateGas = async (file: File) => {
    if (!daoAttestationUID || !formData.name) return;
    
    try {
      const estimate = await estimateDocumentRegistrationGas({
        daoAttestationUID,
        documentTitle: formData.name,
        file,
        version: formData.version
      });
      
      setGasEstimate({
        gas: estimate.estimatedGas,
        costETH: estimate.estimatedCostETH
      });
    } catch (error) {
      console.warn('Gas estimation failed:', error);
      setGasEstimate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fileContent) {
      setError('ファイルを選択してください');
      return;
    }

    if (!daoAttestationUID) {
      setError('DAOアテステーションUIDが必要です');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setProgress(null);

    try {
      const result = await registerDocument({
        daoAttestationUID,
        documentTitle: formData.name,
        file: formData.fileContent,
        version: formData.version
      }, setProgress);

      // Create document object for UI update
      const newDocument: Document = {
        id: result.attestationUID, // アテステーションUIDをドキュメントIDとして使用
        daoId: daoId,
        name: formData.name,
        type: formData.type,
        fileUrl: getIPFSFileUrl(result.ipfsCid, 'https://ipfs.io/ipfs/'),
        hash: result.documentHash,
        version: parseFloat(formData.version) || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        ipfsCid: result.ipfsCid,
        ipfsGateway: 'https://ipfs.io/ipfs/', // デフォルトゲートウェイ
        attestationUID: result.attestationUID
      };

      // Call the callback with the new document
      onDocumentRegistered(newDocument);
      setSuccess(`ドキュメントが正常に登録されました。\nアテステーションUID: ${result.attestationUID.substring(0, 20)}...\nIPFS CID: ${result.ipfsCid.substring(0, 20)}...`);

      // Reset form
      setFormData({
        name: '',
        type: 'articles',
        fileContent: null,
        version: '1.0'
      });
      setGasEstimate(null);

    } catch (err) {
      console.error('Document registration error:', err);
      
      // IPFSエラーの場合は詳細なヘルプメッセージを表示
      let errorMessage = err instanceof Error ? err.message : '登録中にエラーが発生しました';
      
      // IPFSアップロードエラーの場合
      if (errorMessage.includes('IPFS') || errorMessage.includes('Pinata') || errorMessage.includes('認証情報')) {
        console.log('🚨 IPFS設定エラーが検出されました - プロセスを中止します');
        errorMessage += '\n\n⚠️ モックデータでのアテステーション作成を防ぐため、プロセスを中止しました。';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">新規ドキュメント登録</h2>
        <p className="mt-1 text-sm text-gray-500">
          新しい最小限スキーマを使用した高効率ドキュメント登録
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            ドキュメント名 *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="例: 定款 v2.0"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            ドキュメント種類 *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentType })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="articles">定款</option>
            <option value="meeting">DAO総会規程</option>
            <option value="token">トークン規程</option>
            <option value="operation">運営規程</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label htmlFor="version" className="block text-sm font-medium text-gray-700">
            バージョン
          </label>
          <input
            type="text"
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="1.0"
          />
          <p className="mt-1 text-xs text-gray-500">
            セマンティックバージョニング推奨（例: 1.0, 1.1, 2.0）
          </p>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            PDFファイル *
          </label>
          <input
            type="file"
            id="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            PDFファイルをアップロードしてください（最大10MB）
          </p>
        </div>

        {/* ガス見積もり表示 */}
        {gasEstimate && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">ガス見積もり</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>推定ガス: {parseInt(gasEstimate.gas).toLocaleString()} gas</div>
              <div>推定コスト: {parseFloat(gasEstimate.costETH).toFixed(6)} ETH</div>
            </div>
          </div>
        )}

        {/* プログレス表示 */}
        {progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                {progress.message}
              </span>
              <span className="text-xs text-blue-600">
                {progress.progress}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              ステップ: {progress.step}
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>エラー:</strong> {error}
            </div>
          </div>
        )}

        {/* 成功表示 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-sm text-green-800 whitespace-pre-line">
              <strong>成功:</strong> {success}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading || !formData.fileContent}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                処理中...
              </div>
            ) : (
              '登録する'
            )}
          </button>
        </div>
      </form>

      {/* スキーマ情報 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            技術仕様（クリックで表示）
          </summary>
          <div className="mt-2 space-y-1">
            <div>スキーマUID: {daoAttestationUID ? '0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152' : '未設定'}</div>
            <div>フィールド数: 6（最小限設計）</div>
            <div>ガス効率: 従来比 ~26% 削減</div>
            <div>DAO参照: {daoAttestationUID || '未設定'}</div>
          </div>
        </details>
      </div>
    </div>
  );
}