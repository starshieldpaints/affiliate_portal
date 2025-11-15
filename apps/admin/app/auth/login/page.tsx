'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { z } from 'zod';
import { useAuthStore } from '../../../src/store/auth-store';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const initialize = useAuthStore((state) => state.initialize);
  const status = useAuthStore((state) => state.status);
  const storedError = useAuthStore((state) => state.error);
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      initialize();
    }
  }, [status, initialize]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/overview');
    }
  }, [status, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = loginSchema.safeParse(formState);
    if (!validation.success) {
      setFormError(validation.error.errors[0]?.message ?? 'Invalid credentials');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await login(validation.data);
      router.replace('/overview');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to login');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-brand">StarShield</p>
          <p className="text-lg font-semibold">Preparing console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8 shadow-xl shadow-black/20">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-brand">Admin Console</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">Use your StarShield admin credentials to continue.</p>
        </header>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="space-y-1 text-sm">
            <span className="text-slate-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="you@starshield.io"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-400">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="••••••••"
            />
          </label>
          {(formError || storedError) && (
            <p className="text-sm text-rose-400">{formError ?? storedError}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500">
          Need access? Email{' '}
          <Link href="mailto:security@starshield.io" className="text-brand hover:underline">
            security@starshield.io
          </Link>
        </p>
      </div>
    </div>
  );
}
