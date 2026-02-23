import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { setCorsHeaders } from '../cors';

function makeRequest(origin?: string): NextRequest {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return new NextRequest('http://localhost:3000/api/test', { headers });
}

describe('setCorsHeaders', () => {
  it('sets correct origin for allowed localhost:3000', () => {
    const req = makeRequest('http://localhost:3000');
    const res = setCorsHeaders(NextResponse.json({}), req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
  });

  it('sets correct origin for allowed localhost:3001', () => {
    const req = makeRequest('http://localhost:3001');
    const res = setCorsHeaders(NextResponse.json({}), req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001');
  });

  it('rejects unknown origins with empty string', () => {
    const req = makeRequest('https://evil.example.com');
    const res = setCorsHeaders(NextResponse.json({}), req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('');
  });

  it('allows same-origin requests (no Origin header)', () => {
    const req = makeRequest(); // no origin
    const res = setCorsHeaders(NextResponse.json({}), req);
    const origin = res.headers.get('Access-Control-Allow-Origin');
    // Should return first allowed origin, not wildcard
    expect(origin).not.toBe('*');
    expect(origin).toBeTruthy();
  });

  it('sets standard CORS headers', () => {
    const req = makeRequest('http://localhost:3000');
    const res = setCorsHeaders(NextResponse.json({}), req);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });
});
