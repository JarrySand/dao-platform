'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateFileHash } from '@/shared/utils/fileHash';
import { formatDate, shortenAddress } from '@/shared/utils/format';
import { FileUploader } from './FileUploader';
import { Card, CardContent, CardHeader, CardTitle, Alert, Badge } from '@/shared/components/ui';
import { LoadingSpinner } from '@/shared/components/feedback';
import type { Document, DocumentType } from '../types';

const typeLabels: Record<DocumentType, string> = {
  articles: '定款',
  meeting: '議事録',
  token: 'トークン',
  operation: '運営',
  voting: '投票',
  other: 'その他',
};

async function searchDocumentByHash(hash: string): Promise<Document | null> {
  const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}`;
  const res = await fetch(`/api/documents?hash=${encodeURIComponent(formattedHash)}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.success && data.data && data.data.length > 0) {
    return data.data[0] as Document;
  }
  return null;
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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ファイルを選択してブロックチェーン上の登録済みドキュメントと照合します。
        </p>

        <FileUploader onFileSelect={handleFileSelect} />

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  <span className="text-gray-600 dark:text-gray-400">タイトル:</span>
                  <span className="font-medium">{matchedDocument.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">種別:</span>
                  <Badge variant="default" size="sm">
                    {typeLabels[matchedDocument.documentType]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">登録者:</span>
                  <span className="font-mono text-xs">
                    {shortenAddress(matchedDocument.attester)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">登録日:</span>
                  <span>{formatDate(matchedDocument.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">IPFS CID:</span>
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
