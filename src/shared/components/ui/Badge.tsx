import { type HTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

const variantStyles = {
  default: 'bg-[var(--color-bg-hover)] text-skin-heading',
  success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  error: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
  outline: 'border border-skin-border text-[var(--color-text-secondary)]',
} as const;

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

export function Badge({ variant = 'default', size = 'md', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
