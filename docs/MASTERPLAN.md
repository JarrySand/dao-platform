# v2 実装マスタープラン

**作成日**: 2026-02-22
**対象バージョン**: v0.2.0-alpha
**参照**: [service-specification.md](./service-specification.md) | [architecture.md](./architecture.md) | [v2-requirements.md](./v2-requirements.md)

---

## 概要

v1（モノリシック構造、Context API、テストなし）から v2（Feature-Sliced Design、Zustand + TanStack Query、Vitest、80%+ カバレッジ）への全面リアーキテクチャ。

Agent Teams による並列実装を前提とし、依存関係を最小化したフェーズ構成とする。

---

## フェーズ構成と依存関係

```
Phase 0: Foundation ──→ Phase 1: Shared Layer ──→ Phase 2: Features ──→ Phase 3: Pages & API ──→ Phase 4: Polish
   (並列3チーム)           (並列4チーム)           (並列4チーム)          (並列4チーム)            (並列3チーム)
```

フェーズ間は前フェーズの完了が次フェーズの前提条件。各フェーズ内のチームは原則並列実行可能だが、一部フェーズ内依存が存在する（下記で明記）。

---

## Phase 0: Foundation & Infrastructure

> **目的**: プロジェクト基盤の刷新。ディレクトリ構造・依存関係・設定ファイルを v2 アーキテクチャに合わせる。
> **前提条件**: なし
> **並列チーム数**: 3

### Team 0-A: プロジェクト設定の刷新

**担当ファイル**: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `.prettierrc.json`, `postcss.config.mjs`, `tailwind.config.ts`

| #      | タスク                           | 詳細                                                                                                                                                                                                  | 参照           |
| ------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 0-A-1  | package.json 依存関係更新        | Next.js 15, React 19, Tailwind 4, Zustand 5, TanStack Query 5, React Hook Form 7, Zod 3, Radix UI, clsx + tailwind-merge, Vitest, RTL, MSW 2, husky, lint-staged, commitlint を追加。nft.storage 削除 | arch §1.1-1.6  |
| 0-A-2  | tsconfig.json 更新               | target: ES2022, module: ESNext, moduleResolution: bundler, paths: `@/*` → `./src/*` を維持                                                                                                            | arch §7        |
| 0-A-3  | ESLint 9 flat config             | `eslint.config.mjs` を ESLint 9 flat config に書き換え。Next.js + TypeScript + import order ルール                                                                                                    | arch §1.6      |
| 0-A-4  | Vitest 設定                      | `vitest.config.ts` 作成。パスエイリアス、RTL セットアップ、カバレッジ設定（80%閾値）                                                                                                                  | arch §2.3      |
| 0-A-5  | Prettier 設定                    | `.prettierrc.json` 作成（semi, singleQuote, tabWidth: 2, trailingComma: all）                                                                                                                         | arch §7        |
| 0-A-6  | Tailwind CSS 4 設定              | v1 `tailwind.config.js` → `tailwind.config.ts` にリネーム + v4 仕様に書き換え。CSS 変数ベースのカラートークン（Light/Dark）                                                                           | arch §1.3      |
| 0-A-7  | PostCSS 設定                     | v1 `postcss.config.js` 削除。`postcss.config.mjs` を Tailwind 4 + Lightning CSS 対応に更新                                                                                                            | arch §1.3      |
| 0-A-8  | husky + lint-staged + commitlint | Git hooks セットアップ。pre-commit: lint-staged（ESLint + Prettier）、commit-msg: Conventional Commits                                                                                                | arch §1.6      |
| 0-A-9  | next.config.ts 統合              | v1 `next.config.js` → `next.config.ts` にリネーム + Next.js 15 対応に書き換え。セキュリティヘッダー維持。バンドル分析設定                                                                             | arch §7, §11.6 |
| 0-A-10 | npm scripts 整備                 | `dev`, `build`, `lint`, `typecheck`, `test`, `test:coverage`, `format` を設定                                                                                                                         | -              |

**完了条件**: `npm install` → `npm run build` → `npm run lint` → `npm run typecheck` がすべて成功

---

### Team 0-B: Feature-Sliced Design ディレクトリ構造

**担当ファイル**: `src/` 配下のディレクトリ構造

| #     | タスク                       | 詳細                                                                                                                                                          | 参照      |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 0-B-1 | ディレクトリスキャフォールド | arch §2.2 のディレクトリ構造を完全に作成。各ディレクトリに `index.ts`（バレルエクスポート）を配置                                                             | arch §2.2 |
| 0-B-2 | `src/features/` 作成         | `dao/`, `document/`, `auth/`, `wallet/`, `dashboard/` の各 feature ディレクトリ。内部に `api/`, `components/`, `hooks/`, `stores/`, `types/`, `utils/` を配置 | arch §2.2 |
| 0-B-3 | `src/shared/` 作成           | `components/ui/`, `components/layout/`, `components/feedback/`, `hooks/`, `utils/`, `types/`, `constants/`, `lib/`, `providers/`                              | arch §2.2 |
| 0-B-4 | `src/config/` 作成           | `env.ts`, `chains.ts` のスタブファイル                                                                                                                        | arch §2.2 |
| 0-B-5 | `src/app/` Route Group 構造  | `(public)/` と `(auth)/` Route Group の作成。既存ページファイルの移動                                                                                         | arch §2.2 |
| 0-B-6 | テストディレクトリ構造       | 各 feature 内に `__tests__/`、`src/__tests__/integration/` を作成                                                                                             | arch §2.3 |

**完了条件**: 全ディレクトリが存在し、バレルエクスポートが正しくインポート可能

---

### Team 0-C: EAS Document v3 スキーマデプロイ [完了]

**担当ファイル**: `scripts/setup-schemas.js`, `src/config/chains.ts`

| #     | タスク                          | 詳細                                                                                                                                                                                                                                                   | 参照             |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 0-C-1 | `config/chains.ts` 作成         | CHAIN_CONFIG オブジェクト。DAO スキーマ UID（v1 維持）、Document v3 UID（デプロイ済み）、v1/v2 UID（読み取り専用）、GraphQL エンドポイント、Explorer URL                                                                                               | arch §3.5        |
| 0-C-2 | `scripts/setup-schemas.js` 更新 | Document v3 スキーマ定義でデプロイするスクリプト。`bytes32 daoAttestationUID, string documentTitle, string documentType, bytes32 documentHash, string ipfsCid, bytes32 previousVersionId, bytes32 votingTxHash, uint256 votingChainId`（version 削除） | arch §3.2, §14.6 |
| 0-C-3 | スキーマデプロイ実行            | Sepolia にデプロイ済み → UID: `0xc1c9b4dc...` → `config/chains.ts` と `.env` に反映済み                                                                                                                                                                | arch §14.6       |
| 0-C-4 | `.env.example` 更新             | v3 環境変数: `NEXT_PUBLIC_DOCUMENT_V3_SCHEMA_UID`                                                                                                                                                                                                      | arch §8          |
| 0-C-5 | `config/env.ts` 作成            | Zod による環境変数バリデーション。サーバー/クライアント変数の分離                                                                                                                                                                                      | arch §8          |

