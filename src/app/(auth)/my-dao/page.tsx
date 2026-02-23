'use client';

import Link from 'next/link';
import { useMyDAOs, type DAO } from '@/features/dao';
import { useWallet, WalletConnectButton } from '@/features/wallet';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { ErrorDisplay } from '@/shared/components/feedback/ErrorDisplay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ROUTES } from '@/shared/constants/routes';
import { shortenAddress } from '@/shared/utils/format';

export default function MyDaoPage() {
  const { address } = useWallet();
  const { data, isLoading, error, refetch } = useMyDAOs(address ?? undefined);

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="マイ DAO" description="DAO を管理するにはウォレットを接続してください" />
        <div className="mt-8 flex flex-col items-center gap-4">
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="マイ DAO" />
        <LoadingSpinner center size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="マイ DAO" />
        <ErrorDisplay message="DAO の取得に失敗しました" onRetry={() => refetch()} />
      </div>
    );
  }

  const daos = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="マイ DAO"
        description={`${shortenAddress(address)} で管理している DAO`}
        actions={
          <Link href={ROUTES.MY_DAO_CREATE}>
            <Button>新規 DAO 作成</Button>
          </Link>
        }
      />

      {daos.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            message="管理している DAO がありません。最初の DAO を作成しましょう。"
            actionLabel="DAO を作成"
            onAction={() => {
              window.location.href = ROUTES.MY_DAO_CREATE;
            }}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {daos.map((dao: DAO) => (
            <Link key={dao.id} href={ROUTES.MY_DAO_DETAIL(dao.id)}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-skin-heading">{dao.name}</h3>
                    <Badge variant={dao.status === 'active' ? 'success' : 'error'} size="sm">
                      {dao.status === 'active' ? '有効' : '無効'}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                    {dao.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
                    <span>{dao.location}</span>
                    <span>{dao.memberCount}人</span>
                    {dao.documentCount !== undefined && (
                      <span>{dao.documentCount}件のドキュメント</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
