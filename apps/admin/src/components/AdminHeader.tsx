'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminHeader({ title }: { title: string }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <header className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">Admin</p>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.email ?? 'Admin'}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-800 transition hover:border-brand hover:text-brand disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
