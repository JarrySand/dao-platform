'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientOnly from './ClientOnly';

export default function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          DAO Platform
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/daos" className="hover:text-blue-200">
            DAOs
          </Link>
          
          <ClientOnly fallback={<div className="w-20 h-6 bg-blue-500 rounded animate-pulse"></div>}>
            {user ? (
              <>
                <Link href="/my-dao" className="hover:text-blue-200">
                  My DAO
                </Link>
                <div className="flex items-center space-x-2">
                  {user.authType === 'wallet' && user.walletAddress ? (
                    <span className="flex items-center space-x-1 text-sm">
                      <span>⚡</span>
                      <span>{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
                    </span>
                  ) : (
                    <span className="text-sm">{user.name}</span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="hover:text-blue-200">
                  ログイン
                </Link>
                <Link href="/signup" className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded">
                  登録
                </Link>
              </div>
            )}
          </ClientOnly>
        </div>
      </div>
    </nav>
  );
} 