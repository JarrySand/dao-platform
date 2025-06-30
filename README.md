# 📋 DAO Document Platform

Web3技術を活用したDAOの定款・規程文書管理プラットフォーム

## 🎯 概要

### 目的
DAOの定款や規程文書の真正性をブロックチェーン技術で保証し、透明性と不変性を実現するプラットフォームです。スマートコントラクトに近い性質を持つDAO文書の管理により、実社会で実行力のある執行を可能にします。

### 主要な特徴
- **透明性**: すべてのDAO文書を一般公開し、誰でも閲覧可能
- **不変性**: ブロックチェーン技術により文書の改変を防止・検知
- **検証可能性**: 文書のハッシュ値をオンチェーンで記録し、真正性を証明
- **バージョン管理**: 文書の変更履歴を完全に追跡

## 🚀 Quick Start

```bash
# 1. リポジトリのクローン
git clone [repository-url]
cd dao-platform

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp env.example .env.local
# .env.local を編集して必要な値を設定

# 4. 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてアクセス

## 🌟 主要機能

### 一般ユーザー向け
- **DAO検索・閲覧**: 登録されているDAO一覧の検索・フィルタリング
- **文書閲覧**: DAO の定款・規程文書の閲覧
- **真正性検証**: 文書のハッシュ値とブロックチェーン記録の照合
- **透明性確保**: すべての文書変更履歴の公開

### DAO運営者向け
- **DAO登録・管理**: 基本情報の登録・編集
- **文書管理**: 定款・規程文書のアップロード・更新・バージョン管理
- **ブロックチェーン証明**: EAS（Ethereum Attestation Service）による文書証明
- **IPFS連携**: 分散ストレージへの文書保存

## 🏗️ 技術スタック

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: Ethereum (Sepolia), EAS, ethers.js v6
- **Storage**: IPFS, Firebase Firestore
- **Wallet**: MetaMask
- **Authentication**: Firebase Auth

## 🔧 開発環境セットアップ

### 前提条件
- Node.js 18+
- MetaMaskウォレット（DAO管理者のみ）
- Sepolia testnet ETH（DAO管理者のみ）

### 環境変数設定
`.env.local` ファイルに以下の設定が必要です：

```bash
# ===========================================
# Firebase Configuration
# ===========================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ===========================================
# EAS (Ethereum Attestation Service) Configuration
# ===========================================
NEXT_PUBLIC_DAO_SCHEMA_UID=your_dao_schema_uid
NEXT_PUBLIC_DOCUMENT_SCHEMA_UID=your_document_schema_uid
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0
NEXT_PUBLIC_EAS_GRAPHQL_URL=https://sepolia.easscan.org/graphql

# ===========================================
# Network Configuration
# ===========================================
NEXT_PUBLIC_ETHEREUM_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# ===========================================
# IPFS Configuration
# ===========================================
NEXT_PUBLIC_IPFS_GATEWAY=https://nftstorage.link/ipfs/
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token

# ===========================================
# Development Configuration
# ===========================================
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_ENABLE_LOCALSTORAGE_FALLBACK=true

# ===========================================
# Production Security Configuration
# ===========================================
NEXT_PUBLIC_FORCE_HTTPS=false
NEXT_PUBLIC_CSP_ENABLED=false
```

### MetaMaskウォレット設定（DAO管理者のみ）
1. Sepoliaテストネットを追加
2. [Sepolia Faucet](https://sepoliafaucet.com/) でテストETHを取得

## 📚 使用方法

### 一般ユーザー（閲覧者）
1. **DAO検索**: トップページでDAOを検索・フィルタリング
2. **詳細確認**: 気になるDAOをクリックして詳細情報を確認
3. **文書閲覧**: 定款・規程文書をダウンロード・閲覧
4. **真正性検証**: 「EAS検証」ボタンでブロックチェーン証明を確認

### DAO管理者
1. **アカウント作成**: 「新規登録」からDAO情報を登録
2. **ログイン**: 登録したメールアドレスでログイン
3. **ウォレット接続**: MetaMaskウォレットを接続
4. **文書管理**: 「マイDAO」から文書のアップロード・管理
5. **ブロックチェーン証明**: 文書をアップロード時に自動でEAS証明を発行

## 🔗 関連ドキュメント

### 技術仕様
- **[サービス仕様書](./SERVICE_SPECIFICATION.md)** - EASデータ構造、技術実装の詳細
- **[本番環境移行計画](./PRODUCTION_DEPLOYMENT_PLAN.md)** - プロダクション環境への移行手順

### 設定
- **[環境変数サンプル](./env.example)** - 必要な環境変数の設定例

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔧 サポート

質問や問題がある場合は、GitHubのIssueを作成してください。

---

**Note**: このプラットフォームは現在Sepoliaテストネット上で動作しています。本番環境での使用前に十分なテストを実施してください。
