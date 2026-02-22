'use client';

import { useAuth } from '@/features/auth';
import { StatsCards, RecentActivity, QuickActions } from '@/features/dashboard';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner center size="lg" />;
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <PageHeader
        title={user ? `${user.displayName ?? 'ユーザー'}さん、おかえりなさい` : 'ダッシュボード'}
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
