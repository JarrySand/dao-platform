'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-[var(--color-text-primary)] mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-[var(--color-text-secondary)] mb-6">
          エラーが発生しました
        </h2>
        <p className="text-[var(--color-text-tertiary)] mb-8">
          申し訳ありません。サーバーでエラーが発生しました。
          <br />
          しばらく時間をおいて再度お試しください。
        </p>
        <div className="space-x-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
          >
            再読み込み
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-[var(--color-border)] text-base font-medium rounded-md text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
