import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  shortenAddress,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatFileSize,
  formatTimestamp,
} from '../format';

describe('shortenAddress', () => {
  it('shortens a standard Ethereum address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(shortenAddress(address)).toBe('0x1234...5678');
  });

  it('returns short addresses unchanged', () => {
    expect(shortenAddress('0x1234')).toBe('0x1234');
  });

  it('supports custom character count', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(shortenAddress(address, 6)).toBe('0x123456...345678');
  });

  it('handles empty string', () => {
    expect(shortenAddress('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a date string in ja-JP locale by default', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('accepts custom locale', () => {
    const result = formatDate('2024-01-15', 'en-US');
    expect(result).toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "たった今" for very recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('たった今');
  });

  it('returns minutes ago for times within an hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('5分前');
  });

  it('returns hours ago for times within a day', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('3時間前');
  });

  it('returns days ago for times within a month', () => {
    const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('7日前');
  });
});

describe('formatNumber', () => {
  it('formats numbers with locale separators', () => {
    const result = formatNumber(1234567);
    // Different locales use different separators, just check it contains digits
    expect(result).toMatch(/1.*234.*567/);
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles negative numbers', () => {
    const result = formatNumber(-1000);
    expect(result).toContain('1');
  });
});

describe('formatFileSize', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes with decimal', () => {
    expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('formatTimestamp', () => {
  it('formats a Unix timestamp to a Japanese date string', () => {
    const timestamp = 1700000000; // 2023-11-14
    const result = formatTimestamp(timestamp);
    expect(result).toContain('2023');
  });

  it('handles zero timestamp', () => {
    const result = formatTimestamp(0);
    expect(result).toContain('1970');
  });
});
