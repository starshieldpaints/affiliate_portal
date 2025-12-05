// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { Copy, Share2, Download, AlertTriangle, Check, Loader2, Link as LinkIcon, AlertCircle, Wand2 } from 'lucide-react';
// import { toast } from 'sonner';
// import { useAuthStore } from '../../store/auth-store';
// import { linksApi } from '../../lib/api-client';
// import { useRouter } from 'next/navigation';

// type LinkBuilderProps = {
//   product: {
//     id: string;
//     name: string;
//     sku: string;
//     landingUrl: string;
//   };
//   downloadUrl?: string;
// };

// export function LinkBuilder({ product, downloadUrl }: LinkBuilderProps) {
//   const user = useAuthStore((state) => state.user);
//   const router = useRouter();

//   // Auth Checks
//   const affiliateProfile = user?.affiliate;
//   const emailVerified = Boolean(user?.emailVerifiedAt);
//   const hasAffiliateProfile = Boolean(affiliateProfile);
//   const payoutConfigured = Boolean(affiliateProfile?.payoutMethod);
//   const phoneReminderNeeded = !affiliateProfile?.phoneVerifiedAt;

//   // --- LOGIC: BLOCKERS ---
//   if (!emailVerified) {
//     return (
//       <RequirementCard
//         title="Verify your email"
//         description="Please confirm your email address before generating tracking links."
//         actionLabel="Review account"
//         onAction={() => router.push('/settings/profile')}
//         type="warning"
//       />
//     );
//   }

//   if (!hasAffiliateProfile) {
//     return (
//       <RequirementCard
//         title="Join the program"
//         description="Create your affiliate profile to start generating tracking links."
//         actionLabel="Create profile"
//         onAction={() => router.push('/settings/profile')}
//         type="info"
//       />
//     );
//   }

//   if (!payoutConfigured) {
//     return (
//       <RequirementCard
//         title="Setup payouts"
//         description="Add payout details to ensure you get paid before generating links."
//         actionLabel="Add details"
//         onAction={() => router.push('/settings/profile')}
//         type="alert"
//       />
//     );
//   }

//   // --- STATE & DEFAULTS ---
//   const defaultAffiliateCode = affiliateProfile?.defaultReferralCode ?? '';

//   // 1. Generate Unique Code (BaseCode + ProductSlug)
//   // This dynamically updates when the parent passes a new product/variant prop
//   const suggestedCode = useMemo(() => {
//     if (!defaultAffiliateCode) return '';
//     // Example: BASE-CODE + "-PRODUCT-SKU"
//     const suffix = slugify(product.sku || product.name).toUpperCase();
//     // Prevent double hyphens if base code ends with one
//     return `${defaultAffiliateCode}-${suffix}`.replace(/--+/g, '-');
//   }, [defaultAffiliateCode, product.sku, product.name]);

//   const defaultCampaign = useMemo(() => slugify(product.name), [product.name]);

//   // Initialize state
//   const [affiliateCode, setAffiliateCode] = useState(suggestedCode);
//   const [utmSource, setUtmSource] = useState('instagram');
//   const [utmMedium, setUtmMedium] = useState('social');
//   const [utmCampaign, setUtmCampaign] = useState(defaultCampaign);

//   const [generatedLink, setGeneratedLink] = useState('');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isPreviewCopying, setIsPreviewCopying] = useState(false);
//   const [isSharing, setIsSharing] = useState(false);
//   const [nativeShareLikely, setNativeShareLikely] = useState(false);

//   // --- EFFECTS ---

//   // Update code if the suggested code changes (e.g. User selected a different variant)
//   useEffect(() => {
//     setAffiliateCode(suggestedCode);
//   }, [suggestedCode]);

//   // Update campaign if product name changes
//   useEffect(() => {
//     setUtmCampaign(defaultCampaign);
//   }, [defaultCampaign]);

//   // Reset generated link if any input changes
//   useEffect(() => {
//     setGeneratedLink('');
//   }, [affiliateCode, utmSource, utmMedium, utmCampaign, product.id, product.landingUrl]);

//   useEffect(() => {
//     setNativeShareLikely(prefersNativeShare());
//   }, []);

//   // --- ACTIONS ---
//   const createLink = async () => {
//     if (!affiliateCode.trim()) throw new Error('Enter your affiliate code');

