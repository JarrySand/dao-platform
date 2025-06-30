'use client';

import { useState, useEffect } from 'react';
import { daoService } from '@/services/daoService';
import { formatTimestamp, formatTimestampDetailed } from '@/utils/formatTimestamp';

export default function DebugFirebasePage() {
  const [daos, setDaos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Firebase接続とDAO取得テスト
  useEffect(() => {
    const fetchDAOs = async () => {
      try {
        console.log('🔍 Debug: Starting to fetch DAOs from Firebase...');
        const allDaos = await daoService.getAllDAOs();
        console.log('🔍 Debug: Fetched DAOs:', allDaos);
        setDaos(allDaos);
        setTestResult(`✅ Firebase接続成功: ${allDaos.length}件のDAOを取得`);
      } catch (err) {
        console.error('🔍 Debug: Error fetching DAOs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTestResult('❌ Firebase接続エラー');
      } finally {
        setLoading(false);
      }
    };

    fetchDAOs();
  }, []);

  // テスト用DAO作成
  const createTestDAO = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const testDAO = {
        name: `テストDAO ${Date.now()}`,
        description: 'Firebase接続テスト用のDAO',
        location: 'テスト環境',
        size: 'small' as const,
        memberCount: 1,
        logoUrl: 'https://placehold.co/100x100?text=TEST',
        website: '',
        contactEmail: 'test@example.com',
        contactPerson: 'テストユーザー',
        trustScore: 100,
        status: 'active' as const,
        ownerId: 'debug-user',
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🧪 Creating test DAO:', testDAO);
      const newDaoId = await daoService.createDAO(testDAO);
      console.log('✅ Test DAO created with ID:', newDaoId);
      
      // リフレッシュ
      const updatedDaos = await daoService.getAllDAOs();
      setDaos(updatedDaos);
      setTestResult(`✅ テストDAO作成成功: ID ${newDaoId}`);
    } catch (err) {
      console.error('💥 Test DAO creation failed:', err);
      setError(err instanceof Error ? err.message : 'DAO作成エラー');
      setTestResult('❌ テストDAO作成失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading && daos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">🔥 Firebase Debug Console</h1>
        <div className="text-center">
          <div className="text-lg">Firebase接続中...</div>
          <div className="text-sm text-gray-600">初回接続には時間がかかる場合があります</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">🔥 Firebase Debug Console</h1>
      
      {/* 接続ステータス */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">接続ステータス</h2>
        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {testResult}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg mt-4">
            <strong>エラー:</strong> {error}
          </div>
        )}
      </div>

      {/* テスト機能 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">テスト機能</h2>
        <button
          onClick={createTestDAO}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600"
        >
          {loading ? 'テスト実行中...' : 'テストDAO作成'}
        </button>
      </div>

      {/* DAO一覧 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Firebase DAO一覧 ({daos.length}件)</h2>
        
        {daos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            DAOデータがありません。テストDAO作成ボタンでデータを作成してください。
          </div>
        ) : (
          <div className="space-y-4">
            {daos.map((dao, index) => (
              <div key={dao.id || index} className="border p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{dao.name || '名前未設定'}</h3>
                    <p className="text-sm text-gray-600">ID: {dao.id || '未設定'}</p>
                    <p className="text-sm text-gray-600">ステータス: {dao.status || '未設定'}</p>
                    <p className="text-sm text-gray-600">説明: {dao.description || '未設定'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>作成日:</strong> {formatTimestamp(dao.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>更新日:</strong> {formatTimestamp(dao.updatedAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>詳細作成日:</strong> {formatTimestampDetailed(dao.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>メンバー数:</strong> {dao.memberCount || 0}人
                    </p>
                  </div>
                </div>
                
                {dao.documents && dao.documents.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold">ドキュメント ({dao.documents.length}件)</h4>
                    <div className="text-sm text-gray-600">
                      {dao.documents.map((doc: any, idx: number) => (
                        <div key={idx}>{doc.name || `ドキュメント ${idx + 1}`}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 