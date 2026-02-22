# v1 機能棚卸し

> v1（`src/`）の全機能を整理し、v2 での扱い（再実装/改善/廃止）を決定する。

---

## 1. ページ一覧

### 1.1 Home (`/`)

- **ファイル**: `src/app/page.tsx`
- **機能**: ランディングページ。タイトル「合同会社型DAO 定款・規程 公開プラットフォーム」、EAS連携の説明、DAO一覧へのCTAボタン
- **v2方針**: 改善 — ヒーローセクション強化、統計表示追加、機能紹介セクション追加

### 1.2 DAO一覧 (`/daos`)

- **ファイル**: `src/app/daos/page.tsx`
- **機能**: 全登録DAOの一覧表示。バッチクエリ（EAS GraphQL + Firebase統合）でデータ取得、リフレッシュボタン、空状態表示
- **データ取得**: `useDAOs()` hook → バッチクエリ or 個別クエリフォールバック
- **v2方針**: 改善 — 検索・フィルター・ソート追加、グリッド/リスト表示切替

### 1.3 DAO詳細 (`/daos/[id]`)

- **ファイル**: `src/app/daos/[id]/page.tsx`
- **機能**: 単一DAOの詳細表示。EAS UID フォーマット検証、DAODetail コンポーネントで基本情報表示（名前、説明、所在地、メンバー数、信頼スコア、ステータス等）、紐付きドキュメント一覧
- **バリデーション**: `0x[64文字hex]` 形式チェック
- **v2方針**: 改善 — タブUI強化（情報/ドキュメント/アクティビティ）

### 1.4 My DAO一覧 (`/my-dao`)

- **ファイル**: `src/app/my-dao/page.tsx`
- **前提**: ウォレット接続必須
- **機能**: 接続ウォレットに紐付くDAOの一覧。ウォレットアドレス表示、リフレッシュ、DAO作成ボタン
- **データ取得**: EAS GraphQL で attester アドレスが自分のDAOをフィルター
- **v2方針**: 再実装

### 1.5 My DAO管理 (`/my-dao/[id]`)

- **ファイル**: `src/app/my-dao/[id]/page.tsx`
- **前提**: ウォレット接続 + 管理者権限（`address === dao.adminAddress`）
- **機能**:
  - 管理者アクセスバナー
  - タブメニュー:
    - **基礎情報タブ**: DAODetail コンポーネントで全メタデータ表示
    - **ドキュメント管理タブ**: ドキュメント登録ボタン + ドキュメント一覧
  - DAO編集モーダル（Firebase メタデータ更新）
  - ドキュメント登録モーダル（ファイル→ハッシュ→IPFS→EAS）
- **v2方針**: 改善 — タブ拡張（メンバー/設定追加）

### 1.6 ログイン (`/login`)

- **ファイル**: `src/app/login/page.tsx`
- **機能**: メール/パスワード入力フォーム + ウォレットログイン。パスワードリセットリンク
- **認証フロー**: AuthContext の `login()` → localStorage 保存 → `/my-dao` リダイレクト
- **v2方針**: 改善 — Firebase Auth に移行、認証基盤刷新

### 1.7 サインアップ (`/signup`)

- **ファイル**: `src/app/signup/page.tsx`
- **前提**: ウォレット接続必須
- **フォーム**:
  - DAO名（EASに保存）
  - 管理者アドレス（ウォレットから自動入力、読み取り専用）
  - 説明、所在地、初期メンバー数、ロゴURL（Firebaseに保存）
- **作成フロー**: `DAOService.createEASAttestation()` → `DAOService.saveDAOMetadata()` → `/my-dao/{uid}` リダイレクト
- **v2方針**: 改善 — ウィザード形式、バリデーション強化

### 1.8 パスワードリセット (`/reset-password`)

- **ファイル**: `src/app/reset-password/page.tsx`
- **機能**: パスワード再設定フォーム
- **v2方針**: 再実装（Firebase Auth 連携）

---

## 2. API Routes

### 2.1 GET `/api/daos` — 全DAO取得

- **ファイル**: `src/app/api/daos/route.ts`
- **クエリパラメータ**: `adminAddress`（フィルター）, `currentSchemaOnly`（スキーマフィルター）
- **処理**: バッチクエリ（`getDAOsWithFirebaseIntegration()`）→ 失敗時は個別クエリにフォールバック
- **レスポンス**: `{ success: true, data: DAO[] }`
- **v2方針**: 改善 — Zodバリデーション追加、エラーレスポンス標準化

