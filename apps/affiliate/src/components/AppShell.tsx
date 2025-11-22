'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Space_Grotesk } from 'next/font/google';
import { navigation } from '../config/navigation';
import { cn } from '../utils/cn';
import { Menu, Star, UserCircle2, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { ThemeToggle } from './theme-toggle';

const brandFont = Space_Grotesk({ subsets: ['latin'], weight: ['600'] });

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const affiliateProfile = user?.affiliate;
  const needsAffiliateProfile =
    user?.role === 'affiliate' && (!affiliateProfile || !affiliateProfile.payoutMethod);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const renderNavLinks = (onNavigate?: () => void) =>
    navigation.map((item) => {
      const isActive = pathname?.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'group flex flex-col rounded-2xl border px-4 py-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
            isActive
              ? 'border-brand/40 bg-brand/10 text-slate-900 shadow-accent dark:text-white'
              : 'border-slate-200/70 bg-white/60 text-slate-600 hover:border-brand/40 hover:bg-brand/10 hover:text-slate-900 dark:border-slate-800/60 dark:bg-slate-900/30 dark:text-slate-300'
          )}
        >
          <span className="flex items-center gap-3 text-sm font-semibold">
            <item.icon className="h-4 w-4 text-brand" />
            {item.label}
          </span>
          <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.description}</span>
        </Link>
      );
    });

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-body)] text-slate-900 transition-colors duration-300 dark:text-slate-100 lg:flex-row">
      <aside className="relative sticky top-0 z-40 flex h-16 w-full items-center gap-3 border-b border-slate-200/80 bg-[var(--panel-bg)]/95 px-4 backdrop-blur dark:border-slate-800/80 lg:h-auto lg:w-80 lg:flex-col lg:border-r lg:border-b-0 lg:px-6">
        <div className="flex w-full items-center justify-between gap-3 pt-4 lg:flex-col lg:items-start lg:gap-4 lg:pt-8">
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-col text-slate-900 dark:text-white lg:w-full"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-accent">
                <Star className="h-5 w-5" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className={cn('text-lg tracking-tight truncate', brandFont.className)}>
                  StarShield Affiliate
                </span>
              </div>
            </div>
            <span className="hidden pl-14 text-[0.62rem] uppercase tracking-[0.55em] text-brand/70 sm:inline-block">
              Affiliation Hub
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileNavOpen}
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 p-2 text-slate-600 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 lg:hidden"
            >
              {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div
          className={cn(
            'absolute left-0 right-0 top-full z-10 origin-top max-h-[80vh] overflow-y-auto bg-[var(--panel-bg)]/98 px-4 pb-6 pt-4 shadow-lg backdrop-blur transition-all duration-200 dark:bg-slate-900/95 lg:hidden',
            isMobileNavOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0 -translate-y-2'
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
            {renderNavLinks(() => setMobileNavOpen(false))}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 dark:bg-slate-900/80">
                <UserCircle2 className="h-6 w-6 text-brand" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.affiliate?.displayName ?? user?.email ?? 'Affiliate'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.affiliate?.defaultReferralCode ?? 'Affiliate'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-500/60 hover:text-red-500 dark:border-slate-700 dark:text-slate-300"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
        <nav className="hidden w-full flex-1 flex-col gap-1 overflow-y-auto py-8 lg:flex">
          <div className="mb-4 flex justify-center">
            <ThemeToggle />
          </div>
          {renderNavLinks()}
        </nav>
        <footer className="hidden w-full items-center justify-between border-t border-slate-200/80 py-6 text-sm text-slate-600 dark:border-slate-800/70 dark:text-slate-300 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 dark:bg-slate-900/80">
              <UserCircle2 className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {user?.affiliate?.displayName ?? user?.email ?? 'Affiliate'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.affiliate?.defaultReferralCode ?? 'Affiliate'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-500/60 hover:text-red-500 dark:border-slate-700 dark:text-slate-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </footer>
      </aside>
      <div className="flex-1">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-12 lg:py-10">
          {needsAffiliateProfile && <CompleteProfileBanner />}
          {children}
        </main>
      </div>
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </div>
  );
}

function CompleteProfileBanner() {
  return (
    <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50/80 px-6 py-5 text-sm text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
      <p className="text-base font-semibold">Finish setting up your affiliate profile</p>
      <p className="mt-1 text-xs md:text-sm opacity-80">
        Add payout details and a referral code to unlock link creation, coupons, and payouts.
      </p>
      <Link
        href="/settings/profile"
        className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
      >
        Complete profile
      </Link>
    </div>
  );
}
