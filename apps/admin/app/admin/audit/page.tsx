'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../src/lib/api';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../src/components/AdminSidebar';
import { cn } from '../../../src/utils/cn';
import Link from 'next/link';

type AuditRow = {
  id: string;
  actor?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt?: Date | null;
};

const pageSize = 20;

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminId, setAdminId] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{
          data: any[];
          meta?: { total?: number; totalPages?: number; page?: number; pageSize?: number };
        }>('/admin/audit', {
          adminId: adminId || undefined,
          action: action || undefined,
          entityType: entity || undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          pageSize
        });
        const rows =
          res.data?.map((l) => ({
            id: l.id,
            actor: l.user?.email ?? null,
            action: l.action,
            entityType: l.entityType ?? l.meta?.entityType ?? null,
            entityId: l.entityId ?? null,
            createdAt: l.createdAt ? new Date(l.createdAt) : null
          })) ?? [];
        setLogs(rows);
        setMeta(res.meta ?? {});
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    },
    [adminId, action, entity, from, to, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = meta.totalPages ?? Math.ceil((meta.total ?? logs.length) / pageSize) || 1;

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (adminId) params.set('adminId', adminId);
    if (action) params.set('action', action);
    if (entity) params.set('entityType', entity);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/admin/audit/export?${params.toString()}`, { credentials: 'include' });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
          <div className={cn('lg:block', sidebarOpen ? 'block' : 'hidden')}>
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-900"
              >
                {sidebarOpen ? 'Close' : 'Menu'}
              </button>
            </div>

            <AdminHeader title="Audit Logs" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  value={adminId}
                  onChange={(e) => {
                    setPage(1);
                    setAdminId(e.target.value);
                  }}
                  placeholder="Admin email"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={action}
                  onChange={(e) => {
                    setPage(1);
                    setAction(e.target.value);
                  }}
                  placeholder="Action (e.g., FRAUD_RESOLVE)"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <input
                  value={entity}
                  onChange={(e) => {
                    setPage(1);
                    setEntity(e.target.value);
                  }}
                  placeholder="Entity type"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setPage(1);
                      setFrom(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setPage(1);
                      setTo(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  Export CSV
                </button>
              </div>

              {loading && <p className="mt-4 text-sm text-slate-500">Loading audit logs...</p>}
              {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-white/10">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                  <thead className="bg-slate-50 dark:bg-slate-900/60">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-white/10 dark:bg-slate-950">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          {l.actor ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{l.action}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          {l.entityType ?? '—'} {l.entityId ? `(${l.entityId})` : ''}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-200">
                          {l.createdAt ? l.createdAt.toISOString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                          No audit entries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