**完了条件**: Document v3 スキーマが Sepolia にデプロイ済み。easscan.org で確認可能。 ✅

---

## Phase 1: Shared Layer

> **目的**: 全 feature が依存する共通モジュールの実装。
> **前提条件**: Phase 0 完了
> **並列チーム数**: 4
>
> **フェーズ内依存関係**:
>
> - Team 1-A, 1-B, 1-C は完全に並列実行可能
> - Team 1-D は 1-B（Navbar, LoadingSpinner, ErrorDisplay, EmptyState）と 1-C（routes 定数）に依存
> - **推奨実行順**: 1-A/1-B/1-C を並列開始 → 1-D は 1-D-1〜1-D-5（プロバイダー・CSS）を先行実行し、1-D-6〜1-D-10（レイアウト・エラーページ）は 1-B/1-C 完了後に実行

### Team 1-A: 外部サービス連携ライブラリ (`shared/lib/`)

| #         | タスク                            | 詳細                                                                                                                                            | 参照                   |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1-A-1     | `shared/lib/firebase/client.ts`   | Firestore クライアント初期化。v1 `services/firebase.ts` からリファクタ。モジュラーインポート                                                    | arch §1.5              |
| 1-A-2     | `shared/lib/firebase/admin.ts`    | Firebase Admin SDK 初期化（サーバーサイド専用）。環境変数から認証情報取得                                                                       | arch §1.5, §9          |
| ~~1-A-3~~ | ~~`shared/lib/firebase/auth.ts`~~ | ~~Firebase Auth ヘルパー~~ **廃止: ウォレット認証に移行済み**                                                                                   | —                      |
| 1-A-4     | `shared/lib/firebase/types.ts`    | `FirebaseDAOData`, `FirebaseDocumentData` 型定義。`normalizeDAOMetadata()` 遅延移行関数                                                         | arch §3.4, §14.3       |
| 1-A-5     | `shared/lib/eas/client.ts`        | EAS SDK 初期化。ethers.js v6 BrowserProvider → Signer → EAS インスタンス                                                                        | arch §1.4              |
| 1-A-6     | `shared/lib/eas/schema.ts`        | v1/v2 スキーマのエンコード/デコード。v1→v2 変換レイヤー（documentType="unknown", votingTxHash="0x0"）。v1 `utils/easSchema.ts` からリファクタ   | arch §3.2, §3.5        |
| 1-A-7     | `shared/lib/eas/graphql.ts`       | GraphQL クエリ実行。バッチクエリ `executeBatchQuery()`。v1+v2 統合クエリ（エイリアス方式）。v1 `utils/easQuery.ts` から分解                     | arch §6.2 OPT-02, §3.5 |
| 1-A-8     | `shared/lib/eas/queries.ts`       | 単一リソースクエリ: `getDAOByUID()`, `getDocumentByUID()`, `getDocumentsByDAO()`。`filterByDAOUID()` 偽陽性フィルター                           | arch §6.2 OPT-01, §6.7 |
| 1-A-9     | `shared/lib/eas/types.ts`         | EAS 固有型: `EASAttestation`, `DecodedDAOData`, `DecodedDocumentData`, `SchemaVersion`                                                          | arch §3.2              |
| 1-A-10    | `shared/lib/ipfs/client.ts`       | Pinata アップロード/ダウンロード。w3up-client フォールバック。10MB 上限、リトライ 2回、指数バックオフ。v1 `utils/ipfsStorage.ts` からリファクタ | arch §1.5              |
| 1-A-11    | `shared/lib/ipfs/gateway.ts`      | ゲートウェイ URL 生成: `https://gateway.pinata.cloud/ipfs/{CID}`                                                                                | arch §1.5              |
| 1-A-12    | `shared/lib/api-client.ts`        | HTTP クライアント。リトライ・エラー処理。シンプルな fetch ラッパー（認証ヘッダー不要）                                                          | arch §11.2             |
| 1-A-13    | `shared/lib/query-client.ts`      | TanStack Query 設定。staleTime/gcTime のデフォルト値                                                                                            | arch §6.2 OPT-03       |
| 1-A-14    | `shared/lib/wallet/verify.ts`     | EIP-191 署名ベースのウォレット所有権検証。`verifyWalletOwnership()`                                                                             | arch §9.5              |
| 1-A-15    | `shared/lib/cors.ts`              | CORS 設定。`ALLOWED_ORIGINS`, `setCorsHeaders()`                                                                                                | arch §11.6             |
| 1-A-16    | Firebase バッチ読み取り           | `shared/lib/firebase/client.ts` に `batchGetDAOMetadata()` 実装。Firestore `in` クエリ（最大30件/バッチ）。`chunkArray()` ユーティリティ含む    | arch §6.2 OPT-05       |

**完了条件**: 各モジュールの単体テスト作成。インポートが正常に解決される。

---

### Team 1-B: UI プリミティブコンポーネント (`shared/components/`)

