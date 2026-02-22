'use client';

import { useDAO } from '../hooks/useDAO';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/shared/components/ui';
import { Skeleton } from '@/shared/components/ui';
import { ErrorDisplay } from '@/shared/components/feedback';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { shortenAddress, formatDate, formatTimestamp } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

export interface DAODetailProps {
  daoId: string;
}

const statusConfig = {
  active: { label: 'アクティブ', variant: 'success' as const },
  inactive: { label: '非アクティブ', variant: 'warning' as const },
  pending: { label: '保留中', variant: 'default' as const },
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton variant="text" className="h-8 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton variant="text" className="h-4 w-24" />
              <Skeleton variant="text" className="h-4 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
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
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600',
      )}
      title="コピー"
    >
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-gray-100">{children}</span>
    </div>
  );
}

export function DAODetail({ daoId }: DAODetailProps) {
  const { data, isLoading, isError, error, refetch } = useDAO(daoId);

  if (isLoading) {
    return <DetailSkeleton />;
  }

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

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>基本情報</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <InfoRow label="説明">{dao.description}</InfoRow>
          <InfoRow label="所在地">{dao.location}</InfoRow>
          <InfoRow label="メンバー数">{dao.memberCount.toLocaleString()}名</InfoRow>
          <InfoRow label="規模">{dao.size}</InfoRow>
          {dao.foundingDate > 0 && (
            <InfoRow label="設立日">{formatTimestamp(dao.foundingDate)}</InfoRow>
          )}
          {dao.website && (
            <InfoRow label="ウェブサイト">
              <a
                href={dao.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline dark:text-primary-400"
              >
                {dao.website}
              </a>
            </InfoRow>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      {(dao.contactPerson || dao.contactEmail) && (
        <Card>
          <CardHeader>
            <CardTitle>連絡先</CardTitle>
          </CardHeader>
          <CardContent>
            {dao.contactPerson && <InfoRow label="担当者">{dao.contactPerson}</InfoRow>}
            {dao.contactEmail && (
              <InfoRow label="メール">
                <a
                  href={`mailto:${dao.contactEmail}`}
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  {dao.contactEmail}
                </a>
              </InfoRow>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blockchain Information */}
      <Card>
        <CardHeader>
          <CardTitle>ブロックチェーン情報</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Attestation UID">
            <span className="inline-flex items-center font-mono text-xs">
              {shortenAddress(dao.attestationUID, 8)}
              <CopyButton text={dao.attestationUID} />
            </span>
          </InfoRow>
          <InfoRow label="管理者アドレス">
            <span className="inline-flex items-center font-mono text-xs">
              {shortenAddress(dao.adminAddress)}
              <CopyButton text={dao.adminAddress} />
            </span>
          </InfoRow>
          <InfoRow label="信頼スコア">
            <span className="font-semibold">{dao.trustScore}</span>
          </InfoRow>
        </CardContent>
      </Card>

      {/* Document List Slot */}
      <Card>
        <CardHeader>
          <CardTitle>ドキュメント</CardTitle>
        </CardHeader>
        <CardContent>
          {dao.documentCount !== undefined && dao.documentCount > 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {dao.documentCount}件のドキュメントが登録されています
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ドキュメントはまだ登録されていません
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-gray-400 dark:text-gray-500">
        <p>作成日: {formatDate(dao.createdAt)}</p>
        <p>更新日: {formatDate(dao.updatedAt)}</p>
      </div>
    </div>
  );
}
