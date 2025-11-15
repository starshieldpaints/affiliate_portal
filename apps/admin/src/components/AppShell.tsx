'use client';
import Link from 'next/link';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { navigation } from '../config/navigation';
import { cn } from '../utils/cn';
import { LayoutDashboard, LogOut, Search, UserCog } from 'lucide-react';
import React from 'react';
import { useAuthStore } from '../store/auth-store';
import { ThemeToggle } from './ThemeToggle';

export function AppShell({ children }: PropsWithChildren) {
  const [pathname, setPathname] = useState<string>('/');
  const originalPushState = useRef<History['pushState'] | null>(null);
  const originalReplaceState = useRef<History['replaceState'] | null>(null);

  useEffect(() => {
    const updatePath = () => {
      setPathname(window.location.pathname || '/');
    };
    updatePath();

    const handlePop = () => updatePath();
    window.addEventListener('popstate', handlePop);

    originalPushState.current = history.pushState;
    originalReplaceState.current = history.replaceState;

    history.pushState = function (...args: Parameters<History['pushState']>) {
      originalPushState.current?.apply(this, args);
      updatePath();
    };
    history.replaceState = function (...args: Parameters<History['replaceState']>) {
      originalReplaceState.current?.apply(this, args);
      updatePath();
    };

    return () => {
      window.removeEventListener('popstate', handlePop);
      if (originalPushState.current) {
        history.pushState = originalPushState.current;
      }
      if (originalReplaceState.current) {
        history.replaceState = originalReplaceState.current;
      }
    };
  }, []);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = user?.adminProfile?.displayName ?? user?.email ?? 'Admin';

  return (
    <div className="flex min-h-screen bg-transparent text-slate-900 transition dark:text-slate-100">
      <aside className="card-surface hidden w-72 flex-col px-6 py-8 lg:flex">
        <Link href="/overview" className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-accent">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          StarShield Admin
        </Link>
        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all duration-150',
                  isActive
                    ? 'border-brand/40 bg-brand/15 text-brand-foreground shadow-accent'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand/40 hover:bg-brand/10 hover:text-brand dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:text-white'
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-brand" />
                  {item.label}
                </span>
                {item.tag && (
                  <span className="rounded-full bg-brand/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand">
                    {item.tag}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <footer className="card-surface mt-10 flex flex-col gap-3 rounded-3xl p-4 text-xs text-muted">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Program Health</p>
          <p>API latency: 182ms</p>
          <p>Webhook success: 99.1%</p>
          <p>Queue depth: 4 jobs</p>
          <ThemeToggle />
        </footer>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="card-surface flex h-20 items-center justify-between px-6">
          <div className="flex flex-1 items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-100"
              placeholder="Search orders, affiliates, rules..."
            />
          </div>
          <div className="ml-6 flex items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-left shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
              <span className="rounded-full bg-brand/20 p-2">
                <UserCog className="h-4 w-4 text-brand" />
              </span>
              <div className="text-xs leading-5 text-slate-500 dark:text-slate-300">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                {user?.email && <p className="text-slate-400">{user.email}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand disabled:opacity-60 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-8 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
