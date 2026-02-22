'use client';

import { useState, useCallback } from 'react';
import { useDAOs } from '../hooks/useDAOs';
import { DAOCard } from './DAOCard';
import { Input } from '@/shared/components/ui';
import { Select } from '@/shared/components/ui';
import { Skeleton } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui';
import { ErrorDisplay } from '@/shared/components/feedback';
import { EmptyState } from '@/shared/components/feedback';
import { useDebounce } from '@/shared/hooks/useDebounce';

const statusOptions = [
  { label: 'すべて', value: 'all' },
  { label: 'アクティブ', value: 'active' },
  { label: '非アクティブ', value: 'inactive' },
];

function DAOCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Skeleton variant="text" className="h-6 w-2/3" />
        <Skeleton variant="rectangle" className="h-5 w-20" />
      </div>
      <Skeleton variant="text" className="h-4 w-full mb-2" />
      <Skeleton variant="text" className="h-4 w-3/4 mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton variant="rectangle" className="h-5 w-24" />
        <Skeleton variant="text" className="h-3 w-28" />
      </div>
    </div>
  );
}

export function DAOList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, error, refetch } = useDAOs({
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const daos = data?.success ? data.data.data : [];

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="DAO名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            }
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="ステータス"
            options={statusOptions}
            value={statusFilter}
            onValueChange={handleStatusChange}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DAOCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <ErrorDisplay
          message={error?.message || 'DAOの取得中にエラーが発生しました'}
          onRetry={() => refetch()}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && daos.length === 0 && (
        <EmptyState
          message={
            debouncedSearch
              ? `「${debouncedSearch}」に一致するDAOが見つかりませんでした`
              : 'DAOが登録されていません'
          }
        />
      )}

      {/* DAO Grid */}
      {!isLoading && !isError && daos.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {daos.map((dao) => (
              <DAOCard key={dao.id} dao={dao} />
            ))}
          </div>

          {/* Load More */}
          {data?.success && data.data.hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => refetch()}>
                もっと読み込む
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