### 2.2 POST `/api/daos` — DAO作成

- **ファイル**: `src/app/api/daos/route.ts`
- **リクエスト**: `{ attestationUID, name, adminAddress, description, location, memberCount, logoUrl }`
- **処理**:
  1. UID フォーマット検証
  2. EAS アテステーション存在確認
  3. スキーマUID一致確認
  4. EASデータ（name, adminAddress）の整合性確認
  5. Firebase に保存
- **v2方針**: 改善 — Zodバリデーション、エラーハンドリング統一

### 2.3 GET `/api/daos/[id]` — 単一DAO取得

- **ファイル**: `src/app/api/daos/[id]/route.ts`
- **処理**: Firebase ドキュメント取得 + EAS アテステーション取得 → 統合
- **エラー**: 404（未発見）、400（ID不正）
- **v2方針**: 再実装

### 2.4 PUT `/api/daos/[id]` — DAOメタデータ更新

- **ファイル**: `src/app/api/daos/[id]/route.ts`
- **更新可能フィールド**: description, location, memberCount, trustScore, status, logoUrl, website, contactEmail, contactPerson
- **処理**: 許可フィールドのみフィルター → `updateDoc()` + `updatedAt`
- **v2方針**: 再実装

### 2.5 POST `/api/upload` — IPFSアップロード

- **ファイル**: `src/app/api/upload/route.ts`
- **制約**: 10MB上限、許可タイプ: PDF, DOC, DOCX, TXT, JSON
- **レスポンス**: `{ ipfsCid, fileName, fileSize, fileType, gateway, url }`
- **v2方針**: 改善 — ファイルタイプ拡張検討、エラーハンドリング改善

### 2.6 GET `/api/eas-proxy` — EAS GraphQL プロキシ

- **ファイル**: `src/app/api/eas-proxy/route.ts`
- **機能**: CORS回避のためサーバーサイドでEAS GraphQLに中継
- **v2方針**: 再実装

---

## 3. コンポーネント（17個）

### ナビゲーション・レイアウト

| コンポーネント | ファイル                        | 機能                                          | v2方針                      |
| -------------- | ------------------------------- | --------------------------------------------- | --------------------------- |
| Navbar         | `src/components/Navbar.tsx`     | メインナビ、ユーザー状態表示、ログイン/アウト | 改善（レスポンシブ強化）    |
| ClientOnly     | `src/components/ClientOnly.tsx` | SSR/CSR 不整合回避ラッパー                    | 再実装                      |
| Modal          | `src/components/Modal.tsx`      | 汎用モーダル                                  | 改善（Radix Dialog ベース） |

### DAO管理

| コンポーネント     | ファイル                                | 機能                | v2方針          |
| ------------------ | --------------------------------------- | ------------------- | --------------- |
| EditDaoModal       | `src/components/EditDaoModal.tsx`       | DAO情報編集モーダル | 改善（RHF+Zod） |
| DeleteConfirmModal | `src/components/DeleteConfirmModal.tsx` | 削除確認ダイアログ  | 再実装          |

### ドキュメント管理

| コンポーネント         | ファイル                                    | 機能                                                 | v2方針                 |
| ---------------------- | ------------------------------------------- | ---------------------------------------------------- | ---------------------- |
| DocumentList           | `src/components/DocumentList.tsx`           | ドキュメント一覧（タイプ別分類、DLリンク、失効機能） | 改善                   |
| DocumentRegister       | `src/components/DocumentRegister.tsx`       | 登録フォーム（ファイル選択→進捗表示→完了）           | 改善（マルチステップ） |
| DocumentVerifier       | `src/components/DocumentVerifier.tsx`       | ハッシュ照合による真正性検証                         | 再実装                 |
| EditDocumentModal      | `src/components/EditDocumentModal.tsx`      | ドキュメント情報編集                                 | 改善                   |
| FileHashCalculator     | `src/components/FileHashCalculator.tsx`     | SHA-256ハッシュ表示                                  | 再実装                 |
| FileAttestationCreator | `src/components/FileAttestationCreator.tsx` | アテステーション作成UI                               | 再実装                 |
| FileUploader           | `src/components/FileUploader.tsx`           | ファイルアップロード                                 | 改善（D&D対応）        |

### EAS・ブロックチェーン

