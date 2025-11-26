'use client';

import { ReactNode, useState } from 'react';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AdminSidebar } from '../../src/components/AdminSidebar';
import { AdminHeader } from '../../src/components/AdminHeader';
import { usePathname } from 'next/navigation';
import { cn } from '../../src/utils/cn';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = deriveTitle(pathname);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
          <div className={cn('lg:block', mobileOpen ? 'block' : 'hidden')}>
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-900"
              >
                {mobileOpen ? 'Close' : 'Menu'}
              </button>
            </div>
            <AdminHeader title={pageTitle} />
            <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function deriveTitle(pathname?: string | null) {
  if (!pathname) return 'Dashboard';
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Dashboard';
  return parts[parts.length - 1]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
