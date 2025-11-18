'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../../../src/lib/api-client';

const containerVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const, staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

type VerificationState = 'idle' | 'success';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          <p className="font-semibold">Loading verification form…</p>
          <p className="text-xs text-muted">Fetching the latest link parameters.</p>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams?.get('email') ?? '';
  const prefilledCode = searchParams?.get('code') ?? '';

  const [email, setEmail] = useState(prefilledEmail);
  const [code, setCode] = useState(prefilledCode);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<VerificationState>('idle');

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  useEffect(() => {
    if (prefilledCode) {
      setCode(prefilledCode);
    }
  }, [prefilledCode]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleSend = async () => {
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      toast.error('Enter a valid email before requesting an OTP.');
      return;
    }

    setSending(true);
    try {
      const response = await authApi.sendVerification({
        type: 'email',
        email: normalizedEmail,
      });

      if (response.alreadyVerified) {
        toast.success('Email already verified.');
        setStatus('success');
        return;
      }

      if (response.delivered) {
        toast.success('OTP sent to your inbox.');
        setCooldown(45);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send verification code right now.';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      toast.error('Enter a valid email.');
      return;
    }
    const sanitizedCode = code.trim();
    if (!/^\d{4,8}$/.test(sanitizedCode)) {
      toast.error('Enter the 4-8 digit code we emailed you.');
      return;
    }

    setVerifying(true);
    try {
      const response = await authApi.verifyContact({
        type: 'email',
        email: normalizedEmail,
        code: sanitizedCode,
      });

      if (response.verified) {
        toast.success('Your email has been verified.');
        setStatus('success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid or expired OTP.';
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Header />
      </motion.div>

      {status === 'success' ? (
        <motion.div variants={itemVariants}>
          <SuccessPanel email={normalizedEmail} />
        </motion.div>
      ) : (
        <motion.form
          variants={itemVariants}
          onSubmit={handleVerify}
          className="space-y-5 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40"
        >
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />

          <div className="space-y-2">
            <label className="text-sm text-slate-600 dark:text-slate-300">One-time code</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="form-input flex-1 text-base"
                placeholder="Enter code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                maxLength={8}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || cooldown > 0}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {sending ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sendingï¿½
                  </span>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
            <p className="text-xs text-muted">
              Codes expire quickly, so verify soon. We&apos;ll send the OTP from
              affiliates@starshield.io.
            </p>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark disabled:opacity-60"
          >
            {verifying ? 'Verifyingâ€¦' : 'Verify Email'}
          </button>
        </motion.form>
      )}

      <motion.div variants={itemVariants}>
        <FooterLinks />
      </motion.div>
    </motion.div>
  );
}

function Header() {
  return (
    <header className="space-y-3 text-center sm:text-left">
      <p className="text-xs uppercase tracking-[0.5em] text-brand">Verify email</p>
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
        Confirm your affiliate email
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Enter the one-time passcode we just emailed you via SendGrid to complete onboarding.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 sm:justify-start">
        <Badge icon={<ShieldCheck className="h-3 w-3" />} label="Secure verification" />
        <Badge icon={<MailCheck className="h-3 w-3" />} label="Powered by SendGrid" />
      </div>
    </header>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-900 transition focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
      />
    </label>
  );
}

function SuccessPanel({ email }: { email: string }) {
  return (
    <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-50">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/20 p-2 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-100">
          <MailCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Email verified</p>
          <p className="text-xs opacity-80">
            {email ? `Great! ${email} is confirmed.` : 'Your email is confirmed.'}
          </p>
        </div>
      </div>
      <p className="text-xs text-emerald-800 dark:text-emerald-100/90">
        You can close this window and continue sharing StarShield products. If you just verified,
        refresh your dashboard to see the update.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-700"
        >
          Go to dashboard
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex flex-1 items-center justify-center rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/60 dark:text-emerald-50 dark:hover:bg-emerald-500/10"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}

function FooterLinks() {
  return (
    <div className="space-y-3 text-center text-sm text-slate-600 dark:text-slate-400">
      <p>
        Need to update account details?{' '}
        <Link href="/settings/profile" className="font-semibold text-brand hover:underline">
          Manage profile
        </Link>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Didn&apos;t get the code? Check your spam folder or contact{' '}
        <Link href="mailto:affiliates@starshield.io" className="text-brand hover:underline">
          affiliates@starshield.io
        </Link>
        .
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
