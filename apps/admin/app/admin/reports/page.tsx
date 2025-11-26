'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../src/lib/api';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../src/components/AdminSidebar';
import { cn } from '../../../src/utils/cn';
import { ReportListTable } from '../../../src/components/reports/ReportListTable';
import { ReportForm } from '../../../src/components/reports/ReportForm';

type ReportRow = {
  id: string;
  type: string;
  range: string;
  generatedAt?: Date | null;
  filename?: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: any[] }>('/admin/reports');
        const rows =
          res.data?.map((r) => ({
            id: r.id,
            type: r.type ?? 'summary',
            range: r.range ?? 'recent',
            filename: r.filename ?? 'report.csv',
            generatedAt: r.generatedAt ? new Date(r.generatedAt) : null
          })) ?? [];
        setReports(rows);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load reports');
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

            <AdminHeader title="Reports" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300">Generate and download reports.</p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  New report
                </button>
              </div>

              <ReportListTable data={reports} loading={loading} error={error ?? undefined} onRetry={load} />
            </div>
          </div>
        </div>

        <ReportForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
