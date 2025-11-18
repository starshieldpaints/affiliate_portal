'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '../../../src/lib/api-client';
import type { AffiliateReportsOverview } from '../../../src/types/dashboard';

export default function ReportsPage() {
  const [data, setData] = useState<AffiliateReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    reportsApi
      .overview()
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load reports');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const cohorts = data?.cohorts ?? [];
  const funnel = data?.funnel ?? { sessions: 0, qualified: 0, conversions: 0 };

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Reports</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Analytics & Exports
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Generate time-series insights, breakout performance by channel, and export raw order data
          for your own dashboards.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Schedule Report
          </button>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700/70 dark:text-slate-200">
            Export CSV
          </button>
        </div>
      </header>
      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </p>
      )}
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card-surface rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Weekly Cohorts</h2>
          {loading && cohorts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Loading cohorts…</p>
          ) : cohorts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No data yet for weekly reporting.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {cohorts.map((cohort) => (
                <div
                  key={cohort.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-200"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">{cohort.label}</p>
                    <p className="text-sm text-muted">
                      {cohort.clicks} clicks · {cohort.conversions} conversions
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(cohort.commission)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/5 via-white/60 to-palette-blue/10 p-6 text-slate-900 shadow-lg shadow-brand/20 dark:from-brand/20 dark:via-palette-black/40 dark:to-brand/10 dark:text-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
            Conversion Funnel
          </h2>
          <ol className="mt-4 space-y-4 text-sm">
            <FunnelItem label={`${formatNumber(funnel.sessions)} sessions`} subtitle="Top-of-funnel" />
            <FunnelItem
              label={`${formatNumber(funnel.qualified)} qualified`}
              subtitle="Engaged"
            />
            <FunnelItem
              label={`${formatNumber(funnel.conversions)} conversions`}
              subtitle="Converted"
            />
          </ol>
          <p className="mt-4 text-xs text-brand">
            Funnel computed using last-click attribution with a rolling 4-week window.
          </p>
        </article>
      </section>
    </div>
  );
}

function FunnelItem({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <li className="rounded-2xl border border-brand/20 bg-white/75 px-4 py-3 shadow-sm dark:bg-brand/20">
      <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
      <p className="text-xs uppercase tracking-wide text-brand">{subtitle}</p>
    </li>
  );
}

function formatCurrency(value: number) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value ?? 0);
  } catch {
    return `$${(value ?? 0).toFixed(2)}`;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}
