'use client';

import { format } from 'date-fns';

export type PayoutLineRow = {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt?: Date | null;
};

type Props = {
  data: PayoutLineRow[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
};

export function PayoutLinesTable({ data, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900">
        Loading payout lines...
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
            <th className="px-4 py-3">Affiliate</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-white/10 dark:bg-slate-950">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{row.affiliateId}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                {row.currency} {row.amount.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{row.status}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                {row.createdAt ? format(row.createdAt, 'yyyy-MM-dd') : '—'}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No payout lines found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
