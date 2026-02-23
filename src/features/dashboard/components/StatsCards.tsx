'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useStats } from '../hooks/useStats';
import { formatNumber } from '@/shared/utils/format';
import { BuildingIcon, DocumentIcon } from '@/shared/components/icons';

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  useEffect(() => {
    const duration = 600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    }

    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target]);

  return <>{formatNumber(count)}</>;
}

const STAT_ITEMS = [
  { key: 'daoCount', label: '管理 DAO 数', icon: BuildingIcon },
  { key: 'totalDocuments', label: '総ドキュメント数', icon: DocumentIcon },
] as const;

export function StatsCards() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-20" variant="text" />
              <Skeleton className="h-8 w-16" variant="text" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_ITEMS.map((item) => {
        const value = stats?.[item.key] ?? 0;
        return (
          <Card key={item.key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5 text-[var(--color-text-tertiary)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">{item.label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-skin-heading">
                <AnimatedCounter target={value} />
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
