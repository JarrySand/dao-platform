# v2 技術スタック・アーキテクチャ設計

> v2 の技術選定とアーキテクチャを確定する。

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

### 1.4 ブロックチェーン

| カテゴリ | ライブラリ                            | バージョン | 用途                                 |
| -------- | ------------------------------------- | ---------- | ------------------------------------ |
| Ethereum | ethers.js                             | 6          | プロバイダー、署名、コントラクト操作 |
| EAS      | @ethereum-attestation-service/eas-sdk | latest     | アテステーション作成・検証           |

**変更なし**: ブロックチェーンスタックは v1 継続。

### 1.5 バックエンド・データベース

| カテゴリ   | ライブラリ              | バージョン | 用途                     |
| ---------- | ----------------------- | ---------- | ------------------------ |
| DB         | Firebase Firestore      | 11         | 可変メタデータ保存       |
| 認証       | Firebase Authentication | 11         | メール/パスワード認証    |
| ストレージ | IPFS (要評価)           | -          | ドキュメントファイル保存 |

**v1からの変更点**: Firebase Auth を正式採用（v1は localStorage ベース）
**要評価**: nft.storage vs Pinata vs w3up — Alpha 前に安定性確認

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
│   │   │       └── route.ts          #     GET: 詳細, PUT: 更新, DELETE: 削除
│   │   ├── documents/                # [NEW] ドキュメント専用API
│   │   │   └── route.ts
│   │   ├── upload/
│   │   │   └── route.ts              #     POST: IPFSアップロード
│   │   └── eas-proxy/
│   │       └── route.ts              #     GET: EAS GraphQL プロキシ
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
│   │   │   ├── DocumentVersionHistory.tsx # [NEW]
│   │   │   ├── VotingDocumentForm.tsx     # [NEW] 投票ドキュメント登録（TX紐付け）
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
│   │   │   ├── auth.ts               #   Firebase Auth ヘルパー [NEW]
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

## 3. データフロー

### 3.1 読み取りフロー

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

### 3.2 書き込みフロー（DAO作成）

```
DAOCreateForm
  │  React Hook Form + Zod バリデーション
  └─ useCreateDAO mutation
       │
       ├─ 1. EAS アテステーション作成（クライアントサイド）
       │    └─ ethers.js Signer → EAS SDK → ブロックチェーン
       │
       └─ 2. API Route POST /api/daos（サーバーサイド）
            ├─ EAS アテステーション検証
            └─ Firebase メタデータ保存
```

### 3.3 ドキュメント登録フロー

```
DocumentRegisterForm (マルチステップ)
  │
  └─ useRegisterDocument mutation
       │
       ├─ Step 1: SHA-256 ハッシュ計算（クライアント）
       ├─ Step 2: IPFS アップロード（API Route /api/upload）
       ├─ Step 3: EAS アテステーション作成（クライアント、Signer必要）
       └─ Step 4: Firebase メタデータ保存（API Route）

       各ステップで onProgress コールバック → UI 進捗表示
```

### 3.4 投票ドキュメント登録フロー [NEW]

```
VotingDocumentForm (DocumentRegisterForm を拡張)
  │
  └─ useRegisterDocument mutation
       │
       ├─ Step 1: SHA-256 ハッシュ計算（クライアント）
       ├─ Step 2: IPFS アップロード（API Route /api/upload）
       ├─ Step 3: EAS アテステーション作成（クライアント、documentType = 'voting'）
       └─ Step 4: Firebase メタデータ保存（API Route）
            └─ 追加フィールド（Firebase のみ）:
                 ├─ txHash:          投票トランザクションハッシュ
                 ├─ txChainId:       投票が実行されたチェーンID
                 ├─ txBlockNumber:   ブロック番号（任意、自動取得可）
                 ├─ votingContract:  投票コントラクトアドレス（任意）
                 └─ proposalId:      投票提案ID（任意）

※ EAS スキーマは変更しない。TX紐付け情報は Firebase メタデータとして保存。
```

---

## 4. v1 → v2 改善マッピング

### 4.1 コード構造

