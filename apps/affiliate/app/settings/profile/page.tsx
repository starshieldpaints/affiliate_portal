'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '../../../src/store/auth-store';
import { affiliatesApi, authApi } from '../../../src/lib/api-client';

const payoutOptions = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
];

type BankOption = {
  value: string;
  label: string;
  category: string;
};

const bankOptions: BankOption[] = [
  { value: 'sbi', label: 'State Bank of India (SBIN)', category: 'Public sector' },
  { value: 'bank_of_baroda', label: 'Bank of Baroda (BARB)', category: 'Public sector' },
  { value: 'bank_of_india', label: 'Bank of India (BKID)', category: 'Public sector' },
  { value: 'bank_of_maharashtra', label: 'Bank of Maharashtra (MAHB)', category: 'Public sector' },
  { value: 'canara', label: 'Canara Bank (CNRB)', category: 'Public sector' },
  { value: 'central_bank', label: 'Central Bank of India (CBIN)', category: 'Public sector' },
  { value: 'indian_bank', label: 'Indian Bank (IDIB)', category: 'Public sector' },
  { value: 'indian_overseas', label: 'Indian Overseas Bank (IOBA)', category: 'Public sector' },
  { value: 'pnb', label: 'Punjab National Bank (PUNB)', category: 'Public sector' },
  { value: 'punjab_sind', label: 'Punjab & Sind Bank (PSIB)', category: 'Public sector' },
  { value: 'uco', label: 'UCO Bank (UCBA)', category: 'Public sector' },
  { value: 'union_bank', label: 'Union Bank of India (UBIN)', category: 'Public sector' },
  { value: 'axis', label: 'Axis Bank (UTIB)', category: 'Private sector' },
  { value: 'bandhan', label: 'Bandhan Bank (BDBL)', category: 'Private sector' },
  { value: 'csb', label: 'CSB Bank (CSBK)', category: 'Private sector' },
  { value: 'city_union', label: 'City Union Bank (CIUB)', category: 'Private sector' },
  { value: 'dcb', label: 'DCB Bank (DCBL)', category: 'Private sector' },
  { value: 'dhanlaxmi', label: 'Dhanlaxmi Bank (DLXB)', category: 'Private sector' },
  { value: 'federal', label: 'Federal Bank (FDRL)', category: 'Private sector' },
  { value: 'hdfc', label: 'HDFC Bank (HDFC)', category: 'Private sector' },
  { value: 'icici', label: 'ICICI Bank (ICIC)', category: 'Private sector' },
  { value: 'idbi', label: 'IDBI Bank (IBKL)', category: 'Private sector' },
  { value: 'idfc', label: 'IDFC First Bank (IDFB)', category: 'Private sector' },
  { value: 'indusind', label: 'IndusInd Bank (INDB)', category: 'Private sector' },
  { value: 'jkb', label: 'Jammu & Kashmir Bank (JAKA)', category: 'Private sector' },
  { value: 'karnataka', label: 'Karnataka Bank (KARB)', category: 'Private sector' },
  { value: 'karur_vysya', label: 'Karur Vysya Bank (KVBL)', category: 'Private sector' },
  { value: 'kotak', label: 'Kotak Mahindra Bank (KKBK)', category: 'Private sector' },
  { value: 'nainital', label: 'Nainital Bank (NTBL)', category: 'Private sector' },
  { value: 'rbl', label: 'RBL Bank (RATN)', category: 'Private sector' },
  { value: 'south_indian', label: 'South Indian Bank (SIBL)', category: 'Private sector' },
  { value: 'tmb', label: 'Tamilnad Mercantile Bank (TMBL)', category: 'Private sector' },
  { value: 'yes_bank', label: 'Yes Bank (YESB)', category: 'Private sector' },
  { value: 'au_sfb', label: 'AU Small Finance Bank (AUBL)', category: 'Small finance banks' },
  {
    value: 'capital_sfb',
    label: 'Capital Small Finance Bank (CLBL)',
    category: 'Small finance banks',
  },
  {
    value: 'equitas_sfb',
    label: 'Equitas Small Finance Bank (ESFB)',
    category: 'Small finance banks',
  },
  { value: 'esaf_sfb', label: 'ESAF Small Finance Bank (ESMF)', category: 'Small finance banks' },
  {
    value: 'fincare_sfb',
    label: 'Fincare Small Finance Bank (FSFB)',
    category: 'Small finance banks',
  },
  { value: 'jana_sfb', label: 'Jana Small Finance Bank (JSFB)', category: 'Small finance banks' },
  {
    value: 'nesfb',
    label: 'North East Small Finance Bank (NESF)',
    category: 'Small finance banks',
  },
  {
    value: 'suryoday_sfb',
    label: 'Suryoday Small Finance Bank (SURY)',
    category: 'Small finance banks',
  },
  {
    value: 'ujjivan_sfb',
    label: 'Ujjivan Small Finance Bank (UJVN)',
    category: 'Small finance banks',
  },
  {
    value: 'utkarsh_sfb',
    label: 'Utkarsh Small Finance Bank (UTKS)',
    category: 'Small finance banks',
  },
  { value: 'airtel_payments', label: 'Airtel Payments Bank (AIRP)', category: 'Payments banks' },
  {
    value: 'india_post_payments',
    label: 'India Post Payments Bank (IPOS)',
    category: 'Payments banks',
  },
  { value: 'fino_payments', label: 'Fino Payments Bank (FINO)', category: 'Payments banks' },
  { value: 'jio_payments', label: 'Jio Payments Bank (JIOP)', category: 'Payments banks' },
  { value: 'paytm_payments', label: 'Paytm Payments Bank (PYTM)', category: 'Payments banks' },
  { value: 'nsdl_payments', label: 'NSDL Payments Bank (NSPB)', category: 'Payments banks' },
  { value: 'citi', label: 'Citi Bank (CITI)', category: 'Foreign banks in India' },
  { value: 'hsbc', label: 'HSBC (HSBC)', category: 'Foreign banks in India' },
  { value: 'deutsche', label: 'Deutsche Bank (DEUT)', category: 'Foreign banks in India' },
  {
    value: 'standard_chartered',
    label: 'Standard Chartered Bank (SCBL)',
    category: 'Foreign banks in India',
  },
  { value: 'barclays', label: 'Barclays Bank (BARC)', category: 'Foreign banks in India' },
  { value: 'dbs', label: 'DBS Bank (DBSS)', category: 'Foreign banks in India' },
  { value: 'bank_of_america', label: 'Bank of America (BOFA)', category: 'Foreign banks in India' },
  { value: 'bnp', label: 'BNP Paribas (BNPA)', category: 'Foreign banks in India' },
  { value: 'jp_morgan', label: 'JP Morgan Chase Bank (CHAS)', category: 'Foreign banks in India' },
  { value: 'rbs', label: 'Royal Bank of Scotland (RBOS)', category: 'Foreign banks in India' },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateAffiliateProfile = useAuthStore((state) => state.updateAffiliateProfile);
  const markEmailVerified = useAuthStore((state) => state.markEmailVerified);
  const markPhoneVerified = useAuthStore((state) => state.markPhoneVerified);
  const profileMutation = useMutation({
    mutationFn: affiliatesApi.updateProfile,
    onSuccess: (affiliate) => {
      if (affiliate) {
        updateAffiliateProfile({
          displayName: affiliate.displayName ?? undefined,
          payoutMethod: affiliate.payoutMethod ?? null,
          payoutDetails: affiliate.payoutDetails ?? null,
          kycStatus: affiliate.kycStatus,
          defaultReferralCode: affiliate.defaultReferralCode,
        });
      }
      toast.success('Profile details saved. Admin will review and activate your account.');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Unable to update profile right now.';
      toast.error(message);
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState(user?.affiliate?.displayName ?? '');
  const [payoutMethod, setPayoutMethod] = useState(user?.affiliate?.payoutMethod ?? '');
  const [upiId, setUpiId] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState(user?.affiliate?.aadhaarNumber ?? '');
  const [panImageUrl, setPanImageUrl] = useState(user?.affiliate?.panImageUrl ?? '');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState(user?.affiliate?.aadhaarFrontUrl ?? '');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState(user?.affiliate?.aadhaarBackUrl ?? '');
  const [marketingOptIn, setMarketingOptIn] = useState(true);


  useEffect(() => {
    setUpiId('');
    setBankAccountName('');
    setBankAccountNumber('');
    setBankIfsc('');
    setBankName('');
  }, [payoutMethod]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim() || !payoutMethod) {
      toast.error('Please enter your display name and choose a payout method.');
      return;
    }

    if (payoutMethod === 'upi' && !upiId.trim()) {
      toast.error('Enter your UPI ID so we can route payouts.');
      return;
    }

    if (
      payoutMethod === 'bank_transfer' &&
      (!bankAccountName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim() || !bankName.trim())
    ) {
      toast.error('Bank transfers require bank selection and complete account details.');
      return;
    }
    const normalizedPan = panNumber.trim().toUpperCase();
    if (!normalizedPan) {
      toast.error('Enter your PAN so we can issue payout summaries.');
      return;
    }
    if (!isValidPan(normalizedPan)) {
      toast.error('Enter a valid PAN (e.g., ABCDE1234F).');
      return;
    }
    const normalizedAadhaar = aadhaarNumber.trim();
    if (!isValidAadhaar(normalizedAadhaar)) {
      toast.error('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    const normalizedPanDoc = panImageUrl.trim();
    const normalizedAadhaarFront = aadhaarFrontUrl.trim();
    const normalizedAadhaarBack = aadhaarBackUrl.trim();
    if (!isValidUrl(normalizedPanDoc)) {
      toast.error('Provide a valid URL for your PAN document.');
      return;
    }
    if (!isValidUrl(normalizedAadhaarFront) || !isValidUrl(normalizedAadhaarBack)) {
      toast.error('Provide valid URLs for Aadhaar front and back.');
      return;
    }
    try {
      setSubmitting(true);
      const payoutDetails =
        payoutMethod === 'upi'
          ? { upiId, panNumber: normalizedPan }
          : payoutMethod === 'bank_transfer'
            ? {
                bankName,
                accountHolder: bankAccountName,
                accountNumber: bankAccountNumber,
                ifsc: bankIfsc,
                panNumber: normalizedPan,
              }
            : null;

      await profileMutation.mutateAsync({
        displayName,
        payoutMethod,
        payoutDetails,
        panNumber: normalizedPan,
        aadhaarNumber: normalizedAadhaar,
        panImageUrl: normalizedPanDoc,
        aadhaarFrontUrl: normalizedAadhaarFront,
        aadhaarBackUrl: normalizedAadhaarBack,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3 md:text-left">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Profile setup</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Complete your affiliate profile
        </h1>
        <p className="max-w-3xl text-sm text-muted">
          Add payout preferences, compliance details, and communication choices. Once saved, our
          compliance team reviews everything within 1-2 business days and unlocks link generation.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)]">
        <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-black/30 md:p-8">
          <div className="space-y-8">
            {user && (
              <ContactVerificationSection
                email={user.email}
                emailVerifiedAt={user.emailVerifiedAt}
                phone={user.affiliate?.phone ?? null}
                phoneVerifiedAt={user.affiliate?.phoneVerifiedAt ?? null}
                onEmailVerified={markEmailVerified}
                onPhoneVerified={markPhoneVerified}
              />
            )}
            <form className="space-y-10" onSubmit={handleSubmit}>
              <FormSection
                title="Identity & display"
                description="How your profile appears inside the network and on campaign leaderboards."
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
                  <div className="flex-1">
                    <Field label="Display name" required>
                      <input
                        className="form-input"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Jane Cooper"
                      />
                    </Field>
                  </div>
                  <div className="flex-1">
                    <Field
                      label="Referral code"
                      description="Auto-generated for your tracking links"
                    >
                      <input
                        className="form-input"
                        value={user?.affiliate?.defaultReferralCode ?? 'PENDING'}
                        disabled
                      />
                    </Field>
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Payout preferences"
                description="Choose how you'd like us to settle commissions. We currently support UPI and bank transfers in India."
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                      <Field label="Payout method" required>
                        <select
                          className="form-input"
                          value={payoutMethod}
                          onChange={(event) => setPayoutMethod(event.target.value)}
                        >
                          <option value="">Select method</option>
                          {payoutOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {payoutMethod === 'upi' && (
                      <div className="flex-1">
                        <Field label="UPI ID" description="Example: name@bank" required>
                          <input
                            className="form-input uppercase"
                            value={upiId}
                            onChange={(event) => setUpiId(event.target.value)}
                            placeholder="name@bank"
                          />
                        </Field>
                      </div>
                    )}
                  </div>

                  {payoutMethod === 'bank_transfer' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Select bank" required>
                        <BankSelect value={bankName} onChange={setBankName} />
                      </Field>
                      <Field label="Account holder name" required>
                        <input
                          className="form-input"
                          value={bankAccountName}
                          onChange={(event) => setBankAccountName(event.target.value)}
                          placeholder="Jane Cooper"
                        />
                      </Field>
                      <Field label="Account number" required>
                        <input
                          className="form-input"
                          value={bankAccountNumber}
                          onChange={(event) => setBankAccountNumber(event.target.value)}
                          placeholder="00123456789"
                        />
                      </Field>
                      <Field label="IFSC code" required>
                        <input
                          className="form-input uppercase"
                          value={bankIfsc}
                          onChange={(event) => setBankIfsc(event.target.value.toUpperCase())}
                          placeholder="SBIN0000123"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </FormSection>

              <FormSection
                title="Compliance"
                description="PAN and Aadhaar help us comply with payout regulations."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="PAN" description="Permanent Account Number for Indian residents" required>
                    <input
                      className="form-input uppercase tracking-widest"
                      value={panNumber}
                      onChange={(event) => setPanNumber(event.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      required
                    />
                  </Field>
                  <Field label="Aadhaar number" description="12-digit UIDAI number" required>
                    <input
                      className="form-input tracking-widest"
                      value={aadhaarNumber}
                      onChange={(event) =>
                        setAadhaarNumber(event.target.value.replace(/[^0-9]/g, ''))
                      }
                      maxLength={12}
                      placeholder="123412341234"
                    />
                  </Field>
                  <Field label="PAN document" description="Upload a clear image of your PAN card" required>
                    <DocumentUploadField
                      value={panImageUrl}
                      onChange={setPanImageUrl}
                      placeholder="https://files.example.com/pan.jpg"
                      kind="pan"
                    />
                  </Field>
                  <Field label="Aadhaar front" description="Front image of Aadhaar card" required>
                    <DocumentUploadField
                      value={aadhaarFrontUrl}
                      onChange={setAadhaarFrontUrl}
                      placeholder="https://files.example.com/aadhaar-front.jpg"
                      kind="aadhaar-front"
                    />
                  </Field>
                  <Field label="Aadhaar back" description="Back image of Aadhaar card" required>
                    <DocumentUploadField
                      value={aadhaarBackUrl}
                      onChange={setAadhaarBackUrl}
                      placeholder="https://files.example.com/aadhaar-back.jpg"
                      kind="aadhaar-back"
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection
                title="Notifications"
                description="Stay in the loop about new drops, coupon approvals, and payout reminders."
              >
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-200">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(event) => setMarketingOptIn(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span>
                      Email me about new campaigns, coupon approvals, payout milestones, and
                      compliance reminders.
                    </span>
                  </label>
                </div>
              </FormSection>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'SavingΓÇª' : 'Submit for review'}
                </button>
                <button
                  type="button"
                  onClick={() => router.replace('/dashboard')}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="space-y-4 rounded-[32px] border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-100 p-6 shadow-lg dark:border-slate-800/70 dark:from-slate-900/60 dark:via-slate-900/70 dark:to-slate-950/60">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand">Checklist</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              What we review
            </h2>
            <p className="mt-1 text-sm text-muted">
              Align with RBI guidelines to unlock payouts faster. All fields are encrypted and
              stored securely.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-200">
            {[
              'Valid display name & referral code',
              'Payout method proof (UPI or bank)',
              'PAN (optional but recommended for invoices)',
              'Notification preference saved',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 dark:bg-slate-900/70"
              >
                <span className="mt-0.5 h-2 w-2 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400">
            Need help? Email{' '}
            <a href="mailto:affiliates@starshield.io" className="text-brand underline">
              affiliates@starshield.io
            </a>{' '}
            and weΓÇÖll guide you through onboarding.
          </div>
        </aside>
      </div>
    </div>
  );
}

type ContactVerificationSectionProps = {
  email?: string | null;
  emailVerifiedAt?: string | null;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  onEmailVerified: (verifiedAt: string) => void;
  onPhoneVerified: (verifiedAt: string) => void;
};

function ContactVerificationSection({
  email,
  emailVerifiedAt,
  phone,
  phoneVerifiedAt,
  onEmailVerified,
  onPhoneVerified,
}: ContactVerificationSectionProps) {
  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800/70 dark:bg-slate-950/30">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand">Verification</p>
        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
          Verify your contact details
        </p>
        <p className="text-xs text-muted">
          Email and phone need a quick OTP check before we can unlock tracking links and payouts.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ContactVerificationCard
          type="email"
          label="Email"
          value={email}
          verifiedAt={emailVerifiedAt}
          onVerified={onEmailVerified}
        />
        <ContactVerificationCard
          type="phone"
          label="Phone"
          value={phone}
          verifiedAt={phoneVerifiedAt}
          onVerified={onPhoneVerified}
        />
      </div>
    </div>
  );
}

type ContactVerificationCardProps = {
  type: 'email' | 'phone';
  label: string;
  value?: string | null;
  verifiedAt?: string | null;
  onVerified: (verifiedAt: string) => void;
};

function ContactVerificationCard({
  type,
  label,
  value,
  verifiedAt,
  onVerified,
}: ContactVerificationCardProps) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (verifiedAt) {
      setCode('');
      setOtpSent(false);
      setCooldown(0);
    }
  }, [verifiedAt]);

  const isVerified = Boolean(verifiedAt);
  const normalizedValue = value?.trim() ?? '';
  const hasValue = Boolean(normalizedValue);

  const handleSend = async () => {
    if (!hasValue || sending) {
      if (!hasValue) {
        toast.error(
          type === 'phone'
            ? 'Add a phone number during onboarding or contact support to update it.'
            : 'Email missing from your profile. Please reach out to support.'
        );
      }
      return;
    }

    setSending(true);
    try {
      const response = await authApi.sendVerification({
        type,
        email: type === 'email' ? normalizedValue : undefined,
        phone: type === 'phone' ? normalizedValue : undefined,
      });

      if (response.alreadyVerified) {
        toast.success(`${label} already verified.`);
        if (!isVerified) {
          onVerified(new Date().toISOString());
        }
        return;
      }

      if (response.delivered) {
        toast.success(`OTP sent to your ${label.toLowerCase()}.`);
        setOtpSent(true);
        setCooldown(45);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send OTP right now.';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!hasValue || verifying) {
      return;
    }
    const trimmedCode = code.trim();
    if (!/^\d{4,8}$/.test(trimmedCode)) {
      toast.error('Enter the 4-8 digit code we sent.');
      return;
    }

    setVerifying(true);
    try {
      const response = await authApi.verifyContact({
        type,
        code: trimmedCode,
        email: type === 'email' ? normalizedValue : undefined,
        phone: type === 'phone' ? normalizedValue : undefined,
      });

      if (response.verified) {
        toast.success(`${label} verified successfully.`);
        onVerified(new Date().toISOString());
        setCode('');
        setOtpSent(false);
        setCooldown(0);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid or expired OTP.';
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const statusLabel = isVerified ? 'Verified' : hasValue ? 'Action needed' : 'Missing';
  const statusClasses = isVerified
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-50 dark:ring-emerald-500/40'
    : hasValue
      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-50 dark:ring-amber-500/40'
      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/30 dark:text-slate-200">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${statusClasses}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            {value ?? 'Not provided'}
          </p>
        </div>
        {isVerified && verifiedAt && (
          <p className="text-xs text-muted">Verified on {formatVerificationDate(verifiedAt)}.</p>
        )}
        {!hasValue && (
          <p className="text-xs text-muted">
            Contact support if you need to update your {label.toLowerCase()} on file.
          </p>
        )}
        {!isVerified && hasValue && (
          <p className="text-xs text-muted">
            Enter the OTP we send to confirm your {label.toLowerCase()} identity.
          </p>
        )}
      </div>

      {!isVerified && hasValue && (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || cooldown > 0}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'Sending∩┐╜?∩┐╜' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
            </button>
            <input
              className="form-input flex-1 text-base"
              placeholder="Enter code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              maxLength={8}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
          <button
            type="button"
            onClick={handleVerify}
            disabled={!code || verifying}
            className="inline-flex w-full items-center justify-center rounded-full border border-brand px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? 'Verifying∩┐╜?∩┐╜' : 'Verify code'}
          </button>
          {otpSent && (
            <p className="text-xs text-brand">
              OTP sent. Codes expire in a few minutes, so verify soon.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  description,
  required,
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
      <span className="font-semibold leading-tight text-slate-900 dark:text-white">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      {description && <p className="text-xs text-muted">{description}</p>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function DocumentUploadField({
  value,
  onChange,
  kind,
}: {
  value: string;
  onChange: (next: string) => void;
  kind: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    setUploading(true);
    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? 'Upload failed. Try again.');
      }
      const payload = (await response.json()) as { url: string };
      onChange(payload.url);
      toast.success('Document uploaded successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload document.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleUploadClick}
        disabled={uploading}
        className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
      >
        {uploading ? 'Uploading…' : value ? 'Replace upload' : 'Upload file'}
      </button>
      {value ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-xs dark:border-slate-700/70 dark:bg-slate-900/60">
          <p className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Preview</p>
          <div className="flex flex-col gap-2">
            {/(png|jpg|jpeg|webp)$/i.test(value) ? (
              <img
                src={value}
                alt="Uploaded document"
                className="max-h-48 rounded-xl object-cover"
              />
            ) : (
              <p className="text-muted">File uploaded. Open it to review.</p>
            )}
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10 dark:border-slate-700"
            >
              Open in new tab
            </a>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">No document uploaded yet.</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function isValidPan(value: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase());
}

function isValidAadhaar(value: string) {
  return /^\d{12}$/.test(value);
}

function isValidUrl(value: string) {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function formatVerificationDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

function BankSelect({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bankOptions;
    return bankOptions.filter(
      (option) => option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, BankOption[]>>((groups, option) => {
      if (!groups[option.category]) {
        groups[option.category] = [];
      }
      groups[option.category].push(option);
      return groups;
    }, {});
  }, [filtered]);

  const selectedLabel = bankOptions.find((option) => option.value === value)?.label;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="form-input flex items-center justify-between text-left"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{selectedLabel ?? 'Choose a bank'}</span>
        <svg
          className="h-4 w-4 text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900/95">
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <input
              ref={inputRef}
              className="form-input"
              placeholder="Search bank name or IFSC"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto px-2 py-2 text-sm text-slate-700 dark:text-slate-200">
            {Object.entries(grouped).map(([category, options]) =>
              options.length ? (
                <div key={category} className="mb-3 last:mb-0">
                  <p className="px-2 text-[11px] uppercase tracking-wide text-slate-400">
                    {category}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {options.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                            setQuery('');
                          }}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
            {!filtered.length && (
              <p className="py-6 text-center text-xs text-muted">No banks match your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
