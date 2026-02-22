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
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">SHA-256 ハッシュ</p>

      {isCalculating && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={cn(
                'h-full rounded-full bg-primary-600 transition-all duration-300 dark:bg-primary-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">ハッシュ計算中...</p>
        </div>
      )}

      {hash && !isCalculating && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <code className="break-all text-xs text-gray-700 dark:text-gray-300">{hash}</code>
        </div>
      )}
    </div>
  );
}
