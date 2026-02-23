import { createVerificationMessage } from '@/shared/lib/wallet/verify';

type RequestOptions = Omit<RequestInit, 'method' | 'body'>;

const DEFAULT_TIMEOUT_MS = 30_000;

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { headers: customHeaders, signal: userSignal, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const signal = userSignal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);

  const response = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    signal,
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

/**
 * Sign a wallet verification and return the Authorization header value.
 * Requires MetaMask (window.ethereum).
 */
export async function createWalletAuthHeader(address: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('ウォレットが見つかりません');
  }
  const message = createVerificationMessage(address);
  const signature: string = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, address],
  });
  const payload = btoa(JSON.stringify({ address, signature, message }));
  return `Wallet ${payload}`;
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
