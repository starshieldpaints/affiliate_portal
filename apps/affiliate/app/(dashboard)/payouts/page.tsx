const payouts = [
  { id: 'PO-2025-04', amount: '$3,240', status: 'Paid', date: 'Apr 28, 2025', method: 'Stripe' },
  {
    id: 'PO-2025-03',
    amount: '$2,980',
    status: 'Paid',
    date: 'Mar 31, 2025',
    method: 'Stripe'
  },
  { id: 'PO-2025-02', amount: '$2,112', status: 'Paid', date: 'Feb 28, 2025', method: 'Stripe' }
];

export default function PayoutsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Payouts</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Commission Lifecycle</h1>
        <p className="max-w-2xl text-sm text-muted">
          Track pending, approved, and completed payouts. Receipts are stored for seven years to
          support audits and compliance checks.
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="card-surface rounded-3xl p-6 text-slate-700 shadow-lg shadow-slate-200/60 dark:text-slate-200 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Payout History
          </h2>
          <div className="mt-4 divide-y divide-slate-200/70 dark:divide-slate-800/70">
            {payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between py-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{payout.amount}</p>
                  <p className="text-xs text-muted">{payout.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted">{payout.date}</p>
                  <p className="text-xs text-muted">{payout.method}</p>
                </div>
                <span className="rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand">
                  {payout.status}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/5 via-white/70 to-palette-blue/10 p-6 text-slate-900 shadow-lg shadow-brand/20 dark:from-brand/25 dark:via-palette-black/30 dark:to-brand/10 dark:text-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
            Next Payout
          </h2>
          <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">$4,750</p>
          <p className="text-xs uppercase tracking-wide text-brand">Scheduled · May 15, 2025</p>
          <div className="mt-4 space-y-3 text-xs text-muted">
            <p>Pending commissions: $1,930</p>
            <p>Eligible for approval: $1,120</p>
            <p>Awaiting review: $420</p>
          </div>
          <button className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Download Statement
          </button>
        </article>
      </section>
    </div>
  );
}
