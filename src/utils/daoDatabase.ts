import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/daoDatabase.json');

export interface DAODetails {
  id: string; // daoUID (EASと同じ)
  name: string;
  description: string;
  location: string;
  size: 'small' | 'medium' | 'large';
  memberCount: number;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  contactPerson?: string;
  trustScore: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

interface DatabaseSchema {
  daos: DAODetails[];
}

// データベースファイルを読み込む
export function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // ファイルが存在しない場合は初期化
      const initialData: DatabaseSchema = { daos: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read database:', error);
    return { daos: [] };
  }
}

// データベースファイルに書き込む
export function writeDatabase(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to write database:', error);
    throw error;
  }
}

// DAOを追加
export function addDAO(dao: DAODetails): void {
  const db = readDatabase();
  
  // 重複チェック
  const existingIndex = db.daos.findIndex(d => d.id === dao.id);
  if (existingIndex !== -1) {
    throw new Error(`DAO with ID ${dao.id} already exists`);
  }
  
  db.daos.push(dao);
  writeDatabase(db);
}

// DAOを更新
export function updateDAO(id: string, updates: Partial<DAODetails>): void {
  const db = readDatabase();
  const index = db.daos.findIndex(d => d.id === id);
  
  if (index === -1) {
    throw new Error(`DAO with ID ${id} not found`);
  }
  
  db.daos[index] = { ...db.daos[index], ...updates, updatedAt: new Date().toISOString() };
  writeDatabase(db);
}

// DAOを取得（ID指定）
export function getDAO(id: string): DAODetails | null {
  const db = readDatabase();
  return db.daos.find(d => d.id === id) || null;
}

// 全DAOを取得
export function getAllDAOs(): DAODetails[] {
  const db = readDatabase();
  return db.daos;
}

// DAOを削除
export function deleteDAO(id: string): void {
  const db = readDatabase();
  const index = db.daos.findIndex(d => d.id === id);
  
  if (index === -1) {
    throw new Error(`DAO with ID ${id} not found`);
  }
  
  db.daos.splice(index, 1);
  writeDatabase(db);
}

// DAO名で検索
export function getDAOByName(name: string): DAODetails | null {
  const db = readDatabase();
  return db.daos.find(d => d.name === name) || null;
} 