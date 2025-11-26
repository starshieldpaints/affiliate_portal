'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useAuth } from '../../../src/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => {
    if (user) {
      router.replace('/overview');
    }
  }, [user, router]);

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values);
      router.replace('/overview');
    } catch {
      // AuthContext already sets a safe, generic error message.
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8 shadow-xl shadow-black/20">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-brand">Admin Console</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">Use your StarShield admin credentials to continue.</p>
        </header>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="space-y-1 text-sm">
            <span className="text-slate-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="you@starshield.io"
            />
            {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-400">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
          </label>
          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {isSubmitting || loading ? 'Signing in...' : 'Sign in'}
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
