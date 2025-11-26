'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../../src/lib/api';
import { ProtectedRoute } from '../../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../../src/components/AdminSidebar';
import { cn } from '../../../../src/utils/cn';
import Link from 'next/link';
import { ResolveAlertDialog } from '../../../../src/components/fraud/ResolveAlertDialog';

type AlertRow = {
  id: string;
  type: string;
  riskScore: number;
  status: string;
  affiliateId: string;
};

export default function FraudAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: any[] }>('/admin/fraud/alerts');
        const rows =
          res.data?.map((a) => ({
            id: a.id,
            type: a.type,
            riskScore: Number(a.riskScore ?? 0),
            status: a.status,
            affiliateId: a.affiliateId
          })) ?? [];
        setAlerts(rows);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

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

            <AdminHeader title="Fraud Alerts" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {loading && <p className="text-sm text-slate-500">Loading alerts...</p>}
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-white/10">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                  <thead className="bg-slate-50 dark:bg-slate-900/60">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Affiliate</th>
                      <th className="px-4 py-3">Risk</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-white/10 dark:bg-slate-950">
                    {alerts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <Link href={`/admin/fraud/alerts/${a.id}`}>{a.type}</Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{a.affiliateId}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{a.riskScore}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{a.status}</td>
                        <td className="px-4 py-3 text-right">
                          {a.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => setResolveId(a.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                          No alerts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <ResolveAlertDialog
          open={!!resolveId}
          alertId={resolveId}
          onClose={() => setResolveId(null)}
          onResolved={load}
        />
      </div>
    </ProtectedRoute>
  );
}
