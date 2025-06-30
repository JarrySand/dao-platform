# 🔗 EAS 実装構想

## 📌 概要

このドキュメントは、DAO Document Platformにおける [Ethereum Attestation Service (EAS)](https://attest.sh/) の実装構想と運用計画をまとめたものです。EASを活用してDAOの定款・規程文書の真正性と不変性を保証するための具体的なアプローチを説明します。

## 🎯 目的

1. **文書の真正性保証**
   - 定款・規程文書のハッシュをオンチェーンで記録
   - 文書の無断改変を検知する仕組みの実現
   - 文書が正規のものであることを証明する手段の提供

2. **法的有効性の担保**
   - 改変不可能なブロックチェーン技術を活用した証明
   - 監査可能な変更履歴の提供
   - 法的紛争時の証拠としての活用

3. **透明性の確保**
   - 文書の作成・変更履歴の透明性
   - 公開性と検証可能性の両立
   - 権限管理と変更承認プロセスの明確化

## 💡 基本的な仕組み

### アテステーションの基本構造

#### 1. DAOメインスキーマ

DAOの基本情報を管理する最上位スキーマです。このスキーマはプラットフォーム全体で一度だけ登録され、すべてのDAOに共通して使用されます。

```solidity
struct DAOMainSchema {
  string daoId;                // DAOの一意のID
  string daoName;              // DAO名称
  string description;          // 説明
  address adminAddress;        // 管理者アドレス
  uint256 foundingDate;        // 設立日時のタイムスタンプ
}
```

#### 2. 関連ドキュメントスキーマ

各文書タイプのスキーマは、メインDAOスキーマに紐づく形で構成されます。このスキーマもプラットフォーム全体で一度だけ登録され、すべてのDAO文書に共通して使用されます。

```solidity
struct DAODocumentSchema {
  string daoId;                // 所属するDAOのID（参照）
  bytes32 daoAttestationUID;   // DAOメインスキーマのアテステーションUID（直接参照）
  string documentId;           // 文書の一意のID
  string documentTitle;        // 文書タイトル
  bytes32 documentHash;        // 文書のSHA-256ハッシュ
  string ipfsCid;              // IPFSに保存された文書のコンテンツID
  string ipfsGateway;          // 使用しているIPFSゲートウェイまたはサービスのURL
  uint256 timestamp;           // タイムスタンプ
  string version;              // バージョン情報
  bytes32 previousVersionId;   // 前バージョンのアテステーションUID（初回は0）
  address creatorAddress;      // 作成者アドレス
  string status;               // ステータス（"active", "archived", "draft"）
}
```

この改良されたスキーマでは、`daoAttestationUID`フィールドを追加し、DAOメインスキーマのアテステーションUIDを直接参照することで、より強固な関連付けを実現しています。また、`previousVersionId`フィールドを復活させることで、ドキュメントバージョン間の明示的な参照も可能となり、バージョン履歴の追跡が容易になります。

#### 3. スキーマの相互関係

```
          ┌─── 定款V1 ── 定款V2 ── 定款V3 ───┐
          │                                   │
          ├─── 総会規程V1 ── 総会規程V2 ─────┤
          │                                   │
DAOメイン ─┼─── トークン規程V1 ─────────────┤
          │                                   │
          ├─── 運営規程V1 ── 運営規程V2 ─────┤
          │                                   │
          └─── トレジャリー規定V1 ───────────┘
```

この階層構造により、1つのDAOに対して複数種類の文書が紐づき、それぞれの文書タイプごとにバージョン管理が行われます。

### アテステーションタイプ

- **初回登録**: 文書の初回登録時に作成
- **変更記録**: 文書変更時に過去バージョンを参照して作成
- **定期検証**: 定期的な検証時に真正性確認のために作成

### アテステーション発行フロー

1. **文書アップロード**
   - ユーザーがプラットフォームに文書をアップロード
   - フロントエンドでSHA-256ハッシュを計算
   - メタデータ（タイトル、バージョンなど）の入力

2. **承認プロセス**
   - 適切な権限を持つDAOメンバーによる承認
   - 複数承認者による検証（オプション）
   - 承認者のウォレットによる署名

3. **オンチェーン記録**
   - アテステーションの発行
   - EASコントラクトへの記録
   - イベントの発行と通知

4. **検証と確認**
   - アテステーション情報の表示
   - 検証ステータスの更新
   - 証明書の発行

## 🛠 技術的実装

### 1. インテグレーション方式

#### フロントエンド
- **ライブラリ**: ethers.js / wagmi / web3-react
- **ウォレット接続**: MetaMask / WalletConnect
- **ハッシュ計算**: Web Crypto API

#### バックエンド（オプショナル）
- **署名検証**: サーバーサイド検証
- **EASインデクサー連携**: クエリとデータ取得
- **通知システム**: ウェブフック / プッシュ通知

### 2. 使用するEASコンポーネント

- **EAS Contract**: アテステーションを記録する中核コントラクト
- **SchemaRegistry**: カスタムスキーマの登録と管理（プラットフォーム全体で共通スキーマを一度だけ登録）
- **Indexer API**: アテステーションの効率的な検索とクエリ
- **Resolver Contract** (オプション): カスタムロジックの実装

### 3. スマートコントラクト設計

```solidity
// 基本的なResolverコントラクト（例）
contract DAODocumentResolver {
    address public admin;
    mapping(bytes32 => bool) public revokedAttestations;
    
    constructor() {
        admin = msg.sender;
    }
    
    function onAttest(Attestation calldata attestation) external returns (bool) {
        // カスタム検証ロジック
        return true;
    }
    
    function onRevoke(Attestation calldata attestation) external returns (bool) {
        // 取り消し記録
        revokedAttestations[attestation.uid] = true;
        return true;
    }
}
```

## 📝 文書のバージョン管理

### 1. 文書バージョンの関連付け方法

各種類の文書（定款、DAO総会規程、トークン規程、運営規程、トレジャリー管理規定）は、それぞれ独立したバージョン履歴を持ちます。各バージョンは前バージョンのアテステーションUIDを参照することで、完全な履歴チェーンを構築します。

```
DocumentV1 (previousVersionId = 0) → DocumentV2 (previousVersionId = UID of V1) → DocumentV3 (previousVersionId = UID of V2)
```

### 2. バージョン管理のワークフロー

#### 初回登録

1. 文書のSHA-256ハッシュを計算
2. 文書をIPFSにアップロードし、CIDとゲートウェイ情報を取得
3. versionNumber = 1, previousVersionId = 0 として設定
4. EASコントラクトでアテステーションを作成
5. 返されたUIDを保存（後続バージョンで参照するため）

#### 更新処理

1. 新しい文書バージョンのハッシュを計算
2. 前バージョンのアテステーションUIDを`previousVersionId`として設定
3. versionNumberを1増加
4. 変更内容を記録
5. 新しいアテステーションを作成

#### 履歴の取得

1. 最新バージョンのアテステーションUIDから照会開始
2. `previousVersionId`を辿って再帰的に過去バージョンを取得
3. 完全な変更履歴を時系列で構築

### 3. 実装例

#### 共通スキーマの初期登録（プラットフォーム起動時に一度だけ実行）

```javascript
// グローバルスキーマの登録（プラットフォーム初期化時に一度だけ実行）
const schemaRegistry = new SchemaRegistry(provider);

// すべてのDAOで共通使用するDAO基本スキーマを登録
const daoSchemaUID = await schemaRegistry.register({
  schema: 'string daoId,string daoName,string description,address adminAddress,uint256 foundingDate',
  resolverAddress: ethers.constants.AddressZero, // 必要に応じてカスタムリゾルバーを設定
});

// すべてのDAO文書で共通使用する文書スキーマを登録（IPFSフィールドを含む）
const documentSchemaUID = await schemaRegistry.register({
  schema: 'string daoId,bytes32 daoAttestationUID,string documentId,string documentTitle,bytes32 documentHash,string ipfsCid,string ipfsGateway,uint256 timestamp,string version,bytes32 previousVersionId,address creatorAddress,string status',
  resolverAddress: documentResolverAddress,
});

// グローバルUIDs設定をどこかに保存
console.log(`DAO Main Schema UID: ${daoSchemaUID}`);
console.log(`Document Schema UID: ${documentSchemaUID}`);
```

#### DAOの登録

```javascript
// グローバルスキーマUIDを使用
const eas = new EAS(easContractAddress, provider);
const daoId = `dao-${Date.now()}`; // 一意のID生成

// 既に登録済みのグローバルスキーマUIDを使用
await eas.attest({
  schema: daoSchemaUID, // 全DAOで共通のスキーマUID
  data: {
    daoId: daoId,
    daoName: "サンプルDAO",
    description: "これはサンプルDAOの説明です",
    adminAddress: signerAddress,
    foundingDate: Math.floor(Date.now() / 1000)
  },
});
```

#### 定款の初回登録

```javascript
// 文書ハッシュの計算
const documentHash = ethers.utils.keccak256(documentBytes);
const documentId = `doc-${daoId}-articles-${Date.now()}`;

// IPFS へのアップロード（例: NFT.Storageを使用）
const ipfsClient = new NFTStorage({ token: 'YOUR_API_KEY' });
const ipfsCid = await ipfsClient.storeBlob(new Blob([documentBytes]));
const ipfsGateway = 'https://nftstorage.link';

// 定款の初期バージョンのアテステーション発行（共通スキーマUIDを使用）
const attestationUID = await eas.attest({
  schema: documentSchemaUID, // 全文書で共通のスキーマUID
  data: {
    daoId: daoId,
    daoAttestationUID: daoAttestationUID.uid, // DAOアテステーションへの直接参照
    documentId: documentId,
    documentTitle: "定款",
    documentHash: documentHash,
    ipfsCid: ipfsCid,
    ipfsGateway: ipfsGateway,
    timestamp: Math.floor(Date.now() / 1000),
    version: "1.0",
    previousVersionId: ethers.constants.HashZero, // 初回は0
    creatorAddress: signerAddress,
    status: "active"
  },
});
```

#### 定款の改訂バージョン作成

```javascript
// 新しいバージョンの文書ハッシュを計算
const newDocumentHash = ethers.utils.keccak256(newDocumentBytes);

// 新バージョンをIPFSにアップロード
const newIpfsCid = await ipfsClient.storeBlob(new Blob([newDocumentBytes]));

// 前バージョンのアテステーションUIDを参照する新バージョンを作成
await eas.attest({
  schema: documentSchemaUID,
  data: {
    daoId: daoId,
    daoAttestationUID: daoAttestationUID.uid, // DAOアテステーションへの直接参照
    documentId: documentId, // 同じドキュメントID
    documentTitle: "定款",
    documentHash: newDocumentHash, // 新しいハッシュ
    ipfsCid: newIpfsCid, // 新しいCID
    ipfsGateway: ipfsGateway, // 同じゲートウェイまたは新しいゲートウェイ
    timestamp: Math.floor(Date.now() / 1000),
    version: "2.0",
    previousVersionId: attestationUID.uid, // 前バージョンのUID
    creatorAddress: signerAddress,
    status: "active"
  },
});
```

### 4. 検証と管理

#### 特定DAOの全文書を取得

```javascript
// オフチェーンインデクサを使用
const daoDocuments = await easIndexer.getAttestationsBySchema({
  schema: documentSchemaUID, // 全文書共通のスキーマUID
  where: {
    daoId: daoId
  }
});

// 文書タイプでフィルタリング
const articles = daoDocuments.filter(doc => doc.data.documentType === "articles");
const meetingRules = daoDocuments.filter(doc => doc.data.documentType === "meeting");
const tokenRules = daoDocuments.filter(doc => doc.data.documentType === "token");
const operationRules = daoDocuments.filter(doc => doc.data.documentType === "operation");
const treasuryRules = daoDocuments.filter(doc => doc.data.documentType === "treasury");
```

#### 文書の変更履歴の取得

```javascript
async function getDocumentHistory(documentId) {
  // 最新バージョンを取得
  const latestVersion = await easIndexer.getLatestAttestation({
    where: {
      documentId: documentId
    }
  });
  
  // 履歴をさかのぼって再構築
  const history = [latestVersion];
  let current = latestVersion;
  
  while (current.data.previousVersionId !== ethers.constants.HashZero) {
    // previousVersionIdを使用して直接前バージョンのアテステーションを取得
    const previousVersion = await eas.getAttestation(current.data.previousVersionId);
    history.unshift(previousVersion); // 古いバージョンを先頭に追加
    current = previousVersion;
  }
  
  // 各バージョンのIPFS情報を使用してドキュメントを取得
  const historyWithDocuments = await Promise.all(history.map(async (version) => {
    // IPFSからドキュメントを取得
    const documentUrl = `${version.data.ipfsGateway}/ipfs/${version.data.ipfsCid}`;
    // ドキュメントのコンテンツを取得するロジック
    // ...
    
    return {
      ...version,
      documentUrl,
      // 必要に応じて他の情報を追加
    };
  }));
  
  return historyWithDocuments;
}
```

## 📋 実装計画

### Phase 1: 基本機能実装
1. **EASスキーマ作成と登録**
   - 基本スキーマの設計と注入
   - IPFS連携フィールドを含むドキュメントスキーマの設計
   - テストネットでの検証

2. **IPFS連携**
   - NFT.Storage/Pinataなどの無料IPFSサービスとの連携
   - ドキュメントのIPFSへのアップロード機能
   - CIDとゲートウェイ情報の管理

3. **検証機能**
   - 文書の真正性検証UI
   - 過去バージョンとの比較機能
   - 検証結果の表示

4. **エラー処理と回復メカニズム**
   - トランザクション失敗時のリトライ戦略
   - エラー状態のロギングと監視
   - ユーザーフレンドリーなエラーメッセージと回復手順
   - オフラインファーストアプローチによる一時的なネットワーク問題への対応

### Phase 2: 高度な機能
1. **バッチ処理**
   - 複数文書の一括アテステーション
   - 効率的なガス使用

2. **承認ワークフロー**
   - マルチシグ承認プロセス
   - 承認状態の追跡

3. **通知システム**
   - メール通知
   - ダッシュボードアラート

### Phase 3: インテグレーションと拡張
1. **他のブロックチェーンサポート**
   - ポリゴンなどの低コストチェーン
   - クロスチェーン検証

2. **外部システム連携**
   - GitHubとの統合
   - DIDシステムとの連携

3. **拡張機能**
   - カスタムResolverの実装
   - データ分析とレポート

## 💰 コスト考察

### ガスコスト

| 操作 | 推定ガスコスト | 最適化方法 |
|------|----------------|------------|
| スキーマ登録 | ~500,000 gas | 全DAOで共通スキーマを使用し一度だけ登録 |
| アテステーション発行 | ~150,000 gas | バッチ処理、低ガス時間帯の利用 |
| アテステーション取り消し | ~100,000 gas | 必要な場合のみ実行 |
| Resolver呼び出し | ~50,000+ gas | ロジックの最適化 |

### コスト最適化戦略
- Layer 2ソリューション（Optimism、Arbitrumなど）の利用
- 共通スキーマの使用によるスキーマ登録コストの削減
- ガス価格の低い時間帯での処理
- バッチ処理によるトランザクション数削減
- アテステーションデータの最適化

## 📊 モニタリングと運用

### 1. 定期的な検証
- 自動検証ジョブの実行（日次/週次）
- 不一致検出時の即時アラート

### 2. パフォーマンスモニタリング
- レスポンス時間の追跡
- ガスコストの監視
- エラー率の測定

### 3. セキュリティ対策
- 管理キーの安全な保管
- 定期的なセキュリティ監査
- アラートシステムの構築

### 4. 権限管理
- スキーマ登録と更新権限の管理（マルチシグ/DAO投票）
- リゾルバーコントラクトの更新権限管理
- セーフティチェックとタイムロックの実装
- 管理者権限の分散化による単一障害点の排除

## 🌐 将来展望

1. **DAOガバナンス統合**
   - 投票による文書変更承認
   - オンチェーンガバナンスとの連携

2. **拡張データ構造**
   - ZK-SNARKsによるプライバシー保護
   - 大容量データの効率的な参照メカニズム

3. **法的フレームワーク**
   - 法的有効性の強化
   - 各国法制度との整合性確保

## 📚 参考リソース

- [EAS公式ドキュメント](https://docs.attest.sh/)
- [EAS GitHub](https://github.com/ethereum-attestation-service)
- [EAS開発者フォーラム](https://ethereum-attestation-service.eth.limo/)

## 🔌 NFT投票権との連携

### 1. NFTとDAOドキュメントの統合

DAOの定款や規程文書は、DAOメンバーシップや投票権を表すNFTと連携させることで、よりシームレスなガバナンス体験を実現できます。NFT保有者は、トークンを通じてDAOの法的文書にアクセスし、投票権に応じた文書変更の承認プロセスに参加することが可能になります。

#### 基本的な連携構想

- DAOのメインスキーマに投票権NFTのコントラクトアドレスを含める
- 各NFTは特定のDAOに紐づけられる
- NFTの保有者はDAOの定款や規程文書へのアクセス権を得る
- 投票権の重みに応じて文書変更への投票が可能になる

```solidity
// DAOメインスキーマに投票権NFT情報を追加（将来的な拡張案）
struct DAOMainSchemaV2 {
  // ... 既存フィールド ...
  address votingNFTContract;       // 投票権NFTのコントラクトアドレス
  uint256 requiredTokenBalance;    // 投票に必要な最小トークン保有量
}
```

### 2. NFTメタデータでのDAO参照

NFTメタデータには静的なドキュメントURIを含めるのではなく、DAOの識別子とEASの参照情報を含めます。これにより、NFT保有者はスタンドアローンでDAOメインスキーマにアクセスし、常に最新のドキュメントを追跡できます。

#### メタデータ例

```json
{
  "name": "DAO Voting Token #123",
  "description": "投票権を持つDAOメンバーシップNFT",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "DAO ID", "value": "0x1234..." },
    { "trait_type": "Voting Power", "value": 10 }
  ],
  "dao_reference": {
    "dao_id": "0x1234...",
    "dao_name": "サンプルDAO",
    "eas_contract": "0x4200000000000000000000000000000000000021",
    "schema_id": "0xabcd...",
    "chain_id": 10 // Optimism
  }
}
```

このアプローチでは：

1. NFTメタデータには、DAO ID、EASコントラクトアドレス、スキーマID、チェーンIDを含める
2. これにより、任意のクライアントがEASコントラクトに直接アクセスしてDAOメインスキーマを取得可能
3. メインスキーマから各種ドキュメントへの参照を取得し、常に最新のドキュメントにアクセス
4. ウォレットやマーケットプレイスなどのサードパーティアプリケーションからも、直接EASデータにアクセス可能

この方法により、アプリケーションに依存せず、ブロックチェーン上の参照情報のみでドキュメントにアクセスできる真のスタンドアローン性が確保されます。ドキュメントが更新されても、NFTメタデータを更新する必要がなく、常に最新のDAO情報やドキュメントにアクセスすることができます。 

## 🌐 マルチDAO共通スキーマの実装

### 1. 共通スキーマ管理

プラットフォーム上の全てのDAOは、共通のスキーマ構造を使用します。これにより、ガスコストの削減、データの一貫性、クエリの効率化が可能になります。

#### グローバルスキーマUIDs管理

```javascript
// schemas.js
const GLOBAL_SCHEMA_UIDS = {
  DAO_MAIN: "0x1234...", // プラットフォーム起動時に一度だけ登録されたDAO基本スキーマUID
  DOCUMENT: "0xabcd..."  // 文書スキーマUID
};

// すべてのDAOで共通のスキーマUIDを使用
export const getDAOSchemaUID = () => GLOBAL_SCHEMA_UIDS.DAO_MAIN;
export const getDocumentSchemaUID = () => GLOBAL_SCHEMA_UIDS.DOCUMENT;
```

#### スキーマ登録（プラットフォーム初期化時に一度だけ実行）

```javascript
// deploy-schemas.js
async function deployGlobalSchemas() {
  // スキーマレジストリインスタンス
  const schemaRegistry = new SchemaRegistry(provider);
  
  // DAO基本スキーマの登録（一度だけ）
  const daoMainSchemaUID = await schemaRegistry.register({
    schema: 'string daoId,string daoName,string description,address adminAddress,uint256 foundingDate',
    resolverAddress: ethers.constants.AddressZero,
  });
  
  // 文書スキーマの登録（一度だけ）
  const documentSchemaUID = await schemaRegistry.register({
    schema: 'string daoId,bytes32 daoAttestationUID,string documentId,string documentTitle,bytes32 documentHash,string ipfsCid,string ipfsGateway,uint256 timestamp,string version,bytes32 previousVersionId,address creatorAddress,string status',
    resolverAddress: documentResolverAddress,
  });
  
  // グローバルUIDs設定をどこかに保存
  console.log(`DAO Main Schema UID: ${daoMainSchemaUID}`);
  console.log(`Document Schema UID: ${documentSchemaUID}`);
  
  return { daoMainSchemaUID, documentSchemaUID };
}
```

### 2. 新規DAO登録

```javascript
// registerDAO.js
async function registerNewDAO(daoName, description, foundingMember, metadataURI, votingNFTContract) {
  const eas = new EAS(easContractAddress, provider);
  
  // グローバルスキーマUIDを使用
  const schemaUID = getDAOSchemaUID();
  
  // 一意のDAO IDを生成
  const daoId = `dao-${Date.now()}-${foundingMember.slice(0, 8)}`;
  
  // DAO登録アテステーション
  const attestationUID = await eas.attest({
    schema: schemaUID, // 全DAOで共通のスキーマUID
    data: {
      daoId: daoId,
      daoName: daoName,
      description: description,
      adminAddress: foundingMember,
      foundingDate: Math.floor(Date.now() / 1000)
    },
  });
  
  return { daoId, attestationUID };
}
```

### 3. 文書登録と更新

```javascript
// documentService.js
async function registerDocument(daoId, documentType, documentContent, attestor) {
  const eas = new EAS(easContractAddress, provider);
  
  // グローバルドキュメントスキーマUIDを使用
  const schemaUID = getDocumentSchemaUID();
  
  // 文書ハッシュの計算
  const documentHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(JSON.stringify(documentContent))
  );
  
  // 一意のドキュメントIDを生成
  const documentId = `doc-${daoId.slice(0, 10)}-${documentType}-${Date.now()}`;
  
  // IPFSへのアップロード
  const ipfsClient = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY });
  const documentBlob = new Blob([Buffer.from(JSON.stringify(documentContent))]);
  const ipfsCid = await ipfsClient.storeBlob(documentBlob);
  const ipfsGateway = 'https://nftstorage.link';
  
  // 文書登録アテステーション
  const attestationUID = await eas.attest({
    schema: schemaUID, // 全文書で共通のスキーマUID
    data: {
      daoId: daoId,
      daoAttestationUID: daoAttestationUID, // DAOアテステーションへの直接参照
      documentId: documentId,
      documentTitle: documentType,
      documentHash: documentHash,
      ipfsCid: ipfsCid,
      ipfsGateway: ipfsGateway,
      timestamp: Math.floor(Date.now() / 1000),
      version: "1.0",
      previousVersionId: ethers.constants.HashZero, // 初回は0
      creatorAddress: attestor,
      status: "active"
    },
  });
  
  return { documentId, attestationUID, ipfsCid, ipfsGateway };
}
```

### 4. 全DAOの検索

```javascript
// daoExplorer.js
async function getAllDAOs() {
  // EASインデクサーを使用
  const easIndexer = new EASIndexerClient(indexerEndpoint);
  
  // グローバルDAO基本スキーマで全DAOを検索
  const allDAOs = await easIndexer.getAttestationsBySchema({
    schema: getDAOSchemaUID(), // 共通スキーマUID
    // フィルターは任意
  });
  
  // 必要な情報だけ抽出
  return allDAOs.map(dao => ({
    daoId: dao.data.daoId,
    daoName: dao.data.daoName,
    description: dao.data.description,
    foundingDate: new Date(dao.data.foundingDate * 1000).toISOString(),
    // 注意: votingNFTContractはV2スキーマ実装後に有効になります
    // V1スキーマでは取得しようとするとundefinedが返されます
    votingNFTContract: dao.data.votingNFTContract
  }));
}
```

### 5. スキーマバージョン管理への配慮

```javascript
// schema-upgrader.js
async function upgradeToSchemaV2() {
  // 共通スキーマをアップグレードする場合の考慮事項
  // 1. 既存フィールドは変更しない（互換性維持）
  // 2. 新しいフィールドの追加のみ許可
  // 3. デフォルト値の設定で既存アテステーションの互換性を確保
  
  const schemaRegistry = new SchemaRegistry(provider);
  
  // V2スキーマ登録：新しいフィールドの追加（例）
  const daoMainSchemaV2UID = await schemaRegistry.register({
    schema: 'string daoId,string daoName,string description,address adminAddress,uint256 foundingDate,address votingNFTContract,uint256 requiredTokenBalance',
    resolverAddress: updatedResolverAddress,
  });
  
  // 文書スキーマV2：追加フィールド（例）
  const documentSchemaV2UID = await schemaRegistry.register({
    schema: 'string daoId,bytes32 daoAttestationUID,string documentId,string documentTitle,bytes32 documentHash,string ipfsCid,string ipfsGateway,uint256 timestamp,string version,bytes32 previousVersionId,address creatorAddress,string status,address[] approvers,uint256 expiryDate',
    resolverAddress: updatedDocumentResolverAddress,
  });
  
  // ここでグローバル参照を更新するプロセスが必要
  // 慎重な移行計画とテストが必須
  
  return { daoMainSchemaV2UID, documentSchemaV2UID };
}
```

#### スキーマ移行戦略

スキーマをV1からV2に移行する際の具体的なステップ：

1. **準備段階**
   - 新スキーマのテストネットでの十分な検証
   - 既存データでの互換性テスト
   - ロールバック計画の策定

2. **デプロイ手順**
   - 新スキーマの登録（既存スキーマは維持）
   - フロントエンドの更新（両方のスキーマをサポート）
   - グローバル参照の段階的な更新

3. **ユーザーへの通知**
   - UIでの明示的なバージョン表示
   - 新機能の説明とユーザーガイド
   - 移行期間中のサポート体制

4. **データマイグレーション（オプション）**
   ```javascript
   // 既存アテステーションを新スキーマで再発行する例
   async function migrateAttestationToV2(originalAttestationUID) {
     // 既存アテステーションの取得
     const originalAttestation = await eas.getAttestation(originalAttestationUID);
     
     // 新スキーマで同じデータを使って再発行
     // 既存フィールドはそのまま、新フィールドはデフォルト値を設定
     const newAttestationUID = await eas.attest({
       schema: daoMainSchemaV2UID,
       data: {
         ...originalAttestation.data,
         votingNFTContract: ethers.constants.AddressZero, // デフォルト値
         requiredTokenBalance: 1 // デフォルト値
       }
     });
     
     // 移行マッピングの記録（オフチェーンまたはオンチェーン）
     await recordMigration(originalAttestationUID, newAttestationUID);
     
     return newAttestationUID;
   }
   ```

### 共通スキーマ使用のメリット

1. **ガスコスト削減**: 
   - 各DAOごとに新しいスキーマを登録する必要がなくなり、大幅なガスコスト削減
   - スキーマ登録コスト（約500,000 gas）をプラットフォーム全体で一度だけ負担

2. **データ一貫性**:
   - 全DAOで同一構造のデータが保証される
   - 全ての文書が共通フォーマットで管理され、システム互換性が向上

3. **クエリ効率**:
   - 単一のスキーマIDで全DAOまたは全文書を検索可能
   - インデクサーのパフォーマンス向上
   - フロントエンドでの統一的な表示とフィルタリングが容易

4. **拡張性**:
   - 新機能追加時に全DAOに一貫して機能を展開可能
   - アップグレードプロセスの簡素化 