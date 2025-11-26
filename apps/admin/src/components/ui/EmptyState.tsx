'use client';

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
