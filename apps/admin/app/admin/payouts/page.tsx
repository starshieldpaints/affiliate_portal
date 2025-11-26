'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../src/lib/api';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../src/components/AdminSidebar';
import { cn } from '../../../src/utils/cn';
import { PayoutLinesTable, PayoutLineRow } from '../../../src/components/payouts/PayoutLinesTable';
import { PayoutBatchForm } from '../../../src/components/payouts/PayoutBatchForm';
import Link from 'next/link';

const pageSize = 10;

type BatchRow = {
  id: string;
  status: string;
  totalAmount?: number | null;
  currency?: string | null;
  lineCount?: number;
};

export default function PayoutsPage() {
  const [lines, setLines] = useState<PayoutLineRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loadingLines, setLoadingLines] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadLines = useMemo(
    () => async () => {
      setLoadingLines(true);
      setError(null);
      try {
        const res = await api.get<{ data: any[]; meta?: { total?: number; totalPages?: number } }>(
          '/admin/payouts',
          { page, pageSize }
        );
        const rows =
          res.data?.map((l) => ({
            id: l.id,
            affiliateId: l.affiliateId,
            amount: Number(l.amount ?? 0),
            currency: l.currency ?? 'USD',
            status: l.status,
            createdAt: l.createdAt ? new Date(l.createdAt) : null
          })) ?? [];
        setLines(rows);
        setMeta(res.meta ?? {});
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load payout lines');
      } finally {
        setLoadingLines(false);
      }
    },
    [page]
  );

  const loadBatches = useMemo(
    () => async () => {
      setLoadingBatches(true);
      try {
        const res = await api.get<{ data: any[] }>('/admin/payouts/batches');
        const rows =
          res.data?.map((b) => ({
            id: b.id,
            status: b.status,
            totalAmount: b.totalAmount ? Number(b.totalAmount) : null,
            currency: b.currency ?? 'USD',
            lineCount: b.lineCount ?? b.lines?.length ?? 0
          })) ?? [];
        setBatches(rows);
      } finally {
        setLoadingBatches(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const totalPages = meta.totalPages ?? Math.ceil((meta.total ?? lines.length) / pageSize) || 1;

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

            <AdminHeader title="Payouts" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Manage payout lines and batches.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  New batch
                </button>
              </div>

              <PayoutLinesTable data={lines} loading={loadingLines} error={error ?? undefined} onRetry={loadLines} />

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

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Batches</h2>
              </div>
              {loadingBatches && <p className="text-sm text-slate-500">Loading batches...</p>}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {batches.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/payouts/${b.id}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand hover:shadow-md dark:border-white/10 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-slate-800 dark:text-white">Batch {b.id.slice(0, 6)}</span>
                      <span className="text-xs uppercase">{b.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                      {b.currency ?? 'USD'} {b.totalAmount?.toFixed(2) ?? '0.00'}
                    </div>
                    <div className="text-xs text-slate-500">Lines: {b.lineCount ?? 0}</div>
                  </Link>
                ))}
                {batches.length === 0 && !loadingBatches && (
                  <p className="text-sm text-slate-500">No batches created.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <PayoutBatchForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            loadLines();
            loadBatches();
            setShowForm(false);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
