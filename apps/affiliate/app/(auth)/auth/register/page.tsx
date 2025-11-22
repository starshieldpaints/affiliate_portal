'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../../src/store/auth-store';
import { Eye, EyeOff, ShieldCheck, Sparkles, Target, UserPlus2 } from 'lucide-react';
import { PhoneInput, defaultCountries, type CountryData } from 'react-international-phone';
import 'react-international-phone/style.css';
import { toast } from 'sonner';

const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  displayName: z.string().min(3, 'Display name must be at least 3 characters'),
  phone: z.string().min(6, 'Phone number is required'),
  country: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue' })
  })
});

const isCountryData = (input: unknown): input is CountryData => {
  return (
    Array.isArray(input) &&
    typeof input[0] === 'string' &&
    typeof input[1] === 'string' &&
    typeof input[2] === 'string'
  );
};

type CountryOption = {
  name: string;
  iso2: string;
  dialCode: string;
};

const COUNTRY_OPTIONS: CountryOption[] = defaultCountries
  .map((entry) => ({
    name: entry[0],
    iso2: entry[1],
    dialCode: entry[2]
  }))
  .filter((option) => Boolean(option.name && option.iso2 && option.dialCode));

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    displayName: '',
    country: '',
    marketingOptIn: true,
    termsAccepted: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [phoneMeta, setPhoneMeta] = useState<{ countryName: string; dialCode: string }>({
    countryName: '',
    dialCode: ''
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCountry = formState.country.trim() || phoneMeta.countryName;
    const payload = {
      email: formState.email.trim(),
      password: formState.password,
      displayName: formState.displayName.trim(),
      phone: phoneValue.trim(),
      country: normalizedCountry || undefined,
      marketingOptIn: formState.marketingOptIn,
      termsAccepted: formState.termsAccepted
    };

    const result = registerSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message ?? 'Invalid form data');
      return;
    }

    try {
      setSubmitting(true);
      await register(result.data);
      toast.success('Account created.');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: 'easeOut' as const, staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <FormIntro
          eyebrow="Join program"
          title="Create your affiliate account"
          description="Access curated drops, creative kits, and payout health in one streamlined workspace."
          perks={[
            { icon: <ShieldCheck className="h-3 w-3" />, label: 'Verified payouts' },
            { icon: <Target className="h-3 w-3" />, label: 'Real-time attribution' },
            { icon: <Sparkles className="h-3 w-3" />, label: 'Global support' }
          ]}
        />
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-8">
        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeading
            title="Account access"
            description="These credentials secure your workspace."
          />
          <InputField
            label="Email"
            type="email"
            value={formState.email}
            onChange={(value) => setFormState((prev) => ({ ...prev, email: value }))}
            placeholder="you@email.com"
            autoComplete="email"
          />
          <PasswordField
            label="Password"
            visible={passwordVisible}
            onToggle={() => setPasswordVisible((prev) => !prev)}
            value={formState.password}
            onChange={(value) => setFormState((prev) => ({ ...prev, password: value }))}
          />
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeading
            title="Profile details"
            description="Tell us how to address you and stay in touch."
          />
          <InputField
            label="Display name"
            value={formState.displayName}
            onChange={(value) => setFormState((prev) => ({ ...prev, displayName: value }))}
            placeholder="Creator alias"
          />
          <PhoneInputField
            value={phoneValue}
            meta={phoneMeta}
            onChange={(value, data) => {
              setPhoneValue(value);
              setPhoneMeta(data);
              setFormState((prev) => {
                if (prev.country || !data.countryName) {
                  return prev;
                }
                return { ...prev, country: data.countryName };
              });
            }}
          />
          <CountrySelectField
            value={formState.country}
            onChange={(country) => setFormState((prev) => ({ ...prev, country }))}
          />
        </motion.section>

        <motion.section
          variants={itemVariants}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60"
        >
          <CheckboxField
            label="Notify me about new drops and payout boosts."
            checked={formState.marketingOptIn}
            onChange={(checked) =>
              setFormState((prev) => ({ ...prev, marketingOptIn: checked }))
            }
          />
          <CheckboxField
            label={
              <>
                I agree to the{' '}
                <Link href="#" className="text-brand hover:underline">
                  program terms
                </Link>
                .
              </>
            }
            checked={formState.termsAccepted}
            onChange={(checked) =>
              setFormState((prev) => ({ ...prev, termsAccepted: checked }))
            }
          />
        </motion.section>

        <motion.button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark disabled:opacity-60"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
        >
          <UserPlus2 className="h-4 w-4" />
          {submitting ? 'Creating account...' : 'Create account'}
        </motion.button>
      </motion.form>

      <motion.p variants={itemVariants} className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </motion.p>
      <motion.p variants={itemVariants} className="text-center text-xs text-slate-400">
        Need to finish verification?{' '}
        <Link href="/auth/verify-email" className="font-semibold text-brand hover:underline">
          Confirm your email
        </Link>
        .
      </motion.p>
    </motion.div>
  );
}

