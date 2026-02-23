'use client';

import { useWalletStore } from '@/features/wallet/stores/walletStore';

export function useAuth() {
  const address = useWalletStore((s) => s.address);
  const isConnecting = useWalletStore((s) => s.isConnecting);
  const error = useWalletStore((s) => s.error);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);

  return {
    address,
    isAuthenticated: address !== null,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}

export function useAuthUser() {
  return useWalletStore((s) => s.address);
}

export function useIsAuthenticated() {
  return useWalletStore((s) => s.address) !== null;
}
