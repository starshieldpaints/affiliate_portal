// 'use client';

// import Image from 'next/image';
// import Link from 'next/link';
// import { notFound, useParams, useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import { ArrowLeft, Tag } from 'lucide-react';
// import { toast } from 'sonner';
// import { LinkBuilder } from '../../../../src/components/catalog/LinkBuilder';
// import { catalogApi } from '../../../../src/lib/api-client';
// import type { CatalogProductDetail } from '../../../../src/types/catalog';

// const PLACEHOLDER = 'https://placehold.co/800x500/png?text=StarShield+Product';

// export default function ProductDetailPage() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();
//   const [data, setData] = useState<CatalogProductDetail | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;
//     catalogApi
//       .product(id)
//       .then((payload) => {
//         if (!mounted) return;
//         setData(payload);
//         if (!payload.product) {
//           notFound();
//         }
//       })
//       .catch((error) => {
//         if (!mounted) return;
//         const msg = error instanceof Error ? error.message : 'Unable to load product';
//         toast.error(msg);
//       })
//       .finally(() => {
//         if (mounted) setLoading(false);
//       });
//     return () => {
//       mounted = false;
//     };
//   }, [id]);

//   if (!data?.product && !loading) {
//     notFound();
//   }

//   const product = data?.product;

//   return (
//     <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-10">
//       <header className="flex flex-wrap items-center justify-between gap-4">
//         <nav className="flex items-center gap-2 text-sm text-muted">
//           <Link href="/catalog" className="text-brand hover:underline">
//             Catalog
//           </Link>
//           <span aria-hidden="true">/</span>
//           {product?.category ? (
//             <>
//               <span className="truncate">{product.category.name}</span>
//               <span aria-hidden="true">/</span>
//             </>
//           ) : null}
//           <span className="font-semibold text-slate-800 dark:text-slate-100">
//             {product?.name ?? 'Product'}
//           </span>
//         </nav>
//         <button
//           type="button"
//           onClick={() => router.back()}
//           className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back
//         </button>
//       </header>

//       <section className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">
//         <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//           <div className="relative aspect-[4/3] w-full">
//             {loading ? (
//               <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800" />
//             ) : (
//               <Image
//                 src={product?.imageUrl || PLACEHOLDER}
//                 alt={product?.name ?? 'Product image'}
//                 fill
//                 className="object-cover"
//                 sizes="(max-width: 768px) 100vw, 60vw"
//                 priority
//               />
//             )}
//           </div>
//           <div className="space-y-2 p-5">
//             <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
//               {product?.name ?? 'Product'}
//             </h1>
//             <p className="text-sm text-muted">{product?.description || 'No description available.'}</p>
//             <div className="flex items-center gap-3 pt-2">
//               <span className="text-xl font-semibold text-slate-900 dark:text-emerald-100">
//                 {product ? formatPrice(product.price, product.currency) : '--'}
//               </span>
//               {product?.sku && (
//                 <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-200">
//                   <Tag className="h-3 w-3" />
//                   {product.sku}
//                 </span>
//               )}
//             </div>
//             {product?.landingUrl && (
//               <Link
//                 href={product.landingUrl}
//                 target="_blank"
//                 className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
//               >
//                 View landing page
//               </Link>
//             )}
//           </div>
//         </div>

//         <div className="space-y-6">
//           <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//             <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand">Share</h2>
//             <p className="mt-1 text-sm text-muted">
//               Generate your tracked link for this SKU. Variants below let you switch sizes before creating the link.
//             </p>
//             {product && <LinkBuilder product={product} />}
//           </div>

//           {data?.variants?.length ? (
//             <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
//                   Variants
//                 </h3>
//                 <span className="text-xs text-muted">{data.variants.length} options</span>
//               </div>
//               <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                 {data.variants.map((variant) => (
//                   <Link
//                     key={variant.id}
//                     href={`/catalog/${variant.id}`}
//                     className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900/60"
//                   >
//                     <div className="relative mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
//                       <Image
//                         src={variant.imageUrl || PLACEHOLDER}
//                         alt={variant.name}
//                         width={180}
//                         height={140}
//                         className="h-24 w-auto object-contain transition group-hover:scale-[1.03]"
//                       />
//                     </div>
//                     <p className="line-clamp-2 min-h-[44px] font-semibold leading-snug text-slate-900 dark:text-white">
//                       {variant.name}
//                     </p>
//                     <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-emerald-100">
//                       {formatPrice(variant.price, variant.currency)}
//                     </p>
//                     {variant.sku && (
//                       <p className="truncate text-[11px] uppercase tracking-wide text-slate-400">
//                         {variant.sku}
//                       </p>
//                     )}
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           ) : null}
//         </div>
//       </section>
//     </div>
//   );
// }

