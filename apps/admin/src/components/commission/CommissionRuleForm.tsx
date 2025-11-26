'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { ScopeSelector } from './ScopeSelector';

const ruleSchema = z.object({
  name: z.string().min(2, 'Name required'),
  type: z.enum(['percent', 'fixed']),
  rate: z.coerce.number().positive('Rate must be positive'),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  minOrderAmount: z.coerce.number().optional(),
  maxOrderAmount: z.coerce.number().optional(),
  excludeTaxShipping: z.boolean().optional().default(true),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  affiliateIds: z.array(z.string()).optional()
});

export type CommissionRuleFormValues = z.infer<typeof ruleSchema>;

type Props = {
  open: boolean;
  ruleId?: string;
  initialValues?: Partial<CommissionRuleFormValues>;
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
};

export function CommissionRuleForm({ open, ruleId, initialValues, onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CommissionRuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      type: 'percent',
      rate: 10,
      excludeTaxShipping: true,
      productIds: [],
      categoryIds: [],
      affiliateIds: []
    }
  });

  useEffect(() => {
    if (initialValues) {
      reset({ ...initialValues });
    }
  }, [initialValues, reset]);

  if (!open) return null;

  const submit = async (values: CommissionRuleFormValues) => {
    if (ruleId) {
      await api.patch(`/admin/commission-rules/${ruleId}`, values);
    } else {
      await api.post('/admin/commission-rules', values);
    }
    if (onSaved) await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="h-full w-full bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {ruleId ? 'Edit rule' : 'New rule'}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {initialValues?.name ?? 'Commission Rule'}
            </h2>
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
            <label className="text-sm text-slate-600 dark:text-slate-200">Name</label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="Rule name"
            />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Type</label>
              <select
                {...register('type')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Rate</label>
              <input
                type="number"
                step="0.01"
                {...register('rate')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                placeholder="10"
              />
              {errors.rate && <p className="text-xs text-rose-500">{errors.rate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Starts at (optional)</label>
              <input
                type="date"
                {...register('startsAt')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Ends at (optional)</label>
              <input
                type="date"
                {...register('endsAt')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Min order amount</label>
              <input
                type="number"
                step="0.01"
                {...register('minOrderAmount')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
              {errors.minOrderAmount && (
                <p className="text-xs text-rose-500">{errors.minOrderAmount.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Max order amount</label>
              <input
                type="number"
                step="0.01"
                {...register('maxOrderAmount')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
              {errors.maxOrderAmount && (
                <p className="text-xs text-rose-500">{errors.maxOrderAmount.message}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" {...register('excludeTaxShipping')} defaultChecked />
            Exclude tax/shipping
          </label>

          <Controller
            control={control}
            name="productIds"
            render={({ field }) => {
              const safeGet = (key: 'categoryIds' | 'affiliateIds') => {
                try {
                  // @ts-ignore
                  return control.getValues ? control.getValues(key) ?? [] : [];
                } catch {
                  return [];
                }
              };
              return (
                <ScopeSelector
                  selectedProductIds={field.value ?? []}
                  selectedCategoryIds={safeGet('categoryIds')}
                  selectedAffiliateIds={safeGet('affiliateIds')}
                  onChange={({ productIds, categoryIds, affiliateIds }) => {
                    setValue('productIds', productIds);
                    setValue('categoryIds', categoryIds);
                    setValue('affiliateIds', affiliateIds);
                  }}
                />
              );
            }}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {isSubmitting ? 'Saving...' : 'Save rule'}
          </button>
        </form>
      </div>
    </div>
  );
}
