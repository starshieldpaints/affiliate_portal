import {
  Activity,
  BarChart3,
  BellRing,
  Headset,
  Link2,
  PackageSearch,
  Settings2,
  Wallet
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

export const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Activity,
    description: 'Performance snapshot, pulse metrics, and quick actions.'
  },
  {
    label: 'Catalog',
    href: '/catalog',
    icon: PackageSearch,
    description: 'Browse products, download creatives, craft deep links.'
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Time-series analytics, order-level exports, saved filters.'
  },
  {
    label: 'Payouts',
    href: '/payouts',
    icon: Wallet,
    description: 'Balances, history, and downloadable payout receipts.'
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: BellRing,
    description: 'Sales alerts, policy changes, and payout updates.'
  },
  {
    label: 'Profile & Settings',
    href: '/settings/profile',
    icon: Settings2,
    description: 'Manage payout preferences, verification, and security.'
  },
  {
    label: 'Support',
    href: '/support',
    icon: Headset,
    description: 'FAQs, compliance policies, and contact form.'
  }
];
