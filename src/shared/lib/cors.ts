import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = new Set(
  ['http://localhost:3000', 'http://localhost:3001', process.env.NEXT_PUBLIC_APP_URL].filter(
    Boolean,
  ) as string[],
);

function getOrigin(request?: NextRequest): string {
  const origin = request?.headers.get('origin');
  if (!origin) {
    // Same-origin requests don't send Origin header
    return ALLOWED_ORIGINS.values().next().value ?? '';
  }
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  // Reject unknown origins
  return '';
}

export function setCorsHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  const origin = getOrigin(request);
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}
