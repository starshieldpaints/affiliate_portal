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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Stay in the Loop
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Alerts stream in real time for conversions, payouts, policy changes, and anti-fraud
          events. Control delivery preferences from settings.
        </p>
      </header>
      <section className="space-y-4">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className="card-surface rounded-3xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-black/30"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {notification.title}
              </h2>
              <span className="text-xs uppercase tracking-wide text-muted">
                {notification.timestamp}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{notification.detail}</p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                notification.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                  : notification.type === 'warning'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                  : 'bg-brand/15 text-brand dark:bg-brand/20 dark:text-brand'
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
