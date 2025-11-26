import type { AuthUser } from '../types/auth';
import type { CatalogProduct, PaginatedResponse } from '../types/catalog';
import type {
  AffiliateDashboardOverview,
  AffiliateNotification,
  AffiliatePayoutOverview,
  AffiliateReportsOverview
} from '../types/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

let refreshPromise: Promise<AuthUser | null> | null = null;

async function refreshSession(): Promise<AuthUser | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      if (!refreshResponse.ok) {
        const data = await refreshResponse.json().catch(() => null);
        const message = (data && (data.message || data.error)) ?? 'Unable to refresh session';
        throw new Error(message);
      }
      // After refreshing tokens, fetch the latest user to ensure integrity.
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      if (!meResponse.ok) {
        return null;
      }
      return (await meResponse.json().catch(() => null)) as AuthUser | null;
    })().finally(() => {
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
    displayName: string;
    payoutMethod: string;
    payoutDetails: Record<string, unknown> | null;
    kycStatus?: string;
    panNumber: string;
    aadhaarNumber: string;
    panImageUrl: string;
    aadhaarFrontUrl: string;
    aadhaarBackUrl: string;
  }) => apiFetch<AuthUser['affiliate']>('/affiliates/me', { method: 'PATCH', body: payload }),
  requestUploadUrl: (payload: { fileName: string; mimeType: string; purpose?: string }) =>
    apiFetch<{ uploadUrl: string; publicUrl: string; objectName: string; expiresAt: string }>(
      '/affiliates/uploads/sign',
      { method: 'POST', body: payload }
    ),
  requestDownloadUrl: (payload: { objectName: string }) =>
    apiFetch<{ downloadUrl: string; objectName: string; expiresAt: string }>(
      '/affiliates/uploads/access',
      { method: 'POST', body: payload }
    )
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
  },
  product: (id: string) => apiFetch<{ product: CatalogProduct | null; variants: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    sku: string | null;
    imageUrl: string | null;
  }> }>(`/products/${id}`)
};

export const dashboardApi = {
  overview: () => apiFetch<AffiliateDashboardOverview>('/affiliates/dashboard')
};

export const linksApi = {
  create: (payload: {
    productId?: string;
    productSku?: string;
    landingUrl: string;
    referralCode: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    alias?: string;
  }) =>
    apiFetch<{ id: string; code: string; landingUrl: string; shortUrl: string }>(
      '/affiliates/links',
      { method: 'POST', body: payload }
    )
};

export const notificationsApi = {
  list: () => apiFetch<AffiliateNotification[]>('/affiliates/notifications')
};

export const payoutsApi = {
  overview: () => apiFetch<AffiliatePayoutOverview>('/affiliates/payouts')
};

export const reportsApi = {
  overview: () => apiFetch<AffiliateReportsOverview>('/affiliates/reports')
};
