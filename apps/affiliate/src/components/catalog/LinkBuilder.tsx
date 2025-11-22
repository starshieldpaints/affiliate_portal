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
  const payoutConfigured = Boolean(affiliateProfile?.payoutMethod);
  const phoneReminderNeeded = !affiliateProfile?.phoneVerifiedAt;

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

  if (!hasAffiliateProfile) {
    return (
      <RequirementCard
        title="Complete your affiliate profile"
        description="Add your profile details so we can generate tracking links for you."
        actionLabel="Update profile"
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
  const [nativeShareLikely, setNativeShareLikely] = useState(false);

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

  const canSharePayload = (link: string) => {
    if (!canUseWebShare) return false;
    if (typeof navigator.canShare === 'function') {
      try {
        return navigator.canShare({ url: link, title: product.name });
      } catch {
        return false;
      }
    }
    return true;
  };

  const prefersNativeShare = () => {
    if (!canUseWebShare) return false;
    const touchPoints =
      (typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number'
        ? navigator.maxTouchPoints
        : 0) || 0;
    const pointerCoarse =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
    return touchPoints > 0 || pointerCoarse;
  };

  useEffect(() => {
    setNativeShareLikely(prefersNativeShare());
  }, []);

  const handleShare = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      const link = await ensureLink();
      await copyToClipboard(link);
      const shareSupported = canSharePayload(link) && nativeShareLikely;
      if (!shareSupported) {
        toast.success('Link copied. Use paste to share.');
        return;
      }
      toast.success('Link copied. Opening share sheet...');

      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} from StarShield.`,
          url: link
        });
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
          toast.error('Share sheet could not open. Link is copied.');
        }
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Unable to share this link right now.';
      toast.error(msg);
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
    <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Share instantly</p>
          <p className="text-sm text-muted">
            Build a tracked link and grab the creative in one step.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {product.sku || 'SKU'}
        </span>
      </div>

      {phoneReminderNeeded && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">Phone verification recommended</p>
          <p className="mt-1 text-[11px] opacity-80">
            Add or verify your phone in profile settings to speed up approvals. You can still generate links without it.
          </p>
        </div>
      )}

      {!user?.affiliate && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">Add a referral code to generate tracking links.</p>
          <p className="mt-1 text-[11px] opacity-80">
            Complete your affiliate profile to store a default code for next time.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Affiliate code"
          value={affiliateCode}
          placeholder="e.g. ALEX-ELITE"
          hint="Required"
          onChange={(value) => setAffiliateCode(value.toUpperCase())}
        />
        <Field
          label="UTM source"
          value={utmSource}
          placeholder="instagram"
          hint="Optional"
          onChange={setUtmSource}
        />
        <Field
          label="UTM medium"
          value={utmMedium}
          placeholder="social"
          hint="Optional"
          onChange={setUtmMedium}
        />
        <Field
          label="UTM campaign"
          value={utmCampaign}
          placeholder="product-launch"
          hint="Optional"
          onChange={setUtmCampaign}
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/85 p-3 text-left dark:border-slate-800/60 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Link preview</p>
          {generatedLink && !isGenerating && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
              Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-mono text-slate-800 dark:bg-slate-900 dark:text-slate-100">
            {generatedLink
              ? generatedLink
              : isGenerating
                ? 'Creating your tracking link...'
                : 'Enter your code to generate the link'}
          </code>
          <button
            type="button"
            onClick={handlePreviewCopy}
            disabled={!affiliateCode.trim() || isPreviewCopying}
            className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <Copy className="h-3 w-3" />
            {isPreviewCopying ? 'Copying...' : generatedLink ? 'Copy' : 'Create'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleShare}
          disabled={!affiliateCode.trim() || isSharing}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {isSharing ? 'Sharing...' : nativeShareLikely && canUseWebShare ? 'Share' : 'Copy link'}
        </button>
        <a
          href={downloadUrl ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 dark:border-slate-700/70 dark:text-slate-200"
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
  onChange,
  hint
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-[10px] font-normal text-slate-400">{hint}</span>}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-normal text-slate-900 transition focus:border-brand focus:outline-none dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-white"
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
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-left text-sm text-slate-800 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-100">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction ?? (() => navigateTo(actionHref))}
        className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
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
