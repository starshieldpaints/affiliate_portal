import {
  Activity,
  BadgeAlert,
  Blocks,
  ClipboardList,
  DollarSign,
  FolderCog,
  ShieldCheck,
  Users
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
};

export const navigation: NavItem[] = [
  { label: 'Overview', href: '/overview', icon: Activity },
  { label: 'Affiliates', href: '/affiliates', icon: Users },
  { label: 'Commission Rules', href: '/commission-rules', icon: ClipboardList },
  { label: 'Orders & Refunds', href: '/orders', icon: Blocks },
  { label: 'Payouts', href: '/payouts', icon: DollarSign, tag: 'Batching' },
  { label: 'Reports', href: '/reports', icon: FolderCog },
  { label: 'Fraud & Alerts', href: '/fraud', icon: BadgeAlert },
  { label: 'Audit Center', href: '/audit', icon: ShieldCheck }
];
