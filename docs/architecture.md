# v2 技術スタック・アーキテクチャ設計

> v2 の技術選定とアーキテクチャを確定する。

---

## 0. 設計原則

### 0.1 オンチェーンアンカリング原則

本サービスの信頼性は「すべての証跡がオンチェーンに固定されている」ことに依拠する。
この原則に基づき、データの保存先を以下のように厳格に分離する。

| 保存先              | 役割                                                                                     | 例                                                               |
| ------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| EAS（オンチェーン） | **唯一の真実**。文書の真正性・分類・紐付けに関わるすべてのデータ                         | documentTitle, documentType, documentHash, ipfsCid, votingTxHash |
| IPFS                | 文書ファイル本体の永続化                                                                 | アップロードされた PDF/DOC 等                                    |
| Firebase Firestore  | **キャッシュ + 表示用メタデータのみ**。Firebase が消失してもシステムの核心機能は動作する | DAO の説明文、ロゴ URL、連絡先、EAS クエリ結果のキャッシュ       |

**判断基準**: あるデータが改ざんされた場合にガバナンスの信頼性が損なわれるなら、そのデータはオンチェーンに保存しなければならない。

### 0.2 スキーマ共存原則

EAS スキーマはオンチェーンで不変である。v2 では Document スキーマを新規デプロイし、v1 スキーマのアテステーションは読み取り専用で後方互換を維持する。

---

## 1. 技術スタック

### 1.1 コアフレームワーク

| カテゴリ  | ライブラリ | バージョン | 選定理由                                            |
| --------- | ---------- | ---------- | --------------------------------------------------- |
| Framework | Next.js    | 15         | App Router 安定化、React 19 対応、Server Components |
| React     | React      | 19         | `use()` hook、Suspense 改善、Server Components      |
| 言語      | TypeScript | 5.7+       | strict mode、satisfies operator、const type params  |

**v1からの変更点**: Next.js 14 → 15、React 18 → 19

### 1.2 状態管理・データフェッチ

| カテゴリ         | ライブラリ      | バージョン | 用途                                     |
| ---------------- | --------------- | ---------- | ---------------------------------------- |
| サーバー状態     | TanStack Query  | 5          | API データキャッシュ、自動リフェッチ     |
| クライアント状態 | Zustand         | 5          | ウォレット・認証のグローバル状態         |
| フォーム         | React Hook Form | 7          | フォーム状態管理                         |
| バリデーション   | Zod             | 3          | スキーマバリデーション（フォーム + API） |

**変更なし**: v1 と同じスタック。実績のある組み合わせを継続。

### 1.3 UI・スタイリング

| カテゴリ       | ライブラリ            | バージョン | 選定理由                                            |
| -------------- | --------------------- | ---------- | --------------------------------------------------- |
| CSS            | Tailwind CSS          | 4          | v3→4: Lightning CSS、設定簡素化、パフォーマンス向上 |
| UIプリミティブ | Radix UI              | latest     | アクセシブル、unstyled、合成可能                    |
| クラス結合     | clsx + tailwind-merge | latest     | 条件付きクラス名、Tailwind競合解決                  |

**v1からの変更点**: Tailwind 3 → 4

#### ダークモード実装方針

| 項目           | 仕様                                                              |
| -------------- | ----------------------------------------------------------------- |
| 切替方式       | Tailwind `class` strategy（`<html class="dark">`）                |
| システム連動   | `prefers-color-scheme` を初期値として使用                         |
| 手動切替       | Navbar にトグルボタン配置、設定を `localStorage` に永続化         |
| CSS 変数       | `globals.css` に `--color-*` で Light/Dark のカラートークンを定義 |
| コンポーネント | `shared/providers/ThemeProvider.tsx` でテーマ状態を管理           |
| SSR 対策       | `<script>` タグで FOUC（Flash of Unstyled Content）を防止         |

### 1.4 ブロックチェーン

| カテゴリ | ライブラリ                            | バージョン | 用途                                 |
| -------- | ------------------------------------- | ---------- | ------------------------------------ |
| Ethereum | ethers.js                             | 6          | プロバイダー、署名、コントラクト操作 |
| EAS      | @ethereum-attestation-service/eas-sdk | latest     | アテステーション作成・検証           |

**変更なし**: ブロックチェーンスタックは v1 継続。

### 1.5 バックエンド・データベース

| カテゴリ       | ライブラリ              | バージョン | 用途                                            |
| -------------- | ----------------------- | ---------- | ----------------------------------------------- |
| DB             | Firebase Firestore      | 11         | 表示用メタデータ + EAS クエリキャッシュ（§0.1） |
| 認証           | Firebase Authentication | 11         | メール/パスワード認証                           |
| 認証（server） | Firebase Admin SDK      | 12         | API Route でのトークン検証（サーバーサイド）    |
| ストレージ     | Pinata (IPFS)           | latest     | ドキュメントファイル保存                        |

**v1からの変更点**: Firebase Auth を正式採用（v1は localStorage ベース）、Firebase Admin SDK を追加

**IPFS プロバイダー決定:**

- **プライマリ: Pinata** — v1 で実績あり（nft.storage 停止後のフォールバック先として既に運用中）
- **フォールバック: w3up-client** — Pinata 障害時の代替（package.json に既に導入済み）
- nft.storage は完全廃止（v1 コードに「サービス停止」の記載あり）

| 項目             | 仕様                                      |
| ---------------- | ----------------------------------------- |
| プロバイダー     | Pinata（JWT 認証）                        |
| フォールバック   | w3up-client                               |
| アップロード上限 | 10MB/ファイル                             |
| ゲートウェイ     | `https://gateway.pinata.cloud/ipfs/{CID}` |
| タイムアウト     | 30秒（リトライ2回、指数バックオフ）       |
| ピン保持         | 永続（Pinata Free/Pro プランに依存）      |
| 環境変数         | `PINATA_JWT`（サーバーサイドのみ）        |

### 1.6 開発ツール

| カテゴリ       | ライブラリ            | バージョン | v1比較        | 選定理由                        |
| -------------- | --------------------- | ---------- | ------------- | ------------------------------- |
| テスト         | Vitest                | latest     | Jest → Vitest | ESM native、HMR、設定簡易、高速 |
| テストUI       | React Testing Library | latest     | 変更なし      |                                 |
| APIモック      | MSW                   | 2          | 変更なし      |                                 |
| リンター       | ESLint                | 9          | 8 → 9         | flat config、パフォーマンス改善 |
| フォーマッター | Prettier              | 3          | 変更なし      |                                 |
| Git hooks      | husky + lint-staged   | latest     | 新規          | コミット前の自動チェック        |
| コミット規約   | commitlint            | latest     | 新規          | Conventional Commits 強制       |
| CI/CD          | GitHub Actions        | -          | 新規          | 自動テスト・ビルド・デプロイ    |

### 1.7 バンドルサイズ最適化戦略

非機能要件「First Load JS 200KB 以下」を達成するため、以下の戦略を適用する。

**重量級ライブラリの遅延ロード:**

| ライブラリ                            | サイズ（概算） | 遅延ロード方式 | トリガー                   |
| ------------------------------------- | -------------- | -------------- | -------------------------- |
| ethers.js                             | ~120KB gzip    | `next/dynamic` | ウォレット接続ボタン押下時 |
| @ethereum-attestation-service/eas-sdk | ~50KB gzip     | `next/dynamic` | DAO作成/文書登録画面遷移時 |
| React Hook Form + Zod                 | ~15KB gzip     | `next/dynamic` | フォーム画面遷移時         |

**Next.js コード分割方針:**

```typescript
// 重量級コンポーネントの遅延ロード例
// features/wallet/components/WalletConnectButton.tsx のラッパー
import dynamic from "next/dynamic";

const WalletConnectButton = dynamic(
  () => import("@/features/wallet/components/WalletConnectButton"),
  { ssr: false, loading: () => <ButtonSkeleton /> },
);
```

**Route Group によるバンドル分割:**

- `(public)/` ルート: ウォレット・EAS 関連コードを含まない（閲覧のみ）
- `(auth)/` ルート: ウォレット・EAS 関連コードを遅延ロード

**ツリーシェイキング:**

- ethers.js v6 は ESM 対応。サブパスインポートを活用: `import { BrowserProvider } from "ethers"` ではなく `import { BrowserProvider } from "ethers/providers"`（v6 で可能な場合）
- Firebase SDK v11 はモジュラーインポート: `import { getDoc } from "firebase/firestore"`

---

## 2. アーキテクチャ

### 2.1 Feature-Sliced Design

機能ベースのモジュール分割を採用。各機能は独立したモジュールとして構成し、依存関係を明確にする。

**レイヤー構成:**

```
app/        ← ルーティング・レイアウトのみ（ビジネスロジック禁止）
  ↓ import
features/   ← 機能モジュール（機能ごとに独立）
  ↓ import
shared/     ← 機能横断の共通コード
  ↓ import
config/     ← アプリケーション設定
```

**依存ルール:**

- `app/` → `features/` と `shared/` を import 可能
- `features/` → `shared/` を import 可能、**他の feature を直接 import 禁止**
- `shared/` → `config/` を import 可能
- `config/` → 外部ライブラリのみ

### 2.2 ディレクトリ構造

