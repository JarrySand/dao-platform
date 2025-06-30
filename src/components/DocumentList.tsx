/**
 * ドキュメント一覧表示コンポーネント
 * 新しい最小限スキーマに対応
 */

'use client';

import { useState, useEffect } from 'react';
import { Document } from '@/types';
import { parseDocumentAttestation, getDocumentIPFSUrl, fetchFromIPFSWithFallback } from '@/utils/easSchema';
import { revokeDocument } from '@/services/documentService';

interface DocumentListProps {
  daoId: string;
  daoAttestationUID: string;
  documents: Document[];
  onDocumentRevoked?: (documentId: string) => void;
}

interface DocumentWithStatus extends Omit<Document, 'status'> {
  status: 'active' | 'archived' | 'revoked';
  isDownloading?: boolean;
  downloadError?: string;
}

export default function DocumentList({
  daoId,
  daoAttestationUID,
  documents,
  onDocumentRevoked
}: DocumentListProps) {
  const [localDocuments, setLocalDocuments] = useState<DocumentWithStatus[]>(documents);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const handleDownload = async (document: DocumentWithStatus) => {
    if (!document.ipfsCid) {
      alert('IPFSファイルが見つかりません');
      return;
    }

    // ダウンロード状態を更新
    setLocalDocuments(prev =>
      prev.map(doc =>
        doc.id === document.id
          ? { ...doc, isDownloading: true, downloadError: undefined }
          : doc
      )
    );

    try {
      const response = await fetchFromIPFSWithFallback(document.ipfsCid);
      const blob = await response.blob();
      
      // ファイルをダウンロード
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.name}_v${document.version}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 成功状態を更新
      setLocalDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id
            ? { ...doc, isDownloading: false }
            : doc
        )
      );

    } catch (error) {
      console.error('Download failed:', error);
      
      // エラー状態を更新
      setLocalDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id
            ? { 
                ...doc, 
                isDownloading: false, 
                downloadError: 'ダウンロードに失敗しました' 
              }
            : doc
        )
      );
    }
  };

  const handleRevoke = async (document: DocumentWithStatus) => {
    if (!document.attestationUID) {
      alert('アテステーションUIDが見つかりません');
      return;
    }

    const confirmed = confirm(
      `「${document.name}」を取り消しますか？\n\nこの操作は元に戻せません。ドキュメントはブロックチェーン上で無効化されます。`
    );

    if (!confirmed) return;

    setRevokingIds(prev => new Set(prev).add(document.id));

    try {
      await revokeDocument(document.attestationUID);
      
      // ローカル状態を更新
      setLocalDocuments(prev =>
        prev.map(doc =>
          doc.id === document.id
            ? { ...doc, status: 'revoked' }
            : doc
        )
      );

      // コールバック実行
      onDocumentRevoked?.(document.id);

      alert('ドキュメントが正常に取り消されました');

    } catch (error) {
      console.error('Revoke failed:', error);
      alert('取り消しに失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setRevokingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string, revoked?: boolean) => {
    if (revoked || status === 'revoked') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          取り消し済み
        </span>
      );
    }
    
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          有効
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '不明';
    }
  };

  if (localDocuments.length === 0) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ドキュメントがありません</h3>
          <p className="text-gray-500">
            まだドキュメントが登録されていません。上記のフォームから新しいドキュメントを登録してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            登録済みドキュメント ({localDocuments.length})
          </h3>
          <div className="text-xs text-gray-500">
            スキーマ: 最小限設計 (6フィールド)
          </div>
        </div>

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ドキュメント
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  バージョン
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ハッシュ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {document.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {document.type === 'articles' && '定款'}
                          {document.type === 'meeting' && 'DAO総会規程'}
                          {document.type === 'token' && 'トークン規程'}
                          {document.type === 'operation' && '運営規程'}
                          {document.type === 'other' && 'その他'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    v{document.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(document.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(document.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-mono text-gray-500">
                      {document.hash ? `${document.hash.substring(0, 10)}...` : '未設定'}
                    </div>
                    {document.ipfsCid && (
                      <div className="text-xs text-blue-600 mt-1">
                        IPFS: {document.ipfsCid.substring(0, 10)}...
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {/* ダウンロードボタン */}
                      <button
                        onClick={() => handleDownload(document)}
                        disabled={!document.ipfsCid || document.isDownloading}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {document.isDownloading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></div>
                            DL中
                          </div>
                        ) : (
                          <>
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            DL
                          </>
                        )}
                      </button>

                      {/* EASリンクボタン */}
                      {document.attestationUID && (
                        <a
                          href={`https://sepolia.easscan.org/attestation/view/${document.attestationUID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
                          title="EAS Scanでブロックチェーン証明書を確認"
                        >
                          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          EAS
                        </a>
                      )}

                      {/* 取り消しボタン */}
                      {document.status === 'active' && (
                        <button
                          onClick={() => handleRevoke(document)}
                          disabled={revokingIds.has(document.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          {revokingIds.has(document.id) ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500 mr-1"></div>
                              処理中
                            </div>
                          ) : (
                            <>
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              取消
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* エラー表示 */}
        {localDocuments.some(doc => doc.downloadError) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>ダウンロードエラー:</strong>
              <ul className="mt-1 ml-4 list-disc">
                {localDocuments
                  .filter(doc => doc.downloadError)
                  .map(doc => (
                    <li key={doc.id}>
                      {doc.name}: {doc.downloadError}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* 技術情報 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              技術情報（クリックで表示）
            </summary>
            <div className="mt-2 space-y-1">
              <div>スキーマUID: 0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152</div>
              <div>DAO参照: {daoAttestationUID}</div>
              <div>フィールド構成: daoAttestationUID, documentTitle, documentHash, ipfsCid, version, previousVersionId</div>
              <div>ガス効率: 従来比 ~26% 削減</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
} 