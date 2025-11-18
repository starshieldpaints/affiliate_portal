const entries = [
  {
    id: 'AUD-9921',
    actor: 'Olivia (Admin)',
    action: 'Updated commission rule CR-401 rate from 10% to 12%',
    timestamp: 'May 07, 2025 14:42 UTC'
  },
  {
    id: 'AUD-9916',
    actor: 'System',
    action: 'Auto-approved payout batch PB-2025-04',
    timestamp: 'Apr 28, 2025 04:12 UTC'
  },
  {
    id: 'AUD-9910',
    actor: 'Olivia (Admin)',
    action: 'Manually attributed order ORD-54162 to affiliate Orion Labs',
    timestamp: 'Apr 24, 2025 19:05 UTC'
  }
];

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Audit Center</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Immutable Ledger</h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Every sensitive mutation is captured with actor, payload, and timestamp. Export for
          compliance reviews or share with finance during quarterly audits.
        </p>
      </header>
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/20">
        <ol className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{entry.id}</span>
                <span>{entry.timestamp}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{entry.actor}</p>
              <p className="text-sm text-slate-200">{entry.action}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
