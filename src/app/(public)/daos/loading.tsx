import { Skeleton } from '@/shared/components/ui';

function DAOCardSkeleton() {
  return (
    <div className="rounded-xl border border-skin-border bg-[var(--color-bg-secondary)] p-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Skeleton variant="text" className="h-6 w-2/3" />
        <Skeleton variant="rectangle" className="h-5 w-20" />
      </div>
      <Skeleton variant="text" className="mb-2 h-4 w-full" />
      <Skeleton variant="text" className="mb-4 h-4 w-3/4" />
      <div className="flex items-center justify-between">
        <Skeleton variant="rectangle" className="h-5 w-24" />
        <Skeleton variant="text" className="h-3 w-28" />
      </div>
    </div>
  );
}

export default function DAOListLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <Skeleton variant="text" className="mb-2 h-4 w-32" />
      <Skeleton variant="text" className="mb-2 h-8 w-48" />
      <Skeleton variant="text" className="mb-8 h-4 w-64" />

      {/* Search and filter skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <Skeleton variant="rectangle" className="h-10 flex-1" />
        <Skeleton variant="rectangle" className="h-10 w-full sm:w-48" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <DAOCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
