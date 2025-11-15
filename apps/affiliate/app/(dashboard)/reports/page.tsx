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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Analytics & Exports</h1>
        <p className="max-w-2xl text-sm text-muted">
          Generate time-series insights, breakout performance by channel, and export raw order data
          for your own dashboards. Scheduled delivery emails are available on Pro plans.
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
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card-surface rounded-3xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Weekly Cohorts</h2>
          <div className="mt-4 space-y-4">
            {cohorts.map((cohort) => (
              <div
                key={cohort.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-200"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">{cohort.label}</p>
                  <p className="text-sm text-muted">
                    {cohort.clicks} clicks &middot; {cohort.conversions} conversions
                  </p>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {cohort.commission}
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/5 via-white/60 to-palette-blue/10 p-6 text-slate-900 shadow-lg shadow-brand/20 dark:from-brand/20 dark:via-palette-black/40 dark:to-brand/10 dark:text-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
            Conversion Funnel
          </h2>
          <ol className="mt-4 space-y-4 text-sm">
            <li className="rounded-2xl border border-brand/30 bg-white/85 px-4 py-3 shadow-sm dark:bg-brand/25">
              <p className="font-semibold text-slate-900 dark:text-white">32,480 sessions</p>
              <p className="text-xs uppercase tracking-wide text-brand">Top-of-funnel</p>
            </li>
            <li className="rounded-2xl border border-brand/20 bg-white/75 px-4 py-3 shadow-sm dark:bg-brand/20">
              <p className="font-semibold text-slate-900 dark:text-white">6,210 cart adds</p>
              <p className="text-xs uppercase tracking-wide text-brand">Mid-funnel</p>
            </li>
            <li className="rounded-2xl border border-brand/20 bg-white/75 px-4 py-3 shadow-sm dark:bg-brand/20">
              <p className="font-semibold text-slate-900 dark:text-white">942 conversions</p>
              <p className="text-xs uppercase tracking-wide text-brand">Converted</p>
            </li>
          </ol>
          <p className="mt-4 text-xs text-brand">
            Funnel computed using last-click attribution with a 30-day window. Change to coupon-first
            from settings for campaigns using promo codes.
          </p>
        </article>
      </section>
    </div>
  );
}
