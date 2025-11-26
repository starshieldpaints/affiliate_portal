'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import type { ProductRow } from './ProductTable';

const productSchema = z.object({
  name: z.string().min(2, 'Name required'),
  sku: z.string().min(1, 'SKU required'),
  price: z.coerce.number().nonnegative('Price must be positive'),
  currency: z.string().min(3).max(3),
  description: z.string().max(500).optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

type FormValues = z.infer<typeof productSchema>;

type Props = {
  open: boolean;
  product?: ProductRow | null;
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
};

export function ProductFormDrawer({ open, product, onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { isActive: true, currency: 'USD' }
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku ?? '',
        price: product.price ?? 0,
        currency: product.currency ?? 'USD',
        description: '',
        categoryId: '',
        isActive: product.status ?? true
      });
    } else {
      reset({ isActive: true, currency: 'USD' });
    }
  }, [product, reset]);

  if (!open) return null;

  const submit = async (values: FormValues) => {
    if (product) {
      await api.patch(`/admin/products/${product.id}`, values);
    } else {
      await api.post('/admin/products', values);
    }
    if (onSaved) await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="h-full w-full bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {product ? 'Edit product' : 'New product'}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {product?.name ?? 'Create product'}
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
              placeholder="Product name"
            />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">SKU</label>
              <input
                {...register('sku')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                placeholder="SKU"
              />
              {errors.sku && <p className="text-xs text-rose-500">{errors.sku.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Price</label>
              <input
                type="number"
                step="0.01"
                {...register('price')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                placeholder="0.00"
              />
              {errors.price && <p className="text-xs text-rose-500">{errors.price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Currency</label>
              <input
                {...register('currency')}
                maxLength={3}
                className="w-full uppercase rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                placeholder="USD"
              />
              {errors.currency && <p className="text-xs text-rose-500">{errors.currency.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600 dark:text-slate-200">Category ID (optional)</label>
              <input
                {...register('categoryId')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                placeholder="Category ID"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-200">Description</label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="Description"
            />
            {errors.description && (
              <p className="text-xs text-rose-500">{errors.description.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" {...register('isActive')} />
            Active
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {isSubmitting ? 'Saving...' : 'Save product'}
          </button>
        </form>
      </div>
    </div>
  );
}
