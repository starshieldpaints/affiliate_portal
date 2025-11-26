'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../src/lib/api';
import { ProtectedRoute } from '../../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../../src/components/AdminSidebar';
import { cn } from '../../../../src/utils/cn';
import { PayoutLinesTable, PayoutLineRow } from '../../../../src/components/payouts/PayoutLinesTable';
import { ReconciliationDrawer } from '../../../../src/components/payouts/ReconciliationDrawer';

type BatchDetail = {
  id: string;
  status: string;
  totalAmount?: number | null;
  currency?: string | null;
  provider?: string | null;
  providerBatchId?: string | null;
  receiptUrl?: string | null;
};

export default function PayoutBatchDetailPage() {
  const params = useParams<{ id: string }>();
  const batchId = params?.id;
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [lines, setLines] = useState<PayoutLineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  const load = async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: any }>(`/admin/payouts/${batchId}`);
      const b = res.data;
      setBatch({
        id: b.id,
        status: b.status,
        totalAmount: b.totalAmount ? Number(b.totalAmount) : null,
        currency: b.currency ?? 'USD',
        provider: b.provider,
        providerBatchId: b.providerBatchId,
        receiptUrl: b.receiptUrl
      });
      const linesRes = await api.get<{ data: any[] }>(`/admin/payouts/${batchId}/lines`);
      const rows =
        linesRes.data?.map((l) => ({
          id: l.id,
          affiliateId: l.affiliateId,
          amount: Number(l.amount ?? 0),
          currency: l.currency ?? 'USD',
          status: l.status,
          createdAt: l.createdAt ? new Date(l.createdAt) : null
        })) ?? [];
      setLines(rows);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load batch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [batchId]);

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

            <AdminHeader title="Payout Batch" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {loading && <p className="text-sm text-slate-500">Loading batch...</p>}
              {error && <p className="text-sm text-rose-500">{error}</p>}
              {batch && (
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p>
                    <strong>ID:</strong> {batch.id}
                  </p>
                  <p>
                    <strong>Status:</strong> {batch.status}
                  </p>
                  <p>
                    <strong>Total:</strong> {batch.currency} {batch.totalAmount?.toFixed(2) ?? '0.00'}
                  </p>
                  <p>
                    <strong>Provider:</strong> {batch.provider ?? 'stub'}
                  </p>
                  <p>
                    <strong>Receipt:</strong>{' '}
                    {batch.receiptUrl ? (
                      <a href={batch.receiptUrl} className="text-brand underline">
                        View
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReconcileOpen(true)}
                    className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                  >
                    Reconcile
                  </button>
                </div>
              )}

              <PayoutLinesTable data={lines} />
            </div>
          </div>
        </div>

        <ReconciliationDrawer
          open={reconcileOpen}
          batchId={batchId}
          onClose={() => setReconcileOpen(false)}
          onReconciled={load}
        />
      </div>
    </ProtectedRoute>
  );
}
