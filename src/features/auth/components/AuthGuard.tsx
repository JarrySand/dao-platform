'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/features/wallet/stores/walletStore';
import { WalletConnectButton } from '@/features/wallet/components/WalletConnectButton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const address = useWalletStore((s) => s.address);
  const setupListeners = useWalletStore((s) => s.setupListeners);

  useEffect(() => {
    const cleanup = setupListeners();
    return cleanup;
  }, [setupListeners]);

  if (!address) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-skin-heading">ウォレットを接続してください</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            この機能を利用するには MetaMask ウォレットの接続が必要です
          </p>
        </div>
        <WalletConnectButton />
      </div>
    );
  }

  return <>{children}</>;
}
