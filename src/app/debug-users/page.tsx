'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'operator';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

export default function DebugUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState('cccc@example.com');

  useEffect(() => {
    // ローカルストレージからユーザーデータを取得
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    setUsers(storedUsers);
  }, []);

  const targetUser = users.find(u => u.email === searchEmail);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🔍 ユーザーデータ デバッグ</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          検索するメールアドレス:
        </label>
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="user@example.com"
        />
      </div>

      {targetUser ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            ✅ ユーザー情報が見つかりました
          </h2>
          <div className="space-y-2">
            <div><strong>ID:</strong> {targetUser.id}</div>
            <div><strong>メール:</strong> {targetUser.email}</div>
            <div><strong>名前:</strong> {targetUser.name}</div>
            <div><strong>パスワード:</strong> 
              <span className="bg-yellow-100 px-2 py-1 rounded font-mono text-sm ml-2">
                {targetUser.password}
              </span>
            </div>
            <div><strong>ロール:</strong> {targetUser.role}</div>
            <div><strong>ステータス:</strong> {targetUser.status}</div>
            <div><strong>作成日:</strong> {new Date(targetUser.createdAt).toLocaleString()}</div>
            <div><strong>更新日:</strong> {new Date(targetUser.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            ❌ ユーザーが見つかりません
          </h2>
          <p className="text-red-600">
            「{searchEmail}」のユーザーデータは存在しません。
          </p>
        </div>
      )}

      <div className="bg-gray-50 border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          📋 全ユーザー一覧 ({users.length}件)
        </h2>
        {users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user, index) => (
              <div key={user.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-semibold">{user.name} ({user.email})</div>
                <div className="text-sm text-gray-600">
                  パスワード: <span className="font-mono bg-gray-200 px-1 rounded">{user.password}</span>
                  {' | '}
                  ロール: {user.role}
                  {' | '}
                  ステータス: {user.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            ローカルストレージにユーザーデータが保存されていません。
          </p>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 使用方法</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• このページは開発・デバッグ用です</li>
          <li>• ユーザーデータはブラウザのローカルストレージに保存されています</li>
          <li>• 新規ユーザー登録は /signup ページから行えます</li>
          <li>• ログインは /login ページから行えます</li>
        </ul>
      </div>
    </div>
  );
} 