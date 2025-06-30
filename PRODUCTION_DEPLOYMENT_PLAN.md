# 🚀 DAO Platform - 本番環境移行計画書

**作成日**: 2024年12月  
**対象プロジェクト**: DAO Document Platform  
**現在のステータス**: Phase 1 完了、Phase 2 実行準備中

## 📋 移行計画概要

### 目標
- 開発環境から本番環境への安全な移行
- 不要なデバッグファイル・中間ドキュメントの削除
- セキュリティ強化と最適化
- 安定したプロダクションデプロイメントの実現

### 移行方針
1. **段階的移行**: リスクを最小化するため3段階で実施
2. **バックアップ重視**: 各段階で必要に応じてコミット
3. **テスト駆動**: 各段階でビルド・動作確認を実施

---

## ✅ Phase 1: クリーンアップ（不要ファイル削除）【完了】

### 🎯 目標
開発中に作成されたデバッグ用ファイルと中間ドキュメントを削除し、プロジェクト構造を本番用に整理する。

### 📊 **完了実績**
- **削除ファイル数**: 20個 
- **削除行数**: 2,159行
- **修正ファイル数**: 8個
- **エラー修正**: 1件（my-dao/[id]静的パス生成エラー）

### 📋 作業項目

#### ✅ 削除済みファイル・ディレクトリ

##### デバッグ・テスト用ディレクトリ（6個削除）
```
✅ src/app/debug-firebase/     # Firebase接続テスト用
✅ src/app/debug-query/        # クエリ動作確認用  
✅ src/app/debug-users/        # ユーザー機能テスト用
✅ src/app/hash-test/          # ハッシュ機能テスト用
✅ src/app/ipfs-test/          # IPFS接続テスト用
✅ src/app/wallet-test/        # ウォレット接続テスト用
```

##### 開発中間ドキュメント（7個統合・削除）
```
✅ DEVELOPMENT_ESTIMATION.md   # 開発工数見積もり
✅ DEVELOPMENT_PHASES.md       # 開発フェーズ計画
✅ PROGRESS.md                 # 開発進捗記録
✅ TECHNICAL_DEBT_RESOLUTION.md # 技術負債解決計画
✅ PROJECT_STATUS.md           # プロジェクト状況
✅ USER_WORKFLOWS.md           # ユーザーワークフロー
✅ EAS_IMPLEMENTATION.md       # EAS実装詳細
```

##### 開発用データファイル（3個 + 1ディレクトリ削除）
```
✅ src/data/daoDatabase.json   # 開発用DAO模擬データ
✅ src/data/mockData.ts        # モックデータ定義
✅ src/utils/mockData.ts       # モックデータユーティリティ
✅ src/data/                   # 空ディレクトリ
```

##### 開発用スクリプト（1個削除）
```
✅ create-new-schema.js        # スキーマ作成スクリプト
⚠️  scripts/setup-schemas.js   # 本番スキーマ登録用（保持）
```

##### 重複設定ファイル（2個削除）
```
✅ next.config.ts             # 空のテンプレート
✅ postcss.config.js          # 旧形式
```

##### 空ディレクトリ（2個削除）
```
✅ src/styles/                # 空ディレクトリ
✅ src/app/verify/            # 空ディレクトリ
```

#### ✅ 完了済み作業

##### ドキュメント統合・更新
```
✅ README.md → ユーザー向けに全面リニューアル（クイックスタート、機能説明）
✅ SERVICE_SPECIFICATION.md → 新規作成（EAS構造、技術仕様、API詳細）
✅ env.example → 本番用設定例に完全更新（22項目の環境変数）
```

##### デバッグ表示削除（3ファイル修正）
```
✅ src/app/daos/[id]/page.tsx → ハッシュ計算機、検証機能削除
✅ src/app/my-dao/page.tsx → ウォレット接続、EAS状態表示削除
✅ src/app/my-dao/[id]/page.tsx → 定款規程タブのデバッグ情報削除
```

##### エラー修正
```
✅ src/app/my-dao/[id]/page.tsx → 動的インポート→静的インポート（静的パス生成エラー解決）
✅ src/app/layout.tsx → mockData初期化コード削除
✅ src/components/DocumentRegister.tsx → 重複型宣言削除
✅ src/components/FileAttestationCreator.tsx → 型アサーション修正
✅ src/utils/walletUtils.ts → window.ethereum存在チェック追加
```