| #      | タスク                                          | 詳細                                                                                                        | 参照           |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------- |
| 1-B-1  | `shared/utils/cn.ts`                            | `clsx` + `tailwind-merge` のユーティリティ関数                                                              | arch §1.3      |
| 1-B-2  | `shared/components/ui/Button.tsx`               | バリアント: primary, secondary, outline, ghost, danger。サイズ: sm, md, lg。ローディング状態。disabled 状態 | req §FR-UI-02  |
| 1-B-3  | `shared/components/ui/Card.tsx`                 | ヘッダー・ボディ・フッター構成。ホバー・クリック可能バリアント                                              | -              |
| 1-B-4  | `shared/components/ui/Input.tsx`                | ラベル・エラーメッセージ・ヘルパーテキスト。React Hook Form 互換 `forwardRef`                               | -              |
| 1-B-5  | `shared/components/ui/Modal.tsx`                | Radix Dialog ベース。フォーカストラップ。ESC 閉じ。オーバーレイ。アニメーション                             | req §FR-UI-04  |
| 1-B-6  | `shared/components/ui/Select.tsx`               | Radix Select ベース。オプション検索。ラベル・エラー表示                                                     | -              |
| 1-B-7  | `shared/components/ui/Alert.tsx`                | バリアント: info, success, warning, error。アイコン付き。閉じるボタン                                       | -              |
| 1-B-8  | `shared/components/ui/Badge.tsx`                | バリアント: default, success, warning, error, outline。サイズ: sm, md                                       | -              |
| 1-B-9  | `shared/components/ui/Skeleton.tsx`             | 矩形・円形・テキスト行のスケルトンバリアント。アニメーション                                                | req §FR-DAO-01 |
| 1-B-10 | `shared/components/ui/Table.tsx`                | ヘッダー・ボディ・行・セル。ソート可能カラム。レスポンシブ（モバイルではカード表示）                        | -              |
| 1-B-11 | `shared/components/ui/Tabs.tsx`                 | Radix Tabs ベース。キーボードナビゲーション                                                                 | req §FR-DAO-06 |
| 1-B-12 | `shared/components/ui/Toast.tsx`                | Radix Toast ベース。位置: 右下。自動消去: 5秒。バリアント: success, error, info                             | req §FR-UI-04  |
| 1-B-13 | `shared/components/layout/Navbar.tsx`           | v1 `Navbar.tsx` をリファクタ。ダークモードトグル追加。モバイルハンバーガーメニュー。認証/ウォレット状態表示 | req §FR-UI-01  |
| 1-B-14 | `shared/components/layout/Footer.tsx`           | サイトフッター。著作権表示、リンク                                                                          | -              |
| 1-B-15 | `shared/components/layout/Breadcrumb.tsx`       | パンくずリスト。ルート定数から自動生成                                                                      | -              |
| 1-B-16 | `shared/components/layout/PageHeader.tsx`       | ページタイトル + 説明 + アクションボタン                                                                    | -              |
| 1-B-17 | `shared/components/feedback/LoadingSpinner.tsx` | サイズバリアント。センタリングオプション                                                                    | -              |
| 1-B-18 | `shared/components/feedback/ErrorDisplay.tsx`   | エラーメッセージ + リトライボタン                                                                           | -              |
| 1-B-19 | `shared/components/feedback/EmptyState.tsx`     | アイコン + メッセージ + アクションボタン                                                                    | -              |

**完了条件**: 全コンポーネントが Tailwind CSS 4 + ダークモード対応。`shared/components/ui/index.ts` からエクスポート。

---

### Team 1-C: 共通ユーティリティ・型定義・定数

| #      | タスク                               | 詳細                                                                                                                                   | 参照           |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1-C-1  | `shared/types/common.ts`             | `BaseEntity`, `PaginationParams`, `PaginatedResponse`, `Sort`, `Filter`                                                                | arch §6.5      |
| 1-C-2  | `shared/types/api.ts`                | `ApiResponse<T>`, `ApiErrorResponse`, ステータスコード定数                                                                             | arch §11.1     |
| 1-C-3  | `shared/types/window.d.ts`           | `EthereumProvider` グローバル型（MetaMask `window.ethereum`）                                                                          | arch §2.2      |
| 1-C-4  | `shared/utils/format.ts`             | アドレス短縮表示 `0x1234...5678`、日付フォーマット、数値カンマ区切り、ファイルサイズ表示。v1 `utils/formatTimestamp.ts` からリファクタ | arch §5.1      |
| 1-C-5  | `shared/utils/validation.ts`         | UID 検証 `isValidUID()`, アドレス検証 `isValidAddress()`, Zod 共通スキーマ                                                             | arch §11.3     |
| 1-C-6  | `shared/utils/logger.ts`             | 構造化ログ。dev/prod で出力レベル制御                                                                                                  | arch §2.2      |
| 1-C-7  | `shared/utils/fileHash.ts`           | SHA-256 ハッシュ計算。v1 `utils/fileHash.ts` から移動                                                                                  | arch §2.2      |
| 1-C-8  | `shared/constants/routes.ts`         | 全ルートパス定数: `ROUTES.HOME`, `ROUTES.DAOS`, `ROUTES.DAO_DETAIL(id)`, `ROUTES.MY_DAO(id)` 等                                        | arch §2.2      |
| 1-C-9  | `shared/constants/config.ts`         | アプリ設定定数: ファイルサイズ上限、対応 MIME タイプ、ページサイズデフォルト、タイムアウト値                                           | spec §6        |
| 1-C-10 | `shared/hooks/useDebounce.ts`        | デバウンスフック（検索入力用）                                                                                                         | arch §2.2      |
| 1-C-11 | `shared/hooks/useLocalStorage.ts`    | localStorage フック（SSR 安全）                                                                                                        | arch §2.2      |
| 1-C-12 | `shared/hooks/useMediaQuery.ts`      | メディアクエリフック（レスポンシブ判定）                                                                                               | req §3.5       |
| 1-C-13 | `shared/hooks/useCopyToClipboard.ts` | クリップボードコピー + Toast 通知                                                                                                      | req §FR-DAO-02 |
| 1-C-14 | `shared/hooks/useScrollLock.ts`      | モーダル表示時のスクロールロック                                                                                                       | -              |
| 1-C-15 | `shared/hooks/useHydration.ts`       | SSR ハイドレーション対策フック                                                                                                         | arch §12.2     |

**完了条件**: 全ユーティリティの単体テスト作成。TypeScript strict mode パス。

---

### Team 1-D: プロバイダー・グローバルレイアウト

