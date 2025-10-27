const notifications = [
  {
    id: '1',
    title: 'Payout processed',
    detail: 'Stripe Connect transfer completed for $3,240.',
    timestamp: '4 hours ago',
    type: 'success'
  },
  {
    id: '2',
    title: 'Policy update',
    detail: 'Attribution window extended to 45 days for Q2 launch.',
    timestamp: '1 day ago',
    type: 'info'
  },
  {
    id: '3',
    title: 'Refund reversal',
    detail: 'Order #A-19402 refunded. Commission reversal applied ($-82).',
    timestamp: '2 days ago',
    type: 'warning'
  }
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Notifications</p>
        <h1 className="text-3xl font-semibold text-white">Stay in the Loop</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Alerts stream in real time for conversions, payouts, policy changes, and anti-fraud
          events. Control delivery preferences from settings.
        </p>
      </header>
      <section className="space-y-4">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-5 shadow-lg shadow-black/20"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{notification.title}</h2>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {notification.timestamp}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{notification.detail}</p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                notification.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : notification.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-brand/20 text-brand'
              }`}
            >
              {notification.type.toUpperCase()}
            </span>
          </article>
        ))}
      </section>
    </div>
  );
}
