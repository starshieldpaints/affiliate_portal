'use client';

import { ElementType } from 'react';
import { cn } from '../../../src/utils/cn';

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: ElementType;
};

export function StatCard({ label, value, description, icon: Icon }: StatCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
        <span
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/20 text-brand'
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-300">{description}</p>
    </article>
  );
}