| #      | タスク                               | 詳細                                                                                               | 参照            |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------- |
| 1-D-1  | `shared/providers/QueryProvider.tsx` | TanStack Query の `QueryClientProvider` ラッパー                                                   | arch §2.2       |
| 1-D-2  | `shared/providers/ThemeProvider.tsx` | ダークモード管理。`prefers-color-scheme` 初期値、`localStorage` 永続化、`<html class="dark">` 切替 | arch §1.3       |
| 1-D-3  | `shared/providers/AppProviders.tsx`  | QueryProvider + ThemeProvider の合成プロバイダー                                                   | arch §2.2       |
| 1-D-4  | `app/layout.tsx` 更新                | AppProviders でラップ。globals.css インポート。フォント設定。FOUC 防止 `<script>`                  | arch §1.3       |
| 1-D-5  | `app/globals.css` 更新               | Tailwind 4 の `@theme` ディレクティブ。CSS 変数 `--color-*` で Light/Dark カラートークン定義       | arch §1.3       |
| 1-D-6  | `app/(public)/layout.tsx`            | 公開ページ共通レイアウト（Navbar + Footer）                                                        | arch §2.2       |
| 1-D-7  | `app/(auth)/layout.tsx`              | 認証チェック付きレイアウト。AuthGuard でラップ                                                     | arch §2.2, §9.4 |
| 1-D-8  | `app/error.tsx` 更新                 | グローバルエラーバウンダリ。ErrorDisplay コンポーネント使用                                        | req §FR-UI-04   |
| 1-D-9  | `app/not-found.tsx` 更新             | 404 ページ。EmptyState コンポーネント使用                                                          | req §FR-UI-04   |
| 1-D-10 | `app/loading.tsx` 更新               | グローバルローディング。LoadingSpinner 使用                                                        | -               |

**完了条件**: `npm run dev` でアプリが起動。ダークモードトグルが動作。Route Group のレイアウトが正しく適用。

---

## Phase 2: Feature Modules

> **目的**: 各機能のビジネスロジック（API クライアント、フック、ストア、型定義）を実装。UI コンポーネントは Phase 3 で実装。
> **前提条件**: Phase 1 完了
> **並列チーム数**: 4

### Team 2-A: Auth Feature (`features/auth/`)

| #     | タスク                                   | 詳細                                                                                                            | 参照                       |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2-A-1 | `features/auth/stores/authStore.ts`      | walletStore のアドレスを参照するシンプルなヘルパー。認証 = ウォレット接続                                       | arch §12.1                 |
| 2-A-2 | `features/auth/hooks/useAuth.ts`         | walletStore のセレクターフック。`useAuth()` → `{ address, isAuthenticated, isConnecting, connect, disconnect }` | arch §12.1                 |
| 2-A-3 | `features/auth/components/AuthGuard.tsx` | 認証ガード。ウォレット未接続時に「ウォレットを接続してください」UIをインライン表示。WalletConnectButton を表示  | arch §9.4, req §FR-AUTH-04 |

**完了条件**: ウォレット接続 → 保護ページアクセス → ウォレット切断で認証ガード表示、の一連のフローが動作。

---

### Team 2-B: Wallet Feature (`features/wallet/`)

| #     | タスク                                               | 詳細                                                                                                                                                             | 参照                       |
| ----- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2-B-1 | `features/wallet/stores/walletStore.ts`              | Zustand + persist。`WalletState` + `WalletActions`。`connect()`, `disconnect()`, `switchChain()`, `setupListeners()`。`partialize` で address/chainId のみ永続化 | arch §12.1, §12.2          |
| 2-B-2 | `features/wallet/hooks/useWallet.ts`                 | walletStore のセレクターフック。`useWallet()` → `{ address, chainId, isConnecting, connect, disconnect }`                                                        | arch §12.1                 |
| 2-B-3 | `features/wallet/hooks/useNetwork.ts`                | ネットワーク状態管理。Sepolia チェーン ID 確認。不正ネットワーク時の警告フラグ                                                                                   | req §FR-AUTH-03            |
| 2-B-4 | `features/wallet/hooks/useWalletSignature.ts`        | EIP-191 署名フロー。`signVerification(address)` → `WalletVerification`                                                                                           | arch §9.5                  |
| 2-B-5 | `features/wallet/components/WalletConnectButton.tsx` | 接続/切断ボタン。アドレス短縮表示。`next/dynamic` SSR false で遅延ロード                                                                                         | arch §1.7, req §FR-AUTH-02 |
| 2-B-6 | `features/wallet/components/WalletInfo.tsx`          | 接続中ウォレット情報表示。アドレス、チェーン名、ETH 残高                                                                                                         | -                          |
| 2-B-7 | `features/wallet/components/NetworkSwitcher.tsx`     | 不正ネットワーク警告 UI。「Sepolia に切替」ボタン                                                                                                                | req §FR-AUTH-03            |
| 2-B-8 | テスト: walletStore                                  | ストアの単体テスト。接続/切断/チェーン切替のシナリオ                                                                                                             | -                          |

**完了条件**: MetaMask 接続 → Sepolia 自動切替 → アドレス表示 → アカウント変更検知が動作。

---

### Team 2-C: DAO Feature (`features/dao/`)

| #      | タスク                                   | 詳細                                                                                                               | 参照                             |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| 2-C-1  | `features/dao/types/index.ts`            | `DAO`, `DAOFormData`, `CreateDAOSchema`（Zod）, `UpdateDAOSchema`（Zod）                                           | arch §11.3, req §FR-DAO-03       |
| 2-C-2  | `features/dao/api/daoApi.ts`             | API クライアント関数: `fetchDAOs()`, `fetchDAO(id)`, `createDAO(data)`, `updateDAO(id, data)`, `deactivateDAO(id)` | arch §4.1, §4.2, §4.6            |
| 2-C-3  | `features/dao/hooks/useDAOs.ts`          | TanStack Query。DAO 一覧取得。検索・フィルター・ページネーション対応。staleTime: 60s                               | arch §6.2 OPT-03, req §FR-DAO-01 |
| 2-C-4  | `features/dao/hooks/useDAO.ts`           | TanStack Query。UID 指定の単一 DAO 取得。EAS + Firebase 統合                                                       | arch §6.2 OPT-01, req §FR-DAO-02 |
| 2-C-5  | `features/dao/hooks/useMyDAOs.ts`        | TanStack Query。接続ウォレットの管理 DAO。ウォレット変更時に invalidate                                            | req §FR-DAO-05                   |
| 2-C-6  | `features/dao/hooks/useCreateDAO.ts`     | TanStack Mutation。3ステップウィザード: EAS アテステーション作成 → Firebase メタデータ保存。進捗コールバック       | arch §4.2, req §FR-DAO-03        |
| 2-C-7  | `features/dao/hooks/useUpdateDAO.ts`     | TanStack Mutation。Firebase メタデータ更新。EIP-191 署名検証付き                                                   | req §FR-DAO-04                   |
| 2-C-8  | `features/dao/hooks/useDeactivateDAO.ts` | TanStack Mutation。確認ダイアログ → Firebase status: "inactive"。EIP-191 署名検証付き                              | arch §4.6, req §FR-DAO-07        |
| 2-C-9  | `features/dao/utils/daoService.ts`       | DAO ビジネスロジック。v1 クラスベース → 関数ベースにリファクタ。EAS データ + Firebase メタデータの統合             | arch §5.1                        |
| 2-C-10 | テスト: daoApi, useDAOs                  | API クライアント + フックのテスト。MSW モック使用                                                                  | -                                |

