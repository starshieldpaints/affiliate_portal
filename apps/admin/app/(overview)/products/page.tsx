'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../src/lib/api-client';
import type { AdminProduct, CreateAdminProductPayload } from '../../../src/types/catalog';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const query = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await adminApi.listProducts();
      return response.data;
    }
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Products</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Catalog</h1>
        <p className="max-w-3xl text-sm text-muted">
          Manage attributes, assign categories, and toggle visibility for any product used in
          affiliate campaigns.
        </p>
        <CreateProductButton />
      </header>

      <section className="card-surface rounded-3xl p-5 shadow-lg shadow-black/10">
        {query.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading products...
          </div>
        ) : query.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {query.data.map((product) => (
              <article
                key={product.id}
                className="rounded-3xl border border-slate-200/60 bg-white/90 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-muted">{product.id}</p>
                <h2 className="mt-2 text-lg font-semibold">{product.name}</h2>
                <p className="text-xs text-muted">{product.category?.name ?? 'Uncategorized'}</p>
                <dl className="mt-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <dt>Price</dt>
                    <dd className="font-semibold">
                      {product.currency} {Number(product.price).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>SKU</dt>
                    <dd>{product.sku ?? 'N/A'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Status</dt>
                    <dd className={product.isActive ? 'text-emerald-500' : 'text-amber-500'}>
                      {product.isActive ? 'Active' : 'Hidden'}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted">
            No products found. Create your first product to populate the catalog.
          </div>
        )}
      </section>
    </div>
  );
}

function CreateProductButton() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<CreateAdminProductPayload>({
    name: '',
    price: 0,
    currency: 'USD',
    categoryId: '',
    sku: '',
    landingUrl: ''
  });

  const mutation = useMutation({
    mutationFn: adminApi.createProduct,
    onSuccess: () => {
      toast.success('Product created');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    }
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(formState);
      }}
      className="rounded-3xl border border-slate-200 bg-white/90 p-4 text-sm shadow-sm dark:border-slate-800/60 dark:bg-slate-950/40"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Product name
          <input
            className="form-input"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Price
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={formState.price}
            onChange={(event) => setFormState((prev) => ({ ...prev, price: Number(event.target.value) }))}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Currency
          <input
            className="form-input"
            value={formState.currency}
            onChange={(event) => setFormState((prev) => ({ ...prev, currency: event.target.value }))}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Category ID
          <input
            className="form-input"
            value={formState.categoryId}
            onChange={(event) => setFormState((prev) => ({ ...prev, categoryId: event.target.value }))}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          SKU
          <input
            className="form-input"
            value={formState.sku}
            onChange={(event) => setFormState((prev) => ({ ...prev, sku: event.target.value }))}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Landing URL
          <input
            className="form-input"
            value={formState.landingUrl}
            onChange={(event) => setFormState((prev) => ({ ...prev, landingUrl: event.target.value }))}
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving...' : 'Add product'}
        </button>
      </div>
    </form>
  );
}