// function formatPrice(value: number, currency?: string) {
//   try {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: currency || 'USD',
//       maximumFractionDigits: 0
//     }).format(value);
//   } catch {
//     return `$${value.toFixed(0)}`;
//   }
// }


























// 'use client';

// import Image from 'next/image';
// import Link from 'next/link';
// import { notFound, useParams, useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import { ArrowLeft, Tag, Layers } from 'lucide-react';
// import { toast } from 'sonner';
// // Ensure this path is correct for your project
// import { LinkBuilder } from '../../../../src/components/catalog/LinkBuilder';
// import { catalogApi } from '../../../../src/lib/api-client';
// // Use the new types we defined
// import type { ProductDetailResponse, ProductVariant } from '../../../../src/types/catalog';

// const PLACEHOLDER = 'https://placehold.co/800x500/png?text=StarShield+Product';

// export default function ProductDetailPage() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();
//   const [data, setData] = useState<ProductDetailResponse | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;
//     setLoading(true);
//     catalogApi
//       .product(id)
//       .then((payload) => {
//         if (!mounted) return;
//         if (!payload || !payload.product) {
//           notFound();
//           return;
//         }
//         setData(payload);
//       })
//       .catch((error) => {
//         if (!mounted) return;
//         console.error(error);
//         toast.error('Unable to load product details');
//       })
//       .finally(() => {
//         if (mounted) setLoading(false);
//       });
//     return () => {
//       mounted = false;
//     };
//   }, [id]);

//   if (loading) {
//     return (
//       <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
//         <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand"></div>
//         <p className="mt-4 text-slate-500">Loading product details...</p>
//       </div>
//     );
//   }

//   if (!data?.product) {
//     return notFound();
//   }

//   const { product, variants } = data;

//   // Helper to get display price for a variant
//   const getVariantPrice = (v: ProductVariant) => v.promoPrice ?? v.mrp ?? 0;

//   return (
//     <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-10">

//       {/* Breadcrumb Header */}
//       <header className="flex flex-wrap items-center justify-between gap-4">
//         <nav className="flex items-center gap-2 text-sm text-muted">
//           <Link href="/catalog" className="text-brand hover:underline">
//             Catalog
//           </Link>
//           <span aria-hidden="true" className="text-slate-300">/</span>
//           {product.category ? (
//             <>
//               <span className="truncate max-w-[150px]">{product.category.name}</span>
//               <span aria-hidden="true" className="text-slate-300">/</span>
//             </>
//           ) : null}
//           <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
//             {product.name}
//           </span>
//         </nav>
//         <button
//           type="button"
//           onClick={() => router.back()}
//           className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back
//         </button>
//       </header>

//       <section className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">

//         {/* LEFT COLUMN: Image & Info */}
//         <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//           <div className="relative aspect-[4/3] w-full bg-slate-50 dark:bg-slate-900">
//             <Image
//               src={product.imageUrl || PLACEHOLDER}
//               alt={product.name}
//               fill
//               className="object-contain p-8"
//               sizes="(max-width: 768px) 100vw, 60vw"
//               priority
//             />
//           </div>
//           <div className="space-y-4 p-6 sm:p-8">
//             <div>
//               <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
//                 {product.name}
//               </h1>
//               {/* SKU Badge */}
//               {product.sku && (
//                 <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
//                   <Tag className="h-3.5 w-3.5" />
//                   {product.sku}
//                 </div>
//               )}
//             </div>

//             <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300">
//               <p>{product.description || 'No description available for this product.'}</p>
//             </div>

//             <div className="flex items-baseline gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
//               <span className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
//                 {formatPrice(product.price, product.currency)}
//               </span>
//               <span className="text-sm text-muted">base price</span>
//             </div>

//             {product.landingUrl && (
//               <a
//                 href={product.landingUrl}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
//               >
//                 View official product page
//               </a>
//             )}
//           </div>
//         </div>

//         {/* RIGHT COLUMN: Actions & Variants */}
//         <div className="space-y-6">

