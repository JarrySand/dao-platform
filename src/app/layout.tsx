'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { EasProvider } from '@/contexts/EasContext';
import Navbar from '@/components/Navbar';
import ClientOnly from '@/components/ClientOnly';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // クライアントサイドでのみモックデータを初期化
    if (typeof window !== 'undefined') {
      const initializeMockData = async () => {
        if (!localStorage.getItem('daos')) {
          const { initializeMockData } = await import('@/utils/mockData');
          initializeMockData();
        }
      };
      initializeMockData();
    }
  }, []);

  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <EasProvider>
            <ClientOnly fallback={<div className="bg-blue-600 h-16 w-full animate-pulse"></div>}>
              <Navbar />
            </ClientOnly>
            {children}
          </EasProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
