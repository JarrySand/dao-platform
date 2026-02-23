'use client';

import { useMemo, useState } from 'react';
import { useDAO } from '../hooks/useDAO';
import { useDocuments } from '@/features/document/hooks/useDocuments';
import { DocumentCard } from '@/features/document/components/DocumentCard';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/shared/components/ui';
import { Skeleton } from '@/shared/components/ui';
import { ErrorDisplay, EmptyState } from '@/shared/components/feedback';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { formatDate, formatRelativeTime } from '@/shared/utils/format';
import { ExplorerLink } from '@/shared/components/ExplorerLink';
import { cn } from '@/shared/utils/cn';
import { DocumentPlusIcon, DocumentMinusIcon } from '@/shared/components/icons';
import { getIPFSUrl } from '@/shared/lib/ipfs/gateway';
import type { Document, DocumentType } from '@/features/document/types';
import { isRegulationType } from '@/features/document/types';

export interface DAODetailProps {
  daoId: string;
}

const statusConfig = {
  active: { label: 'アクティブ', variant: 'success' as const },
  inactive: { label: '非アクティブ', variant: 'warning' as const },
  pending: { label: '保留中', variant: 'default' as const },
};

const sizeLabels: Record<string, string> = {
  small: '小規模',
  medium: '中規模',
  large: '大規模',
};

const typeLabels: Record<DocumentType, string> = {
  articles: '定款',
  assembly_rules: 'DAO総会規程',
  operation_rules: '運営規程',
  token_rules: 'トークン規程',
  custom_rules: 'カスタム規程',
  proposal: '投票議題',
  minutes: '議事録',
};

/* ── Chevron icon (reused in multiple toggle sections) ── */
function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={cn(
        'h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform',
        open && 'rotate-180',
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/* ── Compact regulation row with toggle for details ── */
function RegulationRow({ document: doc }: { document: Document }) {
  const [open, setOpen] = useState(false);
  const isActive = doc.status === 'active';

  return (
    <div className="border-b border-skin-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[var(--color-bg-hover)]"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-skin-heading">
          {doc.title}
        </span>
        <Badge variant={isActive ? 'success' : 'error'} size="sm">
          {isActive ? '有効' : '失効'}
        </Badge>
        <span className="shrink-0 text-xs text-[var(--color-text-tertiary)]">v{doc.version}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="px-2 pb-3 pt-1">
          <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
            <p>種別: {typeLabels[doc.documentType]}</p>
            <p>
              登録者:{' '}
              <ExplorerLink
                type="address"
                value={doc.attester}
                className="font-mono text-xs text-[var(--color-text-secondary)] hover:underline"
              />
            </p>
            <p>登録日: {formatDate(doc.createdAt)}</p>
          </div>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getIPFSUrl(doc.ipfsCid), '_blank', 'noopener,noreferrer')}
            >
              ダウンロード
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <Skeleton variant="text" className="h-6 w-20" />
            <Skeleton variant="text" className="h-6 w-16" />
          </div>
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-3/4" />
          <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton variant="text" className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-28 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className={cn(
        'ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-xs transition-colors',
        copied
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          : 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
      )}
      title="コピー"
    >
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  );
}

interface ActivityEntry {
  id: string;
  title: string;
  type: 'registered' | 'revoked';
  createdAt: string;
}