### ✅ 完了基準【ALL COMPLETE】
- [x] すべてのデバッグ用ディレクトリが削除済み（6個削除）
- [x] 中間ドキュメントが削除済み（7個統合・削除）
- [x] 開発用データファイルが削除済み（4個削除）
- [x] プロジェクト構造が整理済み（重複ファイル、空ディレクトリ削除）
- [x] デバッグ表示が削除済み（3ファイル修正）
- [x] エラーが修正済み（静的パス生成エラー等）
- [x] `npm run build` が正常に完了する

### 📊 Phase 1 実行結果サマリー
- **実行期間**: 2024年12月
- **削除ファイル数**: 20個
- **削除行数**: 2,159行  
- **修正ファイル数**: 8個
- **ビルドエラー**: 0件
- **動作確認**: 全ページ正常表示
- **Git コミット**: 7回（段階的実行）

---

## ⚙️ Phase 2: 本番環境向け設定・最適化

### 🎯 目標
本番環境に適した設定への変更、セキュリティ強化、パフォーマンス最適化を実施する。

### 📋 作業項目

#### 🔧 環境設定の整備

##### 環境変数の構成
```bash
# 本番用環境変数ファイル作成
.env.production          # 本番環境用設定
.env.local.example      # ローカル開発用テンプレート
```

##### 主要な環境変数
```bash
# ブロックチェーン設定
NEXT_PUBLIC_ETHEREUM_NETWORK=mainnet
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587
NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=0xA7b39296258348C78294F95B872b282326A97BDF

# IPFS設定
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud
IPFS_API_TOKEN=（本番用トークン）

# アプリケーション設定
NEXT_PUBLIC_APP_URL=https://dao-platform.com
NODE_ENV=production
```

#### 🛡️ セキュリティ強化

##### 1. Content Security Policy (CSP) 設定
```javascript
// next.config.js に追加
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  }
]
```

##### 2. 入力値検証の強化
- フォーム入力のサニタイゼーション
- XSS対策の実装
- SQLインジェクション対策（該当する場合）

##### 3. 秘密情報の環境変数化
- ハードコードされた秘密情報の環境変数化
- API キーの適切な管理

#### 🚀 パフォーマンス最適化

##### 1. Next.js 設定最適化
```javascript
// next.config.js 本番用設定
module.exports = {
  output: 'standalone',
  swcMinify: true,
  experimental: {
    optimizeCss: true
  },
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io']
  }
}
```

##### 2. バンドル最適化
- 不要なライブラリの削除
- Tree Shaking の確認
- Dynamic Imports の活用

##### 3. 画像・アセット最適化
- Next.js Image コンポーネントの活用
- 静的アセットの最適化

#### 📦 依存関係の整理

##### 不要なパッケージの削除候補
```json
{
  "devDependencies": {
    // 開発時のみ必要なものを devDependencies に移動
  }
}
```

##### セキュリティ監査
```bash
npm audit --production
npm audit fix
```

### ✅ 完了基準
- [ ] 本番用環境変数設定が完了
- [ ] セキュリティ設定が実装済み
- [ ] CSP設定が適用済み
- [ ] 不要な依存関係が削除済み
- [ ] `npm run build` で最適化されたビルドが生成される
- [ ] セキュリティ監査で問題なし

---

## 🌐 Phase 3: デプロイメント実行

### 🎯 目標
選択したプラットフォームへの安全なデプロイメントとドメイン設定を完了する。

### 📋 作業項目

#### 🚀 デプロイメントプラットフォーム選択

##### 推奨オプション: Vercel
**理由**:
- Next.js に最適化
- 自動デプロイメント
- Edge Functions 対応
- 優れたパフォーマンス

**設定手順**:
1. Vercel アカウント作成
2. GitHub リポジトリ連携
3. 環境変数設定
4. カスタムドメイン設定

##### 代替オプション
- **Netlify**: 静的サイト特化、優れたCI/CD
- **AWS Amplify**: AWS エコシステム統合
- **Google Cloud Run**: コンテナベースデプロイ