**完了条件**: DAO CRUD（一覧・詳細・作成・編集・非活性化）のビジネスロジックが完成。

---

### Team 2-D: Document Feature (`features/document/`)

| #      | タスク                                            | 詳細                                                                                                                                                                                                                                                      | 参照                                         |
| ------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 2-D-1  | `features/document/types/index.ts`                | `Document`, `DocumentType`(articles/assembly_rules/operation_rules/token_rules/custom_rules/proposal/minutes), `RegisterDocumentFormData`, `registerDocumentSchema`（Zod）, `ProposalDocumentFields`. `RegulationType`/`OtherDocumentType` ヘルパー型含む | arch §3.2, spec §6, doc-categories           |
| 2-D-2  | `features/document/api/documentApi.ts`            | API クライアント: `fetchDocuments(daoId, filters)`, `fetchDocument(id)`, `registerDocument(data)`, `revokeDocument(id)`                                                                                                                                   | arch §4.3, §4.5                              |
| 2-D-3  | `features/document/hooks/useDocuments.ts`         | TanStack Query。DAO 別ドキュメント一覧。タイプ別フィルター。ステータスフィルター。txHash 検索                                                                                                                                                             | req §FR-DOC-02, §FR-VDOC-03                  |
| 2-D-4  | `features/document/hooks/useDocument.ts`          | TanStack Query。単一ドキュメント取得（バージョンチェーン情報含む）                                                                                                                                                                                        | arch §6.6                                    |
| 2-D-5  | `features/document/hooks/useRegisterDocument.ts`  | TanStack Mutation。4ステップ: ハッシュ計算 → IPFS アップロード → EAS v3 アテステーション → Firebase 同期。proposal 選択時は votingTxHash/votingChainId を含む。v3 では version フィールドなし                                                             | arch §4.3, §4.4, req §FR-DOC-01, §FR-VDOC-01 |
| 2-D-6  | `features/document/hooks/useRevokeDocument.ts`    | TanStack Mutation。EAS revoke → Firebase ステータス更新。リトライ対応                                                                                                                                                                                     | arch §4.5, req §FR-DOC-04                    |
| 2-D-7  | `features/document/hooks/useDocumentVersions.ts`  | バージョンチェーン取得。`previousVersionId` を再帰的に辿る（上限 20）。TanStack Query キャッシュ staleTime: 5min                                                                                                                                          | arch §6.6, req §FR-VER-01                    |
| 2-D-8  | `features/document/hooks/useTransactionInfo.ts`   | 投票 TX 情報取得。txHash + chainId → Etherscan API でブロック番号・タイムスタンプ取得                                                                                                                                                                     | req §FR-VDOC-02                              |
| 2-D-9  | `features/document/utils/documentService.ts`      | ドキュメント登録フロー。v1 からリファクタ。SHA-256 + IPFS + EAS + Firebase の順序制御                                                                                                                                                                     | arch §4.3                                    |
| 2-D-10 | `features/document/utils/documentQueryService.ts` | ドキュメントクエリ。v1+v2 スキーマ統合。v1 からリファクタ                                                                                                                                                                                                 | arch §3.5, §6.2                              |
| 2-D-11 | テスト: documentApi, useDocuments                 | API クライアント + フックのテスト。MSW モック使用                                                                                                                                                                                                         | -                                            |

**完了条件**: ドキュメント登録（通常 + 投票）、一覧、検証、失効、バージョンチェーンのビジネスロジックが完成。

---

## Phase 3: Pages, API Routes & Feature Components

> **目的**: ページ・API ルート・UI コンポーネントの実装。Phase 2 のフック・ロジックを使って画面を構成する。
> **前提条件**: Phase 2 完了
> **並列チーム数**: 4
>
> **フェーズ内依存関係**:
>
> - Team 3-A（API Routes）は他チームに依存しない — 最優先で着手
> - Team 3-B/3-C/3-D のページは 3-A の API ルートを呼び出すため、3-A の該当ルート完了後に結合
> - **推奨実行順**: 3-A を先行開始 → 3-B/3-C/3-D はコンポーネント実装を並列開始し、API 結合は 3-A 完了後

### Team 3-A: API Routes

| #      | タスク                                              | 詳細                                                                                                                                                           | 参照                              |
| ------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 3-A-1  | `app/api/daos/route.ts` (GET) **[リファクタ]**      | v1 既存ルートを v2 仕様に書き換え。Zod バリデーション追加。EAS バッチクエリ + Firebase バッチ読み取り（1-A-16）。カーソルベースページネーション。v1 実装は削除 | arch §6.2, §6.5, §11.1            |
| 3-A-2  | `app/api/daos/route.ts` (POST) **[リファクタ]**     | v1 既存ルートを v2 仕様に書き換え。Firebase Auth トークン検証追加。EAS attester 検証。Firebase メタデータ保存                                                  | arch §4.2, §11.1                  |
| 3-A-3  | `app/api/daos/[id]/route.ts` (GET) **[リファクタ]** | v1 既存ルートを v2 仕様に書き換え。UID 指定の単一リソースクエリ（v1 の全件取得→フィルター方式を廃止）。EAS + Firebase 統合                                     | arch §6.2 OPT-01, §11.1           |
| 3-A-4  | `app/api/daos/[id]/route.ts` (PUT) **[リファクタ]** | v1 既存ルートを v2 仕様に書き換え。Firebase Auth + EIP-191 署名検証 + adminAddress 一致チェック追加                                                            | arch §4.6, §9.5, §11.1            |
| 3-A-5  | `app/api/documents/route.ts` (GET) **[新規]**       | ドキュメント一覧。`daoId`（必須）, `type`, `status`, `txHash`, `cursor`, `limit`。v1+v2 統合クエリ                                                             | arch §3.5, §11.1, req §FR-VDOC-03 |
| 3-A-6  | `app/api/documents/route.ts` (POST) **[新規]**      | ドキュメント登録。Firebase Auth + EAS attester 検証 + DAO 管理者チェック                                                                                       | arch §4.3, §11.1                  |
| 3-A-7  | `app/api/documents/[id]/route.ts` (GET) **[新規]**  | ドキュメント詳細。バージョンチェーン情報含む                                                                                                                   | arch §6.6, §11.1                  |
| 3-A-8  | `app/api/documents/[id]/route.ts` (PUT) **[新規]**  | ドキュメント失効（revoke）。Firebase Auth + EIP-191 署名 + adminAddress 一致                                                                                   | arch §4.5, §11.1                  |
| 3-A-9  | `app/api/upload/route.ts` **[リファクタ]**          | v1 既存ルートを v2 仕様に書き換え。Firebase Auth 認証追加。10MB 上限、MIME タイプ検証。Pinata → w3up フォールバック                                            | arch §10.1, §11.1                 |
| 3-A-10 | `app/api/eas-proxy/route.ts` **[リファクタ]**       | v1 既存ルートを v2 仕様に書き換え。サーバーサイドキャッシュ（30s）追加。レート制限（30 req/min/IP）                                                            | arch §6.2 OPT-04, §11.4           |
| 3-A-11 | `app/api/stats/route.ts` **[新規]**                 | 統計。EAS aggregateAttestation で DAO 数 + Document v1/v2 数をバッチ取得。サーバーサイドキャッシュ 60s                                                         | arch §4.1.1, §11.1                |
| 3-A-12 | `app/api/activity/route.ts` **[新規]**              | アクティビティ。Firebase Auth 認証。直近アテステーション一覧。時系列ソート。limit: 20                                                                          | arch §4.7, §11.1                  |
| 3-A-13 | API レート制限ミドルウェア                          | `Map<IP, {count, resetTime}>` インメモリレート制限                                                                                                             | arch §11.4                        |
| 3-A-14 | テスト: API Routes                                  | 各ルートの統合テスト。認証あり/なし、バリデーションエラー、正常系                                                                                              | -                                 |