| コンポーネント     | ファイル                                | 機能                     | v2方針                   |
| ------------------ | --------------------------------------- | ------------------------ | ------------------------ |
| AttestationDisplay | `src/components/AttestationDisplay.tsx` | アテステーション詳細表示 | 再実装                   |
| EasStatus          | `src/components/EasStatus.tsx`          | EAS接続ステータス表示    | 再実装                   |
| SchemaManager      | `src/components/SchemaManager.tsx`      | EASスキーマ管理          | 廃止（開発用、本番不要） |

### 認証

| コンポーネント      | ファイル                                 | 機能                     | v2方針 |
| ------------------- | ---------------------------------------- | ------------------------ | ------ |
| WalletConnectButton | `src/components/WalletConnectButton.tsx` | MetaMask接続ボタン       | 改善   |
| WalletLogin         | `src/components/WalletLogin.tsx`         | ウォレットベースログイン | 改善   |

---

## 4. サービス

### 4.1 DAOService (`src/services/daoService.ts`)

- **パターン**: クラスベース（`new DAOService(signer?)`）
- **メソッド**:
  - `createEASAttestation(data)` — EASアテステーション作成
  - `saveDAOMetadata(uid, data)` — Firebase 保存
  - `getDAO(uid)` — EAS+Firebase統合取得
  - `getAllDAOs()` — バッチクエリ+フォールバック
  - `updateDAODetails(uid, updates)` — Firebase更新
  - `addDocumentToDAO(daoUID, docUID)` — ドキュメント紐付け
  - `getDAODocuments(daoUID)` — ドキュメントUID一覧
  - `parseDAOAttestation(attestation)` — EASデータ抽出
- **v2方針**: 改善 — 関数ベースに変更、依存注入、テスタブルに

### 4.2 documentService (`src/services/documentService.ts`)

- **主要関数**: `registerDocument(data, onProgress)`
- **フロー**: ハッシュ計算(10%) → IPFS(30%) → エンコード(50%) → EAS(70%) → 確認(90%) → 完了(100%)
- **他**: `revokeDocument()`, `estimateDocumentRegistrationGas()`
- **v2方針**: 改善 — エラーハンドリング強化、進捗コールバック改善

### 4.3 documentQueryService (`src/services/documentQueryService.ts`)

- **主要関数**: `queryDocumentsByDAO(daoUID, options, userAddress)`
- **機能**: EAS GraphQL でDAO紐付きドキュメント検索、失効フィルター、ページネーション
- **v2方針**: 改善 — クエリ最適化

### 4.4 Firebase (`src/services/firebase.ts`)

- **機能**: Firebase初期化、Firestore接続
- **v2方針**: 改善 — 抽象化レイヤー追加（`shared/lib/firebase/`）

---

## 5. ユーティリティ（12個）

| ファイル             | 機能                                      | 行数      | v2方針                                     |
| -------------------- | ----------------------------------------- | --------- | ------------------------------------------ |
| `easQuery.ts`        | GraphQLクエリ、バッチ取得、Firebase統合   | **911行** | 分解（graphql.ts, converter.ts, batch.ts） |
| `easSchema.ts`       | スキーマ定義、エンコード/デコード、パース | 大        | 簡素化（shared/lib/eas/schema.ts）         |
| `daoDatabase.ts`     | DAO DB操作                                | 中        | 統合（daoService に）                      |
| `fileHash.ts`        | SHA-256ハッシュ計算                       | 小        | 再実装（shared/utils/）                    |
| `ipfsClient.ts`      | IPFSクライアント設定                      | 小        | 改善（shared/lib/ipfs/）                   |
| `ipfsStorage.ts`     | IPFSアップロード/ダウンロード             | 中        | 改善（shared/lib/ipfs/）                   |
| `formatTimestamp.ts` | 日時フォーマット                          | 小        | 再実装（shared/utils/format.ts）           |
| `idManager.ts`       | ID生成・管理                              | 小        | 評価後決定                                 |
| `logger.ts`          | 構造化ログ                                | 小        | 再実装（shared/utils/）                    |
| `walletUtils.ts`     | ウォレット変更監視                        | 小        | 移動（features/wallet/）                   |
| `index.ts`           | バレルエクスポート                        | 小        | 不要                                       |

---

## 6. コンテキスト

### 6.1 AuthContext (`src/contexts/AuthContext.tsx`)

