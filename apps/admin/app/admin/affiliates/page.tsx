'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../src/lib/api';
import { AffiliatesTable, AffiliateRow } from '../../../src/components/affiliates/AffiliatesTable';
import { KycDecisionDrawer } from '../../../src/components/affiliates/KycDecisionDrawer';
import { AdminHeader } from '../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../src/components/AdminSidebar';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { cn } from '../../../src/utils/cn';

type ApiAffiliate = {
  id: string;
  displayName?: string;
  email?: string;
  status?: string;
  kycStatus?: string;
  createdAt?: string;
  linksCount?: number;
  ordersCount?: number;
};

const pageSize = 10;

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [kycStatus, setKycStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [selected, setSelected] = useState<AffiliateRow | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{
          data: ApiAffiliate[];
          meta?: { total?: number; totalPages?: number };
        }>('/admin/affiliates', {
          search,
          status: status !== 'all' ? status : undefined,
          kycStatus: kycStatus !== 'all' ? kycStatus : undefined,
          page,
          pageSize
        });
        const rows =
          res.data?.map((a) => ({
            id: a.id,
            name: a.displayName ?? '—',
            email: a.email ?? '—',
            status: (a.status ?? 'unknown') as string,
            kycStatus: (a.kycStatus ?? 'pending') as string,
            createdAt: a.createdAt ? new Date(a.createdAt) : null,
            linksCount: a.linksCount ?? 0,
            ordersCount: a.ordersCount ?? 0
          })) ?? [];
        setAffiliates(rows);
        setMeta(res.meta ?? {});
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load affiliates');
      } finally {
        setLoading(false);
      }
    },
    [search, status, kycStatus, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = meta.totalPages ?? Math.ceil((meta.total ?? affiliates.length) / pageSize) || 1;

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

            <AdminHeader title="Affiliates" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search affiliates"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
                <select
                  value={kycStatus}
                  onChange={(e) => {
                    setKycStatus(e.target.value as any);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All KYC</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <AffiliatesTable
                loading={loading}
                error={error ?? undefined}
                data={affiliates}
                onRetry={load}
                onSelect={(a) => setSelected(a)}
              />

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

        <KycDecisionDrawer
          open={!!selected}
          affiliate={selected}
          onClose={() => setSelected(null)}
          onSubmitted={async () => {
            await load();
            setSelected(null);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
