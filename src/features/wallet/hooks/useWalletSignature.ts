'use client';

import { useState } from 'react';
import { createVerificationMessage } from '@/shared/lib/wallet/verify';
import type { WalletVerification } from '@/features/wallet/types';

export function useWalletSignature() {
  const [isSigning, setIsSigning] = useState(false);

  const signVerification = async (address: string): Promise<WalletVerification> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('ウォレットが見つかりません');
    }

    setIsSigning(true);
    try {
      const message = createVerificationMessage(address);
      const signature: string = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      return { address, signature, message };
    } finally {
      setIsSigning(false);
    }
  };

  return { signVerification, isSigning };
}