//           {/* Link Builder Component */}
//           <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//             <div className="mb-4">
//               <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand">Affiliate Tools</h2>
//               <p className="mt-1 text-sm text-slate-500">Generate a tracked link for this specific product configuration.</p>
//             </div>
//             <LinkBuilder product={product} />
//           </div>

//           {/* Variants Grid */}
//           {variants && variants.length > 0 && (
//             <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//               <div className="mb-4 flex items-center justify-between">
//                 <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
//                   <Layers className="h-4 w-4" /> Available Variants
//                 </h3>
//                 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
//                   {variants.length}
//                 </span>
//               </div>

//               <div className="grid gap-3 sm:grid-cols-2">
//                 {variants.map((variant) => {
//                   const isActive = variant.id === product.id; // Check if this variant IS the current page
//                   const variantPrice = getVariantPrice(variant);

//                   return (
//                     <Link
//                       key={variant.id}
//                       href={`/catalog/${variant.id}`} // Navigate to specific variant ID
//                       className={`group relative flex flex-col rounded-xl border p-3 transition-all hover:shadow-md ${isActive
//                           ? 'border-brand bg-brand/5 ring-1 ring-brand'
//                           : 'border-slate-200 bg-white hover:border-brand/50 dark:border-slate-700 dark:bg-slate-900/40'
//                         }`}
//                     >
//                       <div className="flex items-start gap-3">
//                         <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
//                           <Image
//                             src={variant.imageUrl || product.imageUrl || PLACEHOLDER}
//                             alt={variant.sku || 'Variant'}
//                             fill
//                             className="object-contain p-1"
//                           />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
//                             {variant.volume || variant.sku || 'Standard'}
//                           </p>
//                           <p className="text-xs text-slate-500 truncate mb-1">
//                             {variant.sku}
//                           </p>
//                           <p className="text-sm font-bold text-slate-900 dark:text-emerald-100">
//                             {formatPrice(variantPrice, product.currency)}
//                           </p>
//                         </div>
//                       </div>
//                     </Link>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// }

// // --- UTILS ---

// function formatPrice(value: number, currency?: string) {
//   try {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: currency || 'INR',
//       maximumFractionDigits: 0
//     }).format(value);
//   } catch {
//     return `${currency || ''} ${value}`;
//   }
// }


























// 'use client';

// import Image from 'next/image';
// import Link from 'next/link';
// import { notFound, useParams, useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import {
//   ArrowLeft, Tag, Layers, Share2, ExternalLink,
//   CheckCircle2, Box, Info
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { LinkBuilder } from '../../../../src/components/catalog/LinkBuilder';
// import { catalogApi } from '../../../../src/lib/api-client';
// import type { ProductDetailResponse, ProductVariant } from '../../../../src/types/catalog';

// const PLACEHOLDER = 'https://placehold.co/800x800/f1f5f9/94a3b8?text=No+Image';

// export default function ProductDetailPage() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();
//   const [data, setData] = useState<ProductDetailResponse | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;
//     setLoading(true);
//     catalogApi
//       .product(id)
//       .then((payload) => {
//         if (!mounted) return;
//         if (!payload || !payload.product) {
//           notFound();
//           return;
//         }
//         setData(payload);
//       })
//       .catch((error) => {
//         if (!mounted) return;
//         console.error(error);
//         toast.error('Unable to load product details');
//       })
//       .finally(() => {
//         if (mounted) setLoading(false);
//       });
//     return () => {
//       mounted = false;
//     };
//   }, [id]);

//   // --- SKELETON LOADING STATE ---
//   if (loading) {
//     return <ProductSkeleton />;
//   }

//   if (!data?.product) return notFound();

//   const { product, variants } = data;
//   const getVariantPrice = (v: ProductVariant) => v.promoPrice ?? v.mrp ?? 0;

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">

//       {/* 1. Header Navigation */}
//       <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
//         <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
//           <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
//             <button
//               onClick={() => router.back()}
//               className="mr-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//             >
//               <ArrowLeft className="h-5 w-5" />
//             </button>
//             <Link href="/catalog" className="hover:text-brand hover:underline">Catalog</Link>
//             <span>/</span>
//             {product.category && (
//               <>
//                 <span className="hidden sm:inline">{product.category.name}</span>
//                 <span className="hidden sm:inline">/</span>
//               </>
//             )}
//             <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
//               {product.name}
//             </span>
//           </nav>

