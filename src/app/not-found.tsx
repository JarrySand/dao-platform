import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-[var(--color-text-primary)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--color-text-secondary)] mb-6">
          ページが見つかりません
        </h2>
        <p className="text-[var(--color-text-tertiary)] mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
