'use client';

import { useWalletStore } from '@/features/wallet/stores/walletStore';

export function useNetwork() {
  const chainId = useWalletStore((s) => s.chainId);
  const isCorrectNetwork = useWalletStore((s) => s.isCorrectNetwork);
  const switchToSepolia = useWalletStore((s) => s.switchToSepolia);

  return { chainId, isCorrectNetwork, switchToSepolia };
}