//           {product.landingUrl && (
//             <a
//               href={product.landingUrl}
//               target="_blank"
//               rel="noreferrer"
//               className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand hover:text-brand/80"
//             >
//               Live Page <ExternalLink className="h-3 w-3" />
//             </a>
//           )}
//         </div>
//       </div>

//       <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
//         <div className="grid gap-12 lg:grid-cols-[1fr_400px] xl:gap-16">

//           {/* --- LEFT COLUMN: Product Details --- */}
//           <div className="space-y-10">

//             {/* Hero Image Area */}
//             <div className="group relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
//               <Image
//                 src={product.imageUrl || PLACEHOLDER}
//                 alt={product.name}
//                 fill
//                 className="object-contain p-12 transition-transform duration-700 group-hover:scale-105"
//                 sizes="(max-width: 1024px) 100vw, 50vw"
//                 priority
//               />
//               <div className="absolute top-6 left-6 flex flex-col gap-2">
//                 {product.category && (
//                   <span className="inline-flex w-fit items-center rounded-full bg-slate-100/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm dark:bg-slate-800/90 dark:text-slate-300">
//                     {product.category.name}
//                   </span>
//                 )}
//                 {product.sku && (
//                   <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-400">
//                     <Tag className="h-3 w-3" />
//                     {product.sku}
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Product Info */}
//             <div className="space-y-6">
//               <div>
//                 <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
//                   {product.name}
//                 </h1>
//                 <div className="mt-4 flex items-baseline gap-4">
//                   <p className="text-3xl font-bold text-brand">
//                     {formatPrice(product.price, product.currency)}
//                   </p>
//                   <p className="text-sm font-medium text-slate-500">Base Price</p>
//                 </div>
//               </div>

//               <div className="prose prose-slate max-w-none dark:prose-invert">
//                 <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
//                   Description
//                 </h3>
//                 <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
//                   {product.description || 'No detailed description available for this product.'}
//                 </p>
//               </div>

//               {/* Attributes Grid */}
//               <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
//                 <AttributeCard label="SKU" value={product.sku || 'N/A'} icon={Box} />
//                 <AttributeCard label="Category" value={product.category?.name || 'N/A'} icon={Layers} />
//                 <AttributeCard label="Status" value="Active" icon={CheckCircle2} tone="success" />
//               </div>
//             </div>

//             {/* Variants Section */}
//             {variants && variants.length > 0 && (
//               <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Available Variants</h3>
//                   <span className="text-xs font-medium text-slate-500">{variants.length} options</span>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                   {variants.map((variant) => {
//                     const isActive = variant.id === product.id;
//                     const price = getVariantPrice(variant);

//                     return (
//                       <Link
//                         key={variant.id}
//                         href={`/catalog/${variant.id}`}
//                         className={`relative flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${isActive
//                             ? 'border-brand bg-brand/5 ring-1 ring-brand dark:bg-brand/10'
//                             : 'border-slate-200 bg-white hover:border-brand/50 dark:border-slate-800 dark:bg-slate-900'
//                           }`}
//                       >
//                         <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
//                           <Image
//                             src={variant.imageUrl || product.imageUrl || PLACEHOLDER}
//                             alt={variant.sku || 'Variant'}
//                             fill
//                             className="object-contain p-2"
//                           />
//                         </div>
//                         <div className="min-w-0 flex-1">
//                           <div className="flex items-center justify-between">
//                             <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
//                               {variant.volume || variant.sku || 'Standard'}
//                             </p>
//                             {isActive && <CheckCircle2 className="h-4 w-4 text-brand" />}
//                           </div>
//                           <p className="mt-1 text-sm text-slate-500">
//                             {formatPrice(price, product.currency)}
//                           </p>
//                         </div>
//                       </Link>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* --- RIGHT COLUMN: Sticky Affiliate Tools --- */}
//           <div className="lg:sticky lg:top-24 h-fit space-y-6">

//             <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
//               <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
//                 <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
//                   <Share2 className="h-4 w-4 text-brand" />
//                   Affiliate Tools
//                 </h2>
//               </div>

//               <div className="p-6">
//                 <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
//                   Generate a unique tracking link for <strong>{product.name}</strong>. Earnings are tracked automatically.
//                 </p>

//                 {/* Link Builder Component */}
//                 <div className="rounded-xl bg-slate-50 p-1 dark:bg-slate-950/50">
//                   <LinkBuilder product={product} />
//                 </div>

