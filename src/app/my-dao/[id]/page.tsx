'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEas } from '@/contexts/EasContext';
import { DAO, Document } from '@/types';
import Image from 'next/image';
import EditDaoModal from '@/components/EditDaoModal';

import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DocumentRegister from '@/components/DocumentRegister';
import DocumentList from '@/components/DocumentList';
import { queryDocumentsByDAO } from '@/services/documentQueryService';
import { convertAttestationToDAO, convertAttestationToDocument } from '@/utils/easQuery';

interface Props {
  params: {
    id: string;
  };
}

export default function DaoManagementPage({ params }: Props) {
  const { id } = params;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isConnected: isWalletConnected, connect, getAllDAOs, getDAODocuments } = useEas();
  const router = useRouter();
  const [dao, setDao] = useState<DAO | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'members'>('info');
  const [isEditDaoModalOpen, setIsEditDaoModalOpen] = useState(false);

  const [isDeleteDaoModalOpen, setIsDeleteDaoModalOpen] = useState(false);
  const [isDeleteDocumentModalOpen, setIsDeleteDocumentModalOpen] = useState(false);
  const [isDocumentRegisterOpen, setIsDocumentRegisterOpen] = useState(false);
  const [blockchainDocuments, setBlockchainDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | undefined>(undefined);

  useEffect(() => {
    // 初期化中は何もしない
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // DAO データの取得（EASから）
    const loadDao = async () => {
      try {
        const allDAOAttestations = await getAllDAOs();
                 const { getFieldFromDecodedData } = await import('@/utils/easQuery');
         const targetDaoAttestation = allDAOAttestations.find(att => {
           // デコードされたデータからdaoUIDを取得して比較
           try {
             const daoUID = getFieldFromDecodedData(att.data, 'daoUID');
             return daoUID === id;
           } catch {
             return false;
           }
         });
        
        if (!targetDaoAttestation) {
          router.push('/my-dao');
          return;
        }
        
        // EAS証明書をDAOオブジェクトに変換
        const { convertAttestationToDAO } = await import('@/utils/easQuery');
        const daoData = await convertAttestationToDAO(targetDaoAttestation as any);

        setDao(daoData);
      } catch (error) {
        console.error('Failed to load DAO from EAS:', error);
        // フォールバック: localStorageからも試す（移行期間用）
        try {
          const storedDaos = localStorage.getItem('daos');
          if (storedDaos) {
            const allDaos: DAO[] = JSON.parse(storedDaos);
            const targetDao = allDaos.find(d => d.id === id);
            if (targetDao) {
              setDao(targetDao);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback localStorage load also failed:', fallbackError);
        }
      }
    };

    // ドキュメントデータの取得（EASから）
    const loadDocuments = async () => {
      try {
        const documentAttestations = await getDAODocuments(id);
        
        // EAS証明書をDocumentオブジェクトに変換
        const { convertAttestationToDocument } = await import('@/utils/easQuery');
        const documentsData = documentAttestations.map(att => 
          convertAttestationToDocument(att as any)
        );
        
        setDocuments(documentsData as Document[]);
      } catch (error) {
        console.error('Failed to load documents from EAS:', error);
        // フォールバック: localStorageからも試す（移行期間用）
        try {
          const storedDaos = localStorage.getItem('daos');
          if (storedDaos) {
            const allDaos: DAO[] = JSON.parse(storedDaos);
            const targetDao = allDaos.find(d => d.id === id);
            if (targetDao && targetDao.documents) {
              setDocuments(targetDao.documents);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback localStorage load also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };



    (async () => {
      await loadDao();
      await loadDocuments();
    })();
  }, [id, isAuthenticated, router, user]);

  const handleSaveDao = async (updatedDao: DAO) => {
    try {
      // ファイルベースデータベースに保存
      const response = await fetch(`/api/daos/${updatedDao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDao),
      });

      if (response.ok) {
        setDao(updatedDao);
        console.log('DAO updated successfully via API');
      } else {
        throw new Error('Failed to update DAO via API');
      }
    } catch (error) {
      console.error('Failed to save DAO via API, falling back to localStorage:', error);
      // フォールバック: ローカルストレージに保存
      try {
        const storedDaos = localStorage.getItem('daos');
        if (storedDaos) {
          const allDaos: DAO[] = JSON.parse(storedDaos);
          const updatedDaos = allDaos.map(d => d.id === updatedDao.id ? updatedDao : d);
          localStorage.setItem('daos', JSON.stringify(updatedDaos));
          setDao(updatedDao);
          console.log('DAO updated successfully via localStorage fallback');
        }
      } catch (fallbackError) {
        console.error('Failed to save DAO even with localStorage fallback:', fallbackError);
        alert('DAO情報の保存に失敗しました。');
      }
    }
  };



  const handleDocumentRegistered = async (newDocument: Document) => {
    try {
      const storedDAOs = JSON.parse(localStorage.getItem('daos') || '[]');
      const daoIndex = storedDAOs.findIndex((d: any) => d.id === id);
      
      if (daoIndex !== -1) {
        if (!storedDAOs[daoIndex].documents) {
          storedDAOs[daoIndex].documents = [];
        }
        
        storedDAOs[daoIndex].documents.push(newDocument);
        localStorage.setItem('daos', JSON.stringify(storedDAOs));
        // ドキュメントリストを再読み込み
        const updatedDocs = storedDAOs[daoIndex].documents || [];
        setDocuments(updatedDocs);
        setIsDocumentRegisterOpen(false);
        
        // ブロックチェーンドキュメントも再読み込み
        if (dao?.attestationUID) {
          try {
            const result = await queryDocumentsByDAO(
              dao.attestationUID,
              {},
              dao.adminAddress // Admin Addressを渡して検証
            );
            setBlockchainDocuments(result.documents);
            console.log(`Reloaded ${result.documents.length} blockchain documents`);
          } catch (error) {
            console.error('Failed to reload blockchain documents:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error registering document:', error);
    }
  };

  const handleWeb3Registration = async () => {
    if (isWalletConnected) {
      setIsDocumentRegisterOpen(true);
    } else {
      try {
        await connect();
        setIsDocumentRegisterOpen(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('ウォレットの接続に失敗しました。MetaMaskがインストールされているか確認してください。');
      }
    }
  };

  const handleDeleteDao = () => {
    try {
      const storedDaos = localStorage.getItem('daos');
      if (storedDaos) {
        const allDaos: DAO[] = JSON.parse(storedDaos);
        const updatedDaos = allDaos.filter(d => d.id !== id);
        localStorage.setItem('daos', JSON.stringify(updatedDaos));
        router.push('/my-dao');
      }
    } catch (error) {
      console.error('Failed to delete DAO:', error);
    }
  };

  const handleDeleteDocument = () => {
    if (!selectedDocument) return;

    try {
      const storedDAOs = JSON.parse(localStorage.getItem('daos') || '[]');
      const daoIndex = storedDAOs.findIndex((d: any) => d.id === id);
      
      if (daoIndex !== -1 && storedDAOs[daoIndex].documents) {
        storedDAOs[daoIndex].documents = storedDAOs[daoIndex].documents.filter(
          (doc: any) => doc.id !== selectedDocument.id
        );
        localStorage.setItem('daos', JSON.stringify(storedDAOs));
        setDocuments(storedDAOs[daoIndex].documents);
      }
      setIsDeleteDocumentModalOpen(false);
      setSelectedDocument(undefined);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">DAOが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Image
            src={dao.logoUrl || '/next.svg'}
            alt={dao.name}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold">{dao.name}</h1>
            <p className="text-gray-600">{dao.location}</p>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            基本情報
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            定款・規程
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            メンバー管理
          </button>
        </nav>
      </div>



      {/* タブコンテンツ */}
      <div className="mt-8">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">基本情報</h3>
              <div className="space-x-4">
                <button
                  onClick={() => setIsEditDaoModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  編集
                </button>
                <button
                  onClick={() => setIsDeleteDaoModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  削除
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">DAO名</label>
                <input
                  type="text"
                  value={dao.name}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">所在地</label>
                <input
                  type="text"
                  value={dao.location}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">規模</label>
                <input
                  type="text"
                  value={dao.size === 'small' ? '小規模' : dao.size === 'medium' ? '中規模' : dao.size === 'large' ? '大規模' : dao.size}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">メンバー数</label>
                <input
                  type="text"
                  value={`${dao.memberCount}人`}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ウェブサイト</label>
                <input
                  type="text"
                  value={dao.website || '未設定'}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">担当者名</label>
                <input
                  type="text"
                  value={dao.contactPerson || '未設定'}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">連絡先メール</label>
                <input
                  type="text"
                  value={dao.contactEmail || '未設定'}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ステータス</label>
                <input
                  type="text"
                  value={dao.status === 'active' ? '運営中' : dao.status === 'pending' ? '審査中' : '停止中'}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">説明</label>
                <textarea
                  value={dao.description}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">ロゴURL</label>
                <input
                  type="text"
                  value={dao.logoUrl || 'デフォルトロゴ使用'}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">定款・規程</h3>
              <button
                onClick={handleWeb3Registration}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isWalletConnected ? 'ドキュメント登録' : 'ウォレット接続して登録'}
              </button>
            </div>



            {/* Web3ドキュメント登録コンポーネント */}
            {isDocumentRegisterOpen && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Web3ドキュメント登録</h4>
                  <button
                    onClick={() => setIsDocumentRegisterOpen(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    キャンセル
                  </button>
                </div>
                <DocumentRegister
                  daoId={id}
                  daoAttestationUID={dao?.attestationUID || "0x0000000000000000000000000000000000000000000000000000000000000000"}
                  onDocumentRegistered={handleDocumentRegistered}
                />
              </div>
            )}
            {/* ローカルストレージドキュメント（レガシー） */}
            {documents.length > 0 && (
              <div className="mb-8">
                <h4 className="text-md font-medium mb-4 text-gray-600">ローカルドキュメント（レガシー）</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ドキュメント名
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          タイプ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          バージョン
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          アクション
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doc.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.version}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedDocument(doc);
                                setIsDeleteDocumentModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ブロックチェーンドキュメント（新システム） */}
            <div className="mb-4">
              <h4 className="text-md font-medium mb-4 text-green-700">ブロックチェーンドキュメント（新システム）</h4>
              
              {/* タイプ別ドキュメント表示 */}
              <div className="space-y-6">
                {(() => {
                  // ドキュメントタイプのラベル定義
                  const typeLabels: { [key: string]: string } = {
                    'articles': '定款',
                    'meeting': 'DAO総会規程',
                    'token': 'トークン規程',
                    'operation': '運営規程',
                    'other': 'その他'
                  };

                  // タイプの説明
                  const typeDescriptions: { [key: string]: string } = {
                    'articles': 'DAOの基本的な規約や目的を定めた文書',
                    'meeting': 'DAO総会の運営方法や議決方法を定めた規程',
                    'token': 'DAOトークンの発行・管理・配布に関する規程',
                    'operation': 'DAOの日常的な運営方法を定めた規程',
                    'other': 'その他のDAO関連ドキュメント'
                  };

                  // タイプ別にドキュメントをグループ化
                  const documentsByType = dao?.documents ? dao.documents.reduce((acc: any, doc: any) => {
                    const type = doc.type || 'other';
                    if (!acc[type]) {
                      acc[type] = [];
                    }
                    acc[type].push(doc);
                    return acc;
                  }, {}) : {};

                  // すべてのタイプ（提出済み・未提出問わず）を表示
                  return Object.entries(typeLabels).map(([type, label]: [string, string]) => {
                    const docs = documentsByType[type] || [];
                    const hasDocuments = docs.length > 0;
                    
                    return (
                      <div key={type} className={`border rounded-lg p-6 ${hasDocuments ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 border-dashed'}`}>
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0">
                            {type === 'articles' && <span className="text-2xl">📜</span>}
                            {type === 'meeting' && <span className="text-2xl">🏛️</span>}
                            {type === 'token' && <span className="text-2xl">🪙</span>}
                            {type === 'operation' && <span className="text-2xl">⚙️</span>}
                            {type === 'other' && <span className="text-2xl">📄</span>}
                          </div>
                          <div className="ml-3">
                            <h5 className="text-lg font-medium text-gray-900">
                              {label}
                            </h5>
                            <p className="text-sm text-gray-500">
                              {hasDocuments ? `${docs.length}件のドキュメント` : '未提出'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {typeDescriptions[type]}
                            </p>
                          </div>
                        </div>
                        
                        {hasDocuments ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ドキュメント名
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    バージョン
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    登録日
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ハッシュ
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    アクション
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {docs.map((doc: any) => (
                                  <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {doc.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        IPFS: {doc.ipfsCid?.substring(0, 12)}...
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        v{doc.version}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(doc.createdAt).toLocaleDateString('ja-JP')}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                                      {doc.hash?.substring(0, 8)}...
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex justify-end space-x-2">
                                        <a 
                                          href={doc.fileUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                          📥 ダウンロード
                                        </a>
                                        <a 
                                          href={`https://sepolia.easscan.org/attestation/view/${doc.attestationUID}`}
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                          🔍 証明書確認
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">
                              このタイプのドキュメントはまだ提出されていません
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              「Web3ドキュメント登録」ボタンから新しいドキュメントを登録できます
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <h3 className="text-lg font-medium mb-6">メンバー管理</h3>
            <p className="text-gray-600">この機能は現在開発中です。</p>
          </div>
        )}
      </div>

      {/* モーダル */}
      <EditDaoModal
        isOpen={isEditDaoModalOpen}
        onClose={() => setIsEditDaoModalOpen(false)}
        dao={dao}
        onSave={handleSaveDao}
      />



      <DeleteConfirmModal
        isOpen={isDeleteDaoModalOpen}
        onClose={() => setIsDeleteDaoModalOpen(false)}
        onConfirm={handleDeleteDao}
        title="DAOの削除"
        message="このDAOを削除しますか？この操作は取り消せません。関連するすべてのドキュメントも削除されます。"
      />

      <DeleteConfirmModal
        isOpen={isDeleteDocumentModalOpen}
        onClose={() => {
          setIsDeleteDocumentModalOpen(false);
          setSelectedDocument(undefined);
        }}
        onConfirm={handleDeleteDocument}
        title="ドキュメントの削除"
        message="このドキュメントを削除しますか？この操作は取り消せません。"
      />
    </div>
  );
} 