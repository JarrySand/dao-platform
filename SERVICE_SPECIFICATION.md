# 🔧 DAO Platform - サービス仕様書

**作成日**: 2024年12月  
**バージョン**: v1.0.0  
**対象**: 技術者・開発者向け

## 📋 概要

DAO Document Platformは、Ethereum Attestation Service (EAS)を活用してDAO文書の真正性を保証するWeb3プラットフォームです。本文書では、システムアーキテクチャ、データ構造、API仕様などの技術的詳細を説明します。

## 🏗️ システムアーキテクチャ

### 全体構成
```
Frontend (Next.js) ←→ Firebase ←→ IPFS
      ↓
   MetaMask
      ↓
  EAS Contract (Ethereum)
```

### 技術スタック
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Blockchain**: Ethereum Sepolia, EAS Contract, ethers.js v6
- **Storage**: Firebase Firestore, IPFS (Pinata/NFT.Storage)
- **Authentication**: Firebase Auth
- **Wallet**: MetaMask integration

## 🔗 EAS実装仕様

### スキーマ設計

#### 1. DAOメインスキーマ
```typescript
interface DAOSchema {
  daoUID: string;           // 一意のDAO識別子
  name: string;             // DAO名称
  description: string;      // 説明
  adminAddress: address;    // 管理者ウォレットアドレス
  createdAt: uint256;       // 作成日時（Unix timestamp）
}
```

#### 2. ドキュメントスキーマ
```typescript
interface DocumentSchema {
  daoUID: string;           // 所属するDAOのUID
  documentType: string;     // 文書タイプ（articles, meeting, token, operation, other）
  documentTitle: string;    // 文書タイトル
  documentHash: bytes32;    // SHA-256ハッシュ
  ipfsCID: string;         // IPFSコンテンツID
  version: string;         // バージョン番号
}
```

### コントラクトアドレス（Sepolia）
- **EAS Contract**: `0xC2679fBD37d54388Ce493F1DB75320D236e1815e`
- **Schema Registry**: `0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0`

### アテステーション作成フロー
1. 文書アップロード → IPFS保存
2. SHA-256ハッシュ計算
3. メタデータ準備
4. ウォレット署名
5. EASアテステーション作成
6. Firebase保存

## 📊 データ構造

### Firebase Firestore
```typescript
// DAOs Collection
interface DAO {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  adminAddress: string;
  attestationUID: string;  // EASアテステーションUID
  foundingDate: Timestamp;
  location: string;
  memberCount: number;
  trustScore: number;
  status: 'active' | 'pending' | 'suspended';
  documents: string[];     // DocumentのUID配列
  createdAt: Timestamp;
  updatedAt: string;
}

// Documents Collection
interface Document {
  id: string;
  daoId: string;
  name: string;
  type: 'articles' | 'meeting' | 'token' | 'operation' | 'other';
  version: string;
  hash: string;           // SHA-256ハッシュ
  ipfsCID: string;
  attestationUID: string; // EASアテステーションUID
  createdAt: Timestamp;
  status: 'active' | 'archived' | 'draft';
}
```

### IPFS保存形式
```json
{
  "fileName": "articles_v1.pdf",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "uploadedAt": "2024-01-01T00:00:00Z",
  "metadata": {
    "daoId": "dao-123",
    "documentType": "articles",
    "version": "1.0.0"
  }
}
```

## 🔧 API仕様

### RESTful API
```typescript
// DAO関連
GET    /api/daos              // DAOリスト取得
POST   /api/daos              // DAO作成
GET    /api/daos/[id]         // DAO詳細取得
PUT    /api/daos/[id]         // DAO更新
DELETE /api/daos/[id]         // DAO削除

// ドキュメント関連
GET    /api/daos/[id]/documents    // DAO文書リスト
POST   /api/daos/[id]/documents    // 文書追加
PUT    /api/documents/[id]         // 文書更新
DELETE /api/documents/[id]         // 文書削除
```

### EAS統合API
```typescript
// utils/easQuery.ts
export async function createDAOAttestation(data: DAOData): Promise<string>
export async function createDocumentAttestation(data: DocumentData): Promise<string>
export async function getAttestationByUID(uid: string): Promise<Attestation>
export async function getAllDAOs(): Promise<Attestation[]>
export async function getDAODocuments(daoUID: string): Promise<Attestation[]>
```

