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
| ストレージ | Pinata (IPFS)           | latest     | ドキュメントファイル保存 |

**v1からの変更点**: Firebase Auth を正式採用（v1は localStorage ベース）

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

## 3. EAS スキーマ互換性

### 3.1 方針: v1 スキーマをそのまま再利用

v1 で Sepolia テストネットにデプロイ済みの EAS スキーマは **v2 でもそのまま使用**する。
EAS アテステーションはオンチェーンで不変であり、スキーマ変更は新規デプロイが必要になるため、
既存スキーマを維持し、追加データは Firebase メタデータで管理する。

### 3.2 スキーマ UID（Sepolia）

```
DAO スキーマ:
  UID: 0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1
  定義: "string daoUID, string daoName, address adminAddress"

Document スキーマ:
  UID: 0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152
  定義: "string daoAttestationUID, string documentTitle, string documentType,
         string documentVersion, string documentHash, string ipfsCID,
         string previousVersionUID"
```

### 3.3 v2 新機能のデータ配置

| 新機能             | EAS（不変）                                        | Firebase（可変）                                             |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------ |
| 投票ドキュメント   | documentType = `'voting'` として既存スキーマで作成 | txHash, txChainId, txBlockNumber, votingContract, proposalId |
| バージョン管理     | previousVersionUID（既にスキーマに存在）           | バージョン番号のキャッシュ                                   |
| ダッシュボード統計 | —                                                  | アテステーション数・アクティビティの集計キャッシュ           |
| メンバー管理 [P1]  | —                                                  | members[], roles[]                                           |

### 3.4 スキーマ設定の管理

```typescript
// config/chains.ts
export const CHAIN_CONFIG = {
  sepolia: {
    chainId: 11155111,
    easContractAddress: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
    schemaRegistryAddress: "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0",
    schemas: {
      dao: "0x087cc98cb9696a0b70363e43ac372f19db9da2ed6a84bbaf3b4b86b039c5f9e1",
      document:
        "0xbc9fcde5f231a0df136d1685c8d9c043c857ab7135b0b7ba0fe8c6567bcbc152",
    },
    graphqlEndpoint: "https://sepolia.easscan.org/graphql",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  // マルチチェーン対応時に追加（Post-Alpha）
} as const;
```

---

## 4. データフロー

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

## 5. v1 → v2 改善マッピング

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

## 6. EAS クエリ最適化戦略

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

| 失敗箇所              | 前ステップの状態    | 対応                                                          |
| --------------------- | ------------------- | ------------------------------------------------------------- |
| Step 1 (ハッシュ計算) | なし                | 即リトライ                                                    |
| Step 2 (IPFS)         | なし                | リトライ or フォールバック                                    |
| Step 3 (EAS TX)       | IPFS にファイルあり | 放置可（IPFS は自動 GC）、リトライ                            |
| Step 4 (Firebase)     | IPFS + EAS 済み     | **必ずリトライ**（EAS は不変、Firebase なしだとデータ不整合） |

---

## 11. API セキュリティ設計

### 11.1 API ルート認証要件

| エンドポイント   | メソッド | 認証          | 追加チェック                                                            |
| ---------------- | -------- | ------------- | ----------------------------------------------------------------------- |
| `/api/daos`      | GET      | 不要          | —                                                                       |
| `/api/daos`      | POST     | Firebase Auth | ウォレットアドレス検証（EAS アテステーション作成者 = リクエスト送信者） |
| `/api/daos/[id]` | GET      | 不要          | —                                                                       |
| `/api/daos/[id]` | PUT      | Firebase Auth | adminAddress 一致チェック                                               |
| `/api/daos/[id]` | DELETE   | Firebase Auth | adminAddress 一致チェック                                               |
| `/api/documents` | POST     | Firebase Auth | DAO 管理者 or editor ロール（P1）                                       |
| `/api/upload`    | POST     | Firebase Auth | ファイルサイズ 10MB 上限                                                |
| `/api/eas-proxy` | POST     | 不要          | レート制限のみ                                                          |

### 11.2 認証ミドルウェア

```typescript
// shared/lib/api-client.ts (サーバーサイド)
import { getAuth } from "firebase-admin/auth";

async function verifyAuth(request: NextRequest): Promise<DecodedIdToken> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization header required");
  }
  const token = authHeader.split("Bearer ")[1];
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

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DAOs: 誰でも読み取り可、認証済みユーザーのみ書き込み
    match /daos/{daoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
      // Note: adminAddress チェックは API Route 側で実施
    }

    // Documents: 誰でも読み取り可、認証済みユーザーのみ書き込み
    match /documents/{docId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

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

interface AuthActions {
  setUser: (user: AuthState["user"]) => void;
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
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      /* ... */
    }),
    {
      name: "wallet-store",
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
| EAS アテステーション（Document） | Sepolia ブロックチェーン | 〜200        | **移行不要**（同上）                                               |
| Firebase DAO メタデータ          | Firestore `daos/`        | 〜50         | **スキーマ検証 + 補完**                                            |
| Firebase Document メタデータ     | Firestore `documents/`   | 〜200        | **スキーマ検証 + 補完**                                            |
| IPFS ドキュメントファイル        | Pinata                   | 〜200        | **移行不要**（CID は不変、ゲートウェイ URL 統一のみ）              |
| ユーザーアカウント               | localStorage             | 少数         | **再作成**（Firebase Auth で新規登録を案内）                       |

### 14.2 移行が必要なもの

**Firebase メタデータの v2 スキーマ適合:**

v1 の Firebase データには v2 で追加されるフィールドが存在しない。
v2 の初回読み取り時にデフォルト値を補完する「遅延移行」方式を採用する。

```typescript
// shared/lib/firebase/types.ts
function normalizeDAOMetadata(raw: Record<string, unknown>): FirebaseDAOData {
  return {
    description: raw.description ?? "",
    location: raw.location ?? "",
    memberCount: raw.memberCount ?? 0,
    trustScore: raw.trustScore ?? 0,
    status: raw.status ?? "active",
    foundingDate: raw.foundingDate ?? null,
    logoUrl: raw.logoUrl ?? "",
    website: raw.website ?? "",
    contactEmail: raw.contactEmail ?? "",
    contactPerson: raw.contactPerson ?? "",
    documents: raw.documents ?? [],
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date(),
  };
}
```

### 14.3 移行が不要なもの

- **EAS アテステーション**: オンチェーンデータは不変。v2 は同じスキーマ UID で読み取るため、移行作業なし
- **IPFS ファイル**: CID ベースのアドレッシング。ゲートウェイ URL を `shared/lib/ipfs/gateway.ts` で統一管理
- **EAS スキーマ**: v1 と同一スキーマを再利用（§3 参照）

### 14.4 ユーザーアカウント移行

v1 は localStorage ベースの独自認証（デモ認証含む）。v2 は Firebase Auth に完全移行。

- **自動移行は行わない** — v1 のユーザーデータにパスワードハッシュ等がないため不可能
- v2 初回アクセス時にサインアップを案内
- ウォレットアドレスで既存 DAO の管理者であることは EAS データから自動的に紐付く

### 14.5 移行スケジュール

```
Phase 1: v2 デプロイ（v1 と並行稼働）
  - v2 は v1 と同じ Firebase プロジェクト・EAS スキーマを参照
  - 既存データは自動的に v2 から閲覧可能

Phase 2: v1 トラフィック移行
  - DNS を v2 に切替
  - v1 は読み取り専用で一定期間維持

Phase 3: v1 廃止
  - v1 のデプロイを停止
  - localStorage 依存コードを完全削除
```
