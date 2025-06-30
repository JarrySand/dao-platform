export interface DAO {
  id: string;              // ランダムな文字列
  name: string;           // DAO名称
  description: string;    // 説明
  logoUrl?: string;        // ロゴ画像URL（placehold.co使用）
  location: string;       // 所在地
  size: 'small' | 'medium' | 'large';
  foundingDate: string;
  website?: string;
  memberCount: number;    // メンバー数
  trustScore: number;     // 信頼度スコア（0-100）
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
  status: 'active' | 'inactive' | 'pending';  // ステータス
  ownerId: string;        // 運営者ID（メールアドレス）
  contactEmail?: string;
  contactPerson?: string;
  documents?: Document[]; // 関連ドキュメント
  adminAddress?: string;  // EASから取得される管理者ウォレットアドレス
  attestationUID?: string; // EAS証明書のUID
}

export type DocumentType = 
  | 'articles'      // 定款
  | 'meeting'       // DAO総会規程
  | 'token'         // トークン規程
  | 'operation'     // 運営規程
  | 'other';         // その他のタイプ

export interface Document {
  id: string;            // ランダムな文字列
  daoId: string;         // 所属DAOのID
  name: string;          // ファイル名
  type: DocumentType;
  fileUrl: string;       // GitHub上のファイルURL
  hash: string;          // ダミーのハッシュ値
  createdAt: string;     // ISO 8601形式
  updatedAt: string;     // ISO 8601形式
  version: number;       // バージョン番号
  status: 'active' | 'archived';  // ステータス
  ipfsCid?: string;
  ipfsGateway?: string;
  attestationUID?: string;
}

export interface User {
  id: string;           // メールアドレスまたはウォレットアドレス
  email?: string;       // メールアドレス（ウォレット認証の場合は任意）
  walletAddress?: string; // ウォレットアドレス（Web3認証用）
  authType: 'email' | 'wallet'; // 認証タイプ
  daoId?: string;
  name?: string;         // 表示名
  role: 'admin' | 'member' | 'operator' | 'superadmin';  // 権限（一般ユーザーは不要）
  createdAt: string;    // ISO 8601形式
  updatedAt: string;    // ISO 8601形式
  status: 'active' | 'inactive';  // ステータス
  lastLogin?: string;
} 