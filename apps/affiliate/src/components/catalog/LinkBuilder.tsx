'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth-store';
import { buildAffiliateLink } from '../../utils/build-affiliate-link';

type LinkBuilderProps = {
  product: {
    id: string;
    name: string;
    sku: string;
    landingUrl: string;
  };
  downloadUrl?: string;
};

export function LinkBuilder({ product, downloadUrl }: LinkBuilderProps) {
  const user = useAuthStore((state) => state.user);
  const affiliateProfile = user?.affiliate;
  const emailVerified = Boolean(user?.emailVerifiedAt);
  const hasAffiliateProfile = Boolean(affiliateProfile);
  const hasPhone = Boolean(affiliateProfile?.phone?.trim());
  const phoneVerified = Boolean(affiliateProfile?.phoneVerifiedAt);
  const payoutConfigured = Boolean(affiliateProfile?.payoutMethod);

  if (!emailVerified) {
    return (
      <RequirementCard
        title="Verify your email"
        description="Please confirm your email address before generating tracking links."
        actionLabel="Review account"
        actionHref="/settings/profile"
      />
    );
  }

  if (!hasAffiliateProfile || !hasPhone) {
    return (
      <RequirementCard
        title="Add your phone number"
        description="We need a verified phone number on file before you can share products."
        actionLabel="Add phone"
        actionHref="/settings/profile"
      />
    );
  }

  if (!phoneVerified) {
    return (
      <RequirementCard
        title="Verify your phone"
        description="Complete phone verification to unlock link sharing and downloads."
        actionLabel="Verify phone"
        actionHref="/settings/profile"
      />
    );
  }

  if (!payoutConfigured) {
    return (
      <RequirementCard
        title="Complete your affiliate profile"
        description="Add payout details and get verified before you can generate tracking links or download creative kits."
        actionLabel="Complete profile"
        actionHref="/settings/profile"
      />
    );
  }

  const defaultAffiliateCode = affiliateProfile.defaultReferralCode ?? '';
  const defaultCampaign = useMemo(() => slugify(product.name), [product.name]);

  const [affiliateCode, setAffiliateCode] = useState(defaultAffiliateCode);
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('social');
  const [utmCampaign, setUtmCampaign] = useState(defaultCampaign);
  const [isPreviewCopying, setIsPreviewCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    setAffiliateCode(defaultAffiliateCode);
  }, [defaultAffiliateCode]);

  useEffect(() => {
    setUtmCampaign(defaultCampaign);
  }, [defaultCampaign]);

  const linkPreview = useMemo(() => {
    if (!affiliateCode.trim()) {
      return '';
    }

    try {
      return buildAffiliateLink({
        landingUrl: product.landingUrl,
        affiliateCode: affiliateCode.trim(),
        utm: {
          source: utmSource.trim() || undefined,
          medium: utmMedium.trim() || undefined,
          campaign: utmCampaign.trim() || undefined
        },
        extraParams: {
          sku: product.sku,
          product_id: product.id
        }
      });
    } catch {
      return '';
    }
  }, [affiliateCode, product.id, product.landingUrl, product.sku, utmCampaign, utmMedium, utmSource]);

  const copyToClipboard = async () => {
    if (!linkPreview) {
      throw new Error('Missing link preview');
    }
    await navigator.clipboard.writeText(linkPreview);
  };

  const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleShare = async () => {
    if (!linkPreview) {
      toast.error('Generate a link before sharing.');
      return;
    }

    if (!canUseWebShare) {
      await copyToClipboard();
      toast.success('Link copied. Paste it into any app to share.');
      return;
    }

    try {
      setIsSharing(true);
      await navigator.share({
        title: product.name,
        text: `Check out ${product.name} from StarShield.`,
        url: linkPreview
      });
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return;
      }
      console.error(error);
      await copyToClipboard();
      toast.success('Link copied. Paste it into any app to share.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePreviewCopy = async () => {
    if (!linkPreview || isPreviewCopying) {
      return;
    }
    try {
      setIsPreviewCopying(true);
      await copyToClipboard();
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error(error);
      toast.error('Unable to copy link. Please copy it manually.');
    } finally {
      setIsPreviewCopying(false);
    }
  };

  return (
    <div className="space-y-3">
      {!user?.affiliate && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">Add a referral code to generate tracking links.</p>
          <p className="mt-1 text-[11px] opacity-80">
            Complete your affiliate profile to store a default code for next time.
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Field
          label="Affiliate code"
          value={affiliateCode}
          placeholder="e.g. ALEX-ELITE"
          onChange={(value) => setAffiliateCode(value.toUpperCase())}
        />
        <Field
          label="UTM source"
          value={utmSource}
          placeholder="instagram"
          onChange={setUtmSource}
        />
        <Field
          label="UTM medium"
          value={utmMedium}
          placeholder="social"
          onChange={setUtmMedium}
        />
        <Field
          label="UTM campaign"
          value={utmCampaign}
          placeholder="product-launch"
          onChange={setUtmCampaign}
        />
      </div>

      <button
        type="button"
        onClick={handlePreviewCopy}
        disabled={!linkPreview || isPreviewCopying}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left font-mono text-[11px] text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200"
      >
        <span className="block flex-1 whitespace-nowrap text-ellipsis overflow-hidden">
          {linkPreview || 'Enter your code to preview the generated link'}
        </span>
        {linkPreview && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand">
            <Copy className="h-3 w-3" />
            {isPreviewCopying ? 'Copying…' : 'Copy'}
          </span>
        )}
      </button>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleShare}
          disabled={!linkPreview || isSharing}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
        >
          {isSharing ? 'Sharing…' : canUseWebShare ? 'Share' : 'Copy to share'}
        </button>
        <a
          href={downloadUrl ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700/70 dark:text-slate-200"
        >
          Download kit
        </a>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-normal text-slate-900 transition focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
      />
    </label>
  );
}

function RequirementCard({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-80">{description}</p>
      <a
        href={actionHref}
        className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
      >
        {actionLabel}
      </a>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
