import { OverviewCards } from '../_components/OverviewCards';

const metrics = [
  {
    label: 'Clicks',
    value: '12,480',
    change: '+8.2%'
  },
  {
    label: 'Conversions',
    value: '942',
    change: '+3.6%'
  },
  {
    label: 'Commission',
    value: '$18,204',
    change: '+12.4%'
  },
  {
    label: 'Pending Payout',
    value: '$4,750',
    change: '-2.1%'
  }
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Performance Pulse</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Welcome back, Alex</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Track your conversions, optimize campaigns, and monitor payouts. All metrics below
          auto-refresh every 5 minutes.
        </p>
      </header>
      <OverviewCards items={metrics} />
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Quick Actions
          </h2>
          <ul className="space-y-3 text-sm text-slate-200">
            <li>Generate a deep link with Instagram tracking tag.</li>
            <li>Review pending commissions and dispute reversals.</li>
            <li>Download the Q2 creative refresh pack.</li>
          </ul>
          <button className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark">
            Open Link Studio
          </button>
        </article>
        <article className="rounded-3xl border border-brand/30 bg-brand/10 p-6 shadow-accent">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-light">
            Upcoming Payout
          </h2>
          <p className="text-5xl font-semibold text-white">$2,450</p>
          <p className="mt-2 text-sm text-slate-200">Scheduled for May 15 via Stripe Connect.</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-200">
            <div>
              <dt className="text-slate-400">Approved Commissions</dt>
              <dd className="font-semibold text-white">$3,820</dd>
            </div>
            <div>
              <dt className="text-slate-400">Pending Review</dt>
              <dd className="font-semibold text-white">$1,370</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
