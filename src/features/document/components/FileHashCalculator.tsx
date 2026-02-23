'use client';

import { useEffect, useState } from 'react';
import { calculateFileHash } from '@/shared/utils/fileHash';
import { cn } from '@/shared/utils/cn';

interface FileHashCalculatorProps {
  file: File | null;
  onHashCalculated: (hash: string) => void;
}

export function FileHashCalculator({ file, onHashCalculated }: FileHashCalculatorProps) {
  const [hash, setHash] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) {
      setHash(null);
      setProgress(0);
      return;
    }

    let cancelled = false;

    const compute = async () => {
      setIsCalculating(true);
      setProgress(20);

      try {
        setProgress(50);
        const result = await calculateFileHash(file);

        if (!cancelled) {
          setProgress(100);
          setHash(result);
          onHashCalculated(result);
        }
      } catch {
        if (!cancelled) {
          setProgress(0);
        }
      } finally {
        if (!cancelled) {
          setIsCalculating(false);
        }
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [file, onHashCalculated]);

  if (!file) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-skin-heading">SHA-256 ハッシュ</p>

      {isCalculating && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-hover)]">
            <div
              className={cn('h-full rounded-full bg-skin-primary transition-all duration-300')}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">ハッシュ計算中...</p>
        </div>
      )}

      {hash && !isCalculating && (
        <div className="rounded-xl border border-skin-border bg-[var(--color-bg-hover)] p-3">
          <code className="break-all text-xs text-skin-heading">{hash}</code>
        </div>
      )}
    </div>
  );
}
