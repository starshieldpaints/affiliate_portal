'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import Link from 'next/link';

export function AuthGate({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    if (status === 'idle') {
      initialize();
    }
  }, [status, initialize]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-200">
        <div className="space-y-2 text-center">
          <p className="text-lg font-semibold">Loading your workspace</p>
          <p className="text-sm text-slate-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-300">You must sign in to continue.</p>
        <Link
          href="/auth/login"
          className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-dark"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
