import type { AdminUser } from '../types/auth';
import type { AffiliatesListResponse } from '../types/affiliates';
import type { CommissionRulesListResponse, CreateCommissionRulePayload } from '../types/commission-rules';
import type { AdminProduct, CreateAdminProductPayload } from '../types/catalog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

let refreshPromise: Promise<AdminUser | null> | null = null;

async function refreshSession(): Promise<AdminUser | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/admin/refresh`, {
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

export const adminAuthApi = {
  me: () => apiFetch<AdminUser | null>('/auth/admin/me'),
  login: (payload: { email: string; password: string }) =>
    apiFetch<AdminUser>('/auth/admin/login', { method: 'POST', body: payload }),
  logout: () => apiFetch('/auth/admin/logout', { method: 'POST', body: {} })
};

export const adminApi = {
  listAffiliates: (params: { search?: string; status?: string; kycStatus?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.set('search', params.search);
    }
    if (params.status && params.status !== 'all') {
      searchParams.set('status', params.status);
    }
    if (params.kycStatus && params.kycStatus !== 'all') {
      searchParams.set('kycStatus', params.kycStatus);
    }
    const query = searchParams.toString();
    return apiFetch<AffiliatesListResponse>(`/admin/affiliates${query ? `?${query}` : ''}`);
  },
  listCommissionRules: (params: { search?: string; status?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.set('search', params.search);
    }
    if (params.status && params.status !== 'all') {
      searchParams.set('status', params.status);
    }
    const query = searchParams.toString();
    return apiFetch<CommissionRulesListResponse>(
      `/admin/commission-rules${query ? `?${query}` : ''}`
    );
  },
  createCommissionRule: (payload: CreateCommissionRulePayload) =>
    apiFetch('/admin/commission-rules', {
      method: 'POST',
      body: payload
    }),
  listProducts: () =>
    apiFetch<{ data: AdminProduct[]; meta: { total: number; take: number } }>('/admin/products'),
  createProduct: (payload: CreateAdminProductPayload) =>
    apiFetch<AdminProduct>('/admin/products', { method: 'POST', body: payload })
};
