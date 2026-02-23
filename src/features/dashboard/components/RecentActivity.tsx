'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useRecentActivity, type ActivityItem } from '../hooks/useRecentActivity';
import { formatRelativeTime } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import {
  BuildingIcon as BuildingPlusIcon,
  DocumentPlusIcon,
  DocumentMinusIcon,
} from '@/shared/components/icons';

const TYPE_CONFIG: Record<
  ActivityItem['type'],
  { label: string; color: string; Icon: (props: { className?: string }) => React.JSX.Element }
> = {
  dao_created: {
    label: 'DAO 作成',
    color: 'text-blue-600 dark:text-blue-400',
    Icon: BuildingPlusIcon,
  },
  document_registered: {
    label: 'ドキュメント登録',
    color: 'text-[var(--color-success)]',
    Icon: DocumentPlusIcon,
  },
  document_revoked: {
    label: 'ドキュメント無効化',
    color: 'text-[var(--color-danger)]',
    Icon: DocumentMinusIcon,
  },
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近のアクティビティ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 shrink-0" variant="circle" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" variant="text" />
                <Skeleton className="h-3 w-24" variant="text" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近のアクティビティ</CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <EmptyState message="まだアクティビティがありません" />
        ) : (
          <div className="space-y-4">
            {activities.map((item) => {
              const config = TYPE_CONFIG[item.type];
              return (
                <Link
                  key={item.id}
                  href={item.link}
                  className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--color-bg-hover)]"
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-hover)]',
                    )}
                  >
                    <config.Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-skin-heading">
                      <span className={cn('font-medium', config.color)}>{config.label}</span>
                      {' - '}
                      {item.title}
                    </p>
                    {item.daoName && (
                      <p className="text-xs text-[var(--color-text-secondary)]">{item.daoName}</p>
                    )}
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
