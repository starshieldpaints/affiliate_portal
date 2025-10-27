export default function SupportPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Support</p>
        <h1 className="text-3xl font-semibold text-white">Need a Hand?</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Our compliance and partner success teams typically respond within four business hours.
          Submit detailed context so we can resolve issues quickly.
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form className="space-y-6 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-8 shadow-lg shadow-black/20">
          <div>
            <label htmlFor="topic" className="text-xs uppercase tracking-wide text-slate-400">
              Topic
            </label>
            <select
              id="topic"
              className="mt-2 w-full rounded-2xl border border-slate-700/60 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              defaultValue="payout"
            >
              <option value="payout">Payouts & finance</option>
              <option value="commission">Commission rules</option>
              <option value="tracking">Tracking & attribution</option>
              <option value="policy">Policy & compliance</option>
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="text-xs uppercase tracking-wide text-slate-400">
              Subject
            </label>
            <input
              id="subject"
              placeholder="Tell us what you need help with"
              className="mt-2 w-full rounded-2xl border border-slate-700/60 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div>
            <label htmlFor="details" className="text-xs uppercase tracking-wide text-slate-400">
              Details
            </label>
            <textarea
              id="details"
              rows={6}
              placeholder="Include order IDs, dates, and relevant screenshots."
              className="mt-2 w-full rounded-2xl border border-slate-700/60 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <button className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Submit ticket
          </button>
        </form>
        <aside className="space-y-4 rounded-3xl border border-brand/30 bg-brand/10 p-6 shadow-accent">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-light">
            Response SLAs
          </h2>
          <ul className="space-y-3 text-sm text-white">
            <li>
              <span className="font-semibold text-brand-light">Payout issues:</span> 4 business
              hours
            </li>
            <li>
              <span className="font-semibold text-brand-light">Tracking disputes:</span> 1 business
              day
            </li>
            <li>
              <span className="font-semibold text-brand-light">Policy clarifications:</span> 2
              business days
            </li>
          </ul>
          <p className="text-xs text-brand-light">
            Emergency channel available inside the payout page if a transfer fails outside business
            hours.
          </p>
        </aside>
      </section>
    </div>
  );
}
