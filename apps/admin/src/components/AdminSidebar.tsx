'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../utils/cn';
import {
  LayoutDashboard,
  Users,
  Package,
  Percent,
  ShoppingBag,
  Wallet,
  ShieldAlert,
  BarChart2,
  FileText
} from 'lucide-react';

const navItems = [
  { href: '/overview', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/affiliates', label: 'Affiliates', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/commission-rules', label: 'Commission Rules', icon: Percent },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/payouts', label: 'Payouts', icon: Wallet },
  { href: '/fraud', label: 'Fraud Alerts', icon: ShieldAlert },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/audit', label: 'Audit Logs', icon: FileText }
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/80 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10">
      <div className="px-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
        Admin
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
                active
                  ? 'bg-slate-900 text-white shadow-md shadow-brand/10 ring-1 ring-brand'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-white' : 'text-slate-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { navItems as adminNavItems };
