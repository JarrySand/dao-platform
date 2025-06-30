# 🔧 技術的負債解決計画

## 📋 優先度別アクションプラン

### 🚨 緊急対応（Priority 1: 今日〜3日以内）

#### 1. スキーマID統一
**現状**: 複数ファイルで異なるスキーマIDを使用
**影響**: DAO表示不具合、データ不整合

**解決手順**:
```bash
# 1. 環境変数ファイル作成
echo "NEXT_PUBLIC_DAO_SCHEMA_UID=0x27d06e3659317e9a4f8154d1e849eb53d43d91fb4f219884d1684f86d797804a" > .env.local
echo "NEXT_PUBLIC_DOCUMENT_SCHEMA_UID=0x27d06e3659317e9a4f8154d1e849eb53d43d91fb4f219884d1684f86d797804a" >> .env.local

# 2. 設定ファイル統一
# src/config/eas.ts を作成
```

**修正対象ファイル**:
- [x] `src/contexts/EasContext.tsx`
- [ ] `src/app/signup/page.tsx`
- [ ] `src/utils/easSchema.ts`
- [ ] `src/components/DocumentRegister.tsx`
- [ ] `src/components/EasStatus.tsx`

#### 2. エラーハンドリング強化
**現状**: EAS Scan依存によるサービス停止

**解決手順**:
```typescript
// utils/easFallback.ts
export const withFallback = async <T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await primaryFn();
  } catch (error) {
    console.warn(`${errorMessage}, using fallback:`, error);
    return await fallbackFn();
  }
};
```

### ⚡ 高優先度（Priority 2: 1週間以内）

#### 3. 型安全性向上
**現状**: `any` 型の多用、型定義不整合

**対象ファイル**:
```typescript
// types/eas.ts - 新規作成
export interface EASAttestation {
  uid: string;
  schema: string;
  data: Record<string, any>; // 具体的な型に変更
  attester: string;
  recipient: string;
  time: number;
  revoked: boolean;
}

// types/dao.ts - 強化
export interface DAO {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  location: string;
  size: 'small' | 'medium' | 'large';
  memberCount: number;
  trustScore: number;
  status: 'active' | 'pending' | 'inactive';
  ownerId: string;
  attestationUID?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 4. 環境設定整備
```bash
# .env.local テンプレート
NEXT_PUBLIC_DAO_SCHEMA_UID=
NEXT_PUBLIC_DOCUMENT_SCHEMA_UID=
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_NETWORK_CHAIN_ID=11155111
```

### 🔄 中優先度（Priority 3: 2週間以内）

#### 5. コンポーネントリファクタリング
**問題**: Props型安全性、再利用性

**リファクタリング対象**:
```typescript
// components/common/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

// components/common/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

#### 6. 状態管理最適化
**問題**: Context責務分散、不要な再レンダリング

**改善案**:
```typescript
// contexts/AppProvider.tsx - 統合管理
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <EasProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </EasProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
```

### 📈 低優先度（Priority 4: 1ヶ月以内）

#### 7. テスト実装
```bash
# テスト環境セットアップ
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jest-environment-jsdom
```

**テスト対象**:
- [ ] Utils関数（fileHash.ts, easQuery.ts）
- [ ] Contextロジック（AuthContext, EasContext）
- [ ] コンポーネント（WalletConnectButton, DocumentRegister）

#### 8. パフォーマンス最適化
- [ ] Code Splitting実装
- [ ] 画像最適化
- [ ] Bundle分析
- [ ] Lazy Loading

## 🔍 コードレビューチェックリスト

### TypeScript
- [ ] `any` 型を使用していない
- [ ] 全てのpropsに型定義がある
- [ ] オプショナルプロパティが適切にマークされている

### React
- [ ] useEffectの依存配列が正しい
- [ ] 不要な再レンダリングが発生していない
- [ ] メモ化が適切に使用されている

### ブロックチェーン
- [ ] エラーハンドリングが実装されている
- [ ] ガス使用量が最適化されている
- [ ] ネットワーク切り替えに対応している

### セキュリティ
- [ ] 入力値検証が実装されている
- [ ] 秘密鍵がハードコーディングされていない
- [ ] XSS対策が実装されている

## 📊 進捗トラッキング

### 完了済み ✅
- [x] プロジェクト現状分析
- [x] 課題特定と優先度付け

### 進行中 🟡
- [ ] スキーマID統一（50%）
- [ ] エラーハンドリング強化（30%）

### 未着手 ⚪
- [ ] 型安全性向上
- [ ] 環境設定整備
- [ ] コンポーネントリファクタリング
- [ ] テスト実装

## 🎯 マイルストーン

### Week 1: 安定化
- スキーマID統一完了
- 基本的なエラーハンドリング実装
- 環境変数設定

### Week 2: 品質向上
- 型安全性向上
- コンポーネントリファクタリング開始
- ユニットテスト実装開始

### Week 3-4: 機能拡張
- ドキュメント管理機能完成
- IPFS统合強化
- 本格的なテスト実装

---

**更新履歴**:
- 2024/12: 初回作成
- 進捗に応じて週次更新予定 