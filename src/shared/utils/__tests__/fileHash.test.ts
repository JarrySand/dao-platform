import { describe, it, expect } from 'vitest';
import { calculateTextHash, formatHashForBlockchain } from '../fileHash';

describe('calculateTextHash', () => {
  it('returns a hex string for text input', async () => {
    const hash = await calculateTextHash('hello world');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns the same hash for the same input', async () => {
    const hash1 = await calculateTextHash('test content');
    const hash2 = await calculateTextHash('test content');
    expect(hash1).toBe(hash2);
  });

  it('returns different hashes for different inputs', async () => {
    const hash1 = await calculateTextHash('content A');
    const hash2 = await calculateTextHash('content B');
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string', async () => {
    const hash = await calculateTextHash('');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('formatHashForBlockchain', () => {
  it('adds 0x prefix when not present', () => {
    expect(formatHashForBlockchain('abc123')).toBe('0xabc123');
  });

  it('does not double-prefix when 0x is already present', () => {
    expect(formatHashForBlockchain('0xabc123')).toBe('0xabc123');
  });

  it('handles empty string', () => {
    expect(formatHashForBlockchain('')).toBe('0x');
  });
});
