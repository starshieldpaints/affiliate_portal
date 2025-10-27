'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { navigation } from '../config/navigation';
import { cn } from '../utils/cn';
import { ChevronDown, LayoutDashboard, Search, UserCog } from 'lucide-react';

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-72 flex-col border-r border-slate-800/80 bg-slate-950/70 px-6 py-8 lg:flex">
        <Link href="/overview" className="flex items-center gap-3 text-lg font-semibold text-white">
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
                    ? 'border-brand/40 bg-brand/15 text-white shadow-accent'
                    : 'border-slate-800/70 bg-slate-900/40 text-slate-300 hover:border-brand/40 hover:bg-brand/10 hover:text-white'
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
        <footer className="mt-10 flex flex-col gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-300">
          <p className="text-sm font-semibold text-white">Program Health</p>
          <p>API latency: 182ms</p>
          <p>Webhook success: 99.1%</p>
          <p>Queue depth: 4 jobs</p>
        </footer>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-20 items-center justify-between border-b border-slate-800/80 px-6">
          <div className="flex flex-1 items-center gap-3 text-sm text-slate-400">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              className="w-full rounded-full border border-slate-800/60 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Search orders, affiliates, rules..."
            />
          </div>
          <button className="ml-6 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 hover:border-brand hover:text-brand">
            <UserCog className="h-4 w-4" />
            Olivia (Admin)
            <ChevronDown className="h-4 w-4" />
          </button>
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-8 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
