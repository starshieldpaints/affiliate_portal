const cohorts = [
  { label: 'Week 18', clicks: 3200, conversions: 280, commission: '$5,420' },
  { label: 'Week 17', clicks: 2980, conversions: 256, commission: '$4,980' },
  { label: 'Week 16', clicks: 2670, conversions: 211, commission: '$4,240' },
  { label: 'Week 15', clicks: 2435, conversions: 196, commission: '$4,010' }
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Reports</p>
        <h1 className="text-3xl font-semibold text-white">Analytics & Exports</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Generate time-series insights, breakout performance by channel, and export raw order data
          for your own dashboards. Scheduled delivery emails are available on Pro plans.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Schedule Report
          </button>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-brand hover:text-brand">
            Export CSV
          </button>
        </div>
      </header>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Weekly Cohorts
          </h2>
          <div className="mt-4 space-y-4">
            {cohorts.map((cohort) => (
              <div
                key={cohort.label}
                className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{cohort.label}</p>
                  <p className="text-sm text-slate-200">
                    {cohort.clicks} clicks · {cohort.conversions} conversions
                  </p>
                </div>
                <p className="text-lg font-semibold text-white">{cohort.commission}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-3xl border border-brand/30 bg-brand/10 p-6 shadow-accent">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-light">
            Conversion Funnel
          </h2>
          <ol className="mt-4 space-y-4 text-sm text-white">
            <li className="rounded-2xl border border-brand/30 bg-brand/20 px-4 py-3">
              <p className="font-semibold">32,480 sessions</p>
              <p className="text-xs uppercase tracking-wide text-brand-light">Top-of-funnel</p>
            </li>
            <li className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3">
              <p className="font-semibold">6,210 cart adds</p>
              <p className="text-xs uppercase tracking-wide text-brand-light">Mid-funnel</p>
            </li>
            <li className="rounded-2xl border border-brand/20 bg-brand/10 px-4 py-3">
              <p className="font-semibold">942 conversions</p>
              <p className="text-xs uppercase tracking-wide text-brand-light">Converted</p>
            </li>
          </ol>
          <p className="mt-4 text-xs text-brand-light">
            Funnel computed using last-click attribution with a 30-day window. Change to coupon-first
            from settings for campaigns using promo codes.
          </p>
        </article>
      </section>
    </div>
  );
}
