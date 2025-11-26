import type { AdminUser } from '../types/auth';
import type { AuthUser } from '../types/auth';
import type { AffiliatesListResponse } from '../types/affiliates';
import type { CommissionRulesListResponse, CreateCommissionRulePayload } from '../types/commission-rules';
import type {
  AdminProduct,
  CreateAdminProductPayload,
  UpdateAdminProductPayload
} from '../types/catalog';
import type { OverviewResponse } from '../types/overview';
import type { AdminOrder, AdminOrdersListResponse } from '../types/orders';
import type { AdminPayoutBatch, AdminPayoutLine, AdminPayoutsListResponse } from '../types/payouts';
import type { AdminFraudAlert, AdminFraudAlertsListResponse } from '../types/fraud';
import type { AdminReport, AdminReportsListResponse } from '../types/reports';
import type { AdminAuditListResponse, AdminAuditLog } from '../types/audit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const USE_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

const mockUser: AuthUser = {
  id: 'admin-demo',
  email: 'admin@example.com',
  roles: ['admin'],
  adminProfile: { displayName: 'Console Admin' }
};

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
  me: () => {
    if (USE_MOCK) return Promise.resolve(mockUser as AdminUser);
    return apiFetch<AdminUser | null>('/auth/admin/me');
  },
  login: (payload: { email: string; password: string }) => {
    if (USE_MOCK) return Promise.resolve(mockUser as AdminUser);
    return apiFetch<AdminUser>('/auth/admin/login', { method: 'POST', body: payload });
  },
  logout: () => {
    if (USE_MOCK) return Promise.resolve(null);
    return apiFetch('/auth/admin/logout', { method: 'POST', body: {} });
  }
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
  updateAffiliateStatus: (id: string, status: string) =>
    apiFetch(`/admin/affiliates/${id}/status`, { method: 'PATCH', body: { status } }),
  decideAffiliateKyc: (id: string, decision: 'approved' | 'rejected', note?: string) =>
    apiFetch(`/admin/affiliates/${id}/kyc`, {
      method: 'PATCH',
      body: { decision, note }
    }),
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
  updateCommissionRule: (id: string, payload: Partial<CreateCommissionRulePayload>) =>
    apiFetch(`/admin/commission-rules/${id}`, {
      method: 'PATCH',
      body: payload
    }),
  activateCommissionRule: (id: string) => apiFetch(`/admin/commission-rules/${id}/activate`, { method: 'POST' }),
  deactivateCommissionRule: (id: string) => apiFetch(`/admin/commission-rules/${id}/deactivate`, { method: 'POST' }),
  listProducts: (params: { search?: string; categoryId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    const query = searchParams.toString();
    return apiFetch<{ data: AdminProduct[]; meta: { total: number; take: number } }>(
      `/admin/products${query ? `?${query}` : ''}`
    );
  },
  createProduct: (payload: CreateAdminProductPayload) =>
    apiFetch<AdminProduct>('/admin/products', { method: 'POST', body: payload }),
  updateProduct: (productId: string, payload: UpdateAdminProductPayload) =>
    apiFetch<AdminProduct>(`/admin/products/${productId}`, { method: 'PATCH', body: payload }),
  deleteProduct: (productId: string) =>
    apiFetch<{ success: boolean } | null>(`/admin/products/${productId}`, { method: 'DELETE' }),
  overview: () => apiFetch<OverviewResponse>('/admin/overview'),
  listOrders: (params: { search?: string; status?: string; risk?: string; page?: number; pageSize?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.risk && params.risk !== 'all') searchParams.set('risk', params.risk);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const query = searchParams.toString();
    return apiFetch<AdminOrdersListResponse>(`/admin/orders${query ? `?${query}` : ''}`);
  },
  getOrder: (id: string) => apiFetch<AdminOrder>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    apiFetch<AdminOrder>(`/admin/orders/${id}`, { method: 'PATCH', body: { status } }),
  refundOrder: (id: string, payload: { amount: number; reason: string }) =>
    apiFetch<{ id: string; status: string }>(`/admin/orders/${id}/refund`, { method: 'POST', body: payload }),
  listPayoutLines: (params: { status?: string; page?: number; pageSize?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const query = searchParams.toString();
    return apiFetch<AdminPayoutsListResponse>(`/admin/payouts${query ? `?${query}` : ''}`);
  },
  listPayoutBatches: (params: { status?: string; page?: number; pageSize?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const query = searchParams.toString();
    return apiFetch<{ data: AdminPayoutBatch[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/admin/payouts/batches${query ? `?${query}` : ''}`
    );
  },
  createPayoutBatch: (payload: { affiliateIds?: string[]; scheduledFor?: string }) =>
    apiFetch(`/admin/payouts/batch`, { method: 'POST', body: payload }),
  processPayoutBatch: (batchId: string) =>
    apiFetch(`/admin/payouts/batch/${batchId}/process`, { method: 'POST', body: {} }),
  reconcilePayoutBatch: (batchId: string, receiptUrl?: string) =>
    apiFetch(`/admin/payouts/batch/${batchId}/reconcile`, { method: 'PATCH', body: { receiptUrl } }),
  listFraudAlerts: (params: { status?: string; type?: string; page?: number; pageSize?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.type) searchParams.set('type', params.type);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const query = searchParams.toString();
    return apiFetch<AdminFraudAlertsListResponse>(`/admin/fraud/alerts${query ? `?${query}` : ''}`);
  },
  resolveFraudAlert: (id: string, notes?: string) =>
    apiFetch<{ ok: boolean; data: AdminFraudAlert }>(`/admin/fraud/alerts/${id}/resolve`, {
      method: 'PATCH',
      body: { notes }
    }),
  listReports: (params: { type?: string; range?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.type && params.type !== 'all') searchParams.set('type', params.type);
    if (params.range) searchParams.set('range', params.range);
    const query = searchParams.toString();
    return apiFetch<AdminReportsListResponse>(`/admin/reports${query ? `?${query}` : ''}`);
  },
  createReport: (payload: { type: string; range: string; format: string }) =>
    apiFetch<{ id: string; status: string }>(`/admin/reports`, { method: 'POST', body: payload }),
  downloadReport: (id: string) => `${API_BASE_URL}/admin/reports/${id}/download`,
  listAuditLogs: (params: { search?: string; action?: string; page?: number; pageSize?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.action && params.action !== 'all') searchParams.set('action', params.action);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const query = searchParams.toString();
    return apiFetch<AdminAuditListResponse>(`/admin/audit${query ? `?${query}` : ''}`);
  },
  exportAuditCsv: () => `${API_BASE_URL}/admin/audit/export`
};
