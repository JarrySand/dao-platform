'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils/cn';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/daos', label: 'DAO一覧' },
  { href: '/my-dao', label: 'My DAO' },
] as const;

export interface NavbarProps {
  darkModeToggle?: React.ReactNode;
  walletButton?: React.ReactNode;
  authStatus?: React.ReactNode;
}

export function Navbar({ darkModeToggle, walletButton, authStatus }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-skin-border bg-[var(--color-bg-primary)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-skin-heading">DAO Doc</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-xl px-3 py-2 text-sm transition-colors',
                pathname === link.href
                  ? 'font-semibold text-skin-heading'
                  : 'text-[var(--color-text-secondary)] hover:text-skin-heading',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex">
          {darkModeToggle}
          {walletButton}
          {authStatus}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-skin-border bg-[var(--color-bg-primary)] px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm transition-colors',
                  pathname === link.href
                    ? 'font-semibold text-skin-heading'
                    : 'text-[var(--color-text-secondary)] hover:text-skin-heading',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-skin-border pt-3">
            {darkModeToggle}
            {walletButton}
            {authStatus}
          </div>
        </div>
      )}
    </header>
  );
}