//                 <div className="mt-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">
//                   <Info className="h-4 w-4 shrink-0 mt-0.5" />
//                   <p>
//                     Commissions are calculated on the <strong>Net Sale Price</strong> excluding taxes and shipping.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Helper Card */}
//             <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
//               <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Need help promoting?</h3>
//               <p className="mt-2 text-sm text-slate-500">
//                 Check the <Link href="/resources" className="text-brand hover:underline">Marketing Resources</Link> page for banners and copy templates.
//               </p>
//             </div>

//           </div>

//         </div>
//       </main>
//     </div>
//   );
// }

// // --- SUB-COMPONENTS ---

// function AttributeCard({ label, value, icon: Icon, tone }: any) {
//   const handleCopy = () => {
//     if (!value) return;
//     navigator.clipboard.writeText(String(value));
//     toast.success(`${label} copied to clipboard`);
//   };

//   return (
//     <button
//       type="button"
//       onClick={handleCopy}
//       className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-brand/50 hover:shadow-sm active:scale-95 dark:border-slate-800 dark:bg-slate-900"
//       title="Click to copy"
//     >
//       <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-slate-200 dark:group-hover:bg-slate-700 ${tone === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
//         }`}>
//         <Icon className="h-5 w-5" />
//       </div>

//       <div className="min-w-0 flex-1">
//         <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
//         <p className={`truncate text-sm font-semibold ${tone === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
//           {value}
//         </p>
//       </div>
//     </button>
//   );
// }

// function ProductSkeleton() {
//   return (
//     <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
//       <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
//         <div className="space-y-8">
//           <div className="aspect-square w-full animate-pulse rounded-[2.5rem] bg-slate-200 dark:bg-slate-800" />
//           <div className="space-y-4">
//             <div className="h-10 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
//             <div className="h-6 w-1/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
//             <div className="space-y-2 pt-4">
//               <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
//               <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
//               <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
//             </div>
//           </div>
//         </div>
//         <div className="hidden lg:block space-y-6">
//           <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- UTILS ---
// function formatPrice(value: number, currency?: string) {
//   try {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: currency || 'INR',
//       maximumFractionDigits: 0
//     }).format(value);
//   } catch {
//     return `${currency || ''} ${value}`;
//   }
// }


















'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Tag,
  Layers,
  Share2,
  ExternalLink,
  CheckCircle2,
  Box,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { LinkBuilder } from '../../../../src/components/catalog/LinkBuilder';
import { catalogApi } from '../../../../src/lib/api-client';
import type { ProductDetailResponse, ProductVariant } from '../../../../src/types/catalog';