```
src/
├── app/                              # Next.js App Router
│   ├── (public)/                     # 認証不要ルート（Route Group）
│   │   ├── page.tsx                  #   Home
│   │   ├── daos/
│   │   │   ├── page.tsx              #   DAO一覧
│   │   │   └── [id]/
│   │   │       └── page.tsx          #   DAO詳細
│   │   └── layout.tsx                #   公開ページ共通レイアウト
│   │
│   ├── (auth)/                       # 認証必要ルート（Route Group）
│   │   ├── dashboard/
│   │   │   └── page.tsx              #   ダッシュボード [NEW]
│   │   ├── my-dao/
│   │   │   ├── page.tsx              #   My DAO一覧
│   │   │   ├── create/
│   │   │   │   └── page.tsx          #   DAO作成ウィザード [NEW]
│   │   │   └── [id]/
│   │   │       └── page.tsx          #   My DAO管理
│   │   └── layout.tsx                #   認証チェック付きレイアウト
│   │
│   ├── login/
│   │   └── page.tsx                  #   ログイン
│   ├── signup/
│   │   └── page.tsx                  #   サインアップ
│   ├── reset-password/
│   │   └── page.tsx                  #   パスワードリセット
│   │
│   ├── api/                          # API Routes
│   │   ├── daos/
│   │   │   ├── route.ts              #     GET: 一覧, POST: 作成
│   │   │   └── [id]/
│   │   │       └── route.ts          #     GET: 詳細, PUT: 更新（非活性化含む）
│   │   ├── documents/                # [NEW] ドキュメント専用API
│   │   │   ├── route.ts              #     GET: 一覧（daoId必須）, POST: 登録
│   │   │   └── [id]/
│   │   │       └── route.ts          #     GET: 詳細, PUT: 失効（revoke）
│   │   ├── stats/                    # [NEW] 統計API
│   │   │   └── route.ts              #     GET: DAO数・ドキュメント数
│   │   ├── activity/                 # [NEW] アクティビティAPI
│   │   │   └── route.ts              #     GET: 最近のアテステーション一覧
│   │   ├── upload/
│   │   │   └── route.ts              #     POST: IPFSアップロード
│   │   └── eas-proxy/
│   │       └── route.ts              #     POST: EAS GraphQL プロキシ
│   │
│   ├── layout.tsx                    # ルートレイアウト
│   ├── error.tsx                     # グローバルエラーバウンダリ
│   ├── not-found.tsx                 # 404
│   ├── loading.tsx                   # グローバルローディング
│   └── globals.css                   # グローバルCSS
│
├── features/                         # 機能モジュール
│   │
│   ├── dao/                          # DAO管理機能
│   │   ├── api/
│   │   │   └── daoApi.ts             #   API クライアント関数
│   │   ├── components/
│   │   │   ├── DAOCard.tsx           #   一覧用カード
│   │   │   ├── DAOList.tsx           #   一覧コンテナ
│   │   │   ├── DAODetail.tsx         #   詳細表示
│   │   │   ├── DAOCreateForm.tsx     #   作成フォーム
│   │   │   ├── DAOEditForm.tsx       #   編集フォーム
│   │   │   ├── DAOStats.tsx          #   統計表示 [NEW]
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useDAOs.ts            #   一覧取得
│   │   │   ├── useDAO.ts             #   単一取得
│   │   │   ├── useMyDAOs.ts          #   自分のDAO
│   │   │   ├── useCreateDAO.ts       #   作成ミューテーション
│   │   │   ├── useUpdateDAO.ts       #   更新ミューテーション
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts             #   DAO固有型定義
│   │   ├── utils/
│   │   │   └── daoService.ts        #   DAO ビジネスロジック
│   │   └── index.ts                  #   バレルエクスポート
│   │
│   ├── document/                     # ドキュメント管理機能
│   │   ├── api/
│   │   │   └── documentApi.ts
│   │   ├── components/
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── DocumentRegisterForm.tsx   # マルチステップウィザード
│   │   │   ├── DocumentVerifier.tsx
│   │   │   ├── DocumentVersionHistory.tsx # [NEW] バージョンタイムライン
│   │   │   ├── DocumentVersionCompare.tsx # [NEW] バージョン間メタデータ比較
│   │   │   ├── TransactionInfo.tsx        # [NEW] リンク済みTX情報表示
│   │   │   ├── FileUploader.tsx           # D&D対応
│   │   │   ├── FileHashCalculator.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useDocuments.ts
│   │   │   ├── useDocument.ts
│   │   │   ├── useRegisterDocument.ts
│   │   │   ├── useDocumentVersions.ts     # [NEW]
│   │   │   ├── useTransactionInfo.ts      # [NEW] TX情報取得・検証
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── documentService.ts         # 登録フロー
│   │   │   └── documentQueryService.ts    # クエリ
│   │   └── index.ts
│   │
│   ├── auth/                         # 認証機能
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx         #   ルート保護
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── WalletLogin.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts          #   Zustand
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── wallet/                       # ウォレット機能
│   │   ├── components/
│   │   │   ├── WalletConnectButton.tsx
│   │   │   ├── WalletInfo.tsx
│   │   │   ├── NetworkSwitcher.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useWallet.ts
│   │   │   ├── useNetwork.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── walletStore.ts        #   Zustand
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── dashboard/                    # ダッシュボード [NEW]
│       ├── components/
│       │   ├── StatsCards.tsx
│       │   ├── RecentActivity.tsx
│       │   ├── QuickActions.tsx
│       │   └── index.ts
│       ├── hooks/
│       │   ├── useStats.ts
│       │   └── index.ts
│       └── index.ts
│
├── shared/                           # 共通モジュール
│   │
│   ├── components/
│   │   ├── ui/                       # UIプリミティブ
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx             #   Radix Dialog
│   │   │   ├── Select.tsx            #   Radix Select
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Toast.tsx             #   Radix Toast
│   │   │   └── index.ts
│   │   ├── layout/                   # レイアウト
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── index.ts
│   │   └── feedback/                 # フィードバック
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorDisplay.tsx
│   │       ├── EmptyState.tsx
│   │       └── index.ts
│   │
│   ├── hooks/                        # 共通フック
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useCopyToClipboard.ts
│   │   ├── useScrollLock.ts
│   │   └── index.ts
│   │
│   ├── utils/                        # ユーティリティ
│   │   ├── cn.ts                     #   clsx + tailwind-merge
│   │   ├── format.ts                 #   アドレス・日付・数値フォーマット
│   │   ├── validation.ts             #   UID・アドレス検証、Zod スキーマ
│   │   ├── logger.ts                 #   構造化ログ
│   │   ├── fileHash.ts               #   SHA-256 ハッシュ
│   │   └── index.ts
│   │
│   ├── types/                        # 共通型定義
│   │   ├── common.ts                 #   BaseEntity, Pagination, Sort, Filter
│   │   ├── api.ts                    #   ApiResponse, ApiError, PaginatedResponse
│   │   ├── window.d.ts               #   EthereumProvider グローバル型
│   │   └── index.ts
│   │
│   ├── constants/                    # 定数
│   │   ├── routes.ts                 #   全ルートパス定義
│   │   ├── config.ts                 #   アプリ設定定数
│   │   └── index.ts
│   │
│   ├── lib/                          # 外部サービス連携
│   │   ├── firebase/
│   │   │   ├── client.ts             #   Firestore クライアント初期化
│   │   │   ├── admin.ts              #   Firebase Admin SDK 初期化（サーバーサイド） [NEW]
│   │   │   ├── auth.ts               #   Firebase Auth ヘルパー（クライアントサイド） [NEW]
│   │   │   └── types.ts              #   Firebase 型変換
│   │   ├── eas/
│   │   │   ├── client.ts             #   EAS SDK 初期化
│   │   │   ├── schema.ts             #   スキーマ定義・エンコード/デコード
│   │   │   ├── graphql.ts            #   GraphQL クエリ実行 + バッチクエリ
│   │   │   ├── queries.ts            #   単一リソースクエリ定義 [NEW]
│   │   │   └── types.ts              #   EAS 固有型
│   │   ├── ipfs/
│   │   │   ├── client.ts             #   IPFSアップロード/ダウンロード
│   │   │   └── gateway.ts            #   ゲートウェイURL生成
│   │   ├── api-client.ts             #   HTTP クライアント（リトライ・エラー処理）
│   │   └── query-client.ts           #   TanStack Query 設定
│   │
│   └── providers/                    # コンテキストプロバイダー
│       ├── QueryProvider.tsx         #   TanStack Query
│       ├── ThemeProvider.tsx         #   ダークモード管理 [NEW]
│       ├── AppProviders.tsx          #   全プロバイダー合成
│       └── index.ts
│
└── config/                           # アプリケーション設定
    ├── env.ts                        #   環境変数バリデーション
    └── chains.ts                     #   チェーン設定 [NEW]
```

### 2.3 テスト構造

```
src/
├── features/
│   └── dao/
│       └── __tests__/                # feature 内にテスト配置
│           ├── daoApi.test.ts
│           ├── useDAOs.test.ts
│           ├── DAOCard.test.tsx
│           └── daoService.test.ts
├── shared/
│   └── utils/
│       └── __tests__/
│           ├── format.test.ts
│           ├── validation.test.ts
│           └── cn.test.ts
└── __tests__/                        # 統合テスト
    └── integration/
        ├── dao-crud.test.ts
        └── document-flow.test.ts
```

