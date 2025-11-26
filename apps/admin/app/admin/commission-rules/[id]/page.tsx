'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../src/lib/api';
import { CommissionRuleForm } from '../../../../src/components/commission/CommissionRuleForm';
import { ProtectedRoute } from '../../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../../src/components/AdminSidebar';
import { cn } from '../../../../src/utils/cn';

export default function CommissionRuleEditPage() {
  const params = useParams<{ id: string }>();
  const ruleId = params?.id;
  const [initialValues, setInitialValues] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!ruleId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: any }>(`/admin/commission-rules/${ruleId}`);
        const r = res.data;
        setInitialValues({
          name: r.name,
          type: r.type,
          rate: Number(r.rate),
          excludeTaxShipping: r.excludeTaxShipping,
          productIds: r.scopes?.map((s: any) => s.productId).filter(Boolean) ?? [],
          categoryIds: r.scopes?.map((s: any) => s.categoryId).filter(Boolean) ?? [],
          affiliateIds: r.scopes?.map((s: any) => s.affiliateId).filter(Boolean) ?? []
        });
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load rule');
      } finally {
        setLoading(false);
      }
    })();
  }, [ruleId]);

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
            <AdminHeader title="Edit Commission Rule" />
            <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {loading && <p className="text-sm text-slate-500">Loading rule...</p>}
              {error && <p className="text-sm text-rose-500">{error}</p>}
            </main>
          </div>
        </div>
        <CommissionRuleForm
          open={open}
          ruleId={ruleId}
          initialValues={initialValues ?? undefined}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