**完了条件**: 全 API ルートが動作。Zod バリデーション・認証・認可が正しく機能。

---

### Team 3-B: 公開ページ & DAO コンポーネント

| #     | タスク                                  | 詳細                                                                                                                    | 参照                        |
| ----- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 3-B-1 | `features/dao/components/DAOCard.tsx`   | DAO 名、説明（truncate）、文書数、ステータスバッジ、設立日。ホバー効果。レスポンシブ                                    | req §FR-DAO-01              |
| 3-B-2 | `features/dao/components/DAOList.tsx`   | DAOCard のグリッド表示。検索バー（useDebounce）。ステータスフィルター。ページネーション。スケルトンローディング。空状態 | req §FR-DAO-01              |
| 3-B-3 | `features/dao/components/DAODetail.tsx` | EAS + Firebase 統合データ表示。UID コピー機能。紐付きドキュメント一覧。管理者アドレス表示                               | req §FR-DAO-02              |
| 3-B-4 | `features/dao/components/DAOStats.tsx`  | 統計カード（管理 DAO 数、ドキュメント数）。Home ページ用                                                                | req §FR-UI-05               |
| 3-B-5 | `app/(public)/page.tsx`                 | Home ページ。ヒーローセクション + 統計表示 + 機能紹介 + CTA。Server Component で統計取得                                | req §FR-UI-05, arch §4.1.1  |
| 3-B-6 | `app/(public)/daos/page.tsx`            | DAO 一覧ページ。DAOList コンポーネント使用                                                                              | req §FR-DAO-01              |
| 3-B-7 | `app/(public)/daos/[id]/page.tsx`       | DAO 詳細ページ。DAODetail + DocumentList。投票ドキュメントフィルター                                                    | req §FR-DAO-02, §FR-VDOC-03 |
| 3-B-8 | `app/(public)/daos/loading.tsx`         | DAO ページ用ローディング UI                                                                                             | -                           |
| 3-B-9 | テスト: DAOCard, DAOList                | RTL でのコンポーネントテスト                                                                                            | -                           |

**完了条件**: Home → DAO 一覧 → DAO 詳細の閲覧フローが完全に動作。レスポンシブ対応。

---

### Team 3-C: ドキュメントコンポーネント

| #     | タスク                                                  | 詳細                                                                                                                                                        | 参照                        |
| ----- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 3-C-1 | `features/document/components/DocumentCard.tsx`         | タイトル、タイプバッジ、バージョン、登録日、ステータス（active/revoked）。IPFS ダウンロードリンク。投票ドキュメント: TX サマリー付き                        | req §FR-DOC-02, §FR-VDOC-03 |
| 3-C-2 | `features/document/components/DocumentList.tsx`         | DocumentCard のリスト表示。タイプ別フィルター。ステータスフィルター。txHash 検索。管理者のみ「失効」ボタン                                                  | req §FR-DOC-02, §FR-VDOC-03 |
| 3-C-3 | `features/document/components/DocumentRegisterForm.tsx` | マルチステップウィザード。タイトル・タイプ・バージョン・ファイル入力。voting 選択時に votingTxHash/votingChainId 条件表示。進捗バー（0-100%）。Gas 見積もり | req §FR-DOC-01, §FR-VDOC-01 |
| 3-C-4 | `features/document/components/DocumentVerifier.tsx`     | ファイルアップロード → ハッシュ計算 → オンチェーン照合。一致/不一致の結果表示。登録者・登録日・タイプ・CID 表示                                             | req §FR-DOC-03              |
| 3-C-5 | `features/document/components/FileUploader.tsx`         | D&D 対応。ファイルサイズ/タイプバリデーション。プレビュー                                                                                                   | req §FR-DOC-01              |
| 3-C-6 | `features/document/components/FileHashCalculator.tsx`   | SHA-256 ハッシュ計算 UI。計算中のプログレスバー                                                                                                             | -                           |
| 3-C-7 | テスト: DocumentRegisterForm, DocumentVerifier          | RTL でのコンポーネントテスト                                                                                                                                | -                           |

**完了条件**: ドキュメント登録・検証 UI が動作。

---

### Team 3-D: 管理ページ & 新機能コンポーネント

