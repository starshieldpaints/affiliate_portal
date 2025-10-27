import { ReactNode } from 'react';
import { AppShell } from '../../src/components/AppShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
