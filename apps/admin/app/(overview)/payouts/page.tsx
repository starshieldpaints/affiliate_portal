const batches = [
  {
    id: 'PB-2025-05',
    period: 'Apr 1 – Apr 30',
    total: '$148,230',
    status: 'Processing',
    initiatedBy: 'Olivia',
    lines: 412
  },
  {
    id: 'PB-2025-04',
    period: 'Mar 1 – Mar 31',
    total: '$132,980',
    status: 'Paid',
    initiatedBy: 'Olivia',
    lines: 398
  }
];

export default function PayoutBatchesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Payouts</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Batch Orchestration
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Aggregate approved commissions into payout batches, submit to Stripe Connect or PayPal,
          and reconcile receipts automatically.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Create Batch
          </button>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-brand hover:text-brand">
            Upload Receipt
          </button>
        </div>
      </header>
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Batches
          </h2>
          <div className="mt-4 space-y-4 text-sm text-slate-200">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-white">{batch.id}</p>
                  <p className="text-xs text-slate-400">{batch.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{batch.total}</p>
                  <p className="text-xs text-slate-400">
                    {batch.lines} lines · {batch.initiatedBy}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    batch.status === 'Paid'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-brand/20 text-brand'
                  }`}
                >
                  {batch.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-3xl border border-brand/30 bg-brand/10 p-6 text-slate-900 shadow-accent dark:text-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-light">
            Reconciliation
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-inherit">
            <li>Last reconciliation run at 05:42 UTC.</li>
            <li>2 payout lines pending provider confirmation.</li>
            <li>0 discrepancies detected in last 30 days.</li>
          </ul>
          <button className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Run reconciliation
          </button>
        </aside>
      </section>
    </div>
  );
}
