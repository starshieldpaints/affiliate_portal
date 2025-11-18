'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Wallet, LineChart, Share2, ExternalLink } from 'lucide-react';
import { OverviewCards } from '../_components/OverviewCards';
import { cn } from '../../../src/utils/cn';
import { dashboardApi } from '../../../src/lib/api-client';
import type { AffiliateDashboardOverview } from '../../../src/types/dashboard';

type MetricsCard = {
  label: string;
  value: string;
  change: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<AffiliateDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    dashboardApi
      .overview()
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load dashboard');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const metricCards: MetricsCard[] = useMemo(() => {
    if (!data) {
      return [
        { label: 'Clicks', value: '—', change: 'live' },
        { label: 'Conversions', value: '—', change: 'live' },
        { label: 'Commission', value: '—', change: 'live' },
        { label: 'Pending Payout', value: '—', change: 'live' }
      ];
    }
    return [
      { label: 'Clicks', value: formatNumber(data.stats.clicks), change: 'live' },
      { label: 'Conversions', value: formatNumber(data.stats.conversions), change: 'live' },
      { label: 'Commission', value: formatCurrency(data.stats.totalCommission), change: 'approved' },
      {
        label: 'Pending Payout',
        value: formatCurrency(data.stats.pendingCommission),
        change: `${formatNumber(data.stats.activeLinks)} links`
      }
    ];
  }, [data]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 px-6 py-6 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60 dark:shadow-black/30 sm:px-10 sm:py-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.5em] text-brand">Affiliate cockpit</p>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="max-w-3xl text-sm text-muted">
              Your campaigns auto-refresh every five minutes. Use these live metrics to keep payouts
              and conversions on track.
            </p>
          </div>
        </div>
      </header>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </p>
      )}

      <OverviewCards items={metricCards} />

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <PerformancePanel stats={data?.stats} topLinks={data?.topLinks ?? []} loading={loading} />
        <ActivityCard activity={data?.recentActivity ?? []} loading={loading} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PayoutCard upcoming={data?.upcomingPayout ?? null} stats={data?.stats} loading={loading} />
        <ChannelCard channels={data?.channelMix ?? []} loading={loading} />
      </section>
    </div>
  );
}

function PerformancePanel({
  stats,
  topLinks,
  loading
}: {
  stats?: AffiliateDashboardOverview['stats'];
  topLinks: AffiliateDashboardOverview['topLinks'];
  loading: boolean;
}) {
  return (
    <article className="card-surface flex flex-col gap-6 rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand">Performance pulse</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Campaign snapshot
          </h2>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
          <LineChart className="h-4 w-4" />
          Download report
        </button>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <HighlightCard
          icon={<Wallet className="h-4 w-4" />}
          title="Pending commission"
          value={stats ? formatCurrency(stats.pendingCommission) : '—'}
          delta={stats ? `${formatNumber(stats.activeLinks)} live links` : 'Awaiting data'}
        />
        <HighlightCard
          icon={<Share2 className="h-4 w-4" />}
          title="Approved commission"
          value={stats ? formatCurrency(stats.totalCommission) : '—'}
          delta={stats ? `${formatNumber(stats.conversions)} conversions` : 'Awaiting data'}
        />
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-950/50 dark:text-slate-300">
        <p className="font-semibold text-slate-900 dark:text-white">Top links</p>
        <div className="mt-4 space-y-3">
          {loading && topLinks.length === 0 ? (
            <p className="text-sm text-muted">Loading links...</p>
          ) : topLinks.length === 0 ? (
            <p className="text-sm text-muted">No link data yet.</p>
          ) : (
            topLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100/80 px-3 py-2 text-xs dark:border-slate-800"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{link.label}</p>
                  <p className="text-muted">{formatNumber(link.clicks)} clicks</p>
                </div>
                {link.landingUrl && (
                  <a
                    href={link.landingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

function HighlightCard({
  icon,
  title,
  value,
  delta
}: {
  icon: ReactNode;
  title: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800/70 dark:bg-slate-950/50">
      <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-muted">{delta}</p>
    </div>
  );
}

function ActivityCard({
  activity,
  loading
}: {
  activity: AffiliateDashboardOverview['recentActivity'];
  loading: boolean;
}) {
  return (
    <article className="card-surface flex flex-col gap-4 rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
      <header className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Timeline</p>
        <ArrowUpRight className="h-4 w-4 text-slate-400" />
      </header>
      <div className="space-y-4 text-sm text-muted">
        {loading && activity.length === 0 ? (
          <p className="text-sm text-muted">Loading activity...</p>
        ) : activity.length === 0 ? (
          <p className="text-sm text-muted">No activity recorded yet.</p>
        ) : (
          activity.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-slate-800/70"
            >
              <p className="text-slate-900 dark:text-white">{item.label}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-brand">
                {formatCurrency(item.amount, item.currency)}
              </p>
              <p className="text-xs text-muted">
                {item.status} • {formatDate(item.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function PayoutCard({
  upcoming,
  stats,
  loading
}: {
  upcoming: AffiliateDashboardOverview['upcomingPayout'];
  stats?: AffiliateDashboardOverview['stats'];
  loading: boolean;
}) {
  return (
    <article className="card-surface flex flex-col gap-4 rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Payout tracker</p>
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {upcoming ? formatCurrency(upcoming.amount, upcoming.currency) : 'No payout scheduled'}
        </h3>
        <p className="text-sm text-muted">
          {upcoming
            ? `Next release ${formatDate(upcoming.scheduledFor)}`
            : loading
              ? 'Loading payout data...'
              : 'Approved commissions will appear once scheduled.'}
        </p>
      </header>
      <div className="space-y-4">
        <PayoutStage
          label="Approved"
          amount={formatCurrency(stats?.totalCommission ?? 0)}
          progress={stats && stats.totalCommission ? 100 : 0}
          tone="complete"
        />
        <PayoutStage
          label="Pending review"
          amount={formatCurrency(stats?.pendingCommission ?? 0)}
          progress={stats && stats.pendingCommission ? 70 : 0}
          tone="active"
        />
        <PayoutStage
          label="Scheduled"
          amount={upcoming ? formatCurrency(upcoming.amount, upcoming.currency) : '$0'}
          progress={upcoming ? 40 : 0}
          tone="waiting"
        />
      </div>
    </article>
  );
}

function PayoutStage({
  label,
  amount,
  progress,
  tone
}: {
  label: string;
  amount: string;
  progress: number;
  tone: 'complete' | 'active' | 'waiting';
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="text-muted">{amount}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            tone === 'complete' ? 'bg-emerald-500' : tone === 'active' ? 'bg-brand' : 'bg-slate-400'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ChannelCard({
  channels,
  loading
}: {
  channels: AffiliateDashboardOverview['channelMix'];
  loading: boolean;
}) {
  return (
    <article className="card-surface flex flex-col gap-4 rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
      <header className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Channel split</p>
        <ArrowUpRight className="h-4 w-4 text-slate-400" />
      </header>
      <div className="space-y-3">
        {loading && channels.length === 0 ? (
          <p className="text-sm text-muted">Loading channel mix...</p>
        ) : channels.length === 0 ? (
          <p className="text-sm text-muted">Channel attribution will appear once data flows in.</p>
        ) : (
          channels.map((channel) => (
            <div
              key={`${channel.label}-${channel.share}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-100/80 px-3 py-3 dark:border-slate-800/70"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {channel.label}
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${channel.share}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted">{channel.share}%</p>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
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

function formatDate(value: string | Date) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}
