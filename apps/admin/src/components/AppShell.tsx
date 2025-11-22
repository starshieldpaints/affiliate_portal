'use client';
import Link from 'next/link';
import { PropsWithChildren, useState } from 'react';
import { usePathname } from 'next/navigation';
import { navigation } from '../config/navigation';
import { cn } from '../utils/cn';
import { LayoutDashboard, LogOut, Menu, Search, UserCog, X } from 'lucide-react';
import React from 'react';
import { useAuthStore } from '../store/auth-store';
import { ThemeToggle } from './ThemeToggle';

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname() || '/';
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const displayName = user?.adminProfile?.displayName ?? user?.email ?? 'Admin';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 transition dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-10">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-black/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand hover:text-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-md dark:bg-white dark:text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                StarShield Admin
              </Link>
              <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 lg:block" />
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-slate-100 focus-within:border-brand focus-within:ring-brand/20 dark:border-slate-800 dark:bg-slate-900/70 dark:ring-slate-800">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full border-none bg-transparent text-slate-800 outline-none placeholder:text-slate-400 focus:border-none focus:outline-none focus:ring-0 dark:text-white"
                placeholder="Search orders, affiliates, rules..."
              />
            </div>
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:flex">
                <span className="rounded-full bg-brand/15 p-2">
                  <UserCog className="h-4 w-4 text-brand" />
                </span>
                <div className="text-xs leading-5 text-slate-500 dark:text-slate-300">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                  {user?.email && <p className="text-slate-400">{user.email}</p>}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex gap-6">
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-40 w-72 translate-x-[-110%] bg-white/95 p-4 shadow-2xl ring-1 ring-slate-200 transition-transform dark:bg-slate-900/95 dark:ring-slate-800 lg:static lg:block lg:translate-x-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0',
              mobileNavOpen && 'translate-x-0'
            )}
          >
            <nav className="space-y-2 rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm shadow-sm shadow-slate-200/50 dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-black/25">
              {navigation.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-150',
                      isActive
                        ? 'bg-slate-900 text-white shadow-md ring-1 ring-slate-800 dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon
                        className={cn('h-4 w-4', isActive ? 'text-white dark:text-slate-900' : 'text-brand')}
                      />
                      {item.label}
                    </span>
                    {item.tag && (
                      <span className="rounded-full bg-brand/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand">
                        {item.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex w-full flex-1 flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/25">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
