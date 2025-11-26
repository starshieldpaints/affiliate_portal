'use client';

import { format } from 'date-fns';
import { cn } from '../../utils/cn';

export type ProductRow = {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | null;
  currency?: string | null;
  status?: boolean;
  category?: string | null;
  createdAt?: Date | null;
};

type Props = {
  data: ProductRow[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSelect?: (row: ProductRow) => void;
};

export function ProductTable({ data, loading, error, onRetry, onSelect }: Props) {
  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-950">
        <span>{error}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-rose-300 px-3 py-1 text-rose-700 hover:bg-rose-100 dark:border-rose-500/60 dark:text-rose-100 dark:hover:bg-rose-900"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-white/10">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
        <thead className="bg-slate-50 dark:bg-slate-900/60">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-white/10 dark:bg-slate-950">
          {data.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
              onClick={() => onSelect?.(row)}
            >
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{row.name}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{row.sku ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-200">
                {row.price ? `${row.currency ?? 'USD'} ${row.price.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-semibold',
                    row.status
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  )}
                >
                  {row.status ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{row.category ?? '—'}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                {row.createdAt ? format(row.createdAt, 'yyyy-MM-dd') : '—'}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