- **状態**: user, isLoading, isAuthenticated
- **メソッド**: login, loginWithWallet, logout, signup
- **問題**: localStorage 依存、セッション管理なし、デモ認証含む
- **v2方針**: 廃止 → Firebase Auth + Zustand ストアに置換

### 6.2 EasContext (`src/contexts/EasContext.tsx`)

- **状態**: eas, signer, provider, isConnected, address
- **メソッド**: connect, disconnect
- **機能**: MetaMask接続、Sepolia自動切替、EAS/SchemaRegistry初期化
- **v2方針**: 廃止 → Zustand walletStore + shared/lib/eas/ に分離

---

## 7. データモデル

### 7.1 EAS スキーマ（ブロックチェーン・不変）

**DAO Schema**:

```
string name, address adminAddress
```

**Document Schema**:

```
bytes32 daoAttestationUID, string documentTitle, string documentType, string documentVersion, bytes32 documentHash, string ipfsCID, bytes32 previousVersionUID
```

### 7.2 Firebase コレクション

**daos/{attestationUID}**:

```typescript
{
  description: string
  location: string
  memberCount: number
  trustScore: number        // 0-100
  status: 'active' | 'pending' | 'suspended'
  foundingDate: Timestamp
  logoUrl?: string
  website?: string
  contactEmail?: string
  contactPerson?: string
  documents: string[]       // Document UID配列
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 7.3 フロントエンド統合型

```typescript
// DAO = EASDAOData + FirebaseDAOData
interface DAO {
  id: string; // = attestationUID
  attestationUID: string;
  name: string; // from EAS
  adminAddress: string; // from EAS
  // ...FirebaseDAOData の全フィールド
}

// Document = EASDocumentData + FirebaseDocumentData
interface Document {
  id: string; // = attestationUID
  attestationUID: string;
  daoId: string;
  name: string; // = documentTitle from EAS
  type: DocumentType;
  version: string;
  hash: string;
  ipfsCID: string;
  previousVersionUID: string;
  // ...FirebaseDocumentData
}

type DocumentType = 'articles' | 'meeting' | 'token' | 'operation' | 'other';

interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  authType: 'email' | 'wallet';
  role: 'admin' | 'member' | 'operator' | 'superadmin';
  status: 'active' | 'inactive';
}
```

---

## 8. 技術的課題の詳細

### 8.1 localStorage認証（影響度: 高）

- AuthContext が `localStorage.setItem('user', JSON.stringify(user))` でセッション管理
- XSS脆弱性のリスク
- セッション有効期限なし
- **v2解決策**: Firebase Authentication の利用、サーバーサイドセッション

### 8.2 EASデータパースの複雑さ（影響度: 高）

- `parseDAOAttestation()` に3段階のフォールバック:
  1. `decodedDataJson` を JSON パース
  2. 文字列としてパース
  3. `SchemaEncoder` で raw data デコード
- SDK バージョンによりレスポンス形式が異なるため
- **v2解決策**: SDK バージョン固定、パースロジック統一、型安全なデコーダー

### 8.3 easQuery.ts の肥大化（影響度: 高）

- 911行に GraphQL クエリ構築、アテステーション変換、Firebase 統合が混在
- `convertAttestationToDAO()` に BOM除去、トリプルネスト値抽出等のハック
- **v2解決策**: 3ファイルに分解
  - `eas/graphql.ts` — クエリ定義・実行
  - `eas/converter.ts` — データ変換
  - `eas/schema.ts` — スキーマ操作

### 8.4 タイムスタンプの不整合（影響度: 中）

- `Date`, `Timestamp`, ISO文字列が混在
- フォーマット関数が複数箇所に散在
- **v2解決策**: 統一型定義 + 共通フォーマット関数（`shared/utils/format.ts`）

### 8.5 テスト・CI/CDの不在（影響度: 高）

- v1 にユニットテストゼロ
- `.github/` ディレクトリなし
- **v2解決策**: Phase 1 でテスト環境・CI/CD を最初に構築

---

## 9. 廃止予定の機能

| 対象                             | 理由                                |
| -------------------------------- | ----------------------------------- |
| SchemaManager コンポーネント     | 開発・デバッグ用、本番不要          |
| `api/debug-firebase` API         | デバッグ用、本番不要                |
| AuthContext の localStorage認証  | Firebase Auth に置換                |
| EasContext                       | walletStore + shared/lib/eas に分離 |
| デモ認証（ハードコード資格情報） | Firebase Auth に統一                |
