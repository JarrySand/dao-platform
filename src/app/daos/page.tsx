'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useEas } from '@/contexts/EasContext';
import { convertAttestationToDAO } from '@/utils/easQuery';

interface DAO {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  location: string;
  size: string; // Changed from scale to size to match type definition
  memberCount: number;
  trustScore: number;
  status: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
}

export default function DAOListPage() {
  const { getAllDAOs, connect, isConnected } = useEas();
  const [daos, setDaos] = useState<DAO[]>([]);
  const [filteredDaos, setFilteredDaos] = useState<DAO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);


  // クライアントサイドでのマウント検出
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初期データの読み込み（優先度順）
  useEffect(() => {
    const loadDaos = async () => {
      try {
        console.log('Loading DAOs...');
        
        // 優先度1: EAS経由で取得（ウォレット接続不要）
        try {
          console.log('Trying EAS GraphQL query...');
          const allDAOAttestations = await getAllDAOs();
          console.log('Raw attestations from EAS:', allDAOAttestations);
          
          if (allDAOAttestations.length > 0) {
            const allDaos = await Promise.all(
              allDAOAttestations.map(async att => {
                console.log('Converting attestation:', att);
                const converted = await convertAttestationToDAO(att as any);
                console.log('Converted result:', converted);
                return converted;
              })
            );
            const filteredDaos = allDaos.filter(dao => dao !== null);
            console.log('Final converted DAOs:', filteredDaos);
            
            setDaos(filteredDaos);
            setFilteredDaos(filteredDaos);
            return; // 成功したら終了
          }
          console.log('No EAS attestations found, trying API...');
        } catch (easError) {
          console.log('EAS query failed, trying API...', easError);
        }

        // 優先度2: API経由でFirebaseから取得
        try {
          const response = await fetch('/api/daos');
          if (response.ok) {
            const result = await response.json();
            console.log('DAOs loaded from API:', result.data);
            setDaos(result.data);
            setFilteredDaos(result.data);
            return; // 成功したら終了
          }
        } catch (apiError) {
          console.log('API fetch failed, trying localStorage...', apiError);
        }

        // 優先度3: ローカルストレージから取得
        try {
          const storedDaos = JSON.parse(localStorage.getItem('daos') || '[]');
          console.log('DAOs from localStorage:', storedDaos);
          if (storedDaos.length > 0) {
            setDaos(storedDaos);
            setFilteredDaos(storedDaos);
            return; // 成功したら終了
          }
        } catch (storageError) {
          console.log('localStorage access failed:', storageError);
        }

        // データが見つからない場合は空配列
        console.log('No DAOs found, setting empty array');
        setDaos([]);
        setFilteredDaos([]);
        
      } catch (error) {
        console.error('Failed to load DAOs:', error);
        setDaos([]);
        setFilteredDaos([]);
      } finally {
        setLoading(false);
      }
    };

    loadDaos();
  }, [getAllDAOs]);

  // 検索とフィルタリングの適用
  useEffect(() => {
    let result = [...daos];

    // キーワード検索
    if (searchTerm) {
      result = result.filter(dao => 
        dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dao.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dao.contactPerson && dao.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dao.website && dao.website.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 所在地フィルター
    if (locationFilter) {
      result = result.filter(dao => 
        dao.location.includes(locationFilter)
      );
    }

    // ステータスフィルター
    if (statusFilter) {
      result = result.filter(dao => 
        dao.status === statusFilter
      );
    }

    setFilteredDaos(result);
  }, [searchTerm, locationFilter, statusFilter, daos]);

  // 所在地の一覧を取得（重複を除去）
  const locations = Array.from(new Set(daos.map(dao => dao.location)));

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">DAO一覧</h1>
          
          {/* ローディングスケルトン */}
          <div className="space-y-6">
            {/* 検索・フィルター部分のスケルトン */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-48">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-48">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>

            {/* テーブル部分のスケルトン */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b">
                <div className="grid grid-cols-6 gap-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ローディングメッセージ */}
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-lg text-gray-600">DAOを読み込んでいます...</span>
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
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">DAO一覧</h1>
      
      {/* デバッグ情報は一時的に無効化（ハイドレーション問題のため） */}
      {false && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p>デバッグ情報（無効化中）</p>
        </div>
      )}

      {/* 検索・フィルターセクション */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* キーワード検索 */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="DAOを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 所在地フィルター */}
          <div className="w-48">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">所在地: すべて</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* ステータスフィルター */}
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">ステータス: すべて</option>
              <option value="active">運営中</option>
              <option value="pending">審査中</option>
              <option value="inactive">停止中</option>
            </select>
          </div>
        </div>

        {/* 検索結果カウント */}
        <div className="text-sm text-gray-600">
          {filteredDaos.length} 件のDAOが見つかりました
        </div>
      </div>
      
      <div className="overflow-x-auto shadow-sm">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg text-gray-900">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ロゴ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DAO名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所在地</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メンバー数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">信頼度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredDaos.map((dao) => (
              <tr key={dao.id} className="hover:bg-gray-50 text-gray-900">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <Image
                        src={dao.logoUrl || '/next.svg'}
                        alt={`${dao.name} logo`}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/daos/${dao.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                    {dao.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{dao.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{dao.memberCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dao.status === 'active' ? 'bg-green-100 text-green-800' :
                    dao.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {dao.status === 'active' ? '運営中' :
                     dao.status === 'pending' ? '審査中' : '停止中'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${dao.trustScore}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-900">{dao.trustScore}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </main>
  );
} 