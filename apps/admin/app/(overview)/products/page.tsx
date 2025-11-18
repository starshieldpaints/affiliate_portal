'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  Layers,
  Loader2,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../../src/lib/api-client';
import type {
  AdminProduct,
  CreateAdminProductPayload,
  UpdateAdminProductPayload
} from '../../../src/types/catalog';

type StatusFilter = 'all' | 'active' | 'hidden';

const createDefaults: CreateAdminProductPayload = {
  name: '',
  price: 0,
  currency: 'USD',
  description: '',
  categoryId: '',
  sku: '',
  landingUrl: '',
  imageUrl: '',
  isActive: true
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await adminApi.listProducts();
      return response.data;
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const products = productsQuery.data ?? [];

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? product.isActive : !product.isActive);
      if (!term) {
        return matchesStatus;
      }
      const haystack = [product.name, product.sku ?? '', product.category?.name ?? '', product.id]
        .join(' ')
        .toLowerCase();
      return matchesStatus && haystack.includes(term);
    });
  }, [products, search, statusFilter]);

  const stats = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const hidden = products.length - active;
    const categories = new Set(
      products.map((product) => product.category?.name ?? product.categoryId ?? 'Uncategorized')
    );
    return {
      total: products.length,
      active,
      hidden,
      categories: categories.size
    };
  }, [products]);

  const updateMutation = useMutation({
    mutationFn: ({
      productId,
      payload
    }: {
      productId: string;
      payload: UpdateAdminProductPayload;
    }) => adminApi.updateProduct(productId, payload),
    onSuccess: () => {
      toast.success('Product updated');
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to update product');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => adminApi.deleteProduct(productId),
    onSuccess: () => {
      toast.success('Product deleted');
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to delete product');
    }
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createProduct,
    onSuccess: () => {
      toast.success('Product created');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to create product');
    }
  });

  return (
    <div className="space-y-10 overflow-x-hidden">
      <Hero stats={stats} onCreate={() => setCreateOpen(true)} />
      <FilterBar
      search={search}
      onSearchChange={setSearch}
      status={statusFilter}
      onStatusChange={setStatusFilter}
      />
      <ProductGrid
        products={filteredProducts}
        isLoading={productsQuery.isLoading}
        onEdit={setEditingProduct}
      />

      {editingProduct && (
        <ProductModal
          title="Edit product"
          product={editingProduct}
          isBusy={updateMutation.isPending || deleteMutation.isPending}
          onClose={() => setEditingProduct(null)}
          onSubmit={(payload) =>
            updateMutation.mutate({ productId: editingProduct.id, payload })
          }
          onDelete={() => deleteMutation.mutate(editingProduct.id)}
        />
      )}

      {isCreateOpen && (
        <ProductModal
          title="Create product"
          product={null}
          isBusy={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(payload) => createMutation.mutate(payload as CreateAdminProductPayload)}
        />
      )}
    </div>
  );
}

function Hero({
  stats,
  onCreate
}: {
  stats: Record<'total' | 'active' | 'hidden' | 'categories', number>;
  onCreate: () => void;
}) {
  return (
    <section className="rounded-4xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-black px-10 py-12 text-white shadow-2xl dark:border-slate-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">Catalog control</p>
          <h1 className="text-4xl font-semibold leading-tight">Modernize every SKU in minutes.</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Search, edit, and launch products without leaving this screen. Approved changes sync
            directly to the affiliate portal.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/30 transition hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          New product
        </button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <HeroCard icon={Package} label="Total products" value={stats.total} />
        <HeroCard icon={Sparkles} label="Active" value={stats.active} />
        <HeroCard icon={Trash2} label="Hidden" value={stats.hidden} tone="warning" />
        <HeroCard icon={Layers} label="Categories" value={stats.categories} />
      </div>
    </section>
  );
}

