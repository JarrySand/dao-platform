import { cn } from '@/shared/utils/cn';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t border-skin-border py-6', className)}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-[var(--color-text-secondary)]">
          &copy; {new Date().getFullYear()} DAO Document Platform. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-text-secondary)] hover:text-skin-heading"
          >
            GitHub
          </a>
          <a
            href="/docs"
            className="text-sm text-[var(--color-text-secondary)] hover:text-skin-heading"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
