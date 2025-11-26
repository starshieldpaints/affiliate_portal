type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_CORE_API_URL ||
  'http://localhost:4000';
const API_BASE = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function resolveUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(resolveUrl('/auth/admin/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken as string;
    }
    return null;
  } catch {
    return null;
  }
}

function buildUrl(url: string, params?: Record<string, string | number | undefined>) {
  if (!params) return resolveUrl(url);
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const target = resolveUrl(url);
  return query ? `${target}?${query}` : target;
}

async function request<T>(
  method: HttpMethod,
  url: string,
  options: {
    body?: any;
    params?: Record<string, any>;
    skipAuth?: boolean;
    retry?: boolean;
  } = {}
): Promise<T> {
  const target = buildUrl(url, options.params);
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
  }
  if (accessToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(target, {
    method,
    credentials: 'include',
    headers,
    body
  });

  // Avoid retry loops against the refresh endpoint itself.
  const isRefreshCall = url.includes('/auth/admin/refresh');

  if (res.status === 401 && !options.retry && !isRefreshCall) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(method, url, { ...options, retry: true });
    }
  }

  if (!res.ok) {
    const text = await res.text();
    // If HTML (likely Next 404), surface a clearer error.
    if (text?.startsWith('<!DOCTYPE')) {
      throw new Error(`Request to ${target} failed with status ${res.status}`);
    }
    throw new Error(text || 'Request failed');
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  // @ts-ignore
  return res.text();
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>) => request<T>('GET', url, { params }),
  post: <T>(url: string, body?: any) => request<T>('POST', url, { body }),
  patch: <T>(url: string, body?: any) => request<T>('PATCH', url, { body }),
  delete: <T>(url: string) => request<T>('DELETE' as any, url),
  setAccessToken
};
