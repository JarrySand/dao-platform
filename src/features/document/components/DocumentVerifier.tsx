'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateFileHash } from '@/shared/utils/fileHash';
import { formatDate } from '@/shared/utils/format';
import { ExplorerLink } from '@/shared/components/ExplorerLink';
import { FileUploader } from './FileUploader';
import { Card, CardContent, CardHeader, CardTitle, Alert, Badge } from '@/shared/components/ui';
import { LoadingSpinner } from '@/shared/components/feedback';
import type { Document, DocumentType } from '../types';

const typeLabels: Record<DocumentType, string> = {
  articles: '定款',
  assembly_rules: 'DAO総会規程',
  operation_rules: '運営規程',
  token_rules: 'トークン規程',
  custom_rules: 'カスタム規程',
  proposal: '投票議題',
  minutes: '議事録',
};

async function searchDocumentByHash(hash: string): Promise<Document | null> {
  const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}`;
  const res = await fetch(`/api/documents?hash=${encodeURIComponent(formattedHash)}`);
  if (!res.ok) return null;
  const json = await res.json();
  if (json.success && json.data?.data?.length > 0) {
    return json.data.data[0] as Document;
  }
  return null;
}

async function fetchDAOName(daoId: string): Promise<string | null> {
  const res = await fetch(`/api/daos/${encodeURIComponent(daoId)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.success ? (json.data?.name ?? null) : null;
}

export function DocumentVerifier() {
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);

  const {
    data: matchedDocument,
    isLoading: isSearching,
    error,
  } = useQuery({
    queryKey: ['document-verify', fileHash],
    queryFn: () => searchDocumentByHash(fileHash!),
    enabled: !!fileHash,
    staleTime: 30_000,
  });

  const { data: daoName } = useQuery({
    queryKey: ['dao-verify', matchedDocument?.daoId],
    queryFn: () => fetchDAOName(matchedDocument!.daoId),
    enabled: !!matchedDocument?.daoId,
    staleTime: 60_000,
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setIsHashing(true);
    setFileHash(null);
    try {
      const hash = await calculateFileHash(file);
      setFileHash(hash);
    } finally {
      setIsHashing(false);
    }
  }, []);

  const isProcessing = isHashing || isSearching;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ドキュメント検証</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          ファイルを選択してブロックチェーン上の登録済みドキュメントと照合します。
        </p>

        <FileUploader onFileSelect={handleFileSelect} />

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {isHashing ? 'ハッシュ計算中...' : '検索中...'}
            </span>
          </div>
        )}

        {fileHash && !isProcessing && matchedDocument && (
          <Alert variant="success">
            <div className="space-y-2">
              <p className="font-medium">一致するドキュメントが見つかりました</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-secondary)]">タイトル:</span>
                  <span className="font-medium">{matchedDocument.title}</span>
                </div>
                {daoName && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-secondary)]">DAO:</span>
                    <span className="font-medium">{daoName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-secondary)]">種別:</span>
                  <Badge variant="default" size="sm">
                    {typeLabels[matchedDocument.documentType]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-secondary)]">ステータス:</span>
                  <Badge
                    variant={matchedDocument.status === 'active' ? 'success' : 'error'}
                    size="sm"
                  >
                    {matchedDocument.status === 'active' ? '有効' : '失効'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-secondary)]">登録者:</span>
                  <ExplorerLink type="address" value={matchedDocument.attester} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-secondary)]">登録日:</span>
                  <span>{formatDate(matchedDocument.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-secondary)]">IPFS CID:</span>
                  <span className="font-mono text-xs">{matchedDocument.ipfsCid}</span>
                </div>
              </div>
            </div>
          </Alert>
        )}

        {fileHash && !isProcessing && !matchedDocument && !error && (
          <Alert variant="warning">
            一致するドキュメントは見つかりませんでした。このファイルは未登録です。
          </Alert>
        )}

        {error && (
          <Alert variant="error">検索中にエラーが発生しました。もう一度お試しください。</Alert>
        )}
      </CardContent>
    </Card>
  );
}
