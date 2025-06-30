'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { connectWallet, getAvailableWallets, checkWalletConnection } from '@/utils/walletUtils';

interface WalletLoginProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function WalletLogin({ onSuccess, redirectTo = '/my-dao' }: WalletLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);
  const { loginWithWallet } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 利用可能なウォレットを確認
    const wallets = getAvailableWallets();
    setAvailableWallets(wallets);
    console.log('Available wallets:', wallets);
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError('');

      console.log('Starting wallet connection...');

      // ウォレット接続
      const walletAddress = await connectWallet();
      console.log('Connected wallet address:', walletAddress);

      if (!walletAddress) {
        throw new Error('ウォレットアドレスを取得できませんでした');
      }

      // ログイン処理
      console.log('Attempting login with wallet...');
      const success = await loginWithWallet(walletAddress);
      
      console.log('Login result:', success);
      
      if (success) {
        console.log('Login successful, redirecting...');
        
        // onSuccessコールバックが提供されている場合はそれを使用
        if (onSuccess) {
          onSuccess();
        } else {
          // デフォルトの遷移処理
          router.push(redirectTo);
        }
      } else {
        throw new Error('ウォレットログインに失敗しました');
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      setError(error.message || 'ウォレット接続に失敗しました');
    } finally {
      setIsConnecting(false);
    }
  };

  // 主要ウォレットのリスト（検出されなくても表示）
  const allSupportedWallets = [
    { name: 'MetaMask', icon: '🦊' },
    { name: 'Coinbase Wallet', icon: '💙' },
    { name: 'Trust Wallet', icon: '🛡️' },
    { name: 'Rainbow', icon: '🌈' },
    { name: 'WalletConnect', icon: '🔗' },
    { name: 'Brave Wallet', icon: '🦁' },
  ];

  return (
    <div className="space-y-4">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>接続中...</span>
          </>
        ) : (
          <>
            <span>🔗</span>
            <span>Web3ウォレットで接続</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center space-y-3">
        <div className="font-medium">対応ウォレット:</div>
        
        {/* インストール済みウォレット */}
        {availableWallets.length > 0 && (
          <div className="space-y-2">
            <div className="text-green-600 font-medium">検出済み:</div>
            <div className="flex justify-center space-x-3 text-lg">
              {availableWallets.map((wallet, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <span title={wallet.name} className="text-xl">
                    {wallet.icon}
                  </span>
                  <span className="text-xs text-green-600">{wallet.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 全対応ウォレット */}
        <div className="space-y-2">
          <div className="text-gray-600">対応ウォレット一覧:</div>
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
            {allSupportedWallets.map((wallet, index) => (
              <div key={index} className="flex flex-col items-center space-y-1 p-2 bg-gray-50 rounded-lg">
                <span title={wallet.name} className="text-lg">
                  {wallet.icon}
                </span>
                <span className="text-xs text-gray-600 text-center">{wallet.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-gray-400 italic">
          Web3ウォレットを使用してメールアドレス登録なしで<br />
          ブロックチェーン機能をご利用いただけます
        </div>
        
        {availableWallets.length === 0 && (
          <div className="text-amber-600 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="font-medium mb-1">⚠️ ウォレットが検出されませんでした</div>
            <div>上記のいずれかのウォレットをインストールしてページを再読み込みしてください</div>
          </div>
        )}
      </div>
    </div>
  );
} 