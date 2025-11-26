'use client';

import { format } from 'date-fns';
import { cn } from '../../utils/cn';

export type OrderRow = {
  id: string;
  externalOrderId?: string;
  placedAt?: Date | null;
  total?: number | null;
  currency?: string | null;
  paymentStatus?: string;
  attributionType?: string | null;
  affiliateName?: string | null;
};

type Props = {
  data: OrderRow[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSelect?: (row: OrderRow) => void;
};

export function OrdersTable({ data, loading, error, onRetry, onSelect }: Props) {
  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900">
        Loading orders...
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
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Placed</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Attribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-white/10 dark:bg-slate-950">
          {data.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
              onClick={() => onSelect?.(row)}
            >
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                {row.externalOrderId ?? row.id}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-200">
                {row.placedAt ? format(row.placedAt, 'yyyy-MM-dd') : '—'}
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                {row.total ? `${row.currency ?? 'USD'} ${row.total.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-semibold capitalize',
                    row.paymentStatus === 'paid' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
                    row.paymentStatus === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
                    row.paymentStatus === 'refunded' && 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
                  )}
                >
                  {row.paymentStatus ?? 'unknown'}
                </span>
              </td>
              <td className="px-4 py-3">
                {row.attributionType ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {row.attributionType}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                )}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