**テスト方針:**

- ユニットテスト: 各モジュールの `__tests__/` ディレクトリ
- 統合テスト: `src/__tests__/integration/`
- テストファイル命名: `*.test.ts(x)`
- カバレッジ目標: shared/ 90%+、features/ 80%+

---

## 3. EAS スキーマ

### 3.1 方針: DAO スキーマ維持 + Document スキーマ v2 新規デプロイ

- **DAO スキーマ**: v1 デプロイ済みをそのまま使用。DAO のアイデンティティ（名前・管理者）はオンチェーンで証明済み。説明文等の表示用メタデータは Firebase で管理する。
- **Document スキーマ**: v2 を**新規デプロイ**する。v1 スキーマには `documentType` が存在せず（タイトルから推測していた）、投票 TX リンクもなく、オンチェーンアンカリング原則（§0.1）を満たせないため。

v1 アテステーションは v1 スキーマ UID で読み取り専用の後方互換を維持する（§3.4）。

### 3.2 スキーマ定義（Sepolia）

```
DAO スキーマ (v1 — 維持):
  UID: 0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1
  定義: "string daoUID, string daoName, address adminAddress"

Document スキーマ v2 (新規デプロイ):
  UID: （デプロイ後に記入）
  定義: "bytes32 daoAttestationUID, string documentTitle, string documentType,
         bytes32 documentHash, string ipfsCid, string version,
         bytes32 previousVersionId, bytes32 votingTxHash, uint256 votingChainId"

Document スキーマ v1 (読み取り専用):
  UID: 0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152
  定義: "bytes32 daoAttestationUID, string documentTitle, bytes32 documentHash,
         string ipfsCid, string version, bytes32 previousVersionId"
```

**Document スキーマ v1 → v2 の変更点:**

| フィールド    | v1       | v2            | 変更理由                                           |
| ------------- | -------- | ------------- | -------------------------------------------------- |
| documentType  | **なし** | string (NEW)  | 文書分類をオンチェーンに固定。タイトル推測を廃止   |
| votingTxHash  | **なし** | bytes32 (NEW) | 投票 TX とのオンチェーンリンク。非投票文書は `0x0` |
| votingChainId | **なし** | uint256 (NEW) | 投票が実行されたチェーン。非投票文書は `0`         |

**v1 から引き継ぐフィールド（型を正確に記載）:**

| フィールド        | 型      | 用途                                       |
| ----------------- | ------- | ------------------------------------------ |
| daoAttestationUID | bytes32 | 所属 DAO への参照                          |
| documentTitle     | string  | 文書タイトル                               |
| documentHash      | bytes32 | SHA-256 ハッシュ（改ざん検知）             |
| ipfsCid           | string  | IPFS コンテンツ ID                         |
| version           | string  | バージョン文字列                           |
| previousVersionId | bytes32 | 前バージョンへの参照（バージョンチェーン） |

### 3.3 データ配置マトリクス

§0.1 の原則に基づく全データの配置先:

| データ                         | EAS（オンチェーン）     | Firebase（キャッシュ/表示用） | 根拠                                         |
| ------------------------------ | ----------------------- | ----------------------------- | -------------------------------------------- |
| DAO 名・管理者アドレス         | ✅ DAO スキーマ         | キャッシュ                    | 証跡（DAO のアイデンティティ）               |
| DAO 説明文・所在地・ロゴ等     | —                       | ✅ 表示用メタデータ           | 表示用（改ざんされてもガバナンスに影響なし） |
| 文書タイトル・タイプ・ハッシュ | ✅ Document v2 スキーマ | キャッシュ                    | 証跡（文書の真正性・分類）                   |
| 文書 IPFS CID・バージョン      | ✅ Document v2 スキーマ | キャッシュ                    | 証跡（文書の所在・履歴）                     |
| 投票 TX リンク                 | ✅ Document v2 スキーマ | キャッシュ                    | 証跡（議決と文書の紐付け）                   |
| バージョンチェーン             | ✅ previousVersionId    | キャッシュ                    | 証跡（改定履歴のオンチェーン追跡）           |
| ダッシュボード統計             | —                       | ✅ 集計キャッシュ             | 派生データ（EAS から再計算可能）             |
| メンバー管理 [P1]              | —                       | ✅ members[], roles[]         | 表示用（Alpha 後に検討）                     |

### 3.4 Firestore コレクション定義

#### `daos/{attestationUID}`

EAS の DAO アテステーション UID をドキュメント ID として使用する。

