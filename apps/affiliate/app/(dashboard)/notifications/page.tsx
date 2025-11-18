'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '../../../src/lib/api-client';
import type { AffiliateNotification } from '../../../src/types/dashboard';

export default function NotificationsPage() {
  const [items, setItems] = useState<AffiliateNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    notificationsApi
      .list()
      .then((data) => {
        if (!mounted) return;
        setItems(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load notifications');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Notifications</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Stay in the Loop</h1>
        <p className="max-w-2xl text-sm text-muted">
          Alerts stream in real time for conversions, payouts, policy changes, and anti-fraud events.
        </p>
      </header>
      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </p>
      )}
      <section className="space-y-4">
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted">Loading notifications…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No notifications yet.</p>
        ) : (
          items.map((notification) => (
            <article
              key={notification.id}
              className="card-surface rounded-3xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-black/30"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {notification.title}
                </h2>
                <span className="text-xs uppercase tracking-wide text-muted">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{notification.detail}</p>
              <span className={badgeClass(notification.type)}>{notification.type.toUpperCase()}</span>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function badgeClass(type: AffiliateNotification['type']) {
  if (type === 'success') {
    return 'mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }
  if (type === 'warning') {
    return 'mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
  }
  return 'mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-brand/15 text-brand dark:bg-brand/20 dark:text-brand';
}

function formatTimestamp(value: string) {
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return value;
  }
}