| v1 の問題                              | v2 の解決策                                                |
| -------------------------------------- | ---------------------------------------------------------- |
| ページコンポーネントにロジック混在     | `app/` はルーティングのみ、ロジックは `features/`          |
| Context API（AuthContext, EasContext） | Zustand ストア + shared/lib/                               |
| クラスベース DAOService                | 関数ベース、依存注入可能                                   |
| easQuery.ts 911行                      | `eas/graphql.ts` + `eas/schema.ts` + `eas/types.ts` に分解 |

### 4.2 品質

| v1 の問題          | v2 の解決策                                       |
| ------------------ | ------------------------------------------------- |
| テストゼロ         | Vitest + RTL + MSW、カバレッジ 80%+               |
| CI/CD なし         | GitHub Actions（lint → typecheck → test → build） |
| 手動バリデーション | Zod スキーマ（フォーム + API 共用）               |
| ESLint 8           | ESLint 9 flat config                              |

### 4.3 認証

| v1 の問題                        | v2 の解決策             |
| -------------------------------- | ----------------------- |
| localStorage にユーザー情報保存  | Firebase Authentication |
| デモ認証（ハードコード資格情報） | 廃止                    |
| セッション管理なし               | Firebase Auth トークン  |

### 4.4 データ処理

| v1 の問題                      | v2 の解決策                          |
| ------------------------------ | ------------------------------------ |
| EAS パースに複数フォールバック | SDK バージョン固定、型安全デコーダー |
| Timestamp 変換の不整合         | `shared/utils/format.ts` に統一      |
| GraphQL 文字列ベース構築       | 型付きクエリヘルパー                 |

---

## 5. EAS クエリ最適化戦略

v1 では EAS GraphQL クエリに深刻なパフォーマンス問題がある。v2 では以下の戦略で解決する。

### 5.1 v1 の問題点

| 問題                   | 深刻度 | 詳細                                                     |
| ---------------------- | ------ | -------------------------------------------------------- |
| N+1 問題               | 致命的 | `daos/[id]` が1件取得のために全 DAO を取得してフィルター |
| キャッシュなし         | 致命的 | 同一データを毎レンダーで再取得、TanStack Query 未活用    |
| 個別 GraphQL コール    | 致命的 | DAO ごとにドキュメント取得の個別リクエスト発行           |
| クライアント側フィルタ | 高     | 全ドキュメント取得→ JS で daoAttestationUID フィルター   |
| Firebase 個別読み取り  | 高     | DAO 変換ごとに Firebase を個別呼び出し（N回）            |
| リクエスト重複         | 高     | 同一 `getAllDAOs()` が複数コンポーネントから重複実行     |

### 5.2 最適化方針

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
  const meta = await getDoc(doc(db, "daos", dao.id)); // N回
}

// v2: 1回のバッチ読み取り（Firestore の制限: 最大10件/バッチ）
import { documentId, where, getDocs, query } from "firebase/firestore";

async function batchGetDAOMetadata(
  daoIds: string[],
): Promise<Map<string, FirebaseDAOData>> {
  const results = new Map();
  // Firestore の `in` クエリは最大30件まで
  for (const chunk of chunkArray(daoIds, 30)) {
    const q = query(collection(db, "daos"), where(documentId(), "in", chunk));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((doc) => results.set(doc.id, doc.data()));
  }
  return results;
}
```

**実装場所:** `shared/lib/firebase/client.ts`

### 5.3 データ取得フロー比較

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

### 5.4 ディレクトリ構成への反映

```
shared/lib/eas/
  ├── client.ts       # EAS SDK 初期化
  ├── schema.ts       # スキーマ定義・エンコード/デコード
  ├── graphql.ts      # GraphQL クエリ実行 + バッチクエリ [OPT-02]
  ├── queries.ts      # 単一リソースクエリ定義 [OPT-01]
  └── types.ts        # EAS 固有型
```

---

## 6. 設定ファイル一覧

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

## 7. 環境変数

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
NEXT_PUBLIC_DOCUMENT_SCHEMA_UID=
NEXT_PUBLIC_EAS_GRAPHQL_ENDPOINT=

# IPFS
IPFS_API_KEY=                         # サーバーサイドのみ
IPFS_API_SECRET=                      # サーバーサイドのみ

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
