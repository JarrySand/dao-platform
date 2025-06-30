'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Document, DocumentType } from '@/types';

import { useEas } from '@/contexts/EasContext';
import { convertAttestationToDAO } from '@/utils/easQuery';

interface DAODetailPageProps {
  params: {
    id: string;
  };
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'articles': '定款',
  'meeting': 'DAO総会規程',
  'token': 'トークン規程',
  'operation': '運営規程',
  'other': 'その他'
};

export default function DAODetailPage({ params }: DAODetailPageProps) {
  const { getAllDAOs, isConnected } = useEas();
  const [dao, setDao] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDao = async () => {
      try {
        console.log(`Loading DAO with ID: ${params.id}`);
        
        // 優先度1: EAS経由で取得（ウォレット接続不要）
        try {
          console.log('Trying EAS GraphQL query...');
          const allDAOAttestations = await getAllDAOs();
          console.log(`Found ${allDAOAttestations.length} DAO attestations`);
          
          if (allDAOAttestations.length > 0) {
            const daoPromises = allDAOAttestations.map(att => convertAttestationToDAO(att as any));
            const allDaos = (await Promise.all(daoPromises)).filter(dao => dao !== null);
            console.log(`Converted ${allDaos.length} DAOs successfully`);
            console.log('Available DAO IDs:', allDaos.map(d => d.id));
            const foundDao = allDaos.find((d: any) => d.id === params.id);
            
            if (foundDao) {
              console.log('DAO found via EAS:', foundDao);
              setDao(foundDao);
              return; // 成功したら終了
            }
          }
          console.log('DAO not found in EAS data, trying API...');
        } catch (easError) {
          console.log('EAS query failed, trying API...', easError);
        }
        
        // 優先度2: API経由でFirebaseから取得
        try {
          const response = await fetch(`/api/daos/${params.id}`);
          if (response.ok) {
            const result = await response.json();
            console.log('DAO found via API:', result.data);
            setDao(result.data);
            return; // 成功したら終了
          } else {
            console.log('DAO not found in API, status:', response.status);
          }
        } catch (apiError) {
          console.error('Failed to fetch from API:', apiError);
        }

        // 優先度3: ローカルストレージから取得
        try {
          const storedDaos = JSON.parse(localStorage.getItem('daos') || '[]');
          const localDao = storedDaos.find((d: any) => d.id === params.id);
          if (localDao) {
            console.log('DAO found in localStorage:', localDao);
            setDao(localDao);
            return; // 成功したら終了
          }
        } catch (storageError) {
          console.log('localStorage access failed:', storageError);
        }

        // すべて失敗した場合
        console.log('DAO not found in any data source');
        notFound();
        
      } catch (err) {
        console.error('Failed to load DAO:', err);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    loadDao();
  }, [params.id, getAllDAOs]);



  if (loading || !dao) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {/* 戻るリンクのスケルトン */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          
          {/* DAO詳細のスケルトン */}
          <div className="space-y-8">
            {/* ヘッダー部分のスケルトン */}
            <div className="flex items-start space-x-6">
              <div className="h-24 w-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>

            {/* 基本情報とコンタクト情報のスケルトン */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* ブロックチェーン情報のスケルトン */}
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* ドキュメント一覧のスケルトン */}
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
              
              {/* テーブルヘッダー */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                {/* テーブル行 */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="px-6 py-4 border-t border-gray-200">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ローディングメッセージ */}
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-lg text-gray-600">DAO情報を読み込んでいます...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                EAS、API、ローカルストレージから順次データを取得中
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mb-8">
        <Link href="/daos" className="text-primary hover:underline">
          ← DAO一覧に戻る
        </Link>
      </div>
      
      <div className="flex items-start mb-8">
        <div className="mr-6">
          <Image
            src={dao.logoUrl}
            alt={`${dao.name} logo`}
            width={100}
            height={100}
            className="rounded-lg"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{dao.name}</h1>
          <p className="text-gray-600 mb-6">{dao.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">基本情報</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">所在地</p>
                  <p className="text-gray-900">{dao.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">規模</p>
                  <p className="text-gray-900">{dao.size === 'small' ? '小規模' : 
                      dao.size === 'medium' ? '中規模' : 
                      dao.size === 'large' ? '大規模' : dao.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">メンバー数</p>
                  <p className="text-gray-900">{dao.memberCount}人</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ステータス</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dao.status === 'active' ? 'bg-green-100 text-green-800' :
                    dao.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {dao.status === 'active' ? '運営中' :
                     dao.status === 'pending' ? '審査中' : '停止中'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">信頼度</p>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${dao.trustScore}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-900">{dao.trustScore}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 連絡先・詳細情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">連絡先・詳細</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">担当者名</p>
                  <p className="text-gray-900">{dao.contactPerson || '未設定'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">連絡先メール</p>
                  <p className="text-gray-900">
                    {dao.contactEmail ? (
                      <a href={`mailto:${dao.contactEmail}`} className="text-blue-600 hover:underline">
                        {dao.contactEmail}
                      </a>
                    ) : '未設定'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ウェブサイト</p>
                  <p className="text-gray-900">
                    {dao.website ? (
                      <a 
                        href={dao.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {dao.website} ↗
                      </a>
                    ) : '未設定'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">設立日</p>
                  <p className="text-gray-900">
                    {dao.foundingDate ? new Date(dao.foundingDate * 1000).toLocaleDateString('ja-JP') : '未設定'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">最終更新</p>
                  <p className="text-gray-900">
                    {dao.updatedAt ? new Date(dao.updatedAt).toLocaleDateString('ja-JP') : '未設定'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ブロックチェーン情報 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ブロックチェーン証明</h3>
            <div className="space-y-3">
              {dao.attestationUID && (
                <div>
                  <p className="text-sm text-gray-500">ブロックチェーン証明書ID</p>
                  <p className="text-xs font-mono text-blue-600 break-all">{dao.attestationUID}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <a 
                      href={`https://sepolia.easscan.org/attestation/view/${dao.attestationUID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      EAS Scanで確認 ↗
                    </a>
                  </p>
                </div>
              )}
              {dao.adminAddress && (
                <div>
                  <p className="text-sm text-gray-500">管理者アドレス</p>
                  <p className="text-xs font-mono text-gray-700 break-all">{dao.adminAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      

      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">定款・規程</h2>
        <p className="text-gray-600 mb-4">
          各ドキュメントのハッシュがブロックチェーンに記録されています。
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種類</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ファイル名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">バージョン</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => {
                const doc = dao.documents?.find((d: any) => d.type === type);
                console.log(`Looking for document type "${type}":`, doc);
                console.log(`Available documents:`, dao.documents?.map((d: any) => ({ type: d.type, name: d.name })));
                return (
                  <tr key={type} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{label}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc ? doc.name : <span className="text-gray-400">未提出</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc ? new Date(doc.createdAt).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc ? `v${doc.version}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc ? (
                        <div className="flex space-x-3">
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            ダウンロード
                          </a>
                          
                          {doc.attestationUID && (
                            <a 
                              href={`https://sepolia.easscan.org/attestation/view/${doc.attestationUID}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              title="EAS Scanでブロックチェーン証明書を確認"
                            >
                              EAS確認
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">履歴</h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          この機能は現在開発中です
        </div>
      </div>
    </main>
  );
} 