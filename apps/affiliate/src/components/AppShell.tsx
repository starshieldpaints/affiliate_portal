'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { navigation } from '../config/navigation';
import { cn } from '../utils/cn';
import { Menu, Star, UserCircle2 } from 'lucide-react';

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="sticky top-0 z-40 flex h-16 w-full items-center gap-3 border-b border-slate-800 bg-surface/95 px-4 backdrop-blur lg:h-auto lg:w-72 lg:flex-col lg:border-r lg:border-b-0 lg:px-6">
        <div className="flex w-full items-center justify-between lg:justify-start">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-accent">
              <Star className="h-5 w-5" />
            </span>
            <span className="hidden text-base tracking-wide text-white lg:block">
              StarShield Affiliate
            </span>
          </Link>
          <button className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/60 p-2 text-slate-300 hover:border-brand hover:text-brand lg:hidden">
            <Menu className="h-4 w-4" />
          </button>
        </div>
        <nav className="hidden w-full flex-1 flex-col gap-1 overflow-y-auto py-8 lg:flex">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex flex-col rounded-2xl border px-4 py-3 transition-all duration-150',
                  isActive
                    ? 'border-brand/40 bg-brand/15 text-white shadow-accent'
                    : 'border-slate-800/60 bg-slate-900/30 text-slate-300 hover:border-brand/40 hover:bg-brand/10 hover:text-white'
                )}
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <item.icon className="h-4 w-4 text-brand" />
                  {item.label}
                </span>
                <span className="mt-1 text-xs text-slate-400">{item.description}</span>
              </Link>
            );
          })}
        </nav>
        <footer className="hidden w-full items-center gap-3 border-t border-slate-800/70 py-6 text-sm text-slate-300 lg:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/80">
            <UserCircle2 className="h-6 w-6 text-brand" />
          </div>
          <div>
            <p className="font-medium text-white">Alex Carter</p>
            <p className="text-xs text-slate-400">Premium Affiliate</p>
          </div>
        </footer>
      </aside>
      <div className="flex-1">
        <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
