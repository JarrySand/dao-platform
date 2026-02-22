import { NextRequest, NextResponse } from 'next/server';
import { CHAIN_CONFIG } from '@/config/chains';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import type { ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

const EAS_GRAPHQL_ENDPOINT = CHAIN_CONFIG.sepolia.eas.graphqlEndpoint;

// Server-side response cache: Map<queryHash, { data, expiresAt }>
const responseCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

// Rate limit: 30 requests per minute per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function getCacheKey(body: unknown): string {
  return JSON.stringify(body);
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIP(request);

    if (!checkRateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS)) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.TOO_MANY_REQUESTS }));
    }

    const requestBody: unknown = await request.json();
    const cacheKey = getCacheKey(requestBody);

    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return setCorsHeaders(NextResponse.json(cached.data, { status: HTTP_STATUS.OK }));
    }

    const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const body: ApiErrorResponse = {
        success: false,
        error: `EAS GraphQL request failed: ${response.status}`,
      };
      return setCorsHeaders(NextResponse.json(body, { status: response.status }));
    }

    const result: unknown = await response.json();

    // Store in cache
    responseCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    // Evict expired entries periodically
    if (responseCache.size > 200) {
      const now = Date.now();
      for (const [key, entry] of responseCache) {
        if (entry.expiresAt < now) {
          responseCache.delete(key);
        }
      }
    }

    return setCorsHeaders(NextResponse.json(result, { status: HTTP_STATUS.OK }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    const body: ApiErrorResponse = { success: false, error: message };
    return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }));
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}
