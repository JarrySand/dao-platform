'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useRecentActivity, type ActivityItem } from '../hooks/useRecentActivity';
import { formatRelativeTime } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

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
    color: 'text-green-600 dark:text-green-400',
    Icon: DocumentPlusIcon,
  },
  document_revoked: {
    label: 'ドキュメント無効化',
    color: 'text-red-600 dark:text-red-400',
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
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700',
                    )}
                  >
                    <config.Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className={cn('font-medium', config.color)}>{config.label}</span>
                      {' - '}
                      {item.title}
                    </p>
                    {item.daoName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.daoName}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
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

function BuildingPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-12.5a.75.75 0 010-1.5H4zm3-11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 5.5zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM7 11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 11zm4-5.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 0111 5.5zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM11 11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 0111 11zm-2 3.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 019 14.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DocumentPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zm7.75 6a.75.75 0 00-1.5 0v1.25H8a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0v-1.25H12a.75.75 0 000-1.5h-1.25V9.5z" />
    </svg>
  );
}

function DocumentMinusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zM7.25 11a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z" />
    </svg>
  );
}
