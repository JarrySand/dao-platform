'use client';

import { useWalletStore } from '@/features/wallet/stores/walletStore';

export function useWallet() {
  const address = useWalletStore((s) => s.address);
  const chainId = useWalletStore((s) => s.chainId);
  const isConnecting = useWalletStore((s) => s.isConnecting);
  const isCorrectNetwork = useWalletStore((s) => s.isCorrectNetwork);
  const error = useWalletStore((s) => s.error);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);

  return {
    address,
    chainId,
    isConnecting,
    isCorrectNetwork,
    error,
    connect,
    disconnect,
  };
}

export function useWalletAddress() {
  return useWalletStore((s) => s.address);
}