## 🔐 セキュリティ仕様

### 認証・認可
- **Firebase Auth**: メールアドレス認証
- **MetaMask**: ウォレット認証（DAO管理者）
- **Role-based Access**: 管理者/一般ユーザーの権限分離

### 文書整合性
- **SHA-256ハッシュ**: 文書の改ざん検知
- **EASアテステーション**: ブロックチェーン上での証明
- **IPFS**: 分散ストレージによる可用性確保

### 入力値検証
```typescript
// バリデーション例
const daoSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000),
  adminAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  // ...
});
```

## 📱 ユーザーワークフロー

### 一般ユーザー
1. **DAO検索** → DAO一覧表示
2. **DAO詳細** → 基本情報・文書リスト表示
3. **文書検証** → ハッシュ値比較・EAS検証
4. **文書ダウンロード** → IPFS経由でファイル取得

### DAO運営者
1. **認証** → Firebase Auth + MetaMask接続
2. **DAO管理** → 基本情報編集
3. **文書管理** → アップロード・更新・削除
4. **ブロックチェーン証明** → EASアテステーション発行

## 🌐 外部サービス連携

### IPFS設定
```typescript
// IPFSクライアント設定
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud',
  'https://ipfs.io',
  'https://cloudflare-ipfs.com'
];

// アップロード処理
export async function uploadToIPFS(file: File): Promise<{
  cid: string;
  gateway: string;
  url: string;
}>
```

### EAS設定
```typescript
// EAS初期化
const eas = new EAS(EAS_CONTRACT_ADDRESS);
const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);

// スキーマUID（環境変数で管理）
const DAO_SCHEMA_UID = process.env.NEXT_PUBLIC_DAO_SCHEMA_UID;
const DOCUMENT_SCHEMA_UID = process.env.NEXT_PUBLIC_DOCUMENT_SCHEMA_UID;
```

## 🔄 バージョン管理

### 文書バージョニング
- **セマンティックバージョニング**: MAJOR.MINOR.PATCH
- **履歴追跡**: 前バージョンのアテステーションUID参照
- **差分表示**: 変更内容の可視化

### システムバージョン
- **API Version**: v1.0.0
- **Schema Version**: v1.0.0
- **Contract Version**: Sepolia testnet

## 🚀 パフォーマンス仕様

### 応答時間目標
- **DAO一覧取得**: < 2秒
- **文書ダウンロード**: < 5秒
- **EAS証明作成**: < 30秒
- **文書検証**: < 3秒

### 制限事項
- **ファイルサイズ上限**: 10MB
- **1日あたりアップロード**: 50ファイル/DAO
- **同時接続数**: 1000ユーザー

## 🔧 環境設定

### 必須環境変数
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# EAS
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0
NEXT_PUBLIC_DAO_SCHEMA_UID=
NEXT_PUBLIC_DOCUMENT_SCHEMA_UID=

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud
IPFS_API_TOKEN=
```

### 開発環境セットアップ
```bash
# 依存関係インストール
npm install

# 環境変数設定
cp env.example .env.local

# 開発サーバー起動
npm run dev

# ビルド確認
npm run build
```

## 📝 テスト仕様

### 単体テスト
- **ユーティリティ関数**: Jest
- **コンポーネント**: React Testing Library
- **API**: Supertest

### E2Eテスト
- **ユーザーフロー**: Playwright
- **ブロックチェーン連携**: Hardhat Network

### テスト実行
```bash
npm run test          # 単体テスト
npm run test:e2e      # E2Eテスト
npm run test:coverage # カバレッジ測定
```

## 🐛 既知の制限事項

### 技術的制限
- Sepoliaテストネット依存
- IPFS Gateway可用性依存
- MetaMask必須（DAO管理者）

### 機能制限
- 文書タイプ: 5種類まで
- バージョン履歴: 100世代まで
- DAO数: 制限なし（理論上）

## 📞 サポート・保守

### 監視項目
- EASコントラクト可用性
- IPFS Gateway応答時間
- Firebase使用量
- エラー率

### ログ管理
- **アプリケーションログ**: CloudWatch
- **アクセスログ**: Firebase Analytics
- **エラートラッキング**: Sentry（オプション）

---

**注意**: この仕様書は開発中のシステムを対象としており、本番環境では追加の設定・テストが必要です。 