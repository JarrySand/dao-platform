'use client';

import { useDAOs } from '../hooks/useDAOs';
import { Skeleton } from '@/shared/components/ui';
import { formatNumber } from '@/shared/utils/format';

interface StatItemProps {
  label: string;
  value: number;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-skin-heading">{formatNumber(value)}</span>
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex items-baseline gap-2">
      <Skeleton variant="text" className="h-8 w-12" />
      <Skeleton variant="text" className="h-4 w-20" />
    </div>
  );
}

export function DAOStats() {
  const { data, isLoading } = useDAOs();

  if (isLoading) {
    return (
      <div className="flex gap-8">
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  const daos = data?.data ?? [];
  const totalDAOs = data?.total ?? daos.length;
  const totalDocuments = daos.reduce((sum, dao) => sum + (dao.documentCount ?? 0), 0);

  return (
    <div className="flex gap-8">
      <StatItem label="登録DAO数" value={totalDAOs} />
      <StatItem label="総ドキュメント数" value={totalDocuments} />
    </div>
  );
}
