import type { AuthUser } from '../types/auth';
import type { CatalogProduct, PaginatedResponse } from '../types/catalog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

let refreshPromise: Promise<AuthUser | null> | null = null;

async function refreshSession(): Promise<AuthUser | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const message = (data && (data.message || data.error)) ?? 'Unable to refresh session';
          throw new Error(message);
        }
        return response.json().catch(() => null);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function apiFetch<T>(
  path: string,
  options?: RequestOptions,
  config?: { skipAuthRefresh?: boolean }
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 401 && !config?.skipAuthRefresh) {
    try {
      await refreshSession();
      return apiFetch(path, options, { skipAuthRefresh: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unauthorized. Please sign in again.';
      throw new Error(message);
    }
  }

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data && (data.message || data.error)) ?? 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export const authApi = {
  me: () => apiFetch<AuthUser | null>('/auth/me'),
  login: (payload: { email: string; password: string }) =>
    apiFetch<AuthUser>('/auth/login', { method: 'POST', body: payload }),
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    phone: string;
    country?: string;
    marketingOptIn?: boolean;
    termsAccepted: boolean;
  }) => apiFetch<AuthUser>('/auth/register', { method: 'POST', body: payload }),
  refresh: () => refreshSession(),
  logout: () => apiFetch('/auth/logout', { method: 'POST', body: {} }),
  sendVerification: (payload: {
    type: 'email' | 'phone';
    email?: string;
    phone?: string;
  }) => apiFetch<{ delivered: boolean; alreadyVerified?: boolean }>('/auth/verification/send', {
    method: 'POST',
    body: payload
  }),
  verifyContact: (payload: {
    type: 'email' | 'phone';
    code: string;
    email?: string;
    phone?: string;
  }) => apiFetch<{ verified: boolean; alreadyVerified?: boolean }>('/auth/verification/verify', {
    method: 'POST',
    body: payload
  })
};

export const affiliatesApi = {
  updateProfile: (payload: {
    displayName?: string;
    payoutMethod?: string | null;
    payoutDetails?: Record<string, unknown> | null;
    kycStatus?: string;
    panNumber?: string;
  }) => apiFetch<AuthUser['affiliate']>('/affiliates/me', { method: 'PATCH', body: payload })
};

export const catalogApi = {
  list: (params: { page?: number; pageSize?: number; categoryId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) {
      searchParams.set('page', String(params.page));
    }
    if (params.pageSize) {
      searchParams.set('pageSize', String(params.pageSize));
    }
    if (params.categoryId) {
      searchParams.set('categoryId', params.categoryId);
    }
    const query = searchParams.toString();
    const path = `/products${query ? `?${query}` : ''}`;
    return apiFetch<PaginatedResponse<CatalogProduct>>(path);
  }
};
