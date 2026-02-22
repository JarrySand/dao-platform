import { getIdToken } from './firebase/auth';

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  skipAuth?: boolean;
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API ${method} ${url} failed (${response.status}): ${errorBody}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as T;
}

export const apiClient = {
  get<T>(url: string, options?: RequestOptions) {
    return request<T>('GET', url, undefined, options);
  },
  post<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>('POST', url, body, options);
  },
  put<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>('PUT', url, body, options);
  },
  patch<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>('PATCH', url, body, options);
  },
  delete<T>(url: string, options?: RequestOptions) {
    return request<T>('DELETE', url, undefined, options);
  },
};

/**
 * Server-side: verify Firebase Auth token from request Authorization header.
 * Returns the token string if present, or null.
 * Full token verification requires firebase-admin (see firebase/admin.ts).
 */
export function verifyAuth(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
