'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../../src/lib/api';
import { ProtectedRoute } from '../../../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../../../src/components/AdminSidebar';
import { cn } from '../../../../../src/utils/cn';
import { FraudAlertDetails } from '../../../../../src/components/fraud/FraudAlertDetails';
import { ResolveAlertDialog } from '../../../../../src/components/fraud/ResolveAlertDialog';

type Alert = {
  id: string;
  type: string;
  affiliateId: string;
  orderId?: string | null;
  clickId?: string | null;
  riskScore: number;
  status: string;
  notes?: string | null;
  createdAt?: Date | null;
};

export default function FraudAlertDetailPage() {
  const params = useParams<{ id: string }>();
  const alertId = params?.id;
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  const load = async () => {
    if (!alertId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: any }>(`/admin/fraud/alerts/${alertId}`);
      const a = res.data;
      setAlert({
        id: a.id,
        type: a.type,
        affiliateId: a.affiliateId,
        orderId: a.orderId,
        clickId: a.clickId,
        riskScore: Number(a.riskScore ?? 0),
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt ? new Date(a.createdAt) : null
      });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load alert');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [alertId]);

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

            <AdminHeader title="Fraud Alert" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {loading && <p className="text-sm text-slate-500">Loading alert...</p>}
              {error && <p className="text-sm text-rose-500">{error}</p>}
              {alert && (
                <div className="space-y-3">
                  <FraudAlertDetails alert={alert} />
                  {alert.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => setResolveOpen(true)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <ResolveAlertDialog
          open={resolveOpen}
          alertId={alertId}
          onClose={() => setResolveOpen(false)}
          onResolved={load}
        />
      </div>
    </ProtectedRoute>
  );
}