```typescript
interface FirebaseDAOData {
  // 表示用メタデータ（EAS にない情報）
  description: string;
  location: string;
  memberCount: number;
  status: 'active' | 'inactive';
  foundingDate: Timestamp | null;
  logoUrl: string;
  website: string;
  contactEmail: string;
  contactPerson: string;
  // EAS キャッシュ（クエリ高速化用）
  name: string; // EAS daoName のキャッシュ
  adminAddress: string; // EAS adminAddress のキャッシュ
  // ドキュメント参照
  documents: string[]; // Document attestation UID 配列
  // タイムスタンプ
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `documents/{attestationUID}`

EAS の Document アテステーション UID をドキュメント ID として使用する。
EAS データのキャッシュ + 表示用メタデータを保存する。

```typescript
interface FirebaseDocumentData {
  // EAS キャッシュ（クエリ高速化用）
  daoAttestationUID: string;
  documentTitle: string;
  documentType: string; // v1 アテステーションの場合は "unknown"
  documentHash: string;
  ipfsCid: string;
  version: string;
  previousVersionId: string;
  votingTxHash: string; // v1 アテステーションの場合は "0x0"
  votingChainId: number; // v1 アテステーションの場合は 0
  // 表示用メタデータ（EAS にない情報）
  fileName: string; // アップロード時のオリジナルファイル名
  fileSize: number; // バイト数
  fileType: string; // MIME タイプ
  // ステータス
  status: 'active' | 'revoked';
  registeredBy: string; // EAS attester アドレスのキャッシュ
  // タイムスタンプ
  registeredAt: Timestamp; // EAS タイムスタンプのキャッシュ
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.5 スキーマ共存と後方互換

```
v2 アプリケーション:
  ├─ 新規文書登録 → Document v2 スキーマで作成
  ├─ v2 文書の読み取り → v2 スキーマ UID で GraphQL 検索
  └─ v1 文書の読み取り → v1 スキーマ UID で GraphQL 検索（後方互換）
       ├─ documentType → "unknown" として表示（v1 スキーマにフィールドなし）
       ├─ votingTxHash → "なし" として表示
       └─ v1 フィールド名の差異は変換レイヤーで吸収
```

**v1+v2 統合クエリ戦略:**

EAS GraphQL の `schemaId` フィルターは `equals` のみで `IN` をサポートしない。
v1 と v2 のドキュメントを統合表示するには、GraphQL エイリアスを使って1リクエストで両方取得する。

```graphql
query DocumentsByDAO($daoUID: String!) {
  v2Docs: attestations(
    where: {
      schemaId: { equals: $documentV2SchemaId }
      decodedDataJson: { contains: $daoUID }
      revoked: { equals: false }
    }
  ) {
    id
    decodedDataJson
    timeCreated
    attester
  }

  v1Docs: attestations(
    where: {
      schemaId: { equals: $documentV1SchemaId }
      decodedDataJson: { contains: $daoUID }
      revoked: { equals: false }
    }
  ) {
    id
    decodedDataJson
    timeCreated
    attester
  }
}
```

レスポンスは `shared/lib/eas/schema.ts` の変換レイヤーで統一フォーマットに変換する。

### 3.5 スキーマ設定の管理

```typescript
// config/chains.ts
export const CHAIN_CONFIG = {
  sepolia: {
    chainId: 11155111,
    easContractAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    schemaRegistryAddress: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0',
    schemas: {
      dao: '0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1',
      documentV2: '（デプロイ後に記入）',
      documentV1: '0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152', // 読み取り専用
    },
    schemaDefinitions: {
      dao: 'string daoUID,string daoName,address adminAddress',
      documentV2:
        'bytes32 daoAttestationUID,string documentTitle,string documentType,bytes32 documentHash,string ipfsCid,string version,bytes32 previousVersionId,bytes32 votingTxHash,uint256 votingChainId',
      documentV1:
        'bytes32 daoAttestationUID,string documentTitle,bytes32 documentHash,string ipfsCid,string version,bytes32 previousVersionId',
    },
    graphqlEndpoint: 'https://sepolia.easscan.org/graphql',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  // マルチチェーン対応時に追加（Post-Alpha）
} as const;
```

---

## 4. データフロー

### 4.1 読み取りフロー

```
ページ (app/page.tsx)
  │
  └─ Feature Component (features/dao/components/DAOList.tsx)
       │
       └─ Hook (features/dao/hooks/useDAOs.ts)
            │  TanStack Query で管理
            └─ API Client (features/dao/api/daoApi.ts)
                 │  HTTP request via shared/lib/api-client.ts
                 └─ API Route (app/api/daos/route.ts)
                      │  Zod バリデーション
                      ├─ EAS GraphQL (shared/lib/eas/graphql.ts)
                      │    └─ EAS Sepolia endpoint
                      └─ Firebase (shared/lib/firebase/client.ts)
                           └─ Firestore
```

### 4.1.1 Homeページ統計取得フロー

Homeページ（FR-UI-05）の統計情報（登録DAO数、登録ドキュメント数）は API Route 経由で取得する。

```
Home (app/(public)/page.tsx)
  │
  └─ Server Component（初回レンダリング時にサーバーサイドで取得）
       │
       └─ API Route GET /api/stats
            │  サーバーサイドキャッシュ: 60秒
            ├─ EAS GraphQL: aggregateAttestation で件数取得
            │    ├─ DAO スキーマの総件数
            │    ├─ Document v1 + v2 スキーマの総件数
            │    └─ 1リクエストでバッチ取得（GraphQL エイリアス）
            └─ レスポンス: { daoCount, documentCount }
```

**EAS GraphQL の件数取得クエリ:**

```graphql
query PlatformStats {
  daoCount: aggregateAttestation(
    where: { schemaId: { equals: $daoSchemaId }, revoked: { equals: false } }
  ) {
    _count {
      _all
    }
  }
  docV2Count: aggregateAttestation(
    where: { schemaId: { equals: $docV2SchemaId }, revoked: { equals: false } }
  ) {
    _count {
      _all
    }
  }
  docV1Count: aggregateAttestation(
    where: { schemaId: { equals: $docV1SchemaId }, revoked: { equals: false } }
  ) {
    _count {
      _all
    }
  }
}
```

**Server Component で直接取得する理由:**

- Homeページは公開ページであり認証不要
- 統計は頻繁に変わらないため、サーバーサイドキャッシュと相性が良い
- クライアントサイドの JS バンドルを削減できる（§1.7 バンドルサイズ戦略）

### 4.2 書き込みフロー（DAO作成）

**DAO作成ウィザード（`my-dao/create/page.tsx`）のステップ構成:**

```
Step 1: 基本情報入力
  - DAO名（必須、EAS に保存）
  - 説明（必須、Firebase に保存）
  - 所在地、初期メンバー数、ロゴURL（任意、Firebase に保存）
  - 管理者アドレス（ウォレットから自動入力、読み取り専用）
  → React Hook Form + Zod バリデーション

Step 2: 確認・署名
  - 入力内容の確認画面
  - Gas 見積もり表示
  - 「ウォレットで署名」ボタン → EAS アテステーション作成
  - トランザクション待機（進捗表示）

Step 3: 完了
  - 成功メッセージ + アテステーション UID 表示
  - 作成した DAO 管理ページへリダイレクト
```

**内部処理フロー:**

```
DAOCreateForm (Step 2 の署名実行時)
  │  React Hook Form + Zod バリデーション
  └─ useCreateDAO mutation
       │
       ├─ 1. EAS アテステーション作成（クライアントサイド）
       │    └─ ethers.js Signer → EAS SDK → ブロックチェーン
       │
       └─ 2. API Route POST /api/daos（サーバーサイド）
            ├─ EAS アテステーション検証
            └─ Firebase メタデータ保存（説明、所在地等）
```

### 4.3 ドキュメント登録フロー

```
DocumentRegisterForm (マルチステップ)
  │
  └─ useRegisterDocument mutation
       │
       ├─ Step 1: SHA-256 ハッシュ計算（クライアント）
       ├─ Step 2: IPFS アップロード（API Route /api/upload）
       ├─ Step 3: EAS アテステーション作成（クライアント、Signer必要）
       │    └─ Document v2 スキーマでエンコード
       │         ├─ documentType: ユーザーが選択（articles/meeting/token/operation/voting/other）
       │         ├─ votingTxHash: 0x0（非投票文書）
       │         └─ votingChainId: 0（非投票文書）
       └─ Step 4: Firebase キャッシュ保存（API Route、任意）

       各ステップで onProgress コールバック → UI 進捗表示
```

### 4.4 投票ドキュメント登録フロー [NEW]

投票ドキュメントは独立した専用フォームではなく、`DocumentRegisterForm` の条件分岐として実装する。
ユーザーが documentType で `voting` を選択すると、追加フィールド（votingTxHash, votingChainId）が表示される。

```
DocumentRegisterForm (documentType = "voting" 選択時)
  │
  └─ useRegisterDocument mutation
       │
       ├─ Step 1: SHA-256 ハッシュ計算（クライアント）
       ├─ Step 2: IPFS アップロード（API Route /api/upload）
       ├─ Step 3: EAS アテステーション作成（クライアント）
       │    └─ Document v2 スキーマでエンコード
       │         ├─ documentType: "voting"
       │         ├─ votingTxHash: ユーザー入力（必須、voting 選択時のみ表示）
       │         └─ votingChainId: ユーザー入力（必須、投票が実行されたチェーン）
       └─ Step 4: Firebase キャッシュ保存（API Route、任意）

※ 投票 TX リンクはすべてオンチェーン（EAS）に保存。
※ votingContract, proposalId は txHash + chainId から追跡可能なため、スキーマには含めない。
※ 非投票文書の場合: votingTxHash = 0x0, votingChainId = 0
```

### 4.5 ドキュメント失効フロー

```
DocumentList / DocumentCard（管理者のみ「失効」ボタン表示）
  │
  └─ useRevokeDocument mutation
       │
       ├─ Step 1: EAS revoke（クライアントサイド、Signer 必要）
       │    └─ EAS SDK revoke(attestationUID) → ブロックチェーン
       │    └─ トランザクション待機（§10.2 と同様の進捗表示）
       │
       └─ Step 2: Firebase ステータス更新（API Route PUT /api/documents/[id]）
            ├─ EIP-191 署名検証 + adminAddress 一致チェック
            ├─ status: "active" → "revoked"
            └─ TanStack Query キャッシュ invalidate

※ Step 1 成功・Step 2 失敗の場合: EAS は revoke 済みだが Firebase 未更新。
  → Step 2 をリトライ（§10.3 と同方針）。
  → 閲覧時に EAS の revocation 状態を確認するフォールバックを実装。
```

### 4.6 DAO 非活性化フロー

```
My DAO 管理ページ（管理者のみ）
  │
  ├─ 1. 確認ダイアログ（DAO 名入力による確認）
  │
  └─ 2. useDeactivateDAO mutation
       │
       └─ API Route PUT /api/daos/[id]
            ├─ Firebase Auth トークン検証
            ├─ EIP-191 署名によるウォレット所有権検証（§9.5）
            ├─ adminAddress 一致チェック
            ├─ Firebase: status を "inactive" に更新
            └─ TanStack Query キャッシュ invalidate

※ EAS アテステーション（DAO・紐付きドキュメント）はオンチェーンで不変のため削除・変更しない。
※ 非活性化 DAO は /daos 一覧から非表示、My DAO には inactive ラベル付きで表示。
```

### 4.7 ダッシュボード データ取得フロー [NEW]

```
Dashboard (app/(auth)/dashboard/page.tsx)
  │
  ├─ StatsCards → useStats hook
  │    └─ API Route GET /api/stats
  │         └─ EAS GraphQL aggregateAttestation（§4.1.1 と同様）
  │
  └─ RecentActivity → useRecentActivity hook
       └─ API Route GET /api/activity
            └─ EAS GraphQL: 直近のアテステーション（作成・失効）を時系列で取得
                 ├─ DAO スキーマ + Document v1/v2 スキーマをエイリアスで一括取得
                 ├─ orderBy: [{ timeCreated: desc }]
                 ├─ take: 20（デフォルト）
                 └─ Firebase でメタデータ補完（DAO 名、ドキュメントタイトル等）
```

---

## 5. v1 → v2 改善マッピング

### 5.1 コード構造

| v1 の問題                              | v2 の解決策                                                |
| -------------------------------------- | ---------------------------------------------------------- |
| ページコンポーネントにロジック混在     | `app/` はルーティングのみ、ロジックは `features/`          |
| Context API（AuthContext, EasContext） | Zustand ストア + shared/lib/                               |
| クラスベース DAOService                | 関数ベース、依存注入可能                                   |
| easQuery.ts 911行                      | `eas/graphql.ts` + `eas/schema.ts` + `eas/types.ts` に分解 |

### 5.2 品質

| v1 の問題          | v2 の解決策                                       |
| ------------------ | ------------------------------------------------- |
| テストゼロ         | Vitest + RTL + MSW、カバレッジ 80%+               |
| CI/CD なし         | GitHub Actions（lint → typecheck → test → build） |
| 手動バリデーション | Zod スキーマ（フォーム + API 共用）               |
| ESLint 8           | ESLint 9 flat config                              |

### 5.3 認証

| v1 の問題                        | v2 の解決策             |
| -------------------------------- | ----------------------- |
| localStorage にユーザー情報保存  | Firebase Authentication |
| デモ認証（ハードコード資格情報） | 廃止                    |
| セッション管理なし               | Firebase Auth トークン  |

### 5.4 データ処理

| v1 の問題                      | v2 の解決策                          |
| ------------------------------ | ------------------------------------ |
| EAS パースに複数フォールバック | SDK バージョン固定、型安全デコーダー |
| Timestamp 変換の不整合         | `shared/utils/format.ts` に統一      |
| GraphQL 文字列ベース構築       | 型付きクエリヘルパー                 |

---

## 6. EAS クエリ最適化戦略

v1 では EAS GraphQL クエリに深刻なパフォーマンス問題がある。v2 では以下の戦略で解決する。

### 6.1 v1 の問題点

| 問題                   | 深刻度 | 詳細                                                     |
| ---------------------- | ------ | -------------------------------------------------------- |
| N+1 問題               | 致命的 | `daos/[id]` が1件取得のために全 DAO を取得してフィルター |
| キャッシュなし         | 致命的 | 同一データを毎レンダーで再取得、TanStack Query 未活用    |
| 個別 GraphQL コール    | 致命的 | DAO ごとにドキュメント取得の個別リクエスト発行           |
| クライアント側フィルタ | 高     | 全ドキュメント取得→ JS で daoAttestationUID フィルター   |
| Firebase 個別読み取り  | 高     | DAO 変換ごとに Firebase を個別呼び出し（N回）            |
| リクエスト重複         | 高     | 同一 `getAllDAOs()` が複数コンポーネントから重複実行     |

### 6.2 最適化方針

#### OPT-01: 単一リソースクエリの導入

v1 では全件取得 → `find()` で1件抽出していた。v2 では UID 指定の専用クエリを用意する。

```
v1: getAllDAOs() → find(d => d.id === id)          // 全件取得（100件）→ 1件抽出
v2: getDAOByUID(uid) → GraphQL where: { id: uid }  // 1件直接取得
```

**対象:**

- `getDAOByUID(uid)` — 単一 DAO 取得
- `getDocumentByUID(uid)` — 単一ドキュメント取得
- `getDocumentsByDAO(daoUID)` — 特定 DAO のドキュメントをサーバーサイドでフィルター

#### OPT-02: GraphQL バッチクエリ

複数の独立したクエリを1つの HTTP リクエストに統合する。

```graphql
# v1: 3回の個別リクエスト
# Request 1: getAllDAOs
# Request 2: getDocumentsByDAO(dao1)
# Request 3: getDocumentsByDAO(dao2)

# v2: 1回のバッチリクエスト
query BatchQuery {
  daos: attestations(where: { schemaId: { equals: $daoSchemaId } }) { ... }
  docs_dao1: attestations(where: {
    schemaId: { equals: $docSchemaId },
    decodedDataJson: { contains: $dao1UID }
  }) { ... }
  docs_dao2: attestations(where: {
    schemaId: { equals: $docSchemaId },
    decodedDataJson: { contains: $dao2UID }
  }) { ... }
}
```

**実装場所:** `shared/lib/eas/graphql.ts` に `executeBatchQuery()` を追加

#### OPT-03: TanStack Query キャッシュ戦略

```typescript
// shared/lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分間はキャッシュ優先
      gcTime: 10 * 60 * 1000, // 10分間キャッシュ保持
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

| クエリ種別       | staleTime | gcTime | 理由                                       |
| ---------------- | --------- | ------ | ------------------------------------------ |
| DAO 一覧         | 60s       | 10min  | 頻繁に変わらない、一覧表示で最もコール多い |
| DAO 詳細         | 60s       | 10min  | 同上                                       |
| ドキュメント一覧 | 30s       | 5min   | 登録直後の反映を考慮                       |
| ドキュメント詳細 | 5min      | 30min  | 不変データが多い（EAS アテステーション）   |
| My DAO 一覧      | 30s       | 5min   | ウォレット変更時に invalidate              |

**TanStack Query のリクエスト重複排除:**

- 同一 queryKey のリクエストは自動的に1つに統合される（built-in）
- v1 の「同じ `getAllDAOs()` が複数回実行される」問題は TanStack Query 導入で自動解決

#### OPT-04: API Route レベルキャッシュ

EAS GraphQL プロキシにサーバーサイドキャッシュを追加する。

```typescript
// app/api/eas-proxy/route.ts
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 30 * 1000; // 30秒

export async function POST(request: NextRequest) {
  const body = await request.json();
  const cacheKey = JSON.stringify(body);

  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const response = await fetch(EAS_GRAPHQL_ENDPOINT, { ... });
  const data = await response.json();
  cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

  return NextResponse.json(data);
}
```

**注意:** Vercel Serverless では Map はリクエスト間で共有されない場合がある。本格運用では以下を検討:

- `next.config.js` の `fetch()` キャッシュ（Next.js 組み込み `revalidate`）
- Vercel KV / Upstash Redis（Post-Alpha）

#### OPT-05: Firebase バッチ読み取り

DAO 変換時の Firebase 個別読み取りをバッチ化する。

```typescript
// v1: N回の個別読み取り
for (const dao of daos) {
  const meta = await getDoc(doc(db, 'daos', dao.id)); // N回
}

// v2: 1回のバッチ読み取り（Firestore の制限: 最大10件/バッチ）
import { documentId, where, getDocs, query } from 'firebase/firestore';

async function batchGetDAOMetadata(daoIds: string[]): Promise<Map<string, FirebaseDAOData>> {
  const results = new Map();
  // Firestore の `in` クエリは最大30件まで
  for (const chunk of chunkArray(daoIds, 30)) {
    const q = query(collection(db, 'daos'), where(documentId(), 'in', chunk));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((doc) => results.set(doc.id, doc.data()));
  }
  return results;
}
```

**実装場所:** `shared/lib/firebase/client.ts`

### 6.3 データ取得フロー比較

```
v1（現状）:
  DAO一覧ページ → getAllDAOs() [GraphQL 1回]
    → 各DAOごとに:
        getDocumentsByDAO() [GraphQL N回]
        getDAODetailsFromDatabase() [Firebase N回]
  = 合計: 1 + N + N = 2N+1 リクエスト（DAO 20件で 41リクエスト）

v2（最適化後）:
  DAO一覧ページ → TanStack Query (キャッシュ確認)
    → API Route [1回]
      → EAS バッチクエリ [GraphQL 1回: DAO一覧 + ドキュメント数]
      → Firebase バッチ読み取り [Firebase 1回: 全DAOメタデータ]
    → レスポンスをキャッシュ (60秒)
  = 合計: 2リクエスト（キャッシュヒット時は 0）
```

### 6.4 ディレクトリ構成への反映

```
shared/lib/eas/
  ├── client.ts       # EAS SDK 初期化
  ├── schema.ts       # スキーマ定義・エンコード/デコード
  ├── graphql.ts      # GraphQL クエリ実行 + バッチクエリ [OPT-02]
  ├── queries.ts      # 単一リソースクエリ定義 [OPT-01]
  └── types.ts        # EAS 固有型
```

### 6.5 検索・ページネーション設計

#### DAO 検索

DAO 名のテキスト検索は **Firebase Firestore** で実行する。EAS GraphQL の `decodedDataJson contains` は文字列部分一致のため検索精度が低く、偽陽性のリスクがある（§6.6 参照）。

```typescript
// 検索フロー
// 1. Firebase で検索条件に一致する DAO メタデータを取得
// 2. 取得した attestationUID で EAS データを補完（必要な場合のみ）

// Firestore のテキスト検索: prefix match（startAt / endAt）
// DAO 名の完全一致 or 前方一致を Firestore で処理
const q = query(
  collection(db, 'daos'),
  where('status', '==', 'active'),
  where('name', '>=', searchText),
  where('name', '<=', searchText + '\uf8ff'),
  orderBy('name'),
  limit(pageSize),
);
```

**制約と対策:**

- Firestore のテキスト検索は前方一致のみ（部分一致検索は不可）
- Alpha では前方一致で十分。Post-Alpha で Algolia / Meilisearch 等の全文検索を検討

#### ページネーション

**方式: カーソルベース（Firestore `startAfter`）**

オフセットベースは Firestore の特性上非効率（スキップ件数分の読み取り課金が発生）。
カーソルベースを採用し、最後のドキュメントスナップショットを基点にする。

```typescript
// shared/types/common.ts
interface PaginationParams {
  limit: number; // デフォルト: 20、最大: 100
  cursor?: string; // 前ページ最後の DAO attestationUID
  direction?: 'next' | 'prev';
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    limit: number;
    total: number; // DAO 総数（別途カウントクエリ）
    hasNext: boolean;
    nextCursor: string | null;
    hasPrev: boolean;
    prevCursor: string | null;
  };
}
```

**EAS GraphQL のページネーション:**

EAS GraphQL は `take` / `skip` パラメータをサポートする。
ただし `skip` は大きな値でパフォーマンスが劣化するため、主にFirebaseで取得した UID リストを基にした単一リソースクエリ（§6.2 OPT-01）で補完する。

```graphql
query DAOList($take: Int!, $skip: Int!) {
  attestations(
    where: { schemaId: { equals: $daoSchemaId } }
    take: $take
    skip: $skip
    orderBy: [{ timeCreated: desc }]
  ) {
    id
    decodedDataJson
    timeCreated
    attester
  }
}
```

| パラメータ         | デフォルト | 最大 | 備考                                    |
| ------------------ | ---------- | ---- | --------------------------------------- |
| `limit` (= `take`) | 20         | 100  | API Route で上限を強制                  |
| `cursor`           | なし       | —    | attestationUID or Firestore docSnapshot |

### 6.6 バージョンチェーン取得戦略

`previousVersionId` を辿ってバージョン履歴を構築する方式:

```
GET /api/documents/[id]（バージョンチェーン情報を含む）
  │
  └─ 1. 対象ドキュメントの EAS アテステーション取得
       │
       └─ 2. previousVersionId が 0x0 でない場合
            └─ 再帰的に前バージョンを取得（EAS GraphQL: id で直接取得）
                 └─ previousVersionId が 0x0 になるまで繰り返し
