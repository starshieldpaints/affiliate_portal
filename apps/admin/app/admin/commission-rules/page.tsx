'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../src/lib/api';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../src/components/AdminSidebar';
import { cn } from '../../../src/utils/cn';
import Link from 'next/link';
import { CommissionRuleForm, CommissionRuleFormValues } from '../../../src/components/commission/CommissionRuleForm';

type RuleRow = {
  id: string;
  name: string;
  type: string;
  rate: number;
  isActive: boolean;
};

const pageSize = 10;

export default function CommissionRulesPage() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: any[]; meta?: { total?: number; totalPages?: number } }>(
          '/admin/commission-rules',
          { page, pageSize }
        );
        const rows =
          res.data?.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            rate: Number(r.rate),
            isActive: r.isActive
          })) ?? [];
        setRules(rows);
        setMeta(res.meta ?? {});
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load rules');
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = meta.totalPages ?? Math.ceil((meta.total ?? rules.length) / pageSize) || 1;

  const toggleActive = async (rule: RuleRow) => {
    const endpoint = rule.isActive
      ? `/admin/commission-rules/${rule.id}/deactivate`
      : `/admin/commission-rules/${rule.id}/activate`;
    await api.post(endpoint, {});
    load();
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

            <AdminHeader title="Commission Rules" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Manage commission calculation logic.
                  </p>
                </div>
                <Link
                  href="/admin/commission-rules/new"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  New rule
                </Link>
              </div>

              {loading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
              {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-white/10">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                  <thead className="bg-slate-50 dark:bg-slate-900/60">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-white/10 dark:bg-slate-950">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <Link href={`/admin/commission-rules/${rule.id}`}>{rule.name}</Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{rule.type}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{rule.rate}</td>
                        <td className="px-4 py-3">
                          <span
                            className={rule.isActive ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-300'}
                          >
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRule(rule);
                              setShowForm(true);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(rule)}
                            className="ml-2 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                          >
                            {rule.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                          No rules found.
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

        <CommissionRuleForm
          open={showForm}
          ruleId={selectedRule?.id}
          initialValues={
            selectedRule
              ? {
                  name: selectedRule.name,
                  type: selectedRule.type as any,
                  rate: selectedRule.rate,
                  excludeTaxShipping: true
                }
              : undefined
          }
          onClose={() => {
            setShowForm(false);
            setSelectedRule(null);
          }}
          onSaved={load}
        />
      </div>
    </ProtectedRoute>
  );
}
