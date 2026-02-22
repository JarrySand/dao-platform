'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@/features/wallet/hooks/useWallet';

export function WalletInfo() {
  const { address, chainId } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  if (!address) return null;

  const chainName = chainId === '0xaa36a7' ? 'Sepolia Testnet' : `Chain ${chainId}`;

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        接続中のウォレット
      </h3>
      <div className="space-y-2">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">アドレス</span>
          <button
            type="button"
            onClick={copyAddress}
            className="block w-full truncate rounded bg-gray-50 px-2 py-1 text-left font-mono text-sm text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            title="クリックしてコピー"
          >
            {address}
            {copied && (
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">コピー済み</span>
            )}
          </button>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">ネットワーク</span>
          <p className="text-sm text-gray-900 dark:text-gray-100">{chainName}</p>
        </div>
      </div>
    </div>
  );
}