```

**制約と対策:**

- チェーンの深さに上限を設ける（最大 20 バージョン）。無限ループ防止
- 各バージョンは UID 指定の単一クエリ（§6.2 OPT-01）で取得。N+1 だがバージョン数は少数のため許容
- 取得結果は TanStack Query でキャッシュ（staleTime: 5min）。バージョンチェーンは不変データ
- Firebase キャッシュに `versionChain: string[]`（UID 配列）を保持し、2回目以降は一括取得可能

### 6.7 `decodedDataJson contains` の偽陽性リスク

EAS GraphQL の `decodedDataJson: { contains: $daoUID }` は **JSON 文字列全体の部分一致検索**である。

**リスク:** DAO の attestationUID が、別のフィールド（例: `previousVersionId`）の値と部分一致した場合、無関係なドキュメントが返される。

**対策:**

1. **API Route 側でフィルタリング**: GraphQL 結果を受け取った後、デコード済みデータの `daoAttestationUID` フィールドを厳密に一致チェックする
2. **Firebase キャッシュの活用**: ドキュメント一覧は Firebase の `daoAttestationUID` フィールドで正確にクエリし、EAS データは個別 UID で取得する
3. **バリデーション**: レスポンス内の各アテステーションについて `decodedData.daoAttestationUID === targetDAOUID` を検証してから返却する

```typescript
// shared/lib/eas/queries.ts
function filterByDAOUID(attestations: EASAttestation[], daoUID: string): EASAttestation[] {
  return attestations.filter((att) => {
    const decoded = decodeAttestationData(att.decodedDataJson);
    return decoded.daoAttestationUID === daoUID;
  });
}
```

---

## 7. 設定ファイル一覧

| ファイル                   | 用途                                   |
| -------------------------- | -------------------------------------- |
| `tsconfig.json`            | TypeScript strict mode、パスエイリアス |
| `next.config.ts`           | Next.js 設定                           |
| `eslint.config.mjs`        | ESLint 9 flat config                   |
| `.prettierrc.json`         | Prettier フォーマット設定              |
| `vitest.config.ts`         | Vitest テスト設定                      |
| `.env.example`             | 環境変数テンプレート                   |
| `.husky/pre-commit`        | コミット前チェック                     |
| `commitlint.config.js`     | Conventional Commits 設定              |
| `.github/workflows/ci.yml` | CI パイプライン                        |
| `tailwind.config.ts`       | Tailwind CSS 4 設定                    |

---

## 8. 環境変数

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# EAS
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=
NEXT_PUBLIC_EAS_SCHEMA_REGISTRY_ADDRESS=
NEXT_PUBLIC_DAO_SCHEMA_UID=
NEXT_PUBLIC_DOCUMENT_V2_SCHEMA_UID=
NEXT_PUBLIC_DOCUMENT_V1_SCHEMA_UID=   # 後方互換読み取り用
NEXT_PUBLIC_EAS_GRAPHQL_ENDPOINT=

# Firebase Admin SDK（サーバーサイドのみ）
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# IPFS (Pinata)
PINATA_JWT=                           # サーバーサイドのみ（§1.5 参照）

# Chain
NEXT_PUBLIC_CHAIN_ID=11155111         # Sepolia
NEXT_PUBLIC_RPC_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**セキュリティルール:**

- `NEXT_PUBLIC_` プレフィックス: クライアントに公開OK
- プレフィックスなし: サーバーサイドのみ（API キー等）

---

## 9. 認証・セッション管理

### 9.1 認証フロー

```
┌─────────────────────────────────────────────────┐
│  認証方式1: メール/パスワード                     │
│                                                   │
│  サインアップ                                     │
│    1. メール + パスワード入力                     │
│    2. Firebase Auth createUserWithEmailAndPassword │
│    3. 確認メール送信（Firebase 自動）             │
│    4. メール確認後にアカウント有効化               │
│                                                   │
│  ログイン                                         │
│    1. メール + パスワード入力                     │
│    2. Firebase Auth signInWithEmailAndPassword     │
│    3. Firebase ID トークン取得                     │
│    4. Zustand authStore に保存                     │
│                                                   │
│  パスワードリセット                               │
│    1. メール入力                                   │
│    2. Firebase Auth sendPasswordResetEmail          │
│    3. メールのリンクからリセットフォームへ         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  認証方式2: ウォレット接続                        │
│                                                   │
│  接続                                             │
│    1. MetaMask window.ethereum.request             │
│    2. eth_requestAccounts → アドレス取得           │
│    3. Zustand walletStore に保存                   │
│    4. チェーンID 確認 → Sepolia でなければ切替要求 │
│                                                   │
│  認証はウォレット署名で行わない（Alpha）           │
│    → ウォレットアドレスは「操作権限の証明」に使用  │
│    → DAO 管理者 = adminAddress 一致チェック        │
│    → EAS アテステーション作成時に Signer として使用│
└─────────────────────────────────────────────────┘
```

### 9.2 メール認証とウォレットの関係

- メール認証: ログイン状態の管理（セッション）
- ウォレット接続: ブロックチェーン操作の権限（EAS アテステーション作成・失効）
- **アカウントリンクは Alpha では行わない** — 別々に管理
- 保護ルート（`/my-dao/*`, `/dashboard`）はメール認証が必須
- ブロックチェーン操作（DAO 作成、ドキュメント登録）はウォレット接続も必須

### 9.3 セッション管理

| 項目               | 仕様                                                            |
| ------------------ | --------------------------------------------------------------- |
| トークン           | Firebase ID Token（JWT、1時間有効）                             |
| リフレッシュ       | Firebase SDK 自動リフレッシュ（`onIdTokenChanged`）             |
| 永続化             | Firebase Auth の `browserLocalPersistence`                      |
| ログアウト         | Firebase signOut + Zustand 全ストア reset + localStorage クリア |
| ウォレット変更検知 | `window.ethereum.on('accountsChanged')` → walletStore 更新      |
| チェーン変更検知   | `window.ethereum.on('chainChanged')` → ページリロード           |

### 9.4 認証ガード

```typescript
// features/auth/components/AuthGuard.tsx
// (auth) Route Group の layout.tsx で使用

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  if (isLoading) return <LoadingSpinner />;
  if (!user) {
    router.replace('/login?redirect=' + pathname);
    return null;
  }
  return <>{children}</>;
}
```

### 9.5 ウォレット所有権検証

Firebase Auth トークンにはウォレット情報が含まれないため、サーバーサイドで「リクエスト送信者がそのウォレットを本当に所有しているか」を検証する仕組みが必要である。

**問題**: ウォレットアドレスをリクエストボディで自己申告するだけでは偽装可能。特に `PUT /api/daos/[id]`（DAO 編集・非活性化）で adminAddress 一致チェックが機能しない。

**解決策: EIP-191 署名ベースのウォレット検証**

```typescript
// shared/lib/wallet/verify.ts
import { ethers } from 'ethers';

interface WalletVerification {
  walletAddress: string;
  signature: string; // EIP-191 personal_sign
  message: string; // 署名対象メッセージ
  timestamp: number; // リプレイ攻撃防止
}

async function verifyWalletOwnership(verification: WalletVerification): Promise<string> {
  const { walletAddress, signature, message, timestamp } = verification;

  // タイムスタンプ有効期限: 5分
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    throw new ApiError(401, 'Signature expired');
  }

  // 署名からアドレスを復元
  const expectedMessage = `DAO Platform Verification\nAddress: ${walletAddress}\nTimestamp: ${timestamp}`;
  if (message !== expectedMessage) {
    throw new ApiError(401, 'Invalid message format');
  }

  const recoveredAddress = ethers.verifyMessage(message, signature);
  if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new ApiError(401, 'Wallet ownership verification failed');
  }

  return recoveredAddress;
}
```

**クライアントサイドの署名フロー:**

```typescript
// features/wallet/hooks/useWalletSignature.ts
async function signVerification(address: string): Promise<WalletVerification> {
  const timestamp = Date.now();
  const message = `DAO Platform Verification\nAddress: ${address}\nTimestamp: ${timestamp}`;
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);
  return { walletAddress: address, signature, message, timestamp };
}
```

**適用範囲:**

| 操作                  | 検証方式           | 理由                                                           |
| --------------------- | ------------------ | -------------------------------------------------------------- |
| `POST /api/daos`      | EAS attester 検証  | アテステーション作成者 = リクエスト送信者                      |
| `PUT /api/daos/[id]`  | EIP-191 署名検証   | adminAddress の所有権確認                                      |
| `POST /api/documents` | EAS attester 検証  | アテステーション作成者 = リクエスト送信者                      |
| `POST /api/upload`    | Firebase Auth のみ | ウォレット不要（ファイルアップロードは認証済みユーザーなら可） |

---

## 10. エラーハンドリング・トランザクション管理

### 10.1 エラー分類マトリクス

| エラー種別                    | リトライ             | 最大回数 | バックオフ        | ユーザー表示                               |
| ----------------------------- | -------------------- | -------- | ----------------- | ------------------------------------------ |
| IPFS アップロードタイムアウト | 可                   | 3        | 指数（1s→5s→15s） | 「アップロードを再試行しています...」      |
| IPFS アップロード失敗         | 可（フォールバック） | 1        | —                 | Pinata→w3up 切替、それも失敗→エラー        |
| EAS GraphQL タイムアウト      | 可                   | 3        | 指数（2s→8s→30s） | 「データを取得しています...」              |
| EAS GraphQL レート制限        | 可                   | 3        | 固定（60s）       | 「しばらくお待ちください」                 |
| EAS TX ユーザー拒否           | 不可                 | —        | —                 | 「トランザクションがキャンセルされました」 |
| EAS TX Gas 不足               | 不可                 | —        | —                 | 「ETH 残高が不足しています」               |
| EAS TX revert                 | 不可                 | —        | —                 | 「トランザクションが失敗しました」         |
| Firebase 書き込み失敗         | 可                   | 2        | 固定（3s）        | 「データ保存を再試行しています...」        |
| Firebase オフライン           | 可                   | ∞        | Firebase SDK 自動 | 「オフラインです。接続後に同期されます」   |
| ネットワーク切断              | 可                   | —        | 自動検知          | 「ネットワーク接続を確認してください」     |
| Zod バリデーション            | 不可                 | —        | —                 | フィールド単位のエラー表示                 |

### 10.2 ブロックチェーントランザクション管理

```
DAO 作成 / ドキュメント登録のトランザクションフロー:

  [1. 準備]
    ├─ フォームバリデーション（Zod）
    ├─ ウォレット接続確認
    └─ チェーンID 確認（Sepolia でなければ切替）

  [2. Gas 見積もり]
    ├─ EAS SDK attestByDelegation.estimateGas()
    ├─ 成功 → Gas 見積もりを UI に表示
    └─ 失敗 → 「Gas 見積もりに失敗しました」+ デフォルト値で続行オプション

  [3. トランザクション送信]
    ├─ UI: 「ウォレットで承認してください...」
    ├─ ユーザーが MetaMask で承認
    └─ ユーザーが拒否 → フロー中断、エラートースト

  [4. 確認待ち]
    ├─ UI: 「トランザクション処理中... (txHash: 0x...)」
    ├─ tx.wait() で1ブロック確認を待機
    ├─ タイムアウト: 120秒（Sepolia のブロック時間考慮）
    └─ タイムアウト → 「トランザクションの確認に時間がかかっています」
         └─ Etherscan リンクを表示して手動確認を案内

  [5. 後処理]
    ├─ EAS アテステーション UID 取得
    ├─ Firebase メタデータ保存
    ├─ Firebase 保存失敗 → EAS は成功済みなのでリトライ
    ├─ TanStack Query キャッシュ invalidate
    └─ UI: 成功メッセージ + 作成したリソースへリダイレクト
```

### 10.3 マルチステップ操作のロールバック

ドキュメント登録は4ステップの順序依存操作。途中失敗時の対応:

| 失敗箇所              | 前ステップの状態    | 対応                                                                                         |
| --------------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| Step 1 (ハッシュ計算) | なし                | 即リトライ                                                                                   |
| Step 2 (IPFS)         | なし                | リトライ or フォールバック                                                                   |
| Step 3 (EAS TX)       | IPFS にファイルあり | 放置可（IPFS は自動 GC）、リトライ                                                           |
| Step 4 (Firebase)     | IPFS + EAS 済み     | ベストエフォート（リトライ2回、失敗しても登録完了扱い。次回アクセス時に EAS から再構築可能） |

---

## 11. API セキュリティ設計

### 11.1 API ルート認証要件

| エンドポイント        | メソッド | 認証          | 追加チェック                                                                                        |
| --------------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `/api/daos`           | GET      | 不要          | クエリパラメータ: `search`, `status`, `cursor`, `limit`                                             |
| `/api/daos`           | POST     | Firebase Auth | EAS attester 検証（§9.5）                                                                           |
| `/api/daos/[id]`      | GET      | 不要          | UID 指定の単一リソース取得                                                                          |
| `/api/daos/[id]`      | PUT      | Firebase Auth | EIP-191 署名によるウォレット所有権検証（§9.5）+ adminAddress 一致。非活性化 = status 変更もこの API |
| `/api/documents`      | GET      | 不要          | クエリパラメータ: `daoId`（必須）, `type`, `status`, `txHash`, `cursor`, `limit`                    |
| `/api/documents`      | POST     | Firebase Auth | EAS attester 検証（§9.5）、DAO 管理者チェック                                                       |
| `/api/documents/[id]` | GET      | 不要          | UID 指定の単一ドキュメント取得。バージョンチェーン情報を含む                                        |
| `/api/documents/[id]` | PUT      | Firebase Auth | EIP-191 署名検証 + adminAddress 一致。失効（revoke）操作もこの API で処理                           |
| `/api/upload`         | POST     | Firebase Auth | ファイルサイズ 10MB 上限、MIME タイプ検証（PDF/DOC/DOCX/TXT/JSON）                                  |
| `/api/eas-proxy`      | POST     | 不要          | レート制限のみ                                                                                      |
| `/api/stats`          | GET      | 不要          | Homeページ用統計（DAO数、ドキュメント数）。サーバーサイドキャッシュ 60s                             |
| `/api/activity`       | GET      | Firebase Auth | 最近のアテステーション一覧（作成・失効）。クエリパラメータ: `limit`（デフォルト20）                 |

**API レスポンス共通型:**

```typescript
// shared/types/api.ts

// 成功レスポンス（ページネーションは §6.5 のカーソルベースに統一）
interface ApiResponse<T> {
  data: T;
  meta?: {
    limit: number;
    total: number;
    hasNext: boolean;
    nextCursor: string | null;
    hasPrev: boolean;
    prevCursor: string | null;
  };
}

// エラーレスポンス
interface ApiErrorResponse {
  error: {
    code: string; // "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL"
    message: string; // ユーザー向けメッセージ
    details?: unknown; // Zod バリデーションエラー等
  };
}
```

### 11.2 認証ミドルウェア

```typescript
// shared/lib/api-client.ts (サーバーサイド)
import { getAuth } from 'firebase-admin/auth';

async function verifyAuth(request: NextRequest): Promise<DecodedIdToken> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization header required');
  }
  const token = authHeader.split('Bearer ')[1];
  return getAuth().verifyIdToken(token);
}
```

### 11.3 入力バリデーション

全 API ルートで Zod スキーマによるバリデーション:

```typescript
// features/dao/types/index.ts
const CreateDAOSchema = z.object({
  attestationUID: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  memberCount: z.number().int().min(0).optional(),
  logoUrl: z.string().url().optional(),
});
```

### 11.4 レート制限

| エンドポイント   | 制限   | 単位         |
| ---------------- | ------ | ------------ |
| `/api/eas-proxy` | 30 req | /分/IP       |
| `/api/upload`    | 10 req | /分/ユーザー |
| `/api/daos` POST | 5 req  | /分/ユーザー |
| その他 GET       | 60 req | /分/IP       |

**実装:** Alpha では `Map<IP, {count, resetTime}>` のインメモリ制限。Post-Alpha で Upstash Redis に移行。

### 11.5 Firestore セキュリティルール

**設計方針: クライアント直接書き込み禁止**

Firestore への書き込みはすべて API Route 経由（Firebase Admin SDK）で行う。
クライアントから Firestore への直接書き込みを禁止することで、API Route 側のウォレット所有権検証（§9.5）・adminAddress チェックが確実に適用される。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DAOs: 誰でも読み取り可、クライアント直接書き込みは禁止
    // 書き込みは API Route 経由（Firebase Admin SDK）でのみ実行
    match /daos/{daoId} {
      allow read: if true;
      allow write: if false;
    }

    // Documents: 誰でも読み取り可、クライアント直接書き込みは禁止
    match /documents/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**補足:**

- Firebase Admin SDK はセキュリティルールをバイパスするため、API Route からの書き込みは影響を受けない
- 認可チェック（adminAddress 一致、ウォレット所有権検証）は API Route 内で実施（§9.5、§11.1 参照）
- クライアントからの読み取りはクエリ高速化のために許可

### 11.6 CSP・CORS・セキュリティヘッダー

**Content Security Policy (CSP):**

```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://gateway.pinata.cloud https://*.googleusercontent.com;
  font-src 'self';
  connect-src 'self'
    https://sepolia.easscan.org
    https://*.firebaseio.com
    https://*.googleapis.com
    https://gateway.pinata.cloud
    https://api.pinata.cloud
    wss://*.firebaseio.com
    https://sepolia.infura.io
    https://rpc.sepolia.org;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
`.replace(/\n/g, ' ');
```

**注意点:**

- `unsafe-eval` は ethers.js の一部機能で必要。Post-Alpha で代替手段を検討
- `unsafe-inline` は Tailwind CSS の動的スタイル注入に必要。nonce ベースの CSP は Post-Alpha で検討
- MetaMask は `window.ethereum` をページに注入するため、`script-src` の制限に注意

**CORS 設定:**

API Route はデフォルトで Same-Origin のみ許可。外部からの API 呼び出しが必要な場合は明示的に設定する。

```typescript
// shared/lib/cors.ts
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  // Vercel Preview URL パターン
  /^https:\/\/dao-platform-.*\.vercel\.app$/,
];

function setCorsHeaders(response: NextResponse, origin: string): NextResponse {
  if (ALLOWED_ORIGINS.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  return response;
}
```

**その他のセキュリティヘッダー（`next.config.ts` で設定）:**

| ヘッダー                 | 値                                | 目的                          |
| ------------------------ | --------------------------------- | ----------------------------- |
| `X-Frame-Options`        | `DENY`                            | クリックジャッキング防止      |
| `X-Content-Type-Options` | `nosniff`                         | MIME タイプスニッフィング防止 |
| `Referrer-Policy`        | `strict-origin-when-cross-origin` | リファラー情報の制限          |
| `Permissions-Policy`     | `camera=(), microphone=()`        | 不要な API の無効化           |

---

## 12. 状態管理設計（Zustand）

### 12.1 ストア構成

```typescript
// features/auth/stores/authStore.ts
interface AuthState {
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
  } | null;
  isLoading: boolean;
  isInitialized: boolean; // Firebase Auth の初期化完了フラグ
}

// ロール定義:
// Alpha では DAO ごとに管理者1名のみ（adminAddress 一致チェック）。
// ロールシステムは Post-Alpha（FR-MEM-02）で導入: admin / editor / viewer。
// v1 の "member" | "operator" | "superadmin" は廃止。

interface AuthActions {
  setUser: (user: AuthState['user']) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void; // Firebase signOut + 全ストア reset
  initialize: () => () => void; // onAuthStateChanged リスナー登録、クリーンアップ関数を返す
}

type AuthStore = AuthState & AuthActions;
```

```typescript
// features/wallet/stores/walletStore.ts
interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
}

interface WalletActions {
  connect: () => Promise<void>; // eth_requestAccounts
  disconnect: () => void; // ストアクリア
  switchChain: (chainId: number) => Promise<void>; // wallet_switchEthereumChain
  setupListeners: () => () => void; // accountsChanged, chainChanged
}

type WalletStore = WalletState & WalletActions;
```

### 12.2 永続化・SSR 対応

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      /* ... */
    }),
    {
      name: 'wallet-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        address: state.address, // 永続化する
        chainId: state.chainId, // 永続化する
        // isConnecting は永続化しない
      }),
    },
  ),
);
```

**SSR ハイドレーション対策:**

```typescript
// shared/hooks/useHydration.ts
// SSR 時は localStorage が存在しないためハイドレーションミスマッチを防ぐ
function useHydration() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
```

### 12.3 ストア間の連携

```
authStore.logout()
  ├─ Firebase signOut()
  ├─ authStore.reset()
  ├─ walletStore.disconnect()
  └─ TanStack Query queryClient.clear()

