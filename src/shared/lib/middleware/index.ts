import { NextRequest, NextResponse } from 'next/server';
import { setCorsHeaders } from '../cors';
import { checkRateLimit } from '../rate-limit';
import { verifyWalletSignature } from '@/shared/lib/wallet/verify';
import { logger } from '@/shared/utils/logger';
import type { ApiErrorResponse } from '@/shared/types/api';
import { HTTP_STATUS } from '@/shared/types/api';

// --- Auth helpers ---

const AUTH_MESSAGE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export interface AuthResult {
  address: string;
}

/**
 * Authenticate a request using wallet signature.
 * Expects: Authorization: Wallet <base64(JSON({address, signature, message}))>
 * Returns the authenticated address or null if invalid.
 */
export function authenticateRequest(request: NextRequest): AuthResult | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Wallet ')) return null;

  try {
    const payload = authHeader.slice('Wallet '.length);
    const decoded = JSON.parse(atob(payload)) as Record<string, unknown>;

    const address = typeof decoded.address === 'string' ? decoded.address : '';
    const signature = typeof decoded.signature === 'string' ? decoded.signature : '';
    const message = typeof decoded.message === 'string' ? decoded.message : '';

    if (!address || !signature || !message) return null;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

    // Verify the message contains the claimed address
    if (!message.toLowerCase().includes(address.toLowerCase())) return null;

    // Verify timestamp is present and within acceptable window
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    if (!timestampMatch) return null;
    const messageTime = Number(timestampMatch[1]);
    if (Date.now() - messageTime > AUTH_MESSAGE_MAX_AGE_MS) return null;

    // Verify signature recovers to the expected address
    if (!verifyWalletSignature(message, signature, address)) return null;

    return { address };
  } catch {
    return null;
  }
}

// --- Error sanitization ---

/**
 * Sanitize error messages for client responses.
 * In production, hides internal error details.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'production') {
    return 'Internal server error';
  }
  return error instanceof Error ? error.message : 'Internal server error';
}

// --- Client IP extraction ---

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// --- Higher-order middleware (optional usage) ---

interface MiddlewareOptions {
  rateLimit?: { limit: number; windowMs?: number };
  auth?: 'required' | 'optional';
}

export function withApiMiddleware(
  options: MiddlewareOptions,
  handler: (
    request: NextRequest,
    context: { ip: string; authenticatedAddress?: string; params?: Record<string, string> },
  ) => Promise<NextResponse>,
) {
  return async (
    request: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const ip = getClientIP(request);
    const route = request.nextUrl.pathname;

    try {
      // Rate limiting
      if (options.rateLimit) {
        const { limit, windowMs = 60_000 } = options.rateLimit;
        if (!checkRateLimit(ip, limit, windowMs)) {
          logger.warn('rate_limit_exceeded', { route, ip });
          const body: ApiErrorResponse = {
            success: false,
            error: 'Too many requests. Please try again later.',
          };
          return setCorsHeaders(
            NextResponse.json(body, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
            request,
          );
        }
      }

      // Auth check (wallet signature verification)
      let authenticatedAddress: string | undefined;
      if (options.auth === 'required') {
        const auth = authenticateRequest(request);
        if (!auth) {
          logger.warn('auth_failed', { route, ip });
          const body: ApiErrorResponse = {
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
          };
          return setCorsHeaders(
            NextResponse.json(body, { status: HTTP_STATUS.UNAUTHORIZED }),
            request,
          );
        }
        authenticatedAddress = auth.address;
      } else if (options.auth === 'optional') {
        const auth = authenticateRequest(request);
        if (auth) authenticatedAddress = auth.address;
      }

      const resolvedParams = routeContext?.params ? await routeContext.params : undefined;
      const response = await handler(request, { ip, authenticatedAddress, params: resolvedParams });
      return setCorsHeaders(response, request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('unhandled_api_error', {
        route,
        method: request.method,
        ip,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      const body: ApiErrorResponse = {
        success: false,
        error: sanitizeErrorMessage(error),
      };
      return setCorsHeaders(
        NextResponse.json(body, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
        request,
      );
    }
  };
}
