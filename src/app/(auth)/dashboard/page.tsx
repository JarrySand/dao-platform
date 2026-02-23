'use client';

import { useWallet } from '@/features/wallet';
import { StatsCards, RecentActivity, QuickActions } from '@/features/dashboard';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { shortenAddress } from '@/shared/utils/format';

export default function DashboardPage() {
  const { address } = useWallet();

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <PageHeader
        title={address ? `${shortenAddress(address)} のダッシュボード` : 'ダッシュボード'}
        description="DAO ドキュメントプラットフォームの概要"
      />

      <StatsCards />

      <div className="grid gap-8 lg:grid-cols-2">
        <RecentActivity />
        <div className="space-y-8">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