walletStore.connect()
  └─ 成功後、TanStack Query で My DAO 一覧を prefetch

window.ethereum 'accountsChanged'
  ├─ walletStore.address 更新
  └─ TanStack Query の myDAOs キャッシュを invalidate
```

---

## 13. デプロイ・環境管理

### 13.1 環境構成

| 環境        | 用途          | Firebase プロジェクト | チェーン         | デプロイ先        |
| ----------- | ------------- | --------------------- | ---------------- | ----------------- |
| development | ローカル開発  | dao-platform-dev      | Sepolia          | localhost:3000    |
| preview     | PR プレビュー | dao-platform-dev      | Sepolia          | Vercel Preview    |
| production  | 本番          | dao-platform-prod     | Sepolia（Alpha） | Vercel Production |

**Alpha では Sepolia 固定。** mainnet 移行は Post-Alpha。
**Firebase プロジェクトは2つ:** dev（開発+プレビュー共用）と prod（本番のみ）。

### 13.2 Vercel 環境変数設定

```
Vercel Dashboard → Settings → Environment Variables

変数ごとに適用環境を指定:
  - Production のみ: PINATA_JWT (本番キー)
  - Preview + Development: PINATA_JWT (テストキー)
  - 全環境共通: NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_EAS_* (Sepolia 設定)
