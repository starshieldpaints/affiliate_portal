'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';

const batchSchema = z.object({
  affiliateIds: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((v) => v.trim()).filter(Boolean) : [])),
  scheduledFor: z.string().optional()
});

type FormValues = z.infer<typeof batchSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
};

export function PayoutBatchForm({ open, onClose, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: { affiliateIds: '', scheduledFor: '' }
  });

  const submit = async (values: FormValues) => {
    await api.post('/admin/payouts/batch', values);
    if (onCreated) await onCreated();
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="h-full w-full bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New payout batch</p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create batch</h2>
          </div>
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
            <label className="text-sm text-slate-600 dark:text-slate-200">Affiliate IDs (comma separated)</label>
            <input
              {...register('affiliateIds')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="aff1, aff2"
            />
            {errors.affiliateIds && <p className="text-xs text-rose-500">{errors.affiliateIds.message as string}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-200">Scheduled for (optional)</label>
            <input
              type="date"
              {...register('scheduledFor')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
            {errors.scheduledFor && <p className="text-xs text-rose-500">{errors.scheduledFor.message as string}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {isSubmitting ? 'Creating...' : 'Create batch'}
          </button>
        </form>
      </div>
    </div>
  );
}
