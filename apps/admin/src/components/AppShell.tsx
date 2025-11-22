'use client';
import Link from 'next/link';
import { PropsWithChildren, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { navigation } from '../config/navigation';
import { cn } from '../utils/cn';
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  UserCog,
  X
} from 'lucide-react';
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

  const breadcrumbs = useMemo(() => {
    const active = navigation.find((n) => pathname.startsWith(n.href));
    return active?.label ?? 'Overview';
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/5 lg:hidden">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand hover:text-brand dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white ring-1 ring-slate-200 dark:bg-white dark:text-slate-900 dark:ring-white/20"
          >
            <LayoutDashboard className="h-4 w-4" />
            StarShield Admin
          </Link>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
          <aside
            className={cn(
              'fixed inset-y-4 left-4 z-40 w-72 translate-x-[-110%] overflow-hidden rounded-3xl border border-white/20 bg-white/90 p-4 shadow-2xl ring-1 ring-slate-200 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10 lg:static lg:translate-x-0 lg:shadow-none',
              mobileNavOpen && 'translate-x-0'
            )}
          >
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                <Sparkles className="h-4 w-4 text-brand" />
                Command
              </div>
            </div>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      'group relative flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-white text-slate-900 shadow-lg shadow-brand/20 ring-1 ring-brand/70'
                        : 'bg-white/60 text-slate-700 hover:bg-white/80 hover:text-slate-900 dark:bg-white/0 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'h-4 w-4 transition',
                          isActive ? 'text-brand' : 'text-slate-400 group-hover:text-brand dark:text-slate-300'
                        )}
                      />
                      {item.label}
                    </span>
                    {item.tag && (
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide',
                          isActive ? 'bg-brand/15 text-brand' : 'bg-white/60 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                        )}
                      >
                        {item.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
                  Live systems
                </div>
                <Bell className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-slate-500 dark:text-slate-300">
                Sessions active: <span className="font-semibold text-slate-900 dark:text-white">3</span>
              </p>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand/15 p-2">
                  <UserCog className="h-4 w-4 text-brand" />
                </span>
                <div className="leading-5">
                  <p className="text-sm font-semibold">{displayName}</p>
                  {user?.email && <p className="text-xs text-slate-500 dark:text-slate-300">{user.email}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-800 transition hover:border-brand hover:text-brand disabled:opacity-70 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </aside>

          <main className="flex w-full flex-1 flex-col gap-4 rounded-[28px] border border-slate-200/60 bg-white/85 p-6 shadow-2xl ring-1 ring-slate-200 backdrop-blur dark:border-white/10 dark:bg-slate-950/60 dark:ring-white/10">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm shadow-inner shadow-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">Admin</p>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{breadcrumbs}</h1>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      className="h-6 w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-500 outline-none ring-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 dark:text-white"
                      placeholder="Search orders, affiliates, rules..."
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-semibold uppercase tracking-wide text-white shadow dark:bg-white dark:text-slate-900"
                  >
                    Quick create
                  </button>
                  <div className="hidden sm:flex">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-300">
                <QuickStat label="Latency" value="128ms" />
                <QuickStat label="Fraud guard" value="ON" tone="success" />
                <QuickStat label="Payout queue" value="12 in-flight" />
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <span className="uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn('font-semibold text-slate-900 dark:text-white', tone === 'success' && 'text-emerald-600 dark:text-emerald-300')}>
        {value}
      </span>
    </div>
  );
}
