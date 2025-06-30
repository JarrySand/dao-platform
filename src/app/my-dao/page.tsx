'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEas } from '@/contexts/EasContext';
import { DAO } from '@/types';
import { convertAttestationToDAO } from '@/utils/easQuery';
import Link from 'next/link';
import Image from 'next/image';


export default function MyDaoPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isConnected, getAllDAOs } = useEas();
  const router = useRouter();
  const [daos, setDaos] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // 初期化中は何もしない
    if (isLoading) {
      return;
    }

    // 認証チェック - ユーザーがログインしているかどうか
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // EASからDAOデータを取得
    const loadDaos = async () => {
      try {
        console.log('Loading DAOs from EAS...');
        console.log('Current user:', user);

        
        const allDAOAttestations = await getAllDAOs();
        console.log('All DAO attestations:', allDAOAttestations);

        
        const daoPromises = allDAOAttestations.map(att => convertAttestationToDAO(att as any));
        const allDaos = (await Promise.all(daoPromises)).filter(dao => dao !== null) as DAO[];
        console.log('Converted DAOs:', allDaos);

        
        // フィルタリングロジック
        let filteredDaos = allDaos;
        
        if (user?.role !== 'admin') {
          filteredDaos = allDaos.filter(dao => {
            console.log(`Checking DAO ${dao.name}:`);
            console.log(`  - DAO adminAddress: ${dao.adminAddress}`);
            console.log(`  - DAO ownerId: ${dao.ownerId}`);
            console.log(`  - User walletAddress: ${user?.walletAddress}`);
            console.log(`  - User id: ${user?.id}`);
            console.log(`  - User authType: ${user?.authType}`);
            
            // ウォレット認証の場合
            if (user?.authType === 'wallet' && user?.walletAddress) {
              const isWalletAdmin = dao.adminAddress && 
                dao.adminAddress.toLowerCase() === user.walletAddress.toLowerCase();
              console.log(`  - Wallet admin match: ${isWalletAdmin}`);
              return isWalletAdmin;
            }
            
            // メール認証の場合
            if (user?.authType === 'email' && user?.id) {
              const isUserOwner = dao.ownerId === user.id;
              console.log(`  - User owner match: ${isUserOwner}`);
              return isUserOwner;
            }
            
            console.log(`  - No match found`);
            return false;
          });
        }
        
        console.log(`Filtering result: ${allDaos.length} total DAOs → ${filteredDaos.length} filtered DAOs`);
        console.log('User info:', { 
          userId: user?.id, 
          role: user?.role, 
          walletAddress: user?.walletAddress,
          authType: user?.authType
        });
        
        console.log('Filtered DAOs:', filteredDaos);

        setDaos(filteredDaos);
      } catch (error) {
        console.error('Failed to load DAOs from EAS:', error);

        // フォールバック: localStorageからも試す（移行期間用）
        try {
          const storedDaos = localStorage.getItem('daos');
          if (storedDaos) {
            const allDaos: DAO[] = JSON.parse(storedDaos);
            const filteredDaos = user?.role === 'admin' 
              ? allDaos 
              : allDaos.filter(dao => {
                  if (user?.authType === 'wallet' && user?.walletAddress) {
                    return dao.adminAddress?.toLowerCase() === user.walletAddress.toLowerCase();
                  }
                  return dao.ownerId === user?.id;
                });
            setDaos(filteredDaos);

          }
        } catch (fallbackError) {
          console.error('Fallback localStorage load also failed:', fallbackError);

        }
      } finally {
        setLoading(false);
      }
    };

    loadDaos();
  }, [isAuthenticated, isLoading, router, user]);

  // 初期化中またはページ読み込み中の表示
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">管理ダッシュボード</h1>
        <Link
          href="/signup"
          className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
        >
          新規DAO登録
        </Link>
      </div>



      <h2 className="text-xl font-semibold mb-4">あなたのDAO</h2>
      
      {daos.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
          <p className="mb-4">まだDAOが登録されていません</p>
          <p className="mb-4 text-sm">
            {user?.authType === 'wallet' 
              ? `ウォレットアドレス ${user.walletAddress} で登録されたDAOが見つかりませんでした。`
              : 'あなたのアカウントで登録されたDAOが見つかりませんでした。'
            }
          </p>
          <Link
            href="/signup"
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
          >
            最初のDAOを登録する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {daos.map((dao) => (
            <div key={dao.id} className="border rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Image
                  src={dao.logoUrl || '/next.svg'}
                  alt={dao.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{dao.name}</h3>
                  <p className="text-sm text-gray-500">{dao.location}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{dao.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className={`px-2 py-1 rounded text-sm ${
                  dao.status === 'active' ? 'bg-green-100 text-green-800' :
                  dao.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {dao.status === 'active' ? '有効' : dao.status === 'pending' ? '保留中' : '無効'}
                </span>
                <span className="text-sm text-gray-500">メンバー: {dao.memberCount}</span>
              </div>
              <div className="text-xs text-gray-400 mb-4">
                <div>管理者: {dao.adminAddress ? `${dao.adminAddress.slice(0, 6)}...${dao.adminAddress.slice(-4)}` : 'なし'}</div>
                <div>証明書: {dao.attestationUID ? `${dao.attestationUID.slice(0, 6)}...${dao.attestationUID.slice(-4)}` : 'なし'}</div>
              </div>
              <Link
                href={`/my-dao/${dao.id}`}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                管理
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 