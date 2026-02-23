import { NextRequest, NextResponse } from 'next/server';
import { CHAIN_CONFIG } from '@/config/chains';
import { setCorsHeaders } from '@/shared/lib/cors';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { sanitizeErrorMessage, getClientIP } from '@/shared/lib/middleware';
import { logger } from '@/shared/utils/logger';
import type { ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

const EAS_GRAPHQL_ENDPOINT = CHAIN_CONFIG.sepolia.eas.graphqlEndpoint;

const CACHE_TTL_MS = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 100;

class LRUCache {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();

  get(key: string): unknown | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: unknown): void {
    // Delete first to reset insertion order
    this.cache.delete(key);
    // Evict oldest if at capacity
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }
}

const responseCache = new LRUCache();

// Rate limit: 30 requests per minute per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function getCacheKey(body: unknown): string {
  return JSON.stringify(body);
}

// Maximum allowed query length to prevent abuse
const MAX_QUERY_LENGTH = 4_000;

// Maximum nesting depth to prevent deeply nested queries
const MAX_DEPTH = 5;

// Allowed top-level query root fields for EAS
const ALLOWED_ROOT_FIELDS = new Set(['attestation', 'attestations', 'schema', 'schemas']);

/**
 * Strip GraphQL comments (# ...) from a query string.
 */
function stripComments(query: string): string {
  return query.replace(/#[^\n]*/g, '');
}

/**
 * Check that brace nesting depth does not exceed the limit.
 */
function checkDepth(query: string): boolean {
  let depth = 0;
  for (const ch of query) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth > MAX_DEPTH) return false;
  }
  return depth === 0;
}

/**
 * Extract top-level field names from a GraphQL query body.
 * Matches the first set of identifiers after the outermost '{'.
 */
function extractRootFields(query: string): string[] {
  // Find the first '{' that starts the selection set
  const braceIndex = query.indexOf('{');
  if (braceIndex === -1) return [];

  const inner = query.slice(braceIndex + 1);
  const fields: string[] = [];

  // Match field names (with optional alias: "alias: fieldName" → fieldName)
  const fieldPattern = /(?:(\w+)\s*:\s*)?(\w+)\s*[\s({]/g;
  let depth = 0;
  let match: RegExpExecArray | null;

  while ((match = fieldPattern.exec(inner)) !== null) {
    // Only capture fields at the top level (depth 0)
    const preceding = inner.slice(0, match.index);
    depth = 0;
    for (const ch of preceding) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0) {
      // Use the actual field name (not the alias)
      fields.push(match[2]);
    }
  }

  return fields;
}

/**
 * Validate that the GraphQL request is a safe read-only query.
 * - Strips comments to prevent bypass via # tricks
 * - Enforces query length and nesting depth limits
 * - Blocks mutations and subscriptions via operation keyword check
 * - Validates root fields against an allowlist
 */
function isAllowedEASQuery(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const { query } = body as Record<string, unknown>;
  if (typeof query !== 'string') return false;

  // Length limit
  if (query.length > MAX_QUERY_LENGTH) return false;

  // Strip comments
  const cleaned = stripComments(query);
  const normalized = cleaned.replace(/\s+/g, ' ').trim();

  if (!normalized) return false;

  // Block mutations, subscriptions via operation keyword
  // Matches: "mutation {", "mutation Name {", "subscription {"
  if (/^(mutation|subscription)\b/i.test(normalized)) return false;

  // Also block inline: "{ mutation" patterns hidden after query keyword
  if (/\b(mutation|subscription)\b/i.test(normalized.split('{')[0] || '')) return false;

  // Check nesting depth
  if (!checkDepth(normalized)) return false;

  // Validate root fields are in the allowlist
  const rootFields = extractRootFields(normalized);
  if (rootFields.length === 0) return false;

  for (const field of rootFields) {
    if (!ALLOWED_ROOT_FIELDS.has(field)) return false;
  }

  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIP(request);

    if (!checkRateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS)) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
        request,
      );
    }

    const requestBody: unknown = await request.json();

    // Validate GraphQL query
    if (!isAllowedEASQuery(requestBody)) {
      const body: ApiErrorResponse = {
        success: false,
        error: 'Invalid or disallowed GraphQL query',
        code: 'INVALID_QUERY',
      };
      return setCorsHeaders(NextResponse.json(body, { status: HTTP_STATUS.BAD_REQUEST }), request);
    }

    const cacheKey = getCacheKey(requestBody);

    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached !== undefined) {
      return setCorsHeaders(NextResponse.json(cached, { status: HTTP_STATUS.OK }), request);
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
      return setCorsHeaders(NextResponse.json(body, { status: response.status }), request);
    }

    const result: unknown = await response.json();

    // Store in cache
    responseCache.set(cacheKey, result);

    return setCorsHeaders(NextResponse.json(result, { status: HTTP_STATUS.OK }), request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('eas_proxy_post_failed', {
      route: '/api/eas-proxy',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    const body: ApiErrorResponse = { success: false, error: sanitizeErrorMessage(error) };
    return setCorsHeaders(
      NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
      request,
    );
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return setCorsHeaders(new NextResponse(null, { status: 204 }), request);
}
