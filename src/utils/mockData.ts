import { DAO, Document } from '@/types';

export const initializeMockData = () => {
  // モックDAOデータ
  const mockDaos: DAO[] = [
    {
      id: 'dao1',
      name: 'テストDAO 1',
      description: '日本初の完全分散型自律組織。ブロックチェーン技術を活用した革新的なガバナンスモデルを実践しています。',
      logoUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=TD1',
      location: '東京都',
      scale: '中規模',
      memberCount: 50,
      trustScore: 85,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'active',
      ownerId: 'admin@example.com'
    },
    {
      id: 'dao2',
      name: 'コミュニティDAO',
      description: '地域コミュニティの活性化を目指すDAO。住民主体のまちづくりプロジェクトを展開中。',
      logoUrl: 'https://placehold.co/100x100/22C55E/ffffff?text=CD',
      location: '大阪府',
      scale: '小規模',
      memberCount: 25,
      trustScore: 75,
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      status: 'active',
      ownerId: 'operator@example.com'
    },
    {
      id: 'dao3',
      name: 'イノベーションDAO',
      description: 'Web3技術を活用したイノベーションを推進。スタートアップ支援とインキュベーション事業を展開。',
      logoUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=ID',
      location: '福岡県',
      scale: '大規模',
      memberCount: 150,
      trustScore: 90,
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
      status: 'pending',
      ownerId: 'admin@example.com'
    }
  ];

  // モックドキュメントデータ
  const mockDocuments: Document[] = [
    {
      id: 'doc1',
      daoId: 'dao1',
      name: '定款',
      type: 'articles',
      fileUrl: 'https://example.com/dao1/articles.pdf',
      hash: '0x123...abc',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      status: 'active'
    },
    {
      id: 'doc2',
      daoId: 'dao1',
      name: '運営規程',
      type: 'rules',
      fileUrl: 'https://example.com/dao1/rules.pdf',
      hash: '0x456...def',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      version: 1,
      status: 'active'
    },
    {
      id: 'doc3',
      daoId: 'dao2',
      name: '定款',
      type: 'articles',
      fileUrl: 'https://example.com/dao2/articles.pdf',
      hash: '0x789...ghi',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      version: 1,
      status: 'active'
    }
  ];

  // ローカルストレージにデータを保存
  localStorage.setItem('daos', JSON.stringify(mockDaos));
  localStorage.setItem('documents', JSON.stringify(mockDocuments));
}; 