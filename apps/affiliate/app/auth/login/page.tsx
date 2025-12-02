'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../src/store/auth-store';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } }
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = loginSchema.safeParse(formState);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    try {
      setSubmitting(true);
      await login(validation.data);
      toast.success('Welcome back.');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <FormIntro
          eyebrow="Welcome back"
          title="Sign in to your workspace"
          description="Access payouts, attribution, and creative kits from a single dashboard."
          badges={[
            { icon: <ShieldCheck className="h-3 w-3" />, label: 'Session security' },
            { icon: <ArrowRight className="h-3 w-3" />, label: 'Live payouts' }
          ]}
        />
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Email"
          type="email"
          value={formState.email}
          onChange={(value) => setFormState((prev) => ({ ...prev, email: value }))}
          autoComplete="email"
        />

        <PasswordField
          label="Password"
          value={formState.password}
          visible={passwordVisible}
          onToggle={() => setPasswordVisible((prev) => !prev)}
          onChange={(value) => setFormState((prev) => ({ ...prev, password: value }))}
        />

        <motion.button
          type="submit"
          disabled={submitting || status === 'loading'}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark disabled:opacity-60"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </motion.button>
      </motion.form>

      <motion.div variants={itemVariants}>
        <FooterLinks />
      </motion.div>
    </motion.div>
  );
}

function FormIntro({
  eyebrow,
  title,
  description,
  badges
}: {
  eyebrow: string;
  title: string;
  description: string;
  badges?: Array<{ icon: ReactNode; label: string }>;
}) {
  return (
    <header className="space-y-3 text-center sm:text-left">
      <p className="text-xs uppercase tracking-[0.5em] text-brand">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {badges && (
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 sm:justify-start">
          {badges.map((badge) => (
            <Badge key={badge.label} icon={badge.icon} label={badge.label} />
          ))}
        </div>
      )}
    </header>
  );
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-600 dark:text-slate-300">{label}</label>
      <input
        type={type}
        autoComplete={autoComplete}
        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-900 transition focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggle
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-600 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-900 transition focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function FooterLinks() {
  return (
    <div className="space-y-3 text-center text-sm text-slate-600 dark:text-slate-400">
      <p>
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-semibold text-brand hover:underline">
          Register
        </Link>
      </p>
      <p>
        Need to verify or resend your OTP?{' '}
        <Link href="/auth/verify-email" className="font-semibold text-brand hover:underline">
          Verify email
        </Link>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Need help accessing your account? Contact{' '}
        <Link href="mailto:affiliates@starshield.io" className="text-brand hover:underline">
          affiliates@starshield.io
        </Link>
      </p>
    </div>
  );
}

function Badge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      <span className="text-brand">{icon}</span>
      {label}
    </span>
  );
}
