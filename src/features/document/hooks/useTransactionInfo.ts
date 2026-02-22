'use client';

import { useQuery } from '@tanstack/react-query';
import { CHAIN_CONFIG } from '@/config/chains';
import type { TransactionInfo } from '../types';

async function fetchTransactionInfo(
  txHash: string,
  chainId: number,
): Promise<TransactionInfo | null> {
  // Use Etherscan API to fetch transaction info
  const config = CHAIN_CONFIG.sepolia;
  if (chainId !== config.chainId) return null;

  const url = `${config.explorer}/api?module=proxy&action=eth_getTransactionReceipt&txhash=${encodeURIComponent(txHash)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const result = data.result;
  if (!result || !result.blockNumber) return null;

  return {
    blockNumber: parseInt(result.blockNumber, 16),
    timestamp: Date.now(),
    txHash,
    chainId,
  };
}

export function useTransactionInfo(txHash: string | null, chainId: number | null) {
  return useQuery({
    queryKey: ['tx-info', txHash, chainId],
    queryFn: () => {
      if (!txHash || !chainId) return null;
      return fetchTransactionInfo(txHash, chainId);
    },
    enabled: !!txHash && !!chainId,
    staleTime: Infinity,
  });
}
