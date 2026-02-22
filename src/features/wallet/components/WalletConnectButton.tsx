'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useNetwork } from '@/features/wallet/hooks/useNetwork';
import { useWalletStore } from '@/features/wallet/stores/walletStore';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WalletConnectButtonInner() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const { isCorrectNetwork, switchToSepolia } = useNetwork();
  const setupListeners = useWalletStore((s) => s.setupListeners);

  useEffect(() => {
    const cleanup = setupListeners();
    return cleanup;
  }, [setupListeners]);

  if (isConnecting) {
    return (
      <Button variant="outline" size="sm" isLoading disabled>
        接続中...
      </Button>
    );
  }

  if (address && !isCorrectNetwork) {
    return (
      <Button variant="danger" size="sm" onClick={switchToSepolia}>
        Sepolia に切替
      </Button>
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
          {shortenAddress(address)}
        </span>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          切断
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="primary" size="sm" onClick={connect}>
        ウォレット接続
      </Button>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export const WalletConnectButton = dynamic(() => Promise.resolve(WalletConnectButtonInner), {
  ssr: false,
});
