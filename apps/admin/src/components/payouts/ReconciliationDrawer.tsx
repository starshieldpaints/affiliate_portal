'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';

const reconcileSchema = z.object({
  receiptUrl: z.string().url('Must be a valid URL').optional()
});

type FormValues = z.infer<typeof reconcileSchema>;

type Props = {
  open: boolean;
  batchId: string | null;
  onClose: () => void;
  onReconciled?: () => Promise<void> | void;
};

export function ReconciliationDrawer({ open, batchId, onClose, onReconciled }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(reconcileSchema),
    defaultValues: { receiptUrl: '' }
  });

  const submit = async (values: FormValues) => {
    if (!batchId) return;
    await api.patch(`/admin/payouts/batch/${batchId}/reconcile`, values);
    if (onReconciled) await onReconciled();
    reset();
    onClose();
  };

  if (!open || !batchId) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="h-full w-full bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reconcile batch</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-200">Receipt URL (optional)</label>
            <input
              {...register('receiptUrl')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="https://..."
            />
            {errors.receiptUrl && <p className="text-xs text-rose-500">{errors.receiptUrl.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {isSubmitting ? 'Reconciling...' : 'Reconcile batch'}
          </button>
        </form>
      </div>
    </div>
  );
}
