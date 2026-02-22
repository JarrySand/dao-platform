'use client';

import type { Document, DocumentType } from '../types';
import { getIPFSUrl } from '@/shared/lib/ipfs/gateway';
import { formatDate, shortenAddress } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { Card, CardContent, CardFooter, Badge, Button } from '@/shared/components/ui';
import { useTransactionInfo } from '../hooks/useTransactionInfo';

interface DocumentCardProps {
  document: Document;
  isAdmin?: boolean;
  onRevoke?: (id: string) => void;
}

const typeLabels: Record<DocumentType, string> = {
  articles: '定款',
  meeting: '議事録',
  token: 'トークン',
  operation: '運営',
  voting: '投票',
  other: 'その他',
};

const typeBadgeVariant: Record<
  DocumentType,
  'default' | 'success' | 'warning' | 'error' | 'outline'
> = {
  articles: 'default',
  meeting: 'success',
  token: 'warning',
  operation: 'outline',
  voting: 'error',
  other: 'default',
};

function VotingTxSummary({ txHash, chainId }: { txHash: string; chainId: number }) {
  const { data: txInfo } = useTransactionInfo(txHash, chainId);

  return (
    <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-700/50">
      <p className="font-medium text-gray-700 dark:text-gray-300">投票トランザクション</p>
      <p className="truncate text-gray-500 dark:text-gray-400">TX: {shortenAddress(txHash, 8)}</p>
      {txInfo && <p className="text-gray-500 dark:text-gray-400">Block: {txInfo.blockNumber}</p>}
    </div>
  );
}

export function DocumentCard({ document, isAdmin, onRevoke }: DocumentCardProps) {
  const isActive = document.status === 'active';

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {document.title}
          </h3>
          <Badge variant={isActive ? 'success' : 'error'} size="sm">
            {isActive ? '有効' : '失効'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={typeBadgeVariant[document.documentType]} size="sm">
            {typeLabels[document.documentType]}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">v{document.version}</span>
        </div>

        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <p>登録者: {shortenAddress(document.attester)}</p>
          <p>登録日: {formatDate(document.createdAt)}</p>
        </div>

        {document.votingTxHash && document.votingChainId && (
          <VotingTxSummary txHash={document.votingTxHash} chainId={document.votingChainId} />
        )}
      </CardContent>

      <CardFooter className={cn('gap-2', !isAdmin && 'justify-end')}>
        {isAdmin && isActive && onRevoke && (
          <Button variant="danger" size="sm" onClick={() => onRevoke(document.id)}>
            失効
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.open(getIPFSUrl(document.ipfsCid), '_blank', 'noopener,noreferrer');
          }}
        >
          ダウンロード
        </Button>
      </CardFooter>
    </Card>
  );
}
