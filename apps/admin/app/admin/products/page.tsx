'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../src/lib/api';
import { ProductRow, ProductTable } from '../../../src/components/products/ProductTable';
import { ProductFormDrawer } from '../../../src/components/products/ProductFormDrawer';
import { ConfirmDeleteDialog } from '../../../src/components/products/ConfirmDeleteDialog';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../src/components/AdminSidebar';
import { cn } from '../../../src/utils/cn';
import Link from 'next/link';

const pageSize = 10;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{
          data: any[];
          meta?: { total?: number; totalPages?: number };
        }>('/admin/products', {
          search,
          status: status !== 'all' ? status : undefined,
          page,
          pageSize
        });
        const rows =
          res.data?.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price ? Number(p.price) : null,
            currency: p.currency ?? 'USD',
            status: p.isActive,
            category: p.category?.name ?? null,
            createdAt: p.createdAt ? new Date(p.createdAt) : null
          })) ?? [];
        setProducts(rows);
        setMeta(res.meta ?? {});
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load products');
      } finally {
        setLoading(false);
      }
    },
    [search, status, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = meta.totalPages ?? Math.ceil((meta.total ?? products.length) / pageSize) || 1;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete?.(`/admin/products/${deleteTarget.id}`);
    setDeleteTarget(null);
    load();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
          <div className={cn('lg:block', sidebarOpen ? 'block' : 'hidden')}>
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-900"
              >
                {sidebarOpen ? 'Close' : 'Menu'}
              </button>
            </div>

            <AdminHeader title="Products" />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search products"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Link
                  href="/admin/products/new"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  New product
                </Link>
              </div>

              <ProductTable
                data={products}
                loading={loading}
                error={error ?? undefined}
                onRetry={load}
                onSelect={(p) => {
                  setSelected(p);
                  setShowForm(true);
                }}
              />

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProductFormDrawer
          open={showForm}
          product={selected}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
          }}
          onSaved={load}
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          name={deleteTarget?.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </div>
    </ProtectedRoute>
  );
}
