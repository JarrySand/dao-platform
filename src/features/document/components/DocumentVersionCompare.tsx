'use client';

import { useDocument } from '../hooks/useDocument';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { shortenAddress, formatDate } from '@/shared/utils/format';
import { ExplorerLink } from '@/shared/components/ExplorerLink';
import { cn } from '@/shared/utils/cn';

interface DocumentVersionCompareProps {
  documentId1: string;
  documentId2: string;
}

export function DocumentVersionCompare({ documentId1, documentId2 }: DocumentVersionCompareProps) {
  const { data: doc1, isLoading: loading1 } = useDocument(documentId1);
  const { data: doc2, isLoading: loading2 } = useDocument(documentId2);

  if (loading1 || loading2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>バージョン比較</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner center />
        </CardContent>
      </Card>
    );
  }

  if (!doc1 || !doc2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>バージョン比較</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-danger)]">ドキュメントの取得に失敗しました</p>
        </CardContent>
      </Card>
    );
  }

  const fields: { label: string; key1: React.ReactNode; key2: React.ReactNode; isDiff: boolean }[] =
    [
      { label: 'タイトル', key1: doc1.title, key2: doc2.title, isDiff: doc1.title !== doc2.title },
      {
        label: 'バージョン',
        key1: doc1.version,
        key2: doc2.version,
        isDiff: doc1.version !== doc2.version,
      },
      {
        label: 'ドキュメント種別',
        key1: doc1.documentType,
        key2: doc2.documentType,
        isDiff: doc1.documentType !== doc2.documentType,
      },
      { label: 'ハッシュ', key1: doc1.hash, key2: doc2.hash, isDiff: doc1.hash !== doc2.hash },
      {
        label: 'IPFS CID',
        key1: doc1.ipfsCid,
        key2: doc2.ipfsCid,
        isDiff: doc1.ipfsCid !== doc2.ipfsCid,
      },
      {
        label: 'ステータス',
        key1: doc1.status,
        key2: doc2.status,
        isDiff: doc1.status !== doc2.status,
      },
      {
        label: '登録者',
        key1: <ExplorerLink type="address" value={doc1.attester} />,
        key2: <ExplorerLink type="address" value={doc2.attester} />,
        isDiff: doc1.attester !== doc2.attester,
      },
      {
        label: '登録日',
        key1: formatDate(doc1.createdAt),
        key2: formatDate(doc2.createdAt),
        isDiff: doc1.createdAt !== doc2.createdAt,
      },
    ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>バージョン比較</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-skin-border">
                <th className="pb-2 pr-4 text-left font-medium text-[var(--color-text-secondary)]">
                  項目
                </th>
                <th className="pb-2 pr-4 text-left font-medium text-[var(--color-text-secondary)]">
                  v{doc1.version}
                </th>
                <th className="pb-2 text-left font-medium text-[var(--color-text-secondary)]">
                  v{doc2.version}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {fields.map((field) => (
                <tr key={field.label}>
                  <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{field.label}</td>
                  <td
                    className={cn(
                      'py-2 pr-4 break-all',
                      field.isDiff
                        ? 'font-medium text-amber-700 dark:text-amber-400'
                        : 'text-skin-heading',
                    )}
                  >
                    {field.key1}
                  </td>
                  <td
                    className={cn(
                      'py-2 break-all',
                      field.isDiff
                        ? 'font-medium text-amber-700 dark:text-amber-400'
                        : 'text-skin-heading',
                    )}
                  >
                    {field.key2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* IPFS links */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-4">
          {doc1.ipfsCid && (
            <a
              href={`https://ipfs.io/ipfs/${doc1.ipfsCid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-skin-heading hover:underline"
            >
              v{doc1.version} IPFS ファイル
            </a>
          )}
          {doc2.ipfsCid && (
            <a
              href={`https://ipfs.io/ipfs/${doc2.ipfsCid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-skin-heading hover:underline"
            >
              v{doc2.version} IPFS ファイル
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
