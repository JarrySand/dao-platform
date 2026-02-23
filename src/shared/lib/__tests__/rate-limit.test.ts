import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../rate-limit';

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const ip = `test-ip-${Date.now()}`;
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true);
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true);
    expect(checkRateLimit(ip, 3, 60_000)).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    const ip = `test-ip-block-${Date.now()}`;
    expect(checkRateLimit(ip, 2, 60_000)).toBe(true);
    expect(checkRateLimit(ip, 2, 60_000)).toBe(true);
    expect(checkRateLimit(ip, 2, 60_000)).toBe(false);
  });

  it('treats different IPs independently', () => {
    const ip1 = `test-ip-1-${Date.now()}`;
    const ip2 = `test-ip-2-${Date.now()}`;
    expect(checkRateLimit(ip1, 1, 60_000)).toBe(true);
    expect(checkRateLimit(ip1, 1, 60_000)).toBe(false);
    expect(checkRateLimit(ip2, 1, 60_000)).toBe(true);
  });
});