function HeroCard({
  label,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  value: number;
  icon: typeof Package;
  tone?: 'warning';
}) {
  const chip =
    tone === 'warning' ? 'bg-amber-400/20 text-amber-100' : 'bg-brand/25 text-brand';
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/70">{label}</p>
          <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white px-6 py-5 shadow-lg shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-950/70 dark:shadow-black/30 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, SKU, or ID"
          className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white"
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
        {(['all', 'active', 'hidden'] as StatusFilter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onStatusChange(option)}
            className={`rounded-full px-4 py-2 ${
              status === option
                ? 'bg-brand text-brand-foreground'
                : 'border border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductGrid({
  products,
  isLoading,
  onEdit
}: {
  products: AdminProduct[];
  isLoading: boolean;
  onEdit: (product: AdminProduct) => void;
}) {
  if (isLoading && !products.length) {
    return (
      <div className="card-surface flex min-h-[320px] items-center justify-center rounded-3xl p-8 text-sm text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading catalog...
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="card-surface flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center">
        <p className="text-base font-semibold text-slate-900 dark:text-white">No products match</p>
        <p className="text-sm text-muted">
          Adjust filters or create a new entry to populate this grid.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="flex flex-col rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/70 dark:bg-slate-950/60"
        >
          <ProductImage src={product.imageUrl} name={product.name} />
          <div className="flex flex-1 flex-col gap-3 px-5 py-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                {product.category?.name ?? product.categoryId ?? 'Uncategorized'}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${
                  product.isActive
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                {product.isActive ? 'Live' : 'Hidden'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{product.name}</h3>
              <p className="text-sm text-muted">
                {product.description?.slice(0, 120) || 'No marketing copy yet.'}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
              <InfoRow label="Price" value={formatPrice(product.price, product.currency)} />
              <InfoRow label="SKU" value={product.sku ?? 'Not set'} />
              <InfoRow label="Landing" value={getHostname(product.landingUrl)} />
              <InfoRow
                label="Asset"
                value={product.imageUrl ? 'Attached' : 'Missing'}
                tone={product.imageUrl ? 'success' : 'warning'}
              />
            </dl>
            <div className="mt-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
              >
                Edit
              </button>
              {product.landingUrl && (
                <a
                  href={product.landingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  if (!src) {
    return (
      <div className="flex h-40 items-center justify-center rounded-3xl bg-slate-100 text-sm text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
        No image
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="h-40 w-full rounded-3xl object-cover"
      loading="lazy"
    />
  );
}

function InfoRow({
  label,
  value,
  tone
}: {
  label: string;
  value: ReactNode;
  tone?: 'success' | 'warning';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-600'
      : tone === 'warning'
      ? 'text-amber-500'
      : 'text-slate-900 dark:text-white';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.55rem] uppercase tracking-[0.4em] text-muted">{label}</span>
      <span className={`text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

type ProductFormState = {
  name: string;
  sku: string;
  price: string;
  currency: string;
  categoryId: string;
  landingUrl: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
};

function buildFormState(product: AdminProduct | null): ProductFormState {
  if (!product) {
    return {
      name: '',
      sku: '',
      price: '',
      currency: 'USD',
      categoryId: '',
      landingUrl: '',
      imageUrl: '',
      description: '',
      isActive: true
    };
  }
  return {
    name: product.name,
    sku: product.sku ?? '',
    price: product.price.toString(),
    currency: product.currency ?? 'USD',
    categoryId: product.categoryId ?? product.category?.id ?? '',
    landingUrl: product.landingUrl ?? '',
    imageUrl: product.imageUrl ?? '',
    description: product.description ?? '',
    isActive: product.isActive
  };
}

function ProductModal({
  title,
  product,
  isBusy,
  onSubmit,
  onClose,
  onDelete
}: {
  title: string;
  product: AdminProduct | null;
  isBusy: boolean;
  onSubmit: (payload: UpdateAdminProductPayload | CreateAdminProductPayload) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<ProductFormState>(buildFormState(product));

  useEffect(() => {
    setForm(buildFormState(product));
  }, [product?.id]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: UpdateAdminProductPayload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      price: Number(form.price) || 0,
      currency: form.currency.trim().toUpperCase() || 'USD',
      categoryId: form.categoryId.trim() || undefined,
      description: form.description.trim() || undefined,
      landingUrl: form.landingUrl.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      isActive: form.isActive
    };
    onSubmit(payload);
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white px-6 py-5 shadow-2xl shadow-black/30 dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand">Catalog</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
          >
            Close
          </button>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name">
              <input
                className="form-input"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </Field>
            <Field label="SKU">
              <input
                className="form-input"
                value={form.sku}
                onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
              />
            </Field>
            <Field label="Price">
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </Field>
            <Field label="Currency">
              <input
                className="form-input"
                value={form.currency}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                }
                maxLength={3}
              />
            </Field>
            <Field label="Category ID">
              <input
                className="form-input"
                value={form.categoryId}
                onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              />
            </Field>
            <Field label="Landing URL">
              <input
                className="form-input"
                value={form.landingUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, landingUrl: event.target.value }))}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className="form-input min-h-[110px] resize-none"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </Field>

          <Field label="Hero image URL">
            <input
              className="form-input"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
          </Field>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            Product is active
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark disabled:opacity-60"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', listener);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', listener);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl shadow-2xl shadow-black/40">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
      {label}
      {children}
    </label>
  );
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function getHostname(url?: string | null) {
  if (!url) return 'Not linked';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
