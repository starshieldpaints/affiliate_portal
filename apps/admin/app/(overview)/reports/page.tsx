const schedules = [
  { id: 'Weekly KPI', format: 'CSV', cadence: 'Every Monday 08:00 UTC', recipients: 'team@starshield.io' },
  { id: 'Refund Monitor', format: 'JSON', cadence: 'Daily 02:00 UTC', recipients: 'finance@starshield.io' }
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Reports</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Analytics Delivery</h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Schedule exports to S3, email, or Slack. Each report is generated from ClickHouse to
          provide sub-second rollups across billions of events.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            New Scheduled Report
          </button>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-brand hover:text-brand">
            Connect BI Tool
          </button>
        </div>
      </header>
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Scheduled Reports
        </h2>
        <div className="mt-4 space-y-4 text-sm text-slate-200">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-4"
            >
              <div>
                <p className="font-semibold text-white">{schedule.id}</p>
                <p className="text-xs text-slate-400">{schedule.cadence}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-300">{schedule.format}</p>
                <p className="text-xs text-slate-500">{schedule.recipients}</p>
              </div>
              <button className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-brand hover:text-brand">
                Edit
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
