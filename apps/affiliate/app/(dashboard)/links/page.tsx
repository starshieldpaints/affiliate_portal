const links = [
  {
    id: 'LNK-1029',
    label: 'Elite Helmet Launch',
    shortUrl: 'https://ss.link/elite-x',
    destination: '/p/elite-helmet',
    clicks: 1820,
    conversions: 164,
    status: 'Active'
  },
  {
    id: 'LNK-0931',
    label: 'Photon Visor Reel',
    shortUrl: 'https://ss.link/photon-reel',
    destination: '/p/photon-visor',
    clicks: 940,
    conversions: 108,
    status: 'Active'
  },
  {
    id: 'LNK-0873',
    label: 'Nova Armor Retarget',
    shortUrl: 'https://ss.link/nova-ret',
    destination: '/p/nova-armor',
    clicks: 640,
    conversions: 42,
    status: 'Paused'
  }
];

export default function LinksPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Links & Coupons</p>
        <h1 className="text-3xl font-semibold text-white">Campaign Link Studio</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Build deep links with smart UTMs, generate QR codes, and monitor click-through rates. Your
          most recent link activity appears below.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark">
            New Tracking Link
          </button>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-brand hover:text-brand">
            Bulk Upload Coupons
          </button>
        </div>
      </header>
      <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 shadow-lg shadow-black/20">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-4 text-left font-medium">Label</th>
              <th className="px-6 py-4 text-left font-medium">Short URL</th>
              <th className="px-6 py-4 text-left font-medium">Destination</th>
              <th className="px-6 py-4 text-right font-medium">Clicks</th>
              <th className="px-6 py-4 text-right font-medium">Conversions</th>
              <th className="px-6 py-4 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-slate-200">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-brand/10">
                <td className="px-6 py-4 font-semibold text-white">{link.label}</td>
                <td className="px-6 py-4 font-mono text-xs">{link.shortUrl}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">{link.destination}</td>
                <td className="px-6 py-4 text-right">{link.clicks}</td>
                <td className="px-6 py-4 text-right">{link.conversions}</td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      link.status === 'Active'
                        ? 'bg-brand/20 text-brand'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {link.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