```

### 13.3 CI/CD パイプライン

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
      - run: npm run build
```

### 13.4 シークレットローテーション

| シークレット       | ローテーション方法                           | ダウンタイム                 |
| ------------------ | -------------------------------------------- | ---------------------------- |
| PINATA_JWT         | Vercel ダッシュボードで更新 → 自動再デプロイ | なし（次リクエストから適用） |
| Firebase API Key   | Firebase Console → Vercel 更新               | なし                         |
| Firebase Admin SDK | サービスアカウントキー再生成 → Vercel 更新   | 数秒（再デプロイ中）         |

---

## 14. データ移行戦略（v1 → v2）

### 14.1 移行対象

| データ                           | 保存先                   | 件数（想定） | 移行方針                                                           |
| -------------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------ |
| EAS アテステーション（DAO）      | Sepolia ブロックチェーン | 〜50         | **移行不要**（オンチェーン、v2 から同じスキーマ UID で読み取り可） |
| EAS アテステーション（Document） | Sepolia ブロックチェーン | 〜200        | **移行不要**（v1 スキーマ UID で読み取り専用、§3.4 参照）          |
| Firebase DAO メタデータ          | Firestore `daos/`        | 〜50         | **スキーマ検証 + 補完**（表示用メタデータの遅延移行）              |
| IPFS ドキュメントファイル        | Pinata                   | 〜200        | **移行不要**（CID は不変、ゲートウェイ URL 統一のみ）              |
| ユーザーアカウント               | localStorage             | 少数         | **再作成**（Firebase Auth で新規登録を案内）                       |

