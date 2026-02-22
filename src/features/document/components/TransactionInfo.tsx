'use client';

import { useTransactionInfo } from '../hooks/useTransactionInfo';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { formatTimestamp } from '@/shared/utils/format';

interface TransactionInfoProps {
  txHash: string;
  chainId: number;
}

export function TransactionInfo({ txHash, chainId }: TransactionInfoProps) {
  const { data: txInfo, isLoading } = useTransactionInfo(txHash, chainId);
  const { copy, copied } = useCopyToClipboard();

  const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>トランザクション情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" variant="text" />
          <Skeleton className="h-4 w-48" variant="text" />
          <Skeleton className="h-4 w-32" variant="text" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>トランザクション情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* TX Hash */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">トランザクションハッシュ</p>
          <div className="mt-1 flex items-center gap-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-mono text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              {txHash}
            </a>
            <Button variant="ghost" size="sm" onClick={() => copy(txHash)} className="shrink-0">
              {copied ? 'コピー済' : 'コピー'}
            </Button>
          </div>
        </div>

        {/* Block Number */}
        {txInfo && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">ブロック番号</p>
            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
              {txInfo.blockNumber.toLocaleString()}
            </p>
          </div>
        )}

        {/* Timestamp */}
        {txInfo && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">タイムスタンプ</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatTimestamp(Math.floor(txInfo.timestamp / 1000))}
            </p>
          </div>
        )}

        {/* Etherscan Link */}
        <div className="pt-2">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
          >
            Etherscan で表示
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
