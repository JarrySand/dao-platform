import { type HTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangle' | 'circle' | 'text';
}

export function Skeleton({ variant = 'rectangle', className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-[var(--color-bg-hover)]',
        variant === 'circle' && 'rounded-full',
        variant === 'rectangle' && 'rounded-lg',
        variant === 'text' && 'h-4 w-full rounded',
        className,
      )}
      {...props}
    />
  );
}
