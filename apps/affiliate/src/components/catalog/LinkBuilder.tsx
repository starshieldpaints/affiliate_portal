'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth-store';
import { linksApi } from '../../lib/api-client';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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
        onAction={() => router.push('/settings/profile')}
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
        onAction={() => router.push('/settings/profile')}
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
        onAction={() => router.push('/settings/profile')}
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
        onAction={() => router.push('/settings/profile')}
      />
    );
  }

  const defaultAffiliateCode = affiliateProfile?.defaultReferralCode ?? '';
  const defaultCampaign = useMemo(() => slugify(product.name), [product.name]);

  const [affiliateCode, setAffiliateCode] = useState(defaultAffiliateCode);
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('social');
  const [utmCampaign, setUtmCampaign] = useState(defaultCampaign);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewCopying, setIsPreviewCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    setAffiliateCode(defaultAffiliateCode);
  }, [defaultAffiliateCode]);

  useEffect(() => {
    setUtmCampaign(defaultCampaign);
  }, [defaultCampaign]);

  useEffect(() => {
    setGeneratedLink('');
  }, [affiliateCode, utmSource, utmMedium, utmCampaign, product.id, product.landingUrl]);

  const createLink = async () => {
    if (!affiliateCode.trim()) {
      throw new Error('Enter your affiliate code');
    }
    setIsGenerating(true);
    try {
      const result = await linksApi.create({
        productId: product.id,
        productSku: product.sku,
        landingUrl: product.landingUrl,
        referralCode: affiliateCode.trim(),
        utmSource: utmSource.trim() || undefined,
        utmMedium: utmMedium.trim() || undefined,
        utmCampaign: utmCampaign.trim() || undefined
      });
      setGeneratedLink(result.shortUrl);
      return result.shortUrl;
    } finally {
      setIsGenerating(false);
    }
  };

  const ensureLink = async () => {
    if (generatedLink) {
      return generatedLink;
    }
    return createLink();
  };

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const link = await ensureLink();
      if (canUseWebShare) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} from StarShield.`,
          url: link
        });
      } else {
        await copyToClipboard(link);
        toast.success('Link copied. Paste it into any app to share.');
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Unable to share this link right now.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePreviewCopy = async () => {
    if (isPreviewCopying) {
      return;
    }
    try {
      setIsPreviewCopying(true);
      const link = await ensureLink();
      await copyToClipboard(link);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to copy link.');
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
        disabled={!affiliateCode.trim() || isPreviewCopying}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left font-mono text-[11px] text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200"
      >
        <span className="block flex-1 whitespace-nowrap text-ellipsis overflow-hidden">
          {generatedLink
            ? generatedLink
            : isGenerating
            ? 'Creating your tracking link...'
            : 'Enter your code to generate the link'}
        </span>
        {generatedLink && !isGenerating && (
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
          disabled={!affiliateCode.trim() || isSharing}
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
  actionHref,
  onAction
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-80">{description}</p>
      <button
        type="button"
        onClick={onAction ?? (() => navigateTo(actionHref))}
        className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function navigateTo(href: string) {
  if (typeof window !== 'undefined') {
    window.location.href = href;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