#### 🔧 デプロイメント設定

##### 1. ビルド設定
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "export": "next export"
  }
}
```

##### 2. Vercel 設定ファイル
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 🌍 ドメイン・DNS設定

##### 1. カスタムドメイン
- ドメイン取得・設定
- DNS レコード設定
- SSL 証明書の自動設定

##### 2. CDN設定
- 静的アセットの配信最適化
- キャッシュ戦略の設定

#### 📊 モニタリング・分析

##### 1. パフォーマンス監視
- Vercel Analytics 設定
- Core Web Vitals 監視

##### 2. エラー監視
- エラーログの設定
- 通知システムの構築

### ✅ 完了基準
- [ ] 本番環境へのデプロイが完了
- [ ] カスタムドメインが設定済み
- [ ] SSL証明書が適用済み
- [ ] 全ての主要機能が正常動作
- [ ] パフォーマンステストが合格
- [ ] モニタリングが設定済み

---

## 📅 実行スケジュール

### ✅ Week 1: Phase 1 実行【完了】
| 日程 | 作業内容 | 担当 | 状態 |
|------|----------|------|------|
| Day 1-2 | デバッグディレクトリ削除 | 開発者 | ✅ 完了 |
| Day 3-4 | 中間ドキュメント整理 | 開発者 | ✅ 完了 |
| Day 5 | Phase 1 動作確認・テスト | 開発者 | ✅ 完了 |

### 🚀 Week 2: Phase 2 実行【準備完了】
| 日程 | 作業内容 | 担当 | 状態 |
|------|----------|------|------|
| Day 1-2 | 環境変数設定・セキュリティ強化 | 開発者 | 🟡 準備中 |
| Day 3-4 | パフォーマンス最適化 | 開発者 | 待機 |
| Day 5 | Phase 2 動作確認・テスト | 開発者 | 待機 |

### Week 3: Phase 3 実行
| 日程 | 作業内容 | 担当 | 状態 |
|------|----------|------|------|
| Day 1-2 | デプロイメント設定 | 開発者 | 待機 |
| Day 3-4 | 本番デプロイ・ドメイン設定 | 開発者 | 待機 |
| Day 5 | 最終動作確認・監視設定 | 開発者 | 待機 |

---

## ⚠️ リスク管理・注意事項

### 高リスク項目
1. **EAS スキーマID統一**: 本番移行前に必須
2. **ウォレット接続**: Mainnet切り替え時の動作確認
3. **IPFS設定**: 本番用ゲートウェイの安定性確認

### バックアップ戦略
- 各Phase完了後にGitタグ作成
- 重要なファイル削除前のバックアップ
- 設定変更時のロールバック手順準備

### 緊急時対応
- デプロイ失敗時のロールバック手順
- 障害発生時の連絡体制
- 緊急メンテナンス手順

---

## 📞 連絡・確認事項

### 開始前確認事項
- [ ] 現在の開発環境のバックアップ完了
- [ ] 本番用ドメインの準備状況
- [ ] 本番用API キー・トークンの準備状況

### Phase間の確認ポイント
- 各Phase完了時の動作確認
- 問題発生時の対応方針
- 次Phaseへの移行判断基準

---

## 📋 チェックリスト

### Phase 1 完了確認【✅ ALL COMPLETE】
- [x] デバッグ用ディレクトリ削除（6個）
- [x] 中間ドキュメント削除（7個統合・削除）
- [x] 開発用データファイル削除（4個）
- [x] デバッグ表示削除（3ファイル修正）
- [x] エラー修正（静的パス生成エラー等）
- [x] ビルド正常完了

### Phase 2 完了確認
- [ ] 環境変数設定完了
- [ ] セキュリティ設定実装
- [ ] パフォーマンス最適化実装
- [ ] 依存関係整理完了

### Phase 3 完了確認
- [ ] 本番デプロイ完了
- [ ] ドメイン設定完了
- [ ] SSL証明書適用
- [ ] 全機能動作確認
- [ ] 監視設定完了

---

**最終更新**: 2024年12月（Phase 1完了報告）  
**次回レビュー予定**: Phase 2 完了後 