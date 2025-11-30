'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { verifyContact } from '@/lib/api-client';
import { firebaseApp } from '../../../../src/lib/firebase';
import {
  applyActionCode,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailLink,
  type User
} from 'firebase/auth';
import { useAuthStore } from '../../../../src/store/auth-store';
import { authApi } from '../../../../src/lib/api-client';

const containerVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
};

type VerificationState = 'idle' | 'link-sent' | 'success';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          <p className="font-semibold">Loading verification form.</p>
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
  const oobCode = searchParams?.get('oobCode') ?? '';
  const mode = searchParams?.get('mode') ?? '';

  const [email, setEmail] = useState(prefilledEmail);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<VerificationState>('idle');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const auth = useMemo(() => getAuth(firebaseApp), []);
  const markEmailVerified = useAuthStore((state) => state.markEmailVerified);

  useEffect(() => {
    if (!prefilledEmail) return;
    setEmail(prefilledEmail);
  }, [prefilledEmail]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user?.email && !prefilledEmail) {
        setEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, [auth, prefilledEmail]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    const verifyFromLink = async () => {
      const href = window.location.href;
      if (!oobCode && !isSignInWithEmailLink(auth, href)) return;

      try {
        if (mode === 'verifyEmail' && oobCode) {
          await applyActionCode(auth, oobCode);
        }

        let token: string | undefined;
        let emailForToken: string | undefined = normalizedEmail;

        if (isSignInWithEmailLink(auth, href)) {
          const storedEmail =
            window.localStorage.getItem('pendingEmail') || normalizedEmail || undefined;
          if (storedEmail) {
            const cred = await signInWithEmailLink(auth, storedEmail, href);
            token = await cred.user.getIdToken();
            emailForToken = cred.user.email?.toLowerCase() ?? storedEmail.toLowerCase();
          }
        } else if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            token = await auth.currentUser.getIdToken();
            emailForToken = auth.currentUser.email?.toLowerCase() ?? normalizedEmail;
          }
        }

        if (token && emailForToken) {
          await authApi.verifyContact({
            type: 'email',
            email: emailForToken,
            firebaseIdToken: token
          });
          window.localStorage.removeItem('pendingEmail');
          markEmailVerified(new Date().toISOString());
          toast.success('Email verified. You can return to the app.');
          setStatus('success');
          return;
        }

        toast.error('Email verified in Firebase, but we could not confirm. Try the link again.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Verification link is invalid or expired.';
        toast.error(message);
      }
    };
    void verifyFromLink();
  }, [auth, markEmailVerified, mode, normalizedEmail, oobCode]);

  const handleSend = async () => {
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      toast.error('Enter a valid email before requesting a verification link.');
      return;
    }
    if (!firebaseUser || !firebaseUser.email) {
      toast.error('Sign in first so we can send a verification link to your account email.');
      return;
    }
    if (firebaseUser.email.toLowerCase() !== normalizedEmail) {
      toast.error('The email above must match the signed-in Firebase user.');
      return;
    }

    setSending(true);
    try {
      await sendEmailVerification(firebaseUser, {
        url: `${window.location.origin}/auth/verify-email`,
        handleCodeInApp: true
      });
      window.localStorage.setItem('pendingEmail', firebaseUser.email.toLowerCase());
      toast.success('Verification link sent. Check your inbox and click the link to confirm.');
      setCooldown(45);
      setStatus('link-sent');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send verification link right now.';
      toast.error(message);
    } finally {
      setSending(false);
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
        <motion.div
          variants={itemVariants}
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

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || cooldown > 0}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark disabled:opacity-60"
          >
            {sending ? (
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sending…
              </span>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : status === 'link-sent' ? (
              'Resend verification link'
            ) : (
              'Send verification link'
            )}
          </button>
          <p className="text-xs text-muted">
            We&apos;ll send a Firebase verification link to {normalizedEmail || 'your email'}. Click
            it in your inbox to verify, then return here.
          </p>
        </motion.div>
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
        We&apos;ll email you a Firebase verification link. Click it in your inbox to complete
        onboarding.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 sm:justify-start">
        <Badge icon={<ShieldCheck className="h-3 w-3" />} label="Secure verification" />
        <Badge icon={<MailCheck className="h-3 w-3" />} label="Powered by Firebase" />
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
  required
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
        Didn&apos;t get the link? Check your spam folder or contact{' '}
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
