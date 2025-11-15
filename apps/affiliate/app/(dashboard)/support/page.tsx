export default function SupportPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Support</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Need a Hand?</h1>
        <p className="max-w-2xl text-sm text-muted">
          Our compliance and partner success teams typically respond within four business hours.
          Submit detailed context so we can resolve issues quickly.
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form className="card-surface space-y-6 rounded-3xl p-8 shadow-lg shadow-slate-200/60 dark:shadow-black/30">
          <div>
            <label htmlFor="topic" className="text-xs uppercase tracking-wide text-muted">
              Topic
            </label>
            <select
              id="topic"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-slate-700/60 dark:bg-slate-950/70 dark:text-slate-100"
              defaultValue="payout"
            >
              <option value="payout">Payouts & finance</option>
              <option value="commission">Commission rules</option>
              <option value="tracking">Tracking & attribution</option>
              <option value="policy">Policy & compliance</option>
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="text-xs uppercase tracking-wide text-muted">
              Subject
            </label>
            <input
              id="subject"
              placeholder="Tell us what you need help with"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-slate-700/60 dark:bg-slate-950/70 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="details" className="text-xs uppercase tracking-wide text-muted">
              Details
            </label>
            <textarea
              id="details"
              rows={6}
              placeholder="Include order IDs, dates, and relevant screenshots."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-slate-700/60 dark:bg-slate-950/70 dark:text-slate-100"
            />
          </div>
          <button className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Submit ticket
          </button>
        </form>
        <aside className="space-y-4 rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/5 via-white/70 to-palette-blue/10 p-6 text-slate-900 shadow-lg shadow-brand/20 dark:from-brand/20 dark:via-palette-black/40 dark:to-brand/10 dark:text-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
            Response SLAs
          </h2>
          <ul className="space-y-3 text-sm text-slate-900 dark:text-white">
            <li>
              <span className="font-semibold text-brand">Payout issues:</span> 4 business hours
            </li>
            <li>
              <span className="font-semibold text-brand">Tracking disputes:</span> 1 business day
            </li>
            <li>
              <span className="font-semibold text-brand">Policy clarifications:</span> 2 business
              days
            </li>
          </ul>
          <p className="text-xs text-brand">
            Emergency channel available inside the payout page if a transfer fails outside business
            hours.
          </p>
        </aside>
      </section>
    </div>
  );
}
