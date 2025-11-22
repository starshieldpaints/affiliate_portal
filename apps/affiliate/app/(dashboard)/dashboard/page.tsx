'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Wallet, LineChart, Share2, ExternalLink } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import { OverviewCards } from '../_components/OverviewCards';
import { cn } from '../../../src/utils/cn';
import { dashboardApi } from '../../../src/lib/api-client';
import type { AffiliateDashboardOverview } from '../../../src/types/dashboard';

type MetricsCard = {
  label: string;
  value: string;
  change: string;
};

type InsightMetric = {
  label: string;
  value: string;
  helper: string;
  mood: 'up' | 'down' | 'neutral';
  badge: string;
};

type TrendPoint = {
  date: string;
  amount: number;
  cumulative: number;
};

type LinkPerformancePoint = {
  name: string;
  clicks: number;
  share: number;
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
        { label: 'Clicks', value: '--', change: 'live' },
        { label: 'Conversions', value: '--', change: 'live' },
        { label: 'CTR', value: '--', change: 'live' },
        { label: 'Earnings / Click', value: '--', change: 'live' },
        { label: 'Commission', value: '--', change: 'live' },
        { label: 'Pending Payout', value: '--', change: 'live' },
        { label: 'Active links', value: '--', change: 'live' }
      ];
    }
    return [
      { label: 'Clicks', value: formatNumber(data.stats.clicks), change: 'rolling 30d' },
      { label: 'Conversions', value: formatNumber(data.stats.conversions), change: 'rolling 30d' },
      {
        label: 'CTR',
        value: formatPercent(data.stats.ctr),
        change: `${formatNumber(data.stats.conversions)} conversions`
      },
      {
        label: 'Earnings / Click',
        value: formatCurrency(data.stats.epc),
        change: `${formatNumber(data.stats.clicks)} clicks`
      },
      { label: 'Commission', value: formatCurrency(data.stats.totalCommission), change: 'approved' },
      {
        label: 'Pending Payout',
        value: formatCurrency(data.stats.pendingCommission),
        change: `${formatNumber(data.stats.activeLinks)} links`
      },
      {
        label: 'Active links',
        value: formatNumber(data.stats.activeLinks),
        change: `${formatNumber(data.stats.pendingConversions)} pending conv`
      }
    ];
  }, [data]);

  const insightMetrics = useMemo(
    () => buildInsightMetrics(data?.stats, data?.recentActivity ?? []),
    [data?.stats, data?.recentActivity]
  );

  const payoutTrend = useMemo(
    () => buildPayoutTrend(data?.recentActivity ?? []),
    [data?.recentActivity]
  );

  const linkPerformance = useMemo(
    () => buildLinkPerformance(data?.topLinks ?? [], data?.stats?.clicks ?? 0),
    [data?.topLinks, data?.stats]
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 px-6 py-6 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60 dark:shadow-black/30 sm:px-10 sm:py-8">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] uppercase tracking-[0.5em] text-brand">Affiliate cockpit</p>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
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

      <InsightMetrics items={insightMetrics} />

      <section className="grid gap-6 xl:grid-cols-2">
        <PayoutTrendCard data={payoutTrend} loading={loading} />
        <LinkPerformanceCard data={linkPerformance} loading={loading} />
      </section>

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

function InsightMetrics({ items }: { items: InsightMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((metric) => (
        <article
          key={metric.label}
          className="min-w-0 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-lg shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-950/50 dark:shadow-black/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.4em] text-brand">
            <span>{metric.label}</span>
            <span
              className={cn(
                'rounded-full border px-3 py-1 text-[10px] font-semibold tracking-normal',
                metric.mood === 'up'
                  ? 'border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200'
                  : metric.mood === 'down'
                    ? 'border-rose-200/80 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200'
                    : 'border-slate-200/80 bg-slate-50 text-slate-500 dark:border-slate-600/50 dark:bg-slate-900/40 dark:text-slate-300'
              )}
            >
              {metric.badge}
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{metric.value}</p>
          <p className="text-sm text-muted">{metric.helper}</p>
        </article>
      ))}
    </section>
  );
}

