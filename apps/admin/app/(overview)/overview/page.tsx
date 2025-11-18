import { StatCard } from '../_components/StatCard';
import { AlertTriangle, DollarSign, ShoppingCart, Users } from 'lucide-react';

const stats = [
  {
    label: 'Gross Merchandise Volume',
    value: '$2.4M',
    description: 'Rolling 30 days',
    icon: DollarSign
  },
  {
    label: 'Attributed Orders',
    value: '18,420',
    description: 'Verified conversions',
    icon: ShoppingCart
  },
  {
    label: 'Active Affiliates',
    value: '642',
    description: 'Logins past 14 days',
    icon: Users
  },
  {
    label: 'Alerts',
    value: '7',
    description: 'Needs review',
    icon: AlertTriangle
  }
];

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Operations Command</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Program Overview
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Monitor affiliate health, conversion funnels, payouts, and anomalies. All metrics below
          stream from live telemetry with built-in alerting.
        </p>
      </header>
      <section className="grid gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/25">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Automation Timeline
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-200">
            <li>Daily ETL to ClickHouse completed 17 minutes ago.</li>
            <li>Next payout batch scheduled for May 26, 2025.</li>
            <li>Fraud scoring job flagged 4 high-risk orders.</li>
          </ol>
        </div>
        <div className="rounded-3xl border border-brand/30 bg-brand/10 p-6 text-slate-900 shadow-accent dark:text-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-light">
            Quick Filters
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-inherit">
            <li>Affiliates pending KYC review (12)</li>
            <li>Orders with manual attribution overrides (5)</li>
            <li>Commission rules modified in last 24h (3)</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
