'use client';

import Link from 'next/link';
import type { DAO } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui';
import { Badge } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import { formatTimestamp } from '@/shared/utils/format';
import { ROUTES } from '@/shared/constants/routes';

export interface DAOCardProps {
  dao: DAO;
  onClick?: () => void;
}

const statusConfig = {
  active: { label: 'アクティブ', variant: 'success' as const },
  inactive: { label: '非アクティブ', variant: 'warning' as const },
  pending: { label: '保留中', variant: 'default' as const },
};

export function DAOCard({ dao, onClick }: DAOCardProps) {
  const truncatedDescription =
    dao.description.length > 100 ? `${dao.description.slice(0, 100)}...` : dao.description;

  const status = statusConfig[dao.status];

  const content = (
    <Card
      className={cn(
        'h-full transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        'dark:hover:border-gray-600',
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1">{dao.name}</CardTitle>
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{truncatedDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {dao.documentCount !== undefined && (
              <Badge variant="outline" size="sm">
                {dao.documentCount} ドキュメント
              </Badge>
            )}
          </div>
          {dao.foundingDate > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              設立: {formatTimestamp(dao.foundingDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link
      href={ROUTES.DAO_DETAIL(dao.id)}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
    >
      {content}
    </Link>
  );
}
