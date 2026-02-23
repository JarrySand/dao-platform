'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { getAddressExplorerUrl } from '@/shared/utils/explorer';

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
    <div className="rounded-lg border border-skin-border p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
        接続中のウォレット
      </h3>
      <div className="space-y-2">
        <div>
          <span className="text-xs text-[var(--color-text-secondary)]">アドレス</span>
          <div className="flex items-center gap-1">
            <a
              href={getAddressExplorerUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="block flex-1 truncate rounded bg-[var(--color-bg-hover)] px-2 py-1 text-left font-mono text-sm text-skin-heading hover:underline"
              title={address}
            >
              {address}
            </a>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 rounded px-1.5 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
              title="コピー"
            >
              {copied ? 'コピー済み' : 'コピー'}
            </button>
          </div>
        </div>
        <div>
          <span className="text-xs text-[var(--color-text-secondary)]">ネットワーク</span>
          <p className="text-sm text-skin-heading">{chainName}</p>
        </div>
      </div>
    </div>
  );
}
