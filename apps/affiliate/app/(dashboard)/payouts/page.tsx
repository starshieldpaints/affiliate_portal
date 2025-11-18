'use client';

import { useEffect, useState } from 'react';
import { payoutsApi } from '../../../src/lib/api-client';
import type { AffiliatePayoutOverview } from '../../../src/types/dashboard';

export default function PayoutsPage() {
  const [data, setData] = useState<AffiliatePayoutOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    payoutsApi
      .overview()
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load payouts');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const history = data?.history ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Payouts</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Commission Lifecycle
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Track pending, approved, and completed payouts. Receipts are stored for seven years to
          support audits and compliance checks.
        </p>
      </header>
      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </p>
      )}
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="card-surface rounded-3xl p-6 text-slate-700 shadow-lg shadow-slate-200/60 dark:text-slate-200 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Payout History
          </h2>
          {loading && history.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Loading payout history…</p>
          ) : history.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No payouts recorded yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {history.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between py-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(payout.amount, payout.currency)}
                    </p>
                    <p className="text-xs text-muted">{payout.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted">
                      {formatDate(payout.createdAt)}
                    </p>
                    <p className="text-xs text-muted">{payout.method ?? 'Stripe'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(payout.status)}`}>
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/5 via-white/70 to-palette-blue/10 p-6 text-slate-900 shadow-lg shadow-brand/20 dark:from-brand/25 dark:via-palette-black/30 dark:to-brand/10 dark:text-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
            Next Payout
          </h2>
          {loading && !data ? (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          ) : data?.nextPayout ? (
            <>
              <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(data.nextPayout.amount, data.nextPayout.currency)}
              </p>
              <p className="text-xs uppercase tracking-wide text-brand">
                Scheduled • {formatDate(data.nextPayout.scheduledFor)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">$0</p>
              <p className="text-xs uppercase tracking-wide text-brand">No payout scheduled yet</p>
            </>
          )}
          <div className="mt-4 space-y-3 text-xs text-muted">
            <p>
              Pending commissions:{' '}
              <strong>{formatCurrency(data?.summary.pendingCommission ?? 0)}</strong>
            </p>
            <p>
              Approved commissions:{' '}
              <strong>{formatCurrency(data?.summary.approvedCommission ?? 0)}</strong>
            </p>
          </div>
          <button className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Download Statement
          </button>
        </article>
      </section>
    </div>
  );
}

function formatCurrency(value: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value ?? 0);
  } catch {
    return `$${(value ?? 0).toFixed(2)}`;
  }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function statusClass(status: string) {
  if (status === 'paid') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }
  if (status === 'failed') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
  }
  return 'bg-brand/20 text-brand';
}
