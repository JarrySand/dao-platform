'use client';

import { useMemo, useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { useRevokeDocument } from '../hooks/useRevokeDocument';
import type { Document } from '../types';
import { DocumentCard } from './DocumentCard';
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Button } from '@/shared/components/ui';
import { Skeleton } from '@/shared/components/ui';
import { ErrorDisplay, EmptyState } from '@/shared/components/feedback';
import { useDebounce } from '@/shared/hooks';

interface DocumentListProps {
  daoId: string;
  isAdmin?: boolean;
}

const TYPE_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'articles', label: '定款' },
  { value: 'assembly_rules', label: 'DAO総会規程' },
  { value: 'operation_rules', label: '運営規程' },
  { value: 'token_rules', label: 'トークン規程' },
  { value: 'custom_rules', label: 'カスタム規程' },
  { value: 'proposal', label: '投票議題' },
  { value: 'minutes', label: '議事録' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '有効' },
  { value: 'revoked', label: '失効' },
];

const ITEMS_PER_PAGE = 12;

function DocumentSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-skin-border p-6">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function DocumentList({ daoId, isAdmin }: DocumentListProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [txSearch, setTxSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedTxSearch = useDebounce(txSearch, 300);

  const { data: documents, isLoading, error, refetch } = useDocuments({ daoId });
  const revokeMutation = useRevokeDocument();

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    let result = documents as Document[];

    if (typeFilter !== 'all') {
      result = result.filter((doc) => doc.documentType === typeFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((doc) => doc.status === statusFilter);
    }

    if (debouncedTxSearch) {
      const search = debouncedTxSearch.toLowerCase();
      result = result.filter((doc) => doc.votingTxHash?.toLowerCase().includes(search));
    }

    return result;
  }, [documents, typeFilter, statusFilter, debouncedTxSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE));
  const paginatedDocuments = filteredDocuments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleRevoke = (id: string) => {
    // C4: Only allow revoking the latest version in a chain
    if (documents) {
      const hasSuccessor = (documents as Document[]).some(
        (d) => d.previousVersionId === id && d.status !== 'revoked',
      );
      if (hasSuccessor) {
        window.alert('最新版のみ失効できます。より新しいバージョンが存在します。');
        return;
      }
    }
    if (window.confirm('このドキュメントを失効させますか？')) {
      revokeMutation.mutate(id);
    }
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  if (isLoading) {
    return <DocumentSkeletons />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : 'ドキュメントの取得に失敗しました'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={typeFilter} onValueChange={handleTypeChange}>
        <div className="overflow-x-auto">
          <TabsList>
            {TYPE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={statusFilter === opt.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <div className="flex-1 sm:max-w-xs">
            <Input
              placeholder="TX ハッシュで検索..."
              value={txSearch}
              onChange={(e) => {
                setTxSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {TYPE_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {paginatedDocuments.length === 0 ? (
              <EmptyState message="ドキュメントが見つかりません" />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    isAdmin={isAdmin}
                    onRevoke={handleRevoke}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            前へ
          </Button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