| #      | タスク                                                    | 詳細                                                                                                                                                               | 参照                       |
| ------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 3-D-1  | `features/dao/components/DAOCreateForm.tsx`               | 3ステップウィザード。Step1: 基本情報入力（RHF + Zod）。Step2: 確認・署名（Gas 見積もり）。Step3: 完了（UID 表示 + リダイレクト）                                   | req §FR-DAO-03             |
| 3-D-2  | `features/dao/components/DAOEditForm.tsx`                 | モーダルフォーム。編集可能フィールド: 説明、所在地、メンバー数、ロゴ URL、ウェブサイト、連絡先                                                                     | req §FR-DAO-04             |
| 3-D-3  | `features/document/components/DocumentVersionHistory.tsx` | バージョンチェーンのタイムライン表示。各バージョンの情報。最新バージョンハイライト                                                                                 | req §FR-VER-01             |
| 3-D-4  | `features/document/components/DocumentVersionCompare.tsx` | 2バージョン間のメタデータ比較。IPFS リンク並列表示。ハッシュ差異表示                                                                                               | req §FR-VER-02             |
| 3-D-5  | `features/document/components/TransactionInfo.tsx`        | 投票 TX 情報表示。txHash → Etherscan リンク。ブロック番号・タイムスタンプ                                                                                          | req §FR-VDOC-02            |
| 3-D-6  | `features/dashboard/components/StatsCards.tsx`            | 統計カード: 管理 DAO 数、ドキュメント数、直近 7/30 日の登録数、総アテステーション数                                                                                | req §FR-DASH-01            |
| 3-D-7  | `features/dashboard/components/RecentActivity.tsx`        | タイムライン形式。アテステーション作成/失効。DAO 名・ドキュメント名リンク                                                                                          | req §FR-DASH-02            |
| 3-D-8  | `features/dashboard/components/QuickActions.tsx`          | DAO 作成・ドキュメント登録・My DAO 一覧へのショートカット                                                                                                          | req §FR-DASH-03            |
| 3-D-9  | `features/dashboard/hooks/useStats.ts`                    | TanStack Query。`/api/stats` からの統計取得                                                                                                                        | arch §4.7                  |
| 3-D-10 | `features/dashboard/hooks/useRecentActivity.ts`           | TanStack Query。`/api/activity` からのアクティビティ取得                                                                                                           | arch §4.7                  |
| 3-D-11 | `app/(auth)/dashboard/page.tsx`                           | ダッシュボードページ。StatsCards + RecentActivity + QuickActions                                                                                                   | req §2.2                   |
| 3-D-12 | `app/(auth)/my-dao/page.tsx`                              | My DAO 一覧。ウォレット未接続案内。DAO 作成ショートカット。inactive DAO もラベル付き表示                                                                           | req §FR-DAO-05             |
| 3-D-13 | `app/(auth)/my-dao/create/page.tsx`                       | DAO 作成ウィザードページ。DAOCreateForm 配置                                                                                                                       | req §FR-DAO-03             |
| 3-D-14 | `app/(auth)/my-dao/[id]/page.tsx`                         | My DAO 管理。タブ: 基礎情報 + ドキュメント管理。DAO 編集。ドキュメント登録。非活性化ボタン。バージョン管理 UI。新バージョン登録ボタン（前バージョン UID 自動入力） | req §FR-DAO-06, §FR-VER-03 |
| 3-D-15 | テスト: DAOCreateForm, Dashboard                          | RTL でのコンポーネントテスト                                                                                                                                       | -                          |

**完了条件**: 管理者フロー（ダッシュボード → My DAO → DAO 作成 → ドキュメント管理 → バージョン管理）が完全に動作。

---

## Phase 4: Polish, Testing & CI/CD

> **目的**: 品質保証、パフォーマンス最適化、CI/CD 構築、ドキュメント整備。
> **前提条件**: Phase 3 完了
> **並列チーム数**: 3

### Team 4-A: テスト & 品質保証

| #     | タスク                   | 詳細                                                                               | 参照     |
| ----- | ------------------------ | ---------------------------------------------------------------------------------- | -------- |
| 4-A-1 | MSW ハンドラー定義       | 全 API ルートのモックハンドラー。正常系 + エラー系                                 | -        |
| 4-A-2 | shared/ ユニットテスト   | `utils/`, `hooks/`, `lib/` のテスト。カバレッジ目標: 90%+                          | req §3.2 |
| 4-A-3 | features/ ユニットテスト | 各 feature の `api/`, `hooks/`, `utils/`, `stores/` のテスト。カバレッジ目標: 80%+ | req §3.2 |
| 4-A-4 | コンポーネントテスト     | 主要コンポーネントの RTL テスト。ユーザーインタラクション、アクセシビリティ        | req §3.2 |
| 4-A-5 | 統合テスト               | `src/__tests__/integration/`: DAO CRUD フロー、ドキュメント登録フロー              | req §3.2 |
| 4-A-6 | カバレッジレポート       | Vitest カバレッジ設定。閾値: 80% 全体、90% shared/                                 | req §3.2 |
| 4-A-7 | TypeScript strict 確認   | `npx tsc --noEmit` ゼロエラー確認                                                  | req §3.2 |
| 4-A-8 | ESLint ゼロエラー確認    | `npm run lint` ゼロエラー確認                                                      | req §3.2 |

**完了条件**: テストカバレッジ 80%+。TypeScript + ESLint エラーゼロ。全テスト PASS。

---

### Team 4-B: パフォーマンス & レスポンシブ & アクセシビリティ

| #     | タスク                          | 詳細                                                                                                      | 参照                |
| ----- | ------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------- |
| 4-B-1 | バンドルサイズ最適化            | ethers.js / EAS SDK / RHF+Zod の `next/dynamic` 遅延ロード。Route Group によるバンドル分割確認            | arch §1.7           |
| 4-B-2 | Firebase SDK ツリーシェイキング | モジュラーインポート確認。不要モジュールの除去                                                            | arch §1.7           |
| 4-B-3 | レスポンシブデザイン確認        | 320px〜1920px の全ブレークポイントで表示確認。モバイルハンバーガーメニュー。タッチターゲット 44px+        | req §3.5            |
| 4-B-4 | ダークモード全ページ対応確認    | Light/Dark 切替で全ページ・全コンポーネントの表示確認。カラーコントラスト WCAG AA                         | req §FR-UI-03, §3.4 |
| 4-B-5 | アクセシビリティ                | ARIA ラベル・ロール設定。キーボードナビゲーション。フォーカストラップ（モーダル）。スクリーンリーダー対応 | req §3.4            |
| 4-B-6 | Lighthouse 検証                 | Performance 80+, Accessibility 90+, First Load JS 200KB 以下の確認                                        | req §3.1, §3.4      |
| 4-B-7 | 画像最適化                      | next/image の適切な使用。WebP/AVIF フォーマット。遅延ロード                                               | -                   |

**完了条件**: Lighthouse Performance 80+, Accessibility 90+。First Load JS 200KB 以下。全ブレークポイントで正常表示。

---

### Team 4-C: CI/CD & ドキュメント

