'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useDAO } from '../hooks/useDAO';
import { useDocuments } from '@/features/document/hooks/useDocuments';
import { DocumentCard } from '@/features/document/components/DocumentCard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Alert,
} from '@/shared/components/ui';
import { Skeleton } from '@/shared/components/ui';
import { ErrorDisplay, EmptyState } from '@/shared/components/feedback';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { formatDate, formatRelativeTime, formatFileSize } from '@/shared/utils/format';
import { ExplorerLink } from '@/shared/components/ExplorerLink';
import { cn } from '@/shared/utils/cn';
import { DocumentPlusIcon, DocumentMinusIcon } from '@/shared/components/icons';
import { getIPFSUrl } from '@/shared/lib/ipfs/gateway';
import { calculateFileHash } from '@/shared/utils/fileHash';
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

/* ── Normalize hash for comparison (strip 0x prefix, lowercase) ── */
function normalizeHash(hash: string): string {
  return hash.replace(/^0x/i, '').toLowerCase();
}

/* ── Inline file verification widget ── */
function InlineFileVerify({ expectedHash }: { expectedHash: string }) {
  const [verifyResult, setVerifyResult] = useState<'idle' | 'hashing' | 'match' | 'mismatch'>(
    'idle',
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setVerifyResult('hashing');
      try {
        const hash = await calculateFileHash(file);
        const isMatch = normalizeHash(hash) === normalizeHash(expectedHash);
        setVerifyResult(isMatch ? 'match' : 'mismatch');
      } catch {
        setVerifyResult('mismatch');
      }
    },
    [expectedHash],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleReset = useCallback(() => {
    setVerifyResult('idle');
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  if (verifyResult === 'match') {
    return (
      <Alert variant="success">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">ハッシュ一致 — ファイルは改ざんされていません</span>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 text-xs underline opacity-70 hover:opacity-100"
          >
            再検証
          </button>
        </div>
        {fileName && <p className="mt-1 truncate text-xs opacity-70">{fileName}</p>}
      </Alert>
    );
  }

  if (verifyResult === 'mismatch') {
    return (
      <Alert variant="error">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">ハッシュ不一致 — 内容が異なります</span>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 text-xs underline opacity-70 hover:opacity-100"
          >
            再検証
          </button>
        </div>
        {fileName && <p className="mt-1 truncate text-xs opacity-70">{fileName}</p>}
      </Alert>
    );
  }

  if (verifyResult === 'hashing') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-skin-border p-3 text-xs text-[var(--color-text-secondary)]">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        ハッシュ計算中...
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-skin-border p-3 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]"
    >
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
          d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"
        />
      </svg>
      ファイルをドロップして検証
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
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
        <div className="px-2 pb-3 pt-1 space-y-3">
          {/* Basic info */}
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

          {/* On-chain verification */}
          <div className="rounded-lg bg-[var(--color-bg-hover)] p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-[var(--color-success)]"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium text-[var(--color-success)]">
                オンチェーン検証済み
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="shrink-0">EAS:</span>
              <ExplorerLink
                type="attestation"
                value={doc.id}
                chars={6}
                className="font-mono text-xs text-[var(--color-text-secondary)] hover:underline"
              />
            </div>
            {doc.hash && (
              <p className="truncate font-mono text-[10px] text-[var(--color-text-tertiary)]">
                SHA-256: {doc.hash}
              </p>
            )}
          </div>

          {/* Inline file verification */}
          {doc.hash && <InlineFileVerify expectedHash={doc.hash} />}

          {/* Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getIPFSUrl(doc.ipfsCid), '_blank', 'noopener,noreferrer')}
          >
            ダウンロード
          </Button>
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