### 14.2 EAS スキーマ共存戦略

v2 では Document スキーマを新規デプロイするため、v1 と v2 のアテステーションが共存する。

```
v1 Document アテステーション（〜200件、読み取り専用）:
  - スキーマ UID: 0xbc9fcde5f...
  - フィールド: daoAttestationUID, documentTitle, documentHash, ipfsCid, version, previousVersionId
  - documentType が存在しない → "unknown" として表示
  - votingTxHash が存在しない → "なし" として表示

v2 Document アテステーション（新規登録分）:
  - スキーマ UID: （デプロイ後に記入）
  - フィールド: 上記 + documentType, votingTxHash, votingChainId

読み取り時の統合:
  - DAO 詳細ページでは v1 + v2 両方のアテステーションを表示
  - GraphQL エイリアスで v1/v2 を1リクエストで取得（§3.5 参照）
  - 変換レイヤー（shared/lib/eas/schema.ts）で v1/v2 の差異を吸収
```

### 14.3 Firebase メタデータの遅延移行

v1 の Firebase データには v2 で追加されるフィールドが存在しない。
v2 の初回読み取り時にデフォルト値を補完する「遅延移行」方式を採用する。

```typescript
// shared/lib/firebase/types.ts
function normalizeDAOMetadata(raw: Record<string, unknown>): FirebaseDAOData {
  return {
    description: raw.description ?? '',
    location: raw.location ?? '',
    memberCount: raw.memberCount ?? 0,
    status: raw.status ?? 'active',
    foundingDate: raw.foundingDate ?? null,
    logoUrl: raw.logoUrl ?? '',
    website: raw.website ?? '',
    contactEmail: raw.contactEmail ?? '',
    contactPerson: raw.contactPerson ?? '',
    documents: raw.documents ?? [],
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date(),
  };
}
```

### 14.4 移行が不要なもの

- **EAS アテステーション**: オンチェーンデータは不変。v1 アテステーションは v1 スキーマ UID で読み取り継続
- **IPFS ファイル**: CID ベースのアドレッシング。ゲートウェイ URL を `shared/lib/ipfs/gateway.ts` で統一管理

### 14.5 ユーザーアカウント移行

v1 は localStorage ベースの独自認証（デモ認証含む）。v2 は Firebase Auth に完全移行。

- **自動移行は行わない** — v1 のユーザーデータにパスワードハッシュ等がないため不可能
- v2 初回アクセス時にサインアップを案内
- ウォレットアドレスで既存 DAO の管理者であることは EAS データから自動的に紐付く

### 14.6 Document v2 スキーマデプロイ手順

```
前提:
  - Sepolia ETH を保有するウォレット（開発者の MetaMask）
  - EAS SchemaRegistry コントラクト: 0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0

手順:
  1. scripts/setup-schemas.js を実行（または EAS SDK で手動登録）
     - SchemaRegistry.register() を呼び出し
     - スキーマ定義: "bytes32 daoAttestationUID,string documentTitle,
       string documentType,bytes32 documentHash,string ipfsCid,
       string version,bytes32 previousVersionId,
       bytes32 votingTxHash,uint256 votingChainId"
     - resolver: 0x0（リゾルバーなし）
     - revocable: true
  2. トランザクション完了後、スキーマ UID を取得
  3. config/chains.ts の documentV2 フィールドに UID を設定
  4. .env の NEXT_PUBLIC_DOCUMENT_V2_SCHEMA_UID に同じ UID を設定
  5. easscan.org/schema/{UID} で登録内容を確認
```

### 14.7 移行スケジュール

```
Phase 1: Document v2 スキーマデプロイ
  - Sepolia に新 Document スキーマを登録（§14.6 の手順に従う）
  - スキーマ UID を config/chains.ts に設定

Phase 2: v2 アプリデプロイ（v1 と並行稼働）
  - v2 は v1 と同じ Firebase プロジェクトを参照
  - v1 Document アテステーションは v1 スキーマで読み取り（後方互換）
  - 新規登録は v2 スキーマで作成

Phase 3: v1 トラフィック移行
  - DNS を v2 に切替
  - v1 は読み取り専用で一定期間維持

Phase 4: v1 廃止
  - v1 のデプロイを停止
  - localStorage 依存コードを完全削除
```
