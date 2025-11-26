'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';

const resolveSchema = z.object({
  notes: z.string().max(500).optional()
});

type FormValues = z.infer<typeof resolveSchema>;

type Props = {
  open: boolean;
  alertId: string | null;
  onClose: () => void;
  onResolved?: () => Promise<void> | void;
};

export function ResolveAlertDialog({ open, alertId, onClose, onResolved }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: { notes: '' }
  });

  const submit = async (values: FormValues) => {
    if (!alertId) return;
    await api.patch(`/admin/fraud/alerts/${alertId}/resolve`, values);
    if (onResolved) await onResolved();
    reset();
    onClose();
  };

  if (!open || !alertId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resolve alert</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-200">Notes</label>
            <textarea
              rows={3}
              {...register('notes')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="Notes for resolution"
            />
            {errors.notes && <p className="text-xs text-rose-500">{errors.notes.message}</p>}
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
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