function PayoutTrendCard({ data, loading }: { data: TrendPoint[]; loading: boolean }) {
  const showEmpty = data.length === 0;
  return (
    <article className="card-surface flex flex-col gap-4 rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.4em] text-brand">Earnings velocity</p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Payout momentum</h2>
        </div>
        <Share2 className="h-4 w-4 text-slate-400" />
      </header>
      <div className="h-64">
        {showEmpty ? (
          <p className="text-sm text-muted">
            {loading ? 'Plotting payout momentum…' : 'Run a campaign to unlock payout trends.'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                left: -10,
                right: 12,
                top: 10,
                bottom: 0
              }}
            >
              <defs>
                <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.3)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', opacity: 0.8, fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={70}
                tick={{ fill: 'currentColor', opacity: 0.8, fontSize: 12 }}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <RechartsTooltip
                cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }
                  const point = payload[0].payload as TrendPoint;
                  return (
                    <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-200">
                      <p className="font-semibold">{label}</p>
                      <p>Daily: {formatCurrency(point.amount)}</p>
                      <p>To date: {formatCurrency(point.cumulative)}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#6366F1"
                strokeWidth={3}
                fill="url(#payoutGradient)"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}

function LinkPerformanceCard({
  data,
  loading
}: {
  data: LinkPerformancePoint[];
  loading: boolean;
}) {
  const showEmpty = data.length === 0;
  const shareOfClicks = showEmpty
    ? 0
    : Math.min(100, Math.round(data.reduce((sum, item) => sum + item.share, 0)));
  return (
    <article className="card-surface flex flex-col gap-4 rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.4em] text-brand">Link heatmap</p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top traffic drivers</h2>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-400" />
      </header>
      <div className="h-64">
        {showEmpty ? (
          <p className="text-sm text-muted">
            {loading ? 'Analyzing clicks…' : 'Create links to unlock performance rankings.'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                left: -20,
                right: 12,
                top: 10,
                bottom: 0
              }}
            >
              <CartesianGrid stroke="rgba(148,163,184,0.3)" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={140}
                tick={{ fill: 'currentColor', opacity: 0.8, fontSize: 12 }}
              />
              <RechartsTooltip
                formatter={(value) => `${formatNumber(value as number)} clicks`}
                labelFormatter={(value) => value as string}
              />
              <Bar
                dataKey="clicks"
                radius={[12, 12, 12, 12]}
                barSize={20}
                background={{ fill: 'rgba(148,163,184,0.2)', radius: 12 }}
              >
                {data.map((entry, index) => (
                  <Cell key={`bar-${entry.name}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {!showEmpty && (
        <footer className="text-xs text-muted">
          Top performers represent {shareOfClicks}% of tracked clicks.
        </footer>
      )}
    </article>
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand">Performance pulse</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Campaign snapshot
          </h2>
        </div>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300 sm:w-auto">
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
      <header className="flex flex-wrap items-center justify-between gap-2">
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
                {item.status} - {formatDate(item.createdAt)}
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
  const hasData = channels.length > 0;
  const chartData = channels.map((channel) => ({
    label: channel.label,
    share: channel.share
  }));
  return (
    <article className="card-surface flex flex-col gap-4 rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Channel split</p>
        <ArrowUpRight className="h-4 w-4 text-slate-400" />
      </header>
      {loading && !hasData ? (
        <p className="text-sm text-muted">Loading channel mix...</p>
      ) : !hasData ? (
        <p className="text-sm text-muted">Channel attribution will appear once data flows in.</p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="h-56 w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="share"
                  nameKey="label"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`channel-${entry.label}`}
                      fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex-1 space-y-3 text-sm">
            {chartData.map((channel, index) => (
              <li
                key={`${channel.label}-${channel.share}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100/80 px-3 py-3 dark:border-slate-800/70"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHANNEL_COLORS[index % CHANNEL_COLORS.length] }}
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{channel.label}</p>
                    <p className="text-xs text-muted">{channel.share}% of attributed clicks</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  {channel.share}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

const BAR_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F97316', '#0EA5E9'];
const CHANNEL_COLORS = ['#6366F1', '#0EA5E9', '#F97316', '#10B981', '#F43F5E', '#A78BFA'];

function formatNumber(value?: number) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function formatCurrency(value?: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value ?? 0);
  } catch {
    return `$${(value ?? 0).toFixed(2)}`;
  }
}

function formatCompactCurrency(value?: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value ?? 0);
  } catch {
    return formatCurrency(value, currency);
  }
}

function formatPercent(value?: number) {
  if (!Number.isFinite(value)) {
    return '--';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(value ?? 0);
}

function formatDate(value: string | Date) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

function buildInsightMetrics(
  stats?: AffiliateDashboardOverview['stats'],
  activity: AffiliateDashboardOverview['recentActivity'] = []
): InsightMetric[] {
  if (!stats) {
    return [
      { label: 'Conversion rate', value: '--', helper: 'Awaiting click data', mood: 'neutral', badge: 'Live' },
      { label: 'Earnings per click', value: '--', helper: 'Awaiting conversion data', mood: 'neutral', badge: 'Live' },
      { label: 'Approval rate', value: '--', helper: 'Waiting for approvals', mood: 'neutral', badge: 'Pending' }
    ];
  }

  const conversionRate = stats.ctr;
  const earningsPerClick = stats.epc;
  const approvalRate = stats.approvalRate;

  return [
    {
      label: 'Conversion rate',
      value: formatPercent(conversionRate),
      helper: `${formatNumber(stats.conversions)} conversions on ${formatNumber(stats.clicks)} clicks`,
      mood: conversionRate >= 0.03 ? 'up' : conversionRate === 0 ? 'neutral' : 'down',
      badge: conversionRate >= 0.03 ? 'Healthy' : conversionRate === 0 ? 'Calibrating' : 'Needs love'
    },
    {
      label: 'Earnings per click',
      value: formatCurrency(earningsPerClick),
      helper: `${formatCurrency(stats.totalCommission)} earned overall`,
      mood: earningsPerClick >= 1 ? 'up' : earningsPerClick === 0 ? 'neutral' : 'down',
      badge: earningsPerClick >= 1 ? 'Scaling' : earningsPerClick === 0 ? 'Live' : 'Test mode'
    },
    {
      label: 'Approval rate',
      value: formatPercent(approvalRate),
      helper: deriveActivityCadence(activity),
      mood: approvalRate >= 0.7 ? 'up' : approvalRate === 0 ? 'neutral' : 'down',
      badge: approvalRate >= 0.7 ? 'On track' : approvalRate === 0 ? 'Pending' : 'Review'
    }
  ];
}

function deriveActivityCadence(activity: AffiliateDashboardOverview['recentActivity']) {
  if (!activity.length) {
    return 'No recorded conversions yet';
  }
  const sorted = [...activity].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const first = new Date(sorted[0].createdAt).getTime();
  const last = new Date(sorted[sorted.length - 1].createdAt).getTime();
  const spanDays = Math.max(0, (last - first) / (1000 * 60 * 60 * 24));
  const cadence = Math.max(1, Math.round(spanDays / Math.max(sorted.length - 1, 1)));
  return `Avg event every ${cadence}d`;
}

function buildPayoutTrend(activity: AffiliateDashboardOverview['recentActivity']): TrendPoint[] {
  const map = new Map<string, { amount: number; date: Date }>();
  activity.forEach((entry) => {
    const date = new Date(entry.createdAt);
    const key = date.toISOString().slice(0, 10);
    const previous = map.get(key);
    map.set(key, {
      date,
      amount: (previous?.amount ?? 0) + entry.amount
    });
  });
  const sorted = Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  let cumulative = 0;
  return sorted.map(({ date, amount }) => {
    cumulative += amount;
    return {
      date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
      amount,
      cumulative
    };
  });
}

function buildLinkPerformance(
  topLinks: AffiliateDashboardOverview['topLinks'],
  overallClicks: number
): LinkPerformancePoint[] {
  if (!topLinks.length) {
    return [];
  }
  const normalizedTotal =
    overallClicks && overallClicks > 0
      ? overallClicks
      : topLinks.reduce((sum, link) => sum + (link.clicks ?? 0), 0);
  return topLinks.slice(0, 6).map((link) => ({
    name: link.label || link.id,
    clicks: link.clicks,
    share: normalizedTotal ? Math.round((link.clicks / normalizedTotal) * 100) : 0
  }));
}