| #      | タスク                       | 詳細                                                                                                                                                                                                                      | 参照                        |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 4-C-1  | `.github/workflows/ci.yml`   | CI パイプライン: `lint → typecheck → test --coverage → build`。push to main + PR to main トリガー                                                                                                                         | arch §13.3, req §3.6        |
| 4-C-2  | Vercel デプロイ設定          | PR ごとのプレビューデプロイ。タグプッシュで本番デプロイ。環境変数設定                                                                                                                                                     | arch §13.1, §13.2, req §3.6 |
| 4-C-3  | Firestore セキュリティルール | `firestore.rules` ファイル。読み取り: 全許可、書き込み: 全拒否（Admin SDK バイパス）                                                                                                                                      | arch §11.5                  |
| 4-C-4  | `README.md` 更新             | プロジェクト概要、セットアップ手順、使い方、技術スタック、コントリビューション方法                                                                                                                                        | req §3.7                    |
| 4-C-5  | `CONTRIBUTING.md` 作成       | コーディング規約、PR プロセス、テスト方法、コミットメッセージ規約                                                                                                                                                         | req §3.7                    |
| 4-C-6  | `SECURITY.md` 作成           | 脆弱性報告手順                                                                                                                                                                                                            | req §3.7                    |
| 4-C-7  | `CODE_OF_CONDUCT.md` 作成    | 行動規範                                                                                                                                                                                                                  | req §3.7                    |
| 4-C-8  | `docs/DEVELOPMENT.md` 作成   | ローカル開発環境構築手順。環境変数設定、MetaMask 設定、Sepolia ETH 取得                                                                                                                                                   | req §3.7                    |
| 4-C-9  | `.env.example` 最終化        | 全環境変数テンプレート。説明コメント付き                                                                                                                                                                                  | req §3.7                    |
| 4-C-10 | `CHANGELOG.md` 作成          | v0.2.0-alpha リリースノート                                                                                                                                                                                               | req §3.7                    |
| 4-C-11 | `app/metadata.ts` 更新       | v2 仕様に合わせたメタデータ更新（タイトル、説明、OGP 設定等）                                                                                                                                                             | -                           |
| 4-C-12 | v1 コードクリーンアップ      | 未使用の v1 コード（`src/components/`, `src/contexts/`, `src/services/`, `src/utils/`）の完全削除。nft.storage 関連コードの削除。v1 設定ファイル（`next.config.js`, `tailwind.config.js`, `postcss.config.js`）の残骸削除 | -                           |

**完了条件**: CI パイプライン PASS。OSS 公開用ドキュメント一式完成。v1 レガシーコードが完全に削除。

---

## v1 コード移行戦略

v1 コード（`src/components/`, `src/contexts/`, `src/services/`, `src/utils/`）は段階的に移行・削除する。

| フェーズ  | v1 コードの扱い   | 詳細                                                                                                                                     |
| --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0-B | 新構造を並存作成  | `src/features/`, `src/shared/`, `src/config/` を作成。v1 ディレクトリはそのまま残す（参照用）                                            |
| Phase 1   | v1 からリファクタ | `shared/lib/` の実装時に v1 の `services/`, `utils/` からコードを移植。移植元は触らない                                                  |
| Phase 2-3 | v2 コードのみ使用 | 新規コードは `features/`, `shared/` からのみインポート。**v1 ディレクトリからの import は禁止**（ESLint `no-restricted-imports` で強制） |
| Phase 4   | v1 完全削除       | 4-C-12 で `src/components/`, `src/contexts/`, `src/services/`, `src/utils/`, `src/types/` を完全削除                                     |

**ESLint ルール（Phase 0-A-3 で設定）:**

```javascript
// eslint.config.mjs
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/components/*'], message: 'Use @/shared/components/ or @/features/*/components/ instead' },
        { group: ['@/contexts/*'], message: 'Use @/features/*/stores/ instead' },
        { group: ['@/services/*'], message: 'Use @/shared/lib/ or @/features/*/utils/ instead' },
        { group: ['@/utils/*'], message: 'Use @/shared/utils/ or @/shared/lib/ instead' },
      ]
    }]
  }
}
```

---

## チーム編成サマリー

| フェーズ | チーム数 | 推定タスク数 | 依存関係 |
| -------- | -------- | ------------ | -------- |
| Phase 0  | 3        | 21           | なし     |
| Phase 1  | 4        | 56           | Phase 0  |
| Phase 2  | 4        | 39           | Phase 1  |
| Phase 3  | 4        | 53           | Phase 2  |
| Phase 4  | 3        | 28           | Phase 3  |
| **合計** | **—**    | **197**      | —        |

---

## クリティカルパス

```
0-C-3 (EAS v3 スキーマデプロイ) ✅ 完了
  → 1-A-6 (EAS schema.ts v3 エンコード/デコード)
    → 2-D-5 (useRegisterDocument v3 スキーマ使用)
      → 3-A-6 (POST /api/documents)
        → 3-C-6 (DocumentRegisterForm)
```

EAS v3 スキーマはデプロイ済み。クリティカルパスのボトルネックは解消済み。

---

## リスクと対策

| リスク                             | 影響度     | 対策                                                                  |
| ---------------------------------- | ---------- | --------------------------------------------------------------------- |
| ~~EAS v3 スキーマデプロイ失敗~~    | ~~致命的~~ | ✅ デプロイ済み（UID: `0xc1c9b4dc...`）                               |
| Next.js 15 + React 19 の破壊的変更 | 高         | 公式マイグレーションガイドに沿って対応。Canary チャンネルのバグに注意 |
| Tailwind CSS 4 の設定差異          | 中         | v4 の公式ドキュメント参照。v3 からの設定マイグレーション確認          |
| TanStack Query + Zustand の統合    | 中         | ストア間連携（§12.3）の実装を Phase 2 で早期に検証                    |
| バンドルサイズ 200KB 超過          | 中         | Phase 4 で遅延ロード + バンドル分析。超過時は Code Splitting 追加     |

---

## 完了の定義（Definition of Done）

v0.2.0-alpha リリースに必要な条件:

- [ ] 全 Phase 0〜4 のタスクが完了
- [ ] テストカバレッジ 80%+
- [ ] TypeScript strict mode + ESLint エラーゼロ
- [ ] `npm run build` 成功
- [ ] Lighthouse Performance 80+, Accessibility 90+
- [ ] CI パイプライン PASS
- [ ] 全画面がレスポンシブ（320px〜1920px）+ ダークモード対応
- [ ] v1 レガシーコード完全削除
- [ ] OSS ドキュメント一式完成
- [x] EAS Document v3 スキーマが Sepolia にデプロイ済み
