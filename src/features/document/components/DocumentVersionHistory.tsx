'use client';

import { useDocumentVersions } from '../hooks/useDocumentVersions';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { formatDate } from '@/shared/utils/format';
import { ExplorerLink } from '@/shared/components/ExplorerLink';
import { cn } from '@/shared/utils/cn';

interface DocumentVersionHistoryProps {
  documentId: string;
}

export function DocumentVersionHistory({ documentId }: DocumentVersionHistoryProps) {
  const { data: versions, isLoading, error } = useDocumentVersions(documentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>バージョン履歴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0" variant="circle" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" variant="text" />
                <Skeleton className="h-3 w-48" variant="text" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>バージョン履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-danger)]">バージョン履歴の取得に失敗しました</p>
        </CardContent>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>バージョン履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="バージョン情報がありません" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>バージョン履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-5 top-0 h-full w-px bg-skin-border" />

          <div className="space-y-6">
            {versions.map((version, index) => {
              const isLatest = index === 0;
              return (
                <div key={version.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                      isLatest
                        ? 'border-primary-500 bg-[var(--color-bg-hover)]'
                        : 'border-skin-border bg-[var(--color-bg-secondary)]',
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs font-bold',
                        isLatest ? 'text-skin-heading' : 'text-[var(--color-text-secondary)]',
                      )}
                    >
                      v{version.version}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      'flex-1 rounded-xl border p-3',
                      isLatest
                        ? 'border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/10'
                        : 'border-skin-border bg-[var(--color-bg-secondary)]',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-skin-heading">{version.title}</span>
                      {isLatest && (
                        <Badge variant="success" size="sm">
                          最新
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                      <span>登録日: {formatDate(version.createdAt)}</span>
                      <span>
                        登録者:{' '}
                        <ExplorerLink
                          type="address"
                          value={version.attester}
                          className="font-mono text-xs text-[var(--color-text-secondary)] hover:underline"
                        />
                      </span>
                    </div>
                    {version.ipfsCid && (
                      <div className="mt-1.5">
                        <a
                          href={`https://ipfs.io/ipfs/${version.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-skin-heading hover:underline"
                        >
                          IPFS: {version.ipfsCid.slice(0, 16)}...
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