//     setIsGenerating(true);
//     try {
//       const result = await linksApi.create({
//         productId: product.id,
//         productSku: product.sku,
//         landingUrl: product.landingUrl,
//         referralCode: affiliateCode.trim(),
//         utmSource: utmSource.trim() || undefined,
//         utmMedium: utmMedium.trim() || undefined,
//         utmCampaign: utmCampaign.trim() || undefined
//       });
//       setGeneratedLink(result.shortUrl);
//       return result.shortUrl;
//     } catch (err: any) {
//       // Handle specific duplicate error gracefully
//       if (err.message?.includes('unavailable')) {
//         toast.error(`Code '${affiliateCode}' is taken. Try adding a suffix like '-1'.`);
//       } else {
//         throw err;
//       }
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const ensureLink = async () => {
//     if (generatedLink) return generatedLink;
//     return createLink();
//   };

//   const copyToClipboard = async (value: string) => {
//     if (!value) return;
//     await navigator.clipboard.writeText(value);
//   };

//   const handleShare = async () => {
//     if (isSharing) return;
//     try {
//       setIsSharing(true);
//       const link = await ensureLink();
//       if (!link) return; // Stop if creation failed

//       await copyToClipboard(link);

//       const shareSupported = canSharePayload(link) && nativeShareLikely;

//       if (shareSupported) {
//         toast.info('Opening share options...');
//         await navigator.share({
//           title: product.name,
//           text: `Check out ${product.name}`,
//           url: link
//         });
//       } else {
//         toast.success('Link copied to clipboard');
//       }
//     } catch (error) {
//       if ((error as any)?.name !== 'AbortError') {
//         const msg = error instanceof Error ? error.message : 'Share failed';
//         toast.error(msg);
//       }
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   const handlePreviewCopy = async () => {
//     if (isPreviewCopying) return;
//     try {
//       setIsPreviewCopying(true);
//       const link = await ensureLink();
//       if (!link) return; // Stop if creation failed

//       await copyToClipboard(link);
//       toast.success('Copied to clipboard');
//     } catch (error) {
//       // Error handled in createLink
//     } finally {
//       setIsPreviewCopying(false);
//     }
//   };

//   // --- RENDER ---
//   return (
//     <div className="space-y-6">

//       {/* 1. Header */}
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h3 className="text-xs font-bold uppercase tracking-widest text-brand">
//             Link Generator
//           </h3>
//           <p className="mt-1 text-sm text-slate-500">
//             Configure your tracking parameters below.
//           </p>
//         </div>
//         {/* Product/Variant Badge */}
//         <div className="hidden sm:inline-flex max-w-[150px] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
//           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//           <span className="truncate">{product.sku || 'Product'}</span>
//         </div>
//       </div>

//       {/* 2. Notification / Warnings */}
//       {phoneReminderNeeded && (
//         <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
//           <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
//           <div className="text-xs leading-relaxed">
//             <p className="font-bold">Verify your phone number</p>
//             <p className="opacity-90 mt-0.5">
//               Add your phone in profile settings to speed up approvals. You can still generate links for now.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* 3. Inputs Grid */}
//       <div className="grid gap-5 sm:grid-cols-2">
//         <Field
//           label="Affiliate Code"
//           value={affiliateCode}
//           onChange={(val) => setAffiliateCode(val.toUpperCase())}
//           placeholder="CODE"
//           hint="Required"
//           icon={<Check className="h-3 w-3 text-emerald-500" />}
//         />
//         <Field
//           label="UTM Source"
//           value={utmSource}
//           onChange={setUtmSource}
//           placeholder="instagram"
//           hint="Optional"
//         />
//         <Field
//           label="UTM Medium"
//           value={utmMedium}
//           onChange={setUtmMedium}
//           placeholder="social"
//           hint="Optional"
//         />
//         <Field
//           label="UTM Campaign"
//           value={utmCampaign}
//           onChange={setUtmCampaign}
//           placeholder="summer-sale"
//           hint="Optional"
//         />
//       </div>

//       {/* 4. Link Action Area */}
//       <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
//         <div className="border-b border-slate-200 bg-white/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
//           <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
//             Generated Link
//           </h4>
//         </div>

//         <div className="p-4">
//           <div className="flex flex-col gap-3 sm:flex-row">
//             {/* Input with Icon */}
//             <div className="relative flex-1">
//               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
//                 {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
//               </div>
//               <input
//                 readOnly
//                 value={generatedLink || 'Click create or copy to generate...'}
//                 className={`w-full truncate rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none dark:border-slate-700 dark:bg-slate-950 ${generatedLink ? 'text-brand dark:text-brand-foreground' : 'text-slate-400 italic'}`}
//               />
//             </div>

//             {/* Desktop Actions */}
//             <div className="flex gap-2">
//               <button
//                 onClick={handlePreviewCopy}
//                 disabled={!affiliateCode.trim() || isPreviewCopying}
//                 className="flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
//               >
//                 {isPreviewCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : (generatedLink ? <Copy className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />)}
//                 {generatedLink ? 'Copy' : 'Create'}
//               </button>

//               <button
//                 onClick={handleShare}
//                 disabled={!affiliateCode.trim() || isSharing}
//                 className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
//                 title="Share Link"
//               >
//                 <Share2 className="h-4 w-4" />
//               </button>

//               {downloadUrl && (
//                 <a
//                   href={downloadUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
//                   title="Download Creative Assets"
//                 >
//                   <Download className="h-4 w-4" />
//                 </a>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- SUB-COMPONENTS ---

// function Field({
//   label,
//   value,
//   placeholder,
//   onChange,
//   hint,
//   icon
// }: {
//   label: string;
//   value: string;
//   placeholder?: string;
//   onChange: (val: string) => void;
//   hint?: string;
//   icon?: React.ReactNode;
// }) {
//   return (
//     <label className="flex flex-col gap-1.5 group">
//       <div className="flex items-center justify-between">
//         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-brand dark:text-slate-400">{label}</span>
//         {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
//       </div>
//       <div className="relative">
//         <input
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           placeholder={placeholder}
//           className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition-all focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
//         />
//         {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</div>}
//       </div>
//     </label>
//   );
// }

// function RequirementCard({
//   title,
//   description,
//   actionLabel,
//   onAction,
//   type = 'info'
// }: {
//   title: string;
//   description: string;
//   actionLabel: string;
//   onAction: () => void;
//   type?: 'warning' | 'alert' | 'info';
// }) {
//   const styles = {
//     warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200',
//     alert: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200',
//     info: 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
//   };

//   const Icons = {
//     warning: AlertTriangle,
//     alert: AlertCircle,
//     info: AlertCircle
//   };

//   const Icon = Icons[type];

//   return (
//     <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm ${styles[type]}`}>
//       <div className="flex items-start gap-3">
//         <div className="mt-0.5 rounded-full bg-white/20 p-1.5 shrink-0">
//           <Icon className="h-5 w-5" />
//         </div>
//         <div>
//           <p className="font-bold text-sm">{title}</p>
//           <p className="mt-1 text-xs opacity-90 leading-relaxed">{description}</p>
//         </div>
//       </div>
//       <button
//         type="button"
//         onClick={onAction}
//         className="shrink-0 self-start sm:self-center rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 hover:shadow-md dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
//       >
//         {actionLabel}
//       </button>
//     </div>
//   );
// }



// function slugify(value: string) {
//   return value
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '')
//     .slice(0, 32);
// }

// const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

// const canSharePayload = (link: string) => {
//   if (!canUseWebShare) return false;
//   if (typeof navigator.canShare === 'function') {
//     try {
//       return navigator.canShare({ url: link });
//     } catch {
//       return false;
//     }
//   }
//   return true;
// };

// const prefersNativeShare = () => {
//   if (!canUseWebShare) return false;
//   const touchPoints =
//     (typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number'
//       ? navigator.maxTouchPoints
//       : 0) || 0;
//   return touchPoints > 0;
// };
































// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { Copy, Share2, Download, AlertTriangle, Check, Loader2, Link as LinkIcon, AlertCircle, Wand2 } from 'lucide-react';
// import { toast } from 'sonner';
// import { useAuthStore } from '../../store/auth-store';
// import { linksApi } from '../../lib/api-client';
// import { useRouter } from 'next/navigation';

// type LinkBuilderProps = {
//   product: {
//     id: string;
//     name: string;
//     sku: string;
//     landingUrl: string;
//   };
//   downloadUrl?: string;
// };

// export function LinkBuilder({ product, downloadUrl }: LinkBuilderProps) {
//   const user = useAuthStore((state) => state.user);
//   const router = useRouter();

//   const affiliateProfile = user?.affiliate;
//   const emailVerified = Boolean(user?.emailVerifiedAt);
//   const hasAffiliateProfile = Boolean(affiliateProfile);
//   const payoutConfigured = Boolean(affiliateProfile?.payoutMethod);
//   const phoneReminderNeeded = !affiliateProfile?.phoneVerifiedAt;

//   // --- BLOCKERS ---
//   if (!emailVerified) {
//     return <RequirementCard title="Verify your email" description="Please confirm your email address before generating tracking links." actionLabel="Review account" onAction={() => router.push('/settings/profile')} type="warning" />;
//   }
//   if (!hasAffiliateProfile) {
//     return <RequirementCard title="Join the program" description="Create your affiliate profile to start generating tracking links." actionLabel="Create profile" onAction={() => router.push('/settings/profile')} type="info" />;
//   }
//   if (!payoutConfigured) {
//     return <RequirementCard title="Setup payouts" description="Add payout details to ensure you get paid before generating links." actionLabel="Add details" onAction={() => router.push('/settings/profile')} type="alert" />;
//   }

//   // --- STATE ---
//   const defaultAffiliateCode = affiliateProfile?.defaultReferralCode ?? '';

//   const suggestedCode = useMemo(() => {
//     if (!defaultAffiliateCode) return '';
//     const suffix = slugify(product.sku || product.name).toUpperCase();
//     return `${defaultAffiliateCode}-${suffix}`.replace(/--+/g, '-');
//   }, [defaultAffiliateCode, product.sku, product.name]);

//   const defaultCampaign = useMemo(() => slugify(product.name), [product.name]);

//   const [affiliateCode, setAffiliateCode] = useState(suggestedCode);
//   const [utmSource, setUtmSource] = useState('instagram');
//   const [utmMedium, setUtmMedium] = useState('social');
//   const [utmCampaign, setUtmCampaign] = useState(defaultCampaign);

//   const [generatedLink, setGeneratedLink] = useState('');
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isPreviewCopying, setIsPreviewCopying] = useState(false);
//   const [isSharing, setIsSharing] = useState(false);
//   const [nativeShareLikely, setNativeShareLikely] = useState(false);

