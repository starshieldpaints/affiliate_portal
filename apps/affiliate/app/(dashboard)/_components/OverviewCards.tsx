'use client';

import { cn } from '../../../src/utils/cn';

type OverviewItem = {
  label: string;
  value: string;
  change: string;
};

type OverviewCardsProps = {
  items: OverviewItem[];
};

export function OverviewCards({ items }: OverviewCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="card-surface rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/20"
        >
          <p className="text-xs uppercase tracking-widest text-muted">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
          <p
            className={cn(
              'mt-2 text-xs font-medium',
              item.change.startsWith('-')
                ? 'text-rose-600 dark:text-rose-300'
                : 'text-emerald-600 dark:text-emerald-300'
            )}
          >
            {item.change} vs last 7 days
          </p>
        </article>
      ))}
    </section>
  );
}