const PLACEHOLDER = 'https://placehold.co/800x800/f1f5f9/94a3b8?text=No+Image';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>(); // This ID could be Product ID OR Variant ID
  const router = useRouter();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    catalogApi
      .product(id)
      .then((payload) => {
        if (!mounted) return;
        if (!payload || !payload.product) {
          notFound();
          return;
        }
        setData(payload);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error(error);
        toast.error('Unable to load product details');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  // --- SKELETON LOADING STATE ---
  if (loading) {
    return <ProductSkeleton />;
  }

  if (!data?.product) return notFound();

  const { product, variants } = data;

  // --- LOGIC: DETERMINE ACTIVE VARIANT ---
  // Check if the current URL ID matches a specific variant
  const selectedVariant = variants?.find((v) => v.id === id);

  // Decide what to display: Specific Variant Data OR Default Product Data
  const displayPrice = selectedVariant
    ? (selectedVariant.promoPrice ?? selectedVariant.mrp ?? 0)
    : product.price;

  const displayImage = selectedVariant?.imageUrl || product.imageUrl || PLACEHOLDER;
  const displaySku = selectedVariant?.sku || product.sku;
  const displayVolume = selectedVariant?.volume; // e.g. "1 L"

  // Helper for list pricing
  const getVariantPrice = (v: ProductVariant) => v.promoPrice ?? v.mrp ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* 1. Header Navigation */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <button
              onClick={() => router.back()}
              className="mr-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Link href="/catalog" className="hover:text-brand hover:underline">
              Catalog
            </Link>
            <span>/</span>
            {product.category && (
              <>
                <span className="hidden sm:inline">{product.category.name}</span>
                <span className="hidden sm:inline">/</span>
              </>
            )}
            <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
              {product.name}
            </span>
          </nav>

          {product.landingUrl && (
            <a
              href={product.landingUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand hover:text-brand/80"
            >
              Live Page <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_400px] xl:gap-16">
          {/* --- LEFT COLUMN: Product Details --- */}
          <div className="space-y-10">
            {/* Hero Image Area */}
            <div className="group relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-contain p-12 transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {product.category && (
                  <span className="inline-flex w-fit items-center rounded-full bg-slate-100/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm dark:bg-slate-800/90 dark:text-slate-300">
                    {product.category.name}
                  </span>
                )}
                {displaySku && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-400">
                    <Tag className="h-3 w-3" />
                    {displaySku}
                  </span>
                )}
                {/* Show Selected Volume Badge */}
                {displayVolume && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand shadow-sm backdrop-blur-sm">
                    {displayVolume}
                  </span>
                )}
              </div>
            </div>

            {/* Product Info (Dynamic based on Selection) */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  {product.name} {displayVolume && <span className="text-slate-400 font-medium text-2xl ml-2">- {displayVolume}</span>}
                </h1>
                <div className="mt-4 flex items-baseline gap-4">
                  <p className="text-4xl font-bold text-brand">
                    {formatPrice(displayPrice, product.currency)}
                  </p>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {selectedVariant ? 'Your Price' : 'Starting From'}
                  </p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none dark:prose-invert">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                  Description
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {product.description || 'No detailed description available for this product.'}
                </p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <AttributeCard label="SKU" value={displaySku || 'N/A'} icon={Box} />
                <AttributeCard
                  label="Category"
                  value={product.category?.name || 'N/A'}
                  icon={Layers}
                />
                <AttributeCard
                  label="Status"
                  value="Active"
                  icon={CheckCircle2}
                  tone="success"
                />
              </div>
            </div>

            {/* Variants Selector */}
            {variants && variants.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Select Size / Variant
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    {variants.length} options
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {variants.map((variant) => {
                    // Active if this card's ID matches the current URL ID
                    const isActive = variant.id === id;
                    const price = getVariantPrice(variant);

                    return (
                      <Link
                        key={variant.id}
                        href={`/catalog/${variant.id}`}
                        replace // Use replace to update URL without adding to history stack (optional)
                        className={`relative flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${isActive
                            ? 'border-brand bg-brand/5 ring-1 ring-brand dark:bg-brand/10'
                            : 'border-slate-200 bg-white hover:border-brand/50 dark:border-slate-800 dark:bg-slate-900'
                          }`}
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800">
                          <Image
                            src={variant.imageUrl || product.imageUrl || PLACEHOLDER}
                            alt={variant.sku || 'Variant'}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {variant.volume || variant.sku || 'Standard'}
                            </p>
                            {isActive && <CheckCircle2 className="h-5 w-5 text-brand" />}
                          </div>
                          <p className={`mt-1 text-sm font-medium ${isActive ? 'text-brand' : 'text-slate-500'}`}>
                            {formatPrice(price, product.currency)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN: Sticky Affiliate Tools --- */}
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  <Share2 className="h-4 w-4 text-brand" />
                  Affiliate Tools
                </h2>
              </div>

              <div className="p-6">
                <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                  Generate a tracked link for <strong>{product.name} {displayVolume ? `(${displayVolume})` : ''}</strong>.
                </p>

                {/* Pass the ACTIVE variant info to the Link Builder so the link works correctly */}
                <div className="rounded-xl bg-slate-50 p-1 dark:bg-slate-950/50">
                  <LinkBuilder product={{
                    id: selectedVariant ? selectedVariant.id : product.id, // Use Variant ID if selected
                    name: product.name,
                    sku: displaySku || product.sku || '',
                    landingUrl: selectedVariant?.landingUrl || product.landingUrl || ''
                  }} />
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    Commissions are calculated on the <strong>Net Sale Price</strong> excluding taxes and shipping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS (Same as before) ---

function AttributeCard({ label, value, icon: Icon, tone }: any) {
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-brand/50 hover:shadow-sm active:scale-95 dark:border-slate-800 dark:bg-slate-900"
      title="Click to copy"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-slate-200 dark:group-hover:bg-slate-700 ${tone === 'success'
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p
          className={`truncate text-sm font-semibold ${tone === 'success'
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-slate-900 dark:text-white'
            }`}
        >
          {value}
        </p>
      </div>
    </button>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <div className="aspect-square w-full animate-pulse rounded-[2.5rem] bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-1/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
        <div className="hidden lg:block space-y-6">
          <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

// --- UTILS ---
function formatPrice(value: number, currency?: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || ''} ${value}`;
  }
}