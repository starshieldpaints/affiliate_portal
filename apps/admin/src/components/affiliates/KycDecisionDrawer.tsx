'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import type { AffiliateRow } from './AffiliatesTable';

const kycSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional()
});

type FormValues = z.infer<typeof kycSchema>;

type Props = {
  open: boolean;
  affiliate: AffiliateRow | null;
  onClose: () => void;
  onSubmitted?: () => Promise<void> | void;
};

export function KycDecisionDrawer({ open, affiliate, onClose, onSubmitted }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: { decision: 'approve', note: '' }
  });

  useEffect(() => {
    if (open) {
      reset({ decision: 'approve', note: '' });
    }
  }, [open, reset]);

  if (!open || !affiliate) return null;

  const submit = async (values: FormValues) => {
    await api.patch(`/admin/affiliates/${affiliate.id}/kyc`, {
      decision: values.decision,
      note: values.note
    });
    if (onSubmitted) await onSubmitted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="h-full w-full bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">KYC Decision</p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {affiliate.name ?? 'Affiliate'}
            </h2>
            <p className="text-sm text-slate-500">{affiliate.email}</p>
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
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="approve" {...register('decision')} />
              Approve
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="reject" {...register('decision')} />
              Reject
            </label>
            {errors.decision && (
              <p className="text-xs text-rose-500">{errors.decision.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-200">Notes (optional)</label>
            <textarea
              rows={4}
              {...register('note')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="Add reviewer notes"
            />
            {errors.note && <p className="text-xs text-rose-500">{errors.note.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {isSubmitting ? 'Submitting...' : 'Submit decision'}
          </button>
        </form>
      </div>
    </div>
  );
}
