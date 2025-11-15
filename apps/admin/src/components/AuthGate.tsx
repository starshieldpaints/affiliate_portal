'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';

export function AuthGate({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const router = useRouter();

  useEffect(() => {
    if (status === 'idle') {
      initialize();
    }
  }, [status, initialize]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-slate-400">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-brand">Authenticating</p>
        <p className="text-sm text-slate-500">Verifying admin session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