//   // --- EFFECTS ---
//   useEffect(() => { setAffiliateCode(suggestedCode); }, [suggestedCode]);
//   useEffect(() => { setUtmCampaign(defaultCampaign); }, [defaultCampaign]);
//   useEffect(() => { setGeneratedLink(''); }, [affiliateCode, utmSource, utmMedium, utmCampaign, product.id]);
//   useEffect(() => { setNativeShareLikely(prefersNativeShare()); }, []);

//   // --- ACTIONS ---
//   const createLink = async () => {
//     if (!affiliateCode.trim()) {
//       toast.error('Enter your affiliate code');
//       return null;
//     }

//     setIsGenerating(true);
//     try {
//       const result = await linksApi.create({
//         productId: product.id,
//         productSku: product.sku,
//         landingUrl: product.landingUrl,
//         referralCode: affiliateCode.trim(),
//         utmSource: utmSource.trim() || undefined,
//         utmMedium: utmMedium.trim() || undefined,
//         utmCampaign: utmCampaign.trim() || undefined
//       });

//       if (!result?.shortUrl) throw new Error('Invalid response from server');

//       setGeneratedLink(result.shortUrl);
//       return result.shortUrl;
//     } catch (err: any) {
//       console.error('Link Creation Failed:', err);
//       if (err.message?.includes('unavailable')) {
//         toast.error(`Code '${affiliateCode}' is taken. Try changing it.`);
//       } else {
//         toast.error(err.message || 'Failed to generate link');
//       }
//       return null;
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const ensureLink = async () => {
//     if (generatedLink) return generatedLink;
//     return await createLink();
//   };

//   const handlePreviewCopy = async () => {
//     if (isPreviewCopying || isGenerating) return; // Prevent double click

//     try {
//       setIsPreviewCopying(true);
//       const link = await ensureLink(); // This triggers the API call

//       if (!link) return; // If it returned null (error), stop here

//       await navigator.clipboard.writeText(link);
//       toast.success('Copied to clipboard');
//     } catch (error: any) {
//       console.error('Copy failed:', error);
//       toast.error('Failed to copy link');
//     } finally {
//       setIsPreviewCopying(false);
//     }
//   };

//   const handleShare = async () => {
//     if (isSharing || isGenerating) return;

//     try {
//       setIsSharing(true);
//       const link = await ensureLink();
//       if (!link) return;

//       await navigator.clipboard.writeText(link);

//       const shareSupported = canSharePayload(link) && nativeShareLikely;

//       if (shareSupported) {
//         toast.info('Opening share options...');
//         await navigator.share({
//           title: product.name,
//           text: `Check out ${product.name}`,
//           url: link
//         });
//       } else {
//         toast.success('Link copied to clipboard');
//       }
//     } catch (error: any) {
//       if (error?.name !== 'AbortError') {
//         toast.error(error.message || 'Share failed');
//       }
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   // --- RENDER ---
//   return (
//     <div className="space-y-6">

//       {phoneReminderNeeded && (
//         <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
//           <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
//           <div className="text-xs leading-relaxed">
//             <p className="font-bold">Verify your phone number</p>
//             <p className="opacity-90 mt-0.5">Add your phone in profile settings to speed up approvals.</p>
//           </div>
//         </div>
//       )}

//       <div className="grid gap-5 sm:grid-cols-2">
//         <Field label="Affiliate Code" value={affiliateCode} onChange={(val) => setAffiliateCode(val.toUpperCase())} placeholder="CODE" hint="Required" icon={<Check className="h-3 w-3 text-emerald-500" />} />
//         <Field label="UTM Source" value={utmSource} onChange={setUtmSource} placeholder="instagram" hint="Optional" />
//         <Field label="UTM Medium" value={utmMedium} onChange={setUtmMedium} placeholder="social" hint="Optional" />
//         <Field label="UTM Campaign" value={utmCampaign} onChange={setUtmCampaign} placeholder="summer-sale" hint="Optional" />
//       </div>

//       {/* Link Action Area */}
//       <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
//         <div className="border-b border-slate-200 bg-white/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
//           <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Generated Link</h4>
//         </div>

//         <div className="p-4">
//           <div className="flex flex-col gap-3 sm:flex-row">
//             <div className="relative flex-1">
//               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
//                 {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
//               </div>
//               <input
//                 readOnly
//                 value={generatedLink || 'Click create to generate...'}
//                 className={`w-full truncate rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none dark:border-slate-700 dark:bg-slate-950 ${generatedLink ? 'text-brand dark:text-brand-foreground' : 'text-slate-400 italic'}`}
//               />
//             </div>

//             <div className="flex gap-2">
//               <button
//                 type="button"
//                 onClick={handlePreviewCopy}
//                 disabled={!affiliateCode.trim() || isPreviewCopying || isGenerating}
//                 className="flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
//               >
//                 {(isPreviewCopying || isGenerating) ? <Loader2 className="h-4 w-4 animate-spin" /> : (generatedLink ? <Copy className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />)}
//                 {generatedLink ? 'Copy' : 'Create'}
//               </button>

//               <button
//                 type="button"
//                 onClick={handleShare}
//                 disabled={!affiliateCode.trim() || isSharing || isGenerating}
//                 className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
//                 title="Share Link"
//               >
//                 <Share2 className="h-4 w-4" />
//               </button>

//               {downloadUrl && (
//                 <a href={downloadUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" title="Download Assets">
//                   <Download className="h-4 w-4" />
//                 </a>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- SUB-COMPONENTS & UTILS (Same as before) ---
// function Field({ label, value, placeholder, onChange, hint, icon }: any) {
//   return (
//     <label className="flex flex-col gap-1.5 group">
//       <div className="flex items-center justify-between">
//         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-brand dark:text-slate-400">{label}</span>
//         {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
//       </div>
//       <div className="relative">
//         <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition-all focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
//         {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</div>}
//       </div>
//     </label>
//   );
// }

// function RequirementCard({ title, description, actionLabel, onAction, type = 'info' }: any) {
//   const styles: any = {
//     warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200',
//     alert: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200',
//     info: 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
//   };
//   const Icon = type === 'warning' ? AlertTriangle : AlertCircle;
//   return (
//     <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm ${styles[type]}`}>
//       <div className="flex items-start gap-3">
//         <div className="mt-0.5 rounded-full bg-white/20 p-1.5 shrink-0"><Icon className="h-5 w-5" /></div>
//         <div><p className="font-bold text-sm">{title}</p><p className="mt-1 text-xs opacity-90 leading-relaxed">{description}</p></div>
//       </div>
//       <button type="button" onClick={onAction} className="shrink-0 self-start sm:self-center rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:bg-slate-800 dark:text-white">{actionLabel}</button>
//     </div>
//   );
// }

// function slugify(value: string) {
//   return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
// }

// const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
// const canSharePayload = (link: string) => canUseWebShare && navigator.canShare?.({ url: link });
// const prefersNativeShare = () => {
//   if (!canUseWebShare) return false;
//   const touchPoints = (typeof navigator !== 'undefined' && navigator.maxTouchPoints) || 0;
//   return touchPoints > 0;
// };






































'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Copy, Share2, Download, AlertTriangle, Check,
  Loader2, Link as LinkIcon, AlertCircle, Wand2
} from 'lucide-react';
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

  // --- AUTHENTICATION CHECKS ---
  const affiliateProfile = user?.affiliate;
  const emailVerified = Boolean(user?.emailVerifiedAt);
  const hasAffiliateProfile = Boolean(affiliateProfile);
  const payoutConfigured = Boolean(affiliateProfile?.payoutMethod);
  const phoneReminderNeeded = !affiliateProfile?.phoneVerifiedAt;

  // --- BLOCKERS UI ---
  if (!emailVerified) {
    return (
      <RequirementCard
        title="Verify your email"
        description="Please confirm your email address before generating tracking links."
        actionLabel="Review account"
        onAction={() => router.push('/settings/profile')}
        type="warning"
      />
    );
  }

  if (!hasAffiliateProfile) {
    return (
      <RequirementCard
        title="Join the program"
        description="Create your affiliate profile to start generating tracking links."
        actionLabel="Create profile"
        onAction={() => router.push('/settings/profile')}
        type="info"
      />
    );
  }

  if (!payoutConfigured) {
    return (
      <RequirementCard
        title="Setup payouts"
        description="Add payout details to ensure you get paid before generating links."
        actionLabel="Add details"
        onAction={() => router.push('/settings/profile')}
        type="alert"
      />
    );
  }

  // --- SMART DEFAULTS ---
  const defaultAffiliateCode = affiliateProfile?.defaultReferralCode ?? '';

  // 1. Auto-suggest code based on the SELECTED VARIANT SKU
  const suggestedCode = useMemo(() => {
    if (!defaultAffiliateCode) return '';
    // Example: "REHAN-CODE" + "-SKU-1L"
    const suffix = slugify(product.sku || product.name).toUpperCase();
    return `${defaultAffiliateCode}-${suffix}`.replace(/--+/g, '-');
  }, [defaultAffiliateCode, product.sku, product.name]);

  const defaultCampaign = useMemo(() => slugify(product.name), [product.name]);

  // --- COMPONENT STATE ---
  const [affiliateCode, setAffiliateCode] = useState(suggestedCode);
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('social');
  const [utmCampaign, setUtmCampaign] = useState(defaultCampaign);

  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewCopying, setIsPreviewCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [nativeShareLikely, setNativeShareLikely] = useState(false);

  // --- REACTIVE EFFECTS ---

  // Update inputs when the PRODUCT/VARIANT changes
  useEffect(() => {
    setAffiliateCode(suggestedCode);
  }, [suggestedCode]);

  useEffect(() => {
    setUtmCampaign(defaultCampaign);
  }, [defaultCampaign]);

  // Clear the generated link if ANY input changes (forces user to regenerate)
  useEffect(() => {
    setGeneratedLink('');
  }, [affiliateCode, utmSource, utmMedium, utmCampaign, product.id, product.landingUrl]);

  useEffect(() => {
    setNativeShareLikely(prefersNativeShare());
  }, []);

  // --- API ACTIONS ---

  const createLink = async () => {
    if (!affiliateCode.trim()) {
      toast.error('Enter your affiliate code');
      throw new Error('Code required');
    }

    setIsGenerating(true);
    try {
      // 1. Call Backend
      const result = await linksApi.create({
        productId: product.id, // Sends the Variant ID if selected
        productSku: product.sku,
        landingUrl: product.landingUrl,
        referralCode: affiliateCode.trim(),
        utmSource: utmSource.trim() || undefined,
        utmMedium: utmMedium.trim() || undefined,
        utmCampaign: utmCampaign.trim() || undefined
      });

      // 2. Validate Response
      if (!result || !result.shortUrl) {
        throw new Error('Server returned an empty link. Check backend logs.');
      }

      // 3. Update State
      setGeneratedLink(result.shortUrl);
      return result.shortUrl;

    } catch (err: any) {
      console.error('Link Gen Error:', err);
      // Handle duplicate code error specifically
      if (err.message?.includes('unavailable') || err.response?.status === 400) {
        toast.error(`Code '${affiliateCode}' is already taken. Try adding a suffix.`);
      } else {
        toast.error('Failed to generate link. Please try again.');
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const ensureLink = async () => {
    if (generatedLink) return generatedLink;
    return await createLink();
  };

  const copyToClipboard = async (value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  // --- HANDLERS ---

  const handlePreviewCopy = async () => {
    if (isPreviewCopying || isGenerating) return;

    try {
      setIsPreviewCopying(true);
      const link = await ensureLink(); // Triggers API if needed

      if (link) {
        await copyToClipboard(link);
        toast.success('Copied to clipboard!');
      }
    } catch (error) {
      // Error toast already handled in createLink
    } finally {
      setIsPreviewCopying(false);
    }
  };

  const handleShare = async () => {
    if (isSharing || isGenerating) return;

    try {
      setIsSharing(true);
      const link = await ensureLink();
      if (!link) return;

      // Always copy to clipboard first as fallback
      await copyToClipboard(link);

      if (nativeShareLikely && canSharePayload(link)) {
        toast.info('Opening share options...');
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name}`,
          url: link
        });
      } else {
        toast.success('Link copied to clipboard');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error('Share failed');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // --- RENDER UI ---
  return (
    <div className="space-y-6">

      {/* Notification */}
      {phoneReminderNeeded && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Verify your phone number</p>
            <p className="opacity-90 mt-0.5">Add your phone in profile settings to speed up approvals.</p>
          </div>
        </div>
      )}

      {/* Inputs */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Affiliate Code"
          value={affiliateCode}
          onChange={(val) => setAffiliateCode(val.toUpperCase())}
          placeholder="CODE"
          hint="Required"
          icon={<Check className="h-3 w-3 text-emerald-500" />}
        />
        <Field
          label="UTM Source"
          value={utmSource}
          onChange={setUtmSource}
          placeholder="instagram"
          hint="Optional"
        />
        <Field
          label="UTM Medium"
          value={utmMedium}
          onChange={setUtmMedium}
          placeholder="social"
          hint="Optional"
        />
        <Field
          label="UTM Campaign"
          value={utmCampaign}
          onChange={setUtmCampaign}
          placeholder="summer-sale"
          hint="Optional"
        />
      </div>

      {/* Action Area */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="border-b border-slate-200 bg-white/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Generated Link
          </h4>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
              </div>
              <input
                readOnly
                value={generatedLink || 'Click create to generate...'}
                className={`w-full truncate rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none dark:border-slate-700 dark:bg-slate-950 ${generatedLink ? 'text-brand dark:text-brand-foreground' : 'text-slate-400 italic'}`}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePreviewCopy}
                disabled={!affiliateCode.trim() || isPreviewCopying || isGenerating}
                className="flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {(isPreviewCopying || isGenerating) ? <Loader2 className="h-4 w-4 animate-spin" /> : (generatedLink ? <Copy className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />)}
                {generatedLink ? 'Copy' : 'Create'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={!affiliateCode.trim() || isSharing || isGenerating}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Share Link"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Download Creative Assets"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Field({ label, value, placeholder, onChange, hint, icon }: any) {
  return (
    <label className="flex flex-col gap-1.5 group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-brand dark:text-slate-400">{label}</span>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition-all focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</div>}
      </div>
    </label>
  );
}

function RequirementCard({ title, description, actionLabel, onAction, type = 'info' }: any) {
  const styles: any = {
    warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200',
    alert: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200',
    info: 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  };
  const Icons: any = { warning: AlertTriangle, alert: AlertCircle, info: AlertCircle };
  const Icon = Icons[type];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-white/20 p-1.5 shrink-0"><Icon className="h-5 w-5" /></div>
        <div><p className="font-bold text-sm">{title}</p><p className="mt-1 text-xs opacity-90 leading-relaxed">{description}</p></div>
      </div>
      <button type="button" onClick={onAction} className="shrink-0 self-start sm:self-center rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:bg-slate-800 dark:text-white">{actionLabel}</button>
    </div>
  );
}

// --- UTILS ---

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
}

const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
const canSharePayload = (link: string) => canUseWebShare && navigator.canShare?.({ url: link });
const prefersNativeShare = () => {
  if (!canUseWebShare) return false;
  const touchPoints = (typeof navigator !== 'undefined' && navigator.maxTouchPoints) || 0;
  return touchPoints > 0;
};