export function DAODetail({ daoId }: DAODetailProps) {
  const { data, isLoading, isError, error, refetch } = useDAO(daoId);
  const { data: documents, isLoading: docsLoading } = useDocuments({ daoId });
  const [chainOpen, setChainOpen] = useState(false);

  const { regulations, proposalsAndMinutes, activity } = useMemo(() => {
    if (!documents) return { regulations: [], proposalsAndMinutes: [], activity: [] };

    const docs = documents as Document[];
    const regs = docs
      .filter((d) => isRegulationType(d.documentType))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const propsAndMins = docs
      .filter((d) => d.documentType === 'proposal' || d.documentType === 'minutes')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const act: ActivityEntry[] = docs
      .map((d) => ({
        id: d.id,
        title: d.title,
        type: (d.status === 'revoked' ? 'revoked' : 'registered') as ActivityEntry['type'],
        createdAt: d.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return { regulations: regs, proposalsAndMinutes: propsAndMins, activity: act };
  }, [documents]);

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <ErrorDisplay
        message={error?.message || 'DAOの取得中にエラーが発生しました'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data?.success) {
    return <ErrorDisplay message="DAOが見つかりませんでした" />;
  }

  const dao = data.data;
  const status = statusConfig[dao.status];

  const foundingYear =
    dao.foundingDate > 0
      ? new Date(dao.foundingDate * 1000).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'short',
        })
      : '—';

  let websiteHost = '';
  if (dao.website) {
    try {
      websiteHost = new URL(dao.website).hostname;
    } catch {
      websiteHost = dao.website;
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Hero: Overview ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="outline">{sizeLabels[dao.size] || dao.size}</Badge>
            {websiteHost && (
              <a
                href={dao.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-text-secondary)] hover:text-skin-heading hover:underline"
              >
                {websiteHost}&thinsp;↗
              </a>
            )}
          </div>

          {dao.description && (
            <p className="mb-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {dao.description}
            </p>
          )}

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-[var(--color-bg-hover)] p-3 text-center">
              <p className="text-lg font-bold text-skin-heading">
                {dao.memberCount.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">メンバー</p>
            </div>
            <div className="rounded-lg bg-[var(--color-bg-hover)] p-3 text-center">
              <p className="text-lg font-bold text-skin-heading">{dao.documentCount ?? 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">ドキュメント</p>
            </div>
            <div className="rounded-lg bg-[var(--color-bg-hover)] p-3 text-center">
              <p className="truncate text-lg font-bold text-skin-heading">{dao.location || '—'}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">所在地</p>
            </div>
            <div className="rounded-lg bg-[var(--color-bg-hover)] p-3 text-center">
              <p className="text-lg font-bold text-skin-heading">{foundingYear}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">設立</p>
            </div>
          </div>

          {/* Contact inline */}
          {(dao.contactPerson || dao.contactEmail) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
              {dao.contactPerson && <span>担当: {dao.contactPerson}</span>}
              {dao.contactEmail && (
                <a href={`mailto:${dao.contactEmail}`} className="hover:underline">
                  {dao.contactEmail}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Two-column: Left = Regulations, Right = Votes/Minutes + Activity ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Regulations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>定款・規程類</CardTitle>
              {regulations.length > 0 && (
                <Badge variant="outline" size="sm">
                  {regulations.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : regulations.length === 0 ? (
              <EmptyState message="規程類はまだ登録されていません" />
            ) : (
              <div>
                {regulations.map((doc) => (
                  <RegulationRow key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Proposals/Minutes + Activity (scrollable) */}
        <div className="space-y-6 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
          {/* Proposals & Minutes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>投票・議事録</CardTitle>
                {proposalsAndMinutes.length > 0 && (
                  <Badge variant="outline" size="sm">
                    {proposalsAndMinutes.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : proposalsAndMinutes.length === 0 ? (
                <EmptyState message="投票議題・議事録はまだありません" />
              ) : (
                <div className="space-y-3">
                  {proposalsAndMinutes.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>直近のアクティビティ</CardTitle>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-7 w-7 shrink-0" variant="circle" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" variant="text" />
                        <Skeleton className="h-3 w-20" variant="text" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <EmptyState message="アクティビティはまだありません" />
              ) : (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          item.type === 'registered'
                            ? 'bg-[var(--color-success)]/10'
                            : 'bg-[var(--color-danger)]/10',
                        )}
                      >
                        {item.type === 'registered' ? (
                          <DocumentPlusIcon className="h-3.5 w-3.5 text-[var(--color-success)]" />
                        ) : (
                          <DocumentMinusIcon className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-skin-heading">{item.title}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Blockchain verification (collapsible) ── */}
      <Card>
        <button
          type="button"
          onClick={() => setChainOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-4"
        >
          <CardTitle>ブロックチェーン検証情報</CardTitle>
          <ChevronIcon open={chainOpen} className="h-5 w-5" />
        </button>
        {chainOpen && (
          <CardContent className="space-y-0">
            <div className="flex flex-col gap-1 border-b border-skin-border py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Attestation UID
              </span>
              <span className="inline-flex items-center text-sm">
                <ExplorerLink type="attestation" value={dao.attestationUID} chars={8} />
                <CopyButton text={dao.attestationUID} />
              </span>
            </div>
            <div className="flex flex-col gap-1 border-b border-skin-border py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                管理者アドレス
              </span>
              <span className="inline-flex items-center text-sm">
                <ExplorerLink type="address" value={dao.adminAddress} />
                <CopyButton text={dao.adminAddress} />
              </span>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                信頼スコア
              </span>
              <span className="text-sm font-semibold text-skin-heading">{dao.trustScore}</span>
            </div>
            <p className="pt-2 text-xs text-[var(--color-text-tertiary)]">
              作成: {formatDate(dao.createdAt)} / 更新: {formatDate(dao.updatedAt)}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
