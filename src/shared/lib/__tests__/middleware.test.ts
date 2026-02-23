import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { Wallet } from 'ethers';
import { authenticateRequest, sanitizeErrorMessage, getClientIP } from '../middleware';
import { createVerificationMessage } from '../wallet/verify';

// Use fixed private keys to avoid Wallet.createRandom() + jsdom Buffer incompatibility
const TEST_KEY_1 = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_KEY_2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

async function createAuthHeader(wallet: Wallet): Promise<string> {
  const message = createVerificationMessage(wallet.address);
  const signature = await wallet.signMessage(message);
  const payload = btoa(JSON.stringify({ address: wallet.address, signature, message }));
  return `Wallet ${payload}`;
}

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  const h = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    h.set(key, value);
  }
  return new NextRequest('http://localhost:3000/api/test', { headers: h });
}

describe('authenticateRequest', () => {
  it('returns null for missing auth header', () => {
    const req = makeRequest();
    expect(authenticateRequest(req)).toBeNull();
  });

  it('returns null for non-Wallet auth scheme', () => {
    const req = makeRequest({ authorization: 'Bearer some-token' });
    expect(authenticateRequest(req)).toBeNull();
  });

  it('returns null for invalid base64 payload', () => {
    const req = makeRequest({ authorization: 'Wallet not-valid-base64!!!' });
    expect(authenticateRequest(req)).toBeNull();
  });

  it('returns null for missing fields in payload', () => {
    const payload = btoa(JSON.stringify({ address: '0x123' }));
    const req = makeRequest({ authorization: `Wallet ${payload}` });
    expect(authenticateRequest(req)).toBeNull();
  });

  it('returns null for invalid address format', () => {
    const payload = btoa(
      JSON.stringify({
        address: 'not-an-address',
        signature: '0xabc',
        message: 'some message',
      }),
    );
    const req = makeRequest({ authorization: `Wallet ${payload}` });
    expect(authenticateRequest(req)).toBeNull();
  });

  it('authenticates valid wallet signature', async () => {
    const wallet = new Wallet(TEST_KEY_1);
    const authHeader = await createAuthHeader(wallet);
    const req = makeRequest({ authorization: authHeader });

    const result = authenticateRequest(req);
    expect(result).not.toBeNull();
    expect(result!.address.toLowerCase()).toBe(wallet.address.toLowerCase());
  });

  it('rejects expired timestamp (> 5 minutes)', async () => {
    const wallet = new Wallet(TEST_KEY_1);
    const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    const message = `Sign this message to verify ownership of ${wallet.address}\nTimestamp: ${oldTimestamp}`;
    const signature = await wallet.signMessage(message);
    const payload = btoa(JSON.stringify({ address: wallet.address, signature, message }));
    const req = makeRequest({ authorization: `Wallet ${payload}` });

    expect(authenticateRequest(req)).toBeNull();
  });

  it('rejects message with mismatched address', async () => {
    const wallet = new Wallet(TEST_KEY_1);
    const otherWallet = new Wallet(TEST_KEY_2);
    const message = createVerificationMessage(otherWallet.address);
    const signature = await wallet.signMessage(message);
    const payload = btoa(JSON.stringify({ address: wallet.address, signature, message }));
    const req = makeRequest({ authorization: `Wallet ${payload}` });

    expect(authenticateRequest(req)).toBeNull();
  });
});

describe('sanitizeErrorMessage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns real error message in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const error = new Error('Firebase connection failed');
    expect(sanitizeErrorMessage(error)).toBe('Firebase connection failed');
  });

  it('hides error details in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = new Error('Firebase connection failed');
    expect(sanitizeErrorMessage(error)).toBe('Internal server error');
  });

  it('handles non-Error objects', () => {
    expect(sanitizeErrorMessage('string error')).toBe('Internal server error');
    expect(sanitizeErrorMessage(null)).toBe('Internal server error');
    expect(sanitizeErrorMessage(undefined)).toBe('Internal server error');
  });
});

describe('getClientIP', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = makeRequest({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' });
    expect(getClientIP(req)).toBe('192.168.1.1');
  });

  it('extracts IP from x-real-ip header', () => {
    const req = makeRequest({ 'x-real-ip': '10.0.0.5' });
    expect(getClientIP(req)).toBe('10.0.0.5');
  });

  it('returns unknown when no IP headers present', () => {
    const req = makeRequest();
    expect(getClientIP(req)).toBe('unknown');
  });
});
