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
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="card-surface rounded-2xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-black/20"
        >
          <p className="text-[11px] uppercase tracking-widest text-muted">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {item.value}
          </p>
          <p
            className={cn(
              'mt-1 text-xs font-medium text-muted',
              item.change.startsWith('-')
                ? 'text-rose-600 dark:text-rose-300'
                : 'text-emerald-600 dark:text-emerald-300'
            )}
          >
            {item.change}
          </p>
        </article>
      ))}
    </section>
  );
}
