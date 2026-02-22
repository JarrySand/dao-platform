'use client';

import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useNetwork } from '@/features/wallet/hooks/useNetwork';

export function NetworkSwitcher() {
  const { address } = useWallet();
  const { isCorrectNetwork, switchToSepolia } = useNetwork();

  if (!address || isCorrectNetwork) return null;

  return (
    <Alert variant="warning">
      <div className="flex items-center justify-between gap-4">
        <p>Sepolia テストネットに接続してください。現在のネットワークはサポートされていません。</p>
        <Button variant="outline" size="sm" onClick={switchToSepolia} className="shrink-0">
          Sepolia テストネットに切り替える
        </Button>
      </div>
    </Alert>
  );
}
