'use client';

import { format } from 'date-fns';
import { cn } from '../../utils/cn';

export type AffiliateRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  kycStatus: string;
  createdAt: Date | null;
  linksCount?: number;
  ordersCount?: number;
};

type Props = {
  data: AffiliateRow[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSelect?: (row: AffiliateRow) => void;
};

export function AffiliatesTable({ data, loading, error, onRetry, onSelect }: Props) {
  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900">
        Loading affiliates...
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
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">KYC</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Links</th>
            <th className="px-4 py-3">Orders</th>
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
              <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{row.email}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-semibold',
                    row.status === 'active' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
                    row.status === 'inactive' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
                    row.status === 'blocked' && 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
                    !['active', 'inactive', 'blocked'].includes(row.status) && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  )}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-semibold capitalize',
                    row.kycStatus === 'verified' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
                    row.kycStatus === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
                    row.kycStatus === 'rejected' && 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
                    !['verified', 'pending', 'rejected'].includes(row.kycStatus) && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  )}
                >
                  {row.kycStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                {row.createdAt ? format(row.createdAt, 'yyyy-MM-dd') : '—'}
              </td>
              <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200">{row.linksCount ?? 0}</td>
              <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200">{row.ordersCount ?? 0}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No affiliates found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
