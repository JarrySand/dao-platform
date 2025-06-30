'use client';

import { useState, useEffect } from 'react';
import { useEas } from '@/contexts/EasContext';

interface WalletConnectButtonProps {
  className?: string;
}

export default function WalletConnectButton({ className = '' }: WalletConnectButtonProps) {
  const { connect, disconnect, isConnected, signer } = useEas();
  const [address, setAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const getAddress = async () => {
      if (isConnected && signer) {
        try {
          const addr = await signer.getAddress();
          setAddress(addr);
        } catch (err) {
          console.error('Error getting address:', err);
        }
      } else {
        setAddress('');
      }
    };

    getAddress();
  }, [isConnected, signer]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      await connect();
    } catch (err) {
      console.error('Connection error:', err);
      setError('ウォレット接続に失敗しました');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setAddress('');
  };

  // Format address for display (e.g., 0x1234...5678)
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className={`flex items-center ${className}`}>
      {isConnected ? (
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-white bg-opacity-20 text-white rounded-md text-sm font-medium">
            {formatAddress(address)}
          </span>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            切断
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-white hover:bg-opacity-30 transition-colors disabled:bg-opacity-10 disabled:cursor-not-allowed"
        >
          {isConnecting ? '接続中...' : 'ウォレット接続'}
        </button>
      )}
      
      {error && (
        <div className="ml-2 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
} 