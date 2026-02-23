'use client';

import type { Document, DocumentType } from '../types';
import { getIPFSUrl } from '@/shared/lib/ipfs/gateway';
import { formatDate, shortenAddress } from '@/shared/utils/format';
import { ExplorerLink } from '@/shared/components/ExplorerLink';
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
  assembly_rules: 'DAO総会規程',
  operation_rules: '運営規程',
  token_rules: 'トークン規程',
  custom_rules: 'カスタム規程',
  proposal: '投票議題',
  minutes: '議事録',
};

const typeBadgeVariant: Record<
  DocumentType,
  'default' | 'success' | 'warning' | 'error' | 'outline'
> = {
  articles: 'default',
  assembly_rules: 'success',
  operation_rules: 'outline',
  token_rules: 'warning',
  custom_rules: 'default',
  proposal: 'error',
  minutes: 'success',
};

function VotingTxSummary({ txHash, chainId }: { txHash: string; chainId: number }) {
  const { data: txInfo } = useTransactionInfo(txHash, chainId);

  return (
    <div className="mt-2 rounded-md bg-[var(--color-bg-hover)] p-2 text-xs">
      <p className="font-medium text-skin-heading">投票トランザクション</p>
      <p className="truncate text-[var(--color-text-secondary)]">
        TX:{' '}
        <ExplorerLink
          type="tx"
          value={txHash}
          chars={8}
          className="font-mono text-xs text-[var(--color-text-secondary)] hover:underline"
        />
      </p>
      {txInfo && <p className="text-[var(--color-text-secondary)]">Block: {txInfo.blockNumber}</p>}
    </div>
  );
}

export function DocumentCard({ document, isAdmin, onRevoke }: DocumentCardProps) {
  const isActive = document.status === 'active';

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-skin-heading">{document.title}</h3>
          <Badge variant={isActive ? 'success' : 'error'} size="sm">
            {isActive ? '有効' : '失効'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={typeBadgeVariant[document.documentType]} size="sm">
            {typeLabels[document.documentType]}
          </Badge>
          <span className="text-xs text-[var(--color-text-secondary)]">v{document.version}</span>
        </div>

        <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
          <p>
            登録者:{' '}
            <ExplorerLink
              type="address"
              value={document.attester}
              className="font-mono text-xs text-[var(--color-text-secondary)] hover:underline"
            />
          </p>
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
