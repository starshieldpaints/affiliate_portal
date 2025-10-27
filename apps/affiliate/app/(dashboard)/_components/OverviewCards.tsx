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
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
          <p
            className={cn(
              'mt-2 text-xs font-medium',
              item.change.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'
            )}
          >
            {item.change} vs last 7 days
          </p>
        </article>
      ))}
    </section>
  );
}
