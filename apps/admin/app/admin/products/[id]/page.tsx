'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../src/lib/api';
import { ProductFormDrawer } from '../../../../src/components/products/ProductFormDrawer';
import { ProtectedRoute } from '../../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../../src/components/AdminSidebar';
import { ProductRow } from '../../../../src/components/products/ProductTable';
import { cn } from '../../../../src/utils/cn';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: any }>(`/admin/products/${productId}`);
        const p = res.data;
        setProduct({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price ? Number(p.price) : null,
          currency: p.currency ?? 'USD',
          status: p.isActive,
          category: p.category?.name ?? null,
          createdAt: p.createdAt ? new Date(p.createdAt) : null
        });
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

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
            <AdminHeader title="Product Details" />
            <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {loading && <p className="text-sm text-slate-500">Loading product...</p>}
              {error && <p className="text-sm text-rose-500">{error}</p>}
              {product && (
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p>
                    <strong>Name:</strong> {product.name}
                  </p>
                  <p>
                    <strong>SKU:</strong> {product.sku}
                  </p>
                  <p>
                    <strong>Price:</strong> {product.price ? `${product.currency} ${product.price.toFixed(2)}` : '—'}
                  </p>
                  <p>
                    <strong>Status:</strong> {product.status ? 'Active' : 'Inactive'}
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
        <ProductFormDrawer
          open={open}
          product={product ?? undefined}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
