const affiliates = [
  {
    id: 'AFF-1021',
    name: 'Alex Carter',
    status: 'Active',
    kyc: 'Verified',
    tier: 'Platinum',
    revenue: '$182,400',
    trend: '+12%'
  },
  {
    id: 'AFF-0994',
    name: 'Mira Solis',
    status: 'Active',
    kyc: 'Pending',
    tier: 'Gold',
    revenue: '$94,210',
    trend: '+5%'
  },
  {
    id: 'AFF-0960',
    name: 'Orion Labs',
    status: 'Suspended',
    kyc: 'Verified',
    tier: 'Silver',
    revenue: '$55,120',
    trend: '-8%'
  }
];

export default function AffiliatesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Affiliates</p>
        <h1 className="text-3xl font-semibold text-white">Program Roster</h1>
        <p className="max-w-3xl text-sm text-slate-300">
          Approve, suspend, and tier affiliates. Review onboarding statuses and velocity flags prior
          to pushing new campaigns live.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            Invite Affiliate
          </button>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-brand hover:text-brand">
            Export Directory
          </button>
        </div>
      </header>
      <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-lg shadow-black/20">
        <table className="min-w-full divide-y divide-slate-800/70 text-sm text-slate-200">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-4 text-left font-medium">Affiliate</th>
              <th className="px-6 py-4 text-left font-medium">Status</th>
              <th className="px-6 py-4 text-left font-medium">KYC</th>
              <th className="px-6 py-4 text-left font-medium">Tier</th>
              <th className="px-6 py-4 text-right font-medium">Revenue</th>
              <th className="px-6 py-4 text-right font-medium">Trend</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {affiliates.map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-brand/10">
                <td className="px-6 py-4">
                  <p className="font-semibold text-white">{affiliate.name}</p>
                  <p className="text-xs text-slate-400">{affiliate.id}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      affiliate.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {affiliate.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-300">{affiliate.kyc}</td>
                <td className="px-6 py-4 text-xs text-slate-300">{affiliate.tier}</td>
                <td className="px-6 py-4 text-right font-semibold text-white">{affiliate.revenue}</td>
                <td className="px-6 py-4 text-right text-xs text-emerald-300">{affiliate.trend}</td>
                <td className="px-6 py-4 text-right text-xs">
                  <button className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-brand hover:text-brand">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