function FormIntro({
  eyebrow,
  title,
  description,
  perks
}: {
  eyebrow: string;
  title: string;
  description: string;
  perks: Array<{ icon: ReactNode; label: string }>;
}) {
  return (
    <header className="space-y-3 text-center sm:text-left">
      <p className="text-xs uppercase tracking-[0.5em] text-brand">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 dark:text-slate-300 sm:justify-start">
        {perks.map((perk) => (
          <span
            key={perk.label}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <span className="text-brand">{perk.icon}</span>
            {perk.label}
          </span>
        ))}
      </div>
    </header>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/60 dark:text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-brand focus:ring-brand dark:border-slate-700 dark:bg-slate-900"
      />
      <span>{label}</span>
    </label>
  );
}

type BaseFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
};

function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  autoComplete
}: BaseFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-600 dark:text-slate-300">{label}</label>
      <input
        type={type}
        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-900 transition focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PasswordField({
  label,
  visible,
  onToggle,
  value,
  onChange
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-600 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-900 transition focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PhoneInputField({
  value,
  meta,
  onChange
}: {
  value: string;
  meta: { countryName: string; dialCode: string };
  onChange: (value: string, data: { countryName: string; dialCode: string }) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-600 dark:text-slate-300">Phone</label>
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-800/70 dark:bg-slate-950/60">
        <PhoneInput
          defaultCountry="us"
          value={value}
          onChange={(val, countryData) => {
            const resolved = isCountryData(countryData) ? countryData : undefined;
            onChange(val, {
              countryName: resolved?.[0] ?? '',
              dialCode: resolved?.[2] ?? ''
            });
          }}
          className="ripe-phone-input text-slate-900 dark:text-white"
          inputProps={{
            className:
              '!bg-transparent !text-slate-900 dark:!text-white !text-sm !border-0 !shadow-none focus:!outline-none focus:!ring-0'
          }}
          countrySelectorStyleProps={{
            buttonClassName:
              '!bg-transparent !text-slate-900 dark:!text-white !border-r !border-slate-200 dark:!border-slate-800/70 hover:!bg-white/20 dark:hover:!bg-white/5'
          }}
          dialCodePreviewStyleProps={{
            className: '!text-slate-500 dark:!text-slate-400'
          }}
        />
      </div>
      {meta.countryName && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Selected: {meta.countryName} ({meta.dialCode})
        </p>
      )}
    </div>
  );
}

function CountrySelectField({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(COUNTRY_OPTIONS);

  const filterOptions = (needle: string) => {
    const normalizedQuery = needle.trim().toLowerCase();
    if (!normalizedQuery) {
      setFiltered(COUNTRY_OPTIONS);
      return;
    }
    setFiltered(
      COUNTRY_OPTIONS.filter(
        (option) =>
          option.name.toLowerCase().includes(normalizedQuery) ||
          option.iso2.toLowerCase().includes(normalizedQuery) ||
          option.dialCode.includes(normalizedQuery)
      )
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-600 dark:text-slate-300">Country</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-left text-sm text-slate-900 transition hover:border-brand focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate">{value || 'Select your country'}</span>
          <svg
            className="h-4 w-4 text-slate-500 dark:text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-950/90">
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800/70">
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  filterOptions(event.target.value);
                }}
                placeholder="Search country or dial code"
                className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-white"
              />
            </div>
            <div className="max-h-56 overflow-y-auto px-1 py-2 text-sm">
              {filtered.length ? (
                filtered.map((option) => (
                  <button
                    type="button"
                    key={option.iso2}
                    onClick={() => {
                      onChange(option.name);
                      setQuery('');
                      setFiltered(COUNTRY_OPTIONS);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                      option.name === value
                        ? 'bg-brand/10 text-brand'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="truncate">{option.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      +{option.dialCode}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-6 text-center text-xs text-muted">No matches</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
