'use client';

import { useState } from 'react';
import { ProductFormDrawer } from '../../../../src/components/products/ProductFormDrawer';
import { ProtectedRoute } from '../../../../src/components/ProtectedRoute';
import { AdminHeader } from '../../../../src/components/AdminHeader';
import { AdminSidebar } from '../../../../src/components/AdminSidebar';
import { cn } from '../../../../src/utils/cn';

export default function NewProductPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState(true);

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
            <AdminHeader title="New Product" />
            <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Fill in the product details. Saving will create the product immediately.
              </p>
            </main>
          </div>
        </div>
        <ProductFormDrawer
          open={open}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
