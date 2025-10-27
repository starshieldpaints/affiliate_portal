const alerts = [
  {
    id: 'ALERT-7821',
    title: 'Velocity spike detected',
    detail: 'Affiliate ORION LABS drove 90 clicks within 5 minutes from same ASN.',
    severity: 'High',
    timestamp: '10 minutes ago'
  },
  {
    id: 'ALERT-7812',
    title: 'Self purchase attempt',
    detail: 'Coupon STAR-20 used by affiliate email domain.',
    severity: 'Medium',
    timestamp: '2 hours ago'
  },
  {
    id: 'ALERT-7802',
    title: 'Refund clustering',
    detail: 'Three refunds triggered for helmet variant within 24 hours.',
    severity: 'Low',
    timestamp: '1 day ago'
  }
];

export default function FraudPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Fraud & Alerts</p>
        <h1 className="text-3xl font-semibold text-white">Risk Command Center</h1>
        <p className="max-w-3xl text-sm text-slate-300">
          Real-time detection for bot traffic, self-purchases, velocity spikes, and ASN anomalies.
          Each alert links back to the raw event stream for forensics.
        </p>
      </header>
      <section className="space-y-4">
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/20"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{alert.id}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{alert.title}</h2>
              </div>
              <span className="text-xs uppercase tracking-wide text-slate-400">{alert.timestamp}</span>
            </div>
            <p className="mt-3 text-sm text-slate-200">{alert.detail}</p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                alert.severity === 'High'
                  ? 'bg-red-500/20 text-red-300'
                  : alert.severity === 'Medium'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-700/40 text-slate-200'
              }`}
            >
              {alert.severity}
            </span>
          </article>
        ))}
      </section>
    </div>
  );
}
