'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { adminApi } from '../../../src/lib/api-client';
import type { AdminAffiliate } from '../../../src/types/affiliates';
import { Loader2, RefreshCcw } from 'lucide-react';

const statusFilters = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' }
];

const kycFilters = [
  { label: 'All KYC states', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' }
];

export default function AffiliatesPage() {
  const [search, setSearch] = useState('');
  const [kycStatus, setKycStatus] = useState('all');
  const [status, setStatus] = useState('all');

  const query = useQuery({
    queryKey: ['admin-affiliates', { search, kycStatus, status }],
    queryFn: () =>
      adminApi.listAffiliates({
        search: search.trim() || undefined,
        kycStatus,
        status
      })
  });

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  const kycSummary = useMemo(() => {
    if (!meta?.kycBreakdown) {
      return [];
    }
    return Object.entries(meta.kycBreakdown).map(([state, count]) => ({
      state,
      count
    }));
  }, [meta]);

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Affiliates</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Program Roster</h1>
        <p className="max-w-3xl text-sm text-muted">
          Review onboarding status, payouts readiness, and link/coupon usage. Apply filters to zero
          in on affiliates who need compliance attention.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Invite Affiliate
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700/70 dark:text-slate-200"
            onClick={() => query.refetch()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <section className="card-surface grid gap-4 rounded-3xl p-6 text-sm text-slate-800 shadow-lg shadow-black/10 dark:text-slate-200 lg:grid-cols-4">
        <StatCard title="Total affiliates" value={meta?.total ?? 0} />
        {kycSummary.length ? (
          kycSummary.map((item) => (
            <StatCard key={item.state} title={`KYC ${item.state}`} value={item.count} />
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 text-slate-800 dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">KYC</p>
            <p className="mt-2 text-sm text-muted">No affiliates found for the selected view.</p>
          </div>
        )}
      </section>

      <section className="card-surface rounded-3xl p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Search
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or referral code..."
              className="flex-1 rounded-full border border-transparent bg-transparent px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none dark:text-white"
            />
            {query.isFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted dark:text-slate-300">
            <Select
              value={status}
              onChange={setStatus}
              label="Status"
              options={statusFilters}
            />
            <Select value={kycStatus} onChange={setKycStatus} label="KYC" options={kycFilters} />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <table className="min-w-full divide-y divide-slate-200/60 text-sm text-slate-800 dark:divide-slate-800/70 dark:text-slate-200">
            <thead className="bg-white text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Affiliate</th>
                <th className="px-6 py-4 text-left font-medium">Status</th>
                <th className="px-6 py-4 text-left font-medium">KYC</th>
                <th className="px-6 py-4 text-left font-medium">Links</th>
                <th className="px-6 py-4 text-left font-medium">Coupons</th>
                <th className="px-6 py-4 text-left font-medium">Phone</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {query.isLoading ? (
                <TableMessage message="Loading affiliates..." />
              ) : rows.length === 0 ? (
                <TableMessage message="No affiliates match this view." />
              ) : (
                rows.map((affiliate) => <AffiliateRow key={affiliate.id} affiliate={affiliate} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AffiliateRow({ affiliate }: { affiliate: AdminAffiliate }) {
  return (
    <tr className="hover:bg-brand/10">
      <td className="px-6 py-4">
        <p className="font-semibold text-slate-900 dark:text-white">
          {affiliate.displayName ?? 'Unnamed affiliate'}
        </p>
        <p className="text-xs text-slate-400">{affiliate.user.email}</p>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            affiliate.user.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-amber-500/20 text-amber-200'
          }`}
        >
          {affiliate.user.status}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-slate-600 capitalize dark:text-slate-300">
        {affiliate.kycStatus}
      </td>
      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{affiliate._count.links}</td>
      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{affiliate._count.coupons}</td>
      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{affiliate.phone ?? '—'}</td>
      <td className="px-6 py-4 text-right text-xs">
        <button className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700/70 dark:text-slate-200">
          Review
        </button>
      </td>
    </tr>
  );
}

function Select({
  value,
  onChange,
  label,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="flex flex-col">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs text-slate-700 focus:border-brand focus:outline-none dark:border-slate-800/60 dark:bg-slate-950/50 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TableMessage({ message }: { message: string }) {
  return (
    <tr>
      <td className="px-6 py-8 text-center text-sm text-muted" colSpan={7}>
        {message}
      </td>
    </tr>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="card-surface rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}
