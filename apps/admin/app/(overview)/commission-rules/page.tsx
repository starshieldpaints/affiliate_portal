'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { adminApi } from '../../../src/lib/api-client';
import type {
  AdminCommissionRule,
  CreateCommissionRulePayload
} from '../../../src/types/commission-rules';
import { toast } from 'sonner';

const statusFilters: Array<{ label: string; value: 'all' | 'active' | 'scheduled' | 'expired' | 'inactive' }> =
  [
    { label: 'All statuses', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Expired', value: 'expired' },
    { label: 'Inactive', value: 'inactive' }
  ];

export default function CommissionRulesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'inactive'>(
    'all'
  );

  const query = useQuery({
    queryKey: ['admin-commission-rules', { search, status }],
    queryFn: () =>
      adminApi.listCommissionRules({
        search: search.trim() || undefined,
        status
      })
  });

  const rules = query.data?.data ?? [];
  const stats = query.data?.meta.statusCounts;

  const summaryCards = useMemo(() => {
    if (!stats) return [];
    return statusFilters
      .filter((filter) => filter.value !== 'all')
      .map((filter) => ({
        label: filter.label,
        value: stats[filter.value] ?? 0
      }));
  }, [stats]);

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Commission Rules</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Compensation Engine</h1>
        <p className="max-w-3xl text-sm text-muted">
          Configure percentage or flat payouts scoped to products, categories, affiliates, or
          regions. Filter rules to audit payout logic before launching campaigns.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <CreateRuleButton />
          <button
            onClick={() => query.refetch()}
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700/70 dark:text-slate-200"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <section className="card-surface grid gap-4 rounded-3xl p-6 text-sm text-slate-800 shadow-lg shadow-black/10 dark:text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total rules" value={query.data?.meta.total ?? 0} />
        {summaryCards.map((card) => (
          <StatCard key={card.label} title={card.label} value={card.value} />
        ))}
      </section>

      <section className="card-surface rounded-3xl p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="flex flex-1 flex-col text-xs font-semibold uppercase tracking-wide text-muted">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rule name or type..."
              className="mt-1 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-white"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="mt-1 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs text-slate-700 focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-white"
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {query.isLoading ? (
            <div className="rounded-3xl border border-dashed border-slate-200/70 p-10 text-center text-sm text-muted dark:border-slate-800/70">
              Loading commission rules...
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200/70 p-10 text-center text-sm text-muted dark:border-slate-800/70">
              No rules match this view.
            </div>
          ) : (
            rules.map((rule) => <RuleCard key={rule.id} rule={rule} />)
          )}
        </div>
      </section>
    </div>
  );
}

function RuleCard({ rule }: { rule: AdminCommissionRule }) {
  const formattedRate =
    rule.type.toLowerCase() === 'percent'
      ? `${(rule.rate * 100).toFixed(2).replace(/\.00$/, '')}%`
      : `${rule.rate >= 0 ? '$' : '-$'}${Math.abs(rule.rate).toFixed(2)}`;

  const timeframe =
    rule.startsAt || rule.endsAt
      ? [
          rule.startsAt ? new Date(rule.startsAt).toLocaleDateString() : 'Immediately',
          rule.endsAt ? new Date(rule.endsAt).toLocaleDateString() : 'No end'
        ].join(' → ')
      : 'Open ended';

  return (
    <article className="card-surface flex flex-col gap-4 rounded-3xl p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">{rule.id}</p>
          <h2 className="mt-2 text-lg font-semibold">{rule.name}</h2>
        </div>
        <StatusPill status={rule.status} />
      </div>

      <dl className="grid gap-3 text-sm text-slate-600 dark:text-slate-200">
        <Row label="Type" value={rule.type} />
        <Row label="Rate" value={formattedRate} />
        <Row label="Excludes tax/shipping" value={rule.excludeTaxShipping ? 'Yes' : 'No'} />
        <Row label="Timeframe" value={timeframe} />
      </dl>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Scopes</p>
        <div className="flex flex-wrap gap-2">
          {rule.scopes.length ? (
            rule.scopes.map((scope) => (
              <span
                key={`${rule.id}-${scope.type}-${scope.id}`}
                className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-200"
              >
                {scope.label}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted">Applies to all inventory</span>
          )}
        </div>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs sm:text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-slate-800 dark:text-white">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: AdminCommissionRule['status'] }) {
  const map: Record<AdminCommissionRule['status'], string> = {
    active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200',
    scheduled: 'bg-sky-500/15 text-sky-600 dark:text-sky-200',
    expired: 'bg-amber-500/15 text-amber-600 dark:text-amber-200',
    inactive: 'bg-slate-300/40 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${map[status]}`}>
      {status}
    </span>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-800 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function CreateRuleButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<CreateCommissionRulePayload>({
    name: '',
    type: 'percent',
    rate: 0.1,
    excludeTaxShipping: true,
    scopes: [{ type: 'global' }]
  });

  const mutation = useMutation({
    mutationFn: adminApi.createCommissionRule,
    onSuccess: () => {
      toast.success('Commission rule created.');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-commission-rules'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create rule.');
    }
  });

  const toggleScopeType = (index: number, type: CreateCommissionRulePayload['scopes'][number]['type']) => {
    setFormState((prev) => {
      const nextScopes = prev.scopes ? [...prev.scopes] : [];
      nextScopes[index] = { ...nextScopes[index], type };
      if (type === 'global') {
        nextScopes[index].targetId = undefined;
      }
      return { ...prev, scopes: nextScopes };
    });
  };

  return (
    <>
      <button
        className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark"
        onClick={() => setOpen(true)}
      >
        Create Rule
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">New rule</p>
                <h2 className="text-2xl font-semibold">Create commission rule</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-sm text-muted hover:text-brand">
                Close
              </button>
            </div>

            <form
              className="mt-6 space-y-5 text-sm"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate(formState);
              }}
            >
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Rule name
                </span>
                <input
                  className="form-input"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Type</span>
                  <select
                    className="form-input"
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, type: event.target.value }))
                    }
                  >
                    <option value="percent">Percent</option>
                    <option value="flat">Flat</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Rate</span>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={formState.rate}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, rate: Number(event.target.value) }))
                    }
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
                <input
                  type="checkbox"
                  checked={formState.excludeTaxShipping}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, excludeTaxShipping: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Exclude tax & shipping
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Starts</span>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formState.startsAt ?? ''}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, startsAt: event.target.value || null }))
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Ends</span>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formState.endsAt ?? ''}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, endsAt: event.target.value || null }))
                    }
                  />
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Scopes</p>
                {(formState.scopes ?? []).map((scope, index) => (
                  <div
                    key={`${scope.type}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/50"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <select
                        value={scope.type}
                        onChange={(event) => toggleScopeType(index, event.target.value as typeof scope.type)}
                        className="form-input sm:max-w-xs"
                      >
                        <option value="global">Global</option>
                        <option value="product">Product</option>
                        <option value="category">Category</option>
                        <option value="affiliate">Affiliate</option>
                        <option value="country">Country</option>
                      </select>
                      {scope.type !== 'global' && (
                        <input
                          placeholder="Target ID"
                          className="form-input"
                          value={scope.targetId ?? ''}
                          onChange={(event) =>
                            setFormState((prev) => {
                              const scopes = prev.scopes ? [...prev.scopes] : [];
                              scopes[index] = { ...scopes[index], targetId: event.target.value };
                              return { ...prev, scopes };
                            })
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      scopes: [...(prev.scopes ?? []), { type: 'global' }]
                    }))
                  }
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  + Add scope
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
                >
                  {mutation.isPending ? 'Saving...' : 'Save rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
