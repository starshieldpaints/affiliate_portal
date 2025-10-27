const rules = [
  {
    id: 'CR-401',
    name: 'Default Rate',
    type: 'Percent',
    rate: '12%',
    scope: 'All Products',
    status: 'Active'
  },
  {
    id: 'CR-402',
    name: 'Launch Booster',
    type: 'Percent',
    rate: '18%',
    scope: 'Photon Series',
    status: 'Scheduled'
  },
  {
    id: 'CR-389',
    name: 'Clearance Flat',
    type: 'Flat',
    rate: '$25',
    scope: 'Outlet Category',
    status: 'Active'
  }
];

export default function CommissionRulesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Commission Rules</p>
        <h1 className="text-3xl font-semibold text-white">Compensation Engine</h1>
        <p className="max-w-3xl text-sm text-slate-300">
          Configure percent or flat commissions scoped to products, categories, affiliates, or time
          windows. Simulate rule changes before publishing to ensure profitability thresholds.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Create Rule
          </button>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-brand hover:text-brand">
            Run Simulation
          </button>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        {rules.map((rule) => (
          <article
            key={rule.id}
            className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/20"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">{rule.id}</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{rule.name}</h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <dt>Type</dt>
                <dd className="font-semibold text-white">{rule.type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Rate</dt>
                <dd className="font-semibold text-white">{rule.rate}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Scope</dt>
                <dd className="text-right text-xs text-slate-300">{rule.scope}</dd>
              </div>
            </dl>
            <span
              className={`mt-6 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                rule.status === 'Active'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-brand/20 text-brand'
              }`}
            >
              {rule.status}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
