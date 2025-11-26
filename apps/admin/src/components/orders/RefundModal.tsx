'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';

const refundSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  reason: z.string().min(2, 'Reason required')
});

type FormValues = z.infer<typeof refundSchema>;

type Props = {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onSubmitted?: () => Promise<void> | void;
};

export function RefundModal({ open, orderId, onClose, onSubmitted }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { amount: 0, reason: '' }
  });

  const submit = async (values: FormValues) => {
    if (!orderId) return;
    await api.patch(`/admin/orders/${orderId}/refund`, values);
    if (onSubmitted) await onSubmitted();
    reset();
    onClose();
  };

  if (!open || !orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Refund order</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-200">Amount</label>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-rose-500">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-200">Reason</label>
            <textarea
              rows={3}
              {...register('reason')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="Reason for refund"
            />
            {errors.reason && <p className="text-xs text-rose-500">{errors.reason.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Processing...' : 'Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
