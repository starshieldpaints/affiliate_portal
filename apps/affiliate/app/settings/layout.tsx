import { ReactNode } from 'react';
import { AppShell } from '../../src/components/AppShell';
import { AuthGate } from '../../src/components/AuthGate';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}

