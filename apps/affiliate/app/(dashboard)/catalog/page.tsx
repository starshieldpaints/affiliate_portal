// 'use client';

// import Image from 'next/image';
// import {
//   useCallback,
//   useDeferredValue,
//   useEffect,
//   useMemo,
//   useRef,
//   useState
// } from 'react';
// import Link from 'next/link';
// import { catalogApi } from '../../../src/lib/api-client';
// import type { CatalogCategory, CatalogProduct } from '../../../src/types/catalog';

// const DEFAULT_PLACEHOLDER = 'https://placehold.co/640x384/png?text=StarShield+Product';

// type VariantGroup = {
//   baseName: string;
//   variants: CatalogProduct[];
// };

// type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

// export default function CatalogPage() {
//   const PAGE_VIEW_BATCH = 9;
//   const pageSize = 100;
//   const [products, setProducts] = useState<CatalogProduct[]>([]);
//   const [availableCategories, setAvailableCategories] = useState<CatalogCategory[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const deferredSearchTerm = useDeferredValue(searchTerm);
//   const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
//   const [sort, setSort] = useState<SortOption>('relevance');
//   const [stats, setStats] = useState({
//     total: 0
//   });
//   const [visibleCount, setVisibleCount] = useState(PAGE_VIEW_BATCH);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const loadMoreRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchProducts = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const aggregated: CatalogProduct[] = [];
//         let nextPage = 1;
//         let hasNextPage = true;
//         let lastFilters: CatalogCategory[] | undefined;
//         let totalFromServer = stats.total;

//         while (hasNextPage) {
//           const response = await catalogApi.list({
//             page: nextPage,
//             pageSize
//           });

//           aggregated.push(...response.data);
//           if (response.filters?.categories?.length) {
//             lastFilters = response.filters.categories;
//           }
//           if (typeof response.meta?.total === 'number') {
//             totalFromServer = response.meta.total;
//           }

//           hasNextPage = response.meta?.hasNextPage ?? false;
//           nextPage += 1;

//           if (!hasNextPage || response.data.length === 0) {
//             break;
//           }
//         }

//         if (!isMounted) return;
//         const resolved = aggregated.length ? aggregated : [];
//         setProducts(resolved);
//         setAvailableCategories(
//           lastFilters?.length ? lastFilters : deriveCategoriesFromProducts(resolved)
//         );
//         setStats({
//           total: totalFromServer ?? resolved.length
//         });
//       } catch (err) {
//         if (!isMounted) return;
//         const message =
//           err instanceof Error ? err.message : 'Unable to load products right now.';
//         setError(message);
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };
//     fetchProducts();
//     return () => {
//       isMounted = false;
//     };
//   }, [pageSize]);

//   const groupedProducts = useMemo(() => groupProducts(products), [products]);

//   const filteredGroups = useMemo(() => {
//     const query = deferredSearchTerm.trim().toLowerCase();
//     const filtered = groupedProducts.filter((group) => {
//       const matchesSearch =
//         !query ||
//         group.baseName.toLowerCase().includes(query) ||
//         group.variants.some(
//           (variant) =>
//             variant.name.toLowerCase().includes(query) ||
//             (variant.sku ?? '').toLowerCase().includes(query)
//         );

//       const matchesCategory =
//         selectedCategory === 'all' ||
//         group.variants.some((variant) => {
//           const variantCategoryId = normalizeCategoryIdentifier(
//             variant.category?.id ?? variant.categoryId ?? null
//           );
//           return variantCategoryId === selectedCategory;
//         });
//       return matchesSearch && matchesCategory;
//     });

//     const collapsed = new Map<string, VariantGroup>();
//     for (const group of filtered) {
//       if (!collapsed.has(group.baseName)) {
//         collapsed.set(group.baseName, { ...group, variants: [...group.variants] });
//         continue;
//       }
//       const existing = collapsed.get(group.baseName)!;
//       const merged = [...existing.variants, ...group.variants];
//       collapsed.set(group.baseName, {
//         ...existing,
//         variants: merged.sort((a, b) => a.price - b.price)
//       });
//     }
//     return Array.from(collapsed.values());
//   }, [groupedProducts, deferredSearchTerm, selectedCategory]);

//   const sortedGroups = useMemo(() => {
//     if (sort === 'relevance') return filteredGroups;
//     const copy = [...filteredGroups];
//     switch (sort) {
//       case 'price-asc':
//         return copy.sort((a, b) => (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0));
//       case 'price-desc':
//         return copy.sort((a, b) => (b.variants[0]?.price ?? 0) - (a.variants[0]?.price ?? 0));
//       case 'name-asc':
//         return copy.sort((a, b) => a.baseName.localeCompare(b.baseName));
//       default:
//         return copy;
//     }
//   }, [filteredGroups, sort]);

//   const highlightedCategories = useMemo(() => availableCategories.slice(0, 8), [availableCategories]);
//   const totalVariants = useMemo(
//     () => sortedGroups.reduce((count, group) => count + group.variants.length, 0),
//     [sortedGroups]
//   );
//   const hasMore = visibleCount < sortedGroups.length;

//   useEffect(() => {
//     setVisibleCount(PAGE_VIEW_BATCH);
//   }, [sortedGroups]);

//   const handleLoadMore = useCallback(() => {
//     if (!hasMore) return;
//     setVisibleCount((current) => Math.min(current + PAGE_VIEW_BATCH, sortedGroups.length));
//   }, [hasMore, sortedGroups.length]);

//   useEffect(() => {
//     if (!hasMore) {
//       return;
//     }
//     const target = loadMoreRef.current;
//     if (!target) {
//       return;
//     }
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             handleLoadMore();
//           }
//         });
//       },
//       {
//         rootMargin: '200px'
//       }
//     );
//     observer.observe(target);
//     return () => {
//       observer.disconnect();
//     };
//   }, [hasMore, handleLoadMore]);

//   return (
//     <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
//       <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 shadow-lg dark:border-slate-800">
//         <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
//           <div className="max-w-2xl space-y-3 text-white">
//             <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand/80">
//               Affiliate catalog
//             </p>
//             <h1 className="text-4xl font-semibold leading-tight">
//               Pick the perfect SKU in under a minute.
//             </h1>
//             <p className="text-sm text-slate-200">
//               Search, filter, and ship links without wading through PDFs. Designed for fast,
//               confident selection on any device.
//             </p>
//             <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-200/90">
//               <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
//                 Realtime filters
//               </span>
//               <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
//                 Instant link-ready
//               </span>
//               <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
//                 Mobile-friendly
//               </span>
//             </div>
//           </div>
//           <dl className="grid w-full max-w-md gap-3 text-xs uppercase tracking-[0.35em] text-slate-200 sm:grid-cols-3">
//             <StatPill label="Products live" value={formatNumber(stats.total)} />
//             <StatPill label="Categories" value={availableCategories.length.toString()} />
//             <StatPill label="Variants visible" value={formatNumber(totalVariants)} />
//           </dl>
//         </div>
//       </header>

//       <section className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//           <div>
//             <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Filters</p>
//             <p className="text-base font-semibold text-slate-900 dark:text-white">Dial in the catalog</p>
//           </div>
//           <div className="flex flex-wrap gap-2 text-sm">
//             <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
//               <span>Sort</span>
//               <div className="relative flex items-center">
//                 <select
//                   value={sort}
//                   onChange={(event) => setSort(event.target.value as SortOption)}
//                   className="appearance-none rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-inner transition focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
//                 >
//                   <option value="relevance">Relevance</option>
//                   <option value="price-asc">Price: Low to High</option>
//                   <option value="price-desc">Price: High to Low</option>
//                   <option value="name-asc">Name A-Z</option>
//                 </select>
//                 <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
//               </div>
//             </label>
//             {(searchTerm || selectedCategory !== 'all') && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   setSearchTerm('');
//                   setSelectedCategory('all');
//                   setSort('relevance');
//                 }}
//                 className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
//               >
//                 Reset
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
//           <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//             <span>Search catalog</span>
//             <input
//               value={searchTerm}
//               onChange={(event) => setSearchTerm(event.target.value)}
//               placeholder='Try "Shield Lite" or drop a SKU'
//               className="form-input"
//             />
//           </label>
//           <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//             <span>Filter by category</span>
//             <select
//               value={selectedCategory}
//               onChange={(event) => setSelectedCategory(event.target.value as typeof selectedCategory)}
//               className="form-input"
//             >
//               <option value="all">All categories</option>
//               {availableCategories.map((category) => (
//                 <option key={category.id} value={category.id}>
//                   {category.name}
//                 </option>
//               ))}
//             </select>
//           </label>
//           <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
//             <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Live variants</p>
//             <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
//               {formatNumber(totalVariants)}
//             </p>
//             <p className="text-xs text-muted">
//               Matching {selectedCategory === 'all' ? 'all categories' : 'current filters'}
//             </p>
//           </div>
//         </div>

//         {highlightedCategories.length > 0 && (
//           <div className="mt-4 flex gap-2 overflow-x-auto pb-2 text-sm no-scrollbar">
//             {highlightedCategories.map((category) => {
//               const isActive = category.id === selectedCategory;
//               return (
//                 <button
//                   key={category.id}
//                   type="button"
//                   onClick={() => setSelectedCategory(isActive ? 'all' : category.id)}
//                   className={`rounded-full border px-4 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
//                     isActive
//                       ? 'border-brand bg-brand/10 text-brand'
//                       : 'border-slate-200 text-slate-600 hover:border-brand/60 hover:text-brand dark:border-slate-700 dark:text-slate-300'
//                   }`}
//                 >
//                   {category.name}
//                 </button>
//               );
//             })}
//           </div>
//         )}

//         <div className="mt-4 grid gap-3 text-xs text-muted sm:grid-cols-3">
//           <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
//             <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Grouped products</p>
//             <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
//               {formatNumber(filteredGroups.length)}
//             </p>
//           </div>
//           <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
//             <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Variant density</p>
//             <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
//               {filteredGroups.length ? (totalVariants / filteredGroups.length).toFixed(1) : '—'}
//             </p>
//           </div>
//           <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
//             <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Search intent</p>
//             <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
//               {deferredSearchTerm ? `"${deferredSearchTerm}"` : 'Browsing'}
//             </p>
//           </div>
//         </div>
//       </section>


//       {error && (
//         <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
//           {error}
//         </div>
//       )}

//       {loading && (
//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {Array.from({ length: 8 }).map((_, idx) => (
//             <div
//               key={idx}
//               className="h-64 rounded-3xl border border-slate-200/70 bg-slate-50/80 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40"
//             >
//               <div className="h-full w-full animate-pulse rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700" />
//             </div>
//           ))}
//         </div>
//       )}

//       {filteredGroups.length === 0 ? (
//         <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/80 p-10 text-center text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
//           <p className="mb-4">Nothing matches that filter yet. Try another search or category.</p>
//           <button
//             type="button"
//             onClick={() => {
//               setSearchTerm('');
//               setSelectedCategory('all');
//             }}
//             className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
//           >
//             Reset filters
//           </button>
//         </div>
//       ) : (
//         <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {sortedGroups.slice(0, visibleCount).map((group, index) => (
//             <CatalogCard
//               key={group.variants[0]?.id ?? `${group.baseName}-${index}`}
//               group={group}
//             />
//           ))}
//         </section>
//       )}
//       <div ref={loadMoreRef} />

//       <section className="rounded-[32px] border border-slate-200/80 bg-white/95 px-5 py-5 text-sm text-slate-700 shadow-lg dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-200 sm:flex sm:items-center sm:justify-between">
//         <p>
//           Showing <span className="font-semibold">{sortedGroups.length}</span> grouped products (
//           {totalVariants.toLocaleString()} variants)
//         </p>
//         {loading && (
//           <span className="text-xs uppercase tracking-wide text-muted">Refreshing catalog...</span>
//         )}
//         {!loading && hasMore && (
//           <button
//             type="button"
//             onClick={handleLoadMore}
//             className="text-xs font-semibold uppercase tracking-wide text-brand hover:underline"
//           >
//             Load 9 more
//           </button>
//         )}
//       </section>
//     </div>
//   );
// }


// function CatalogCard({ group }: { group: VariantGroup }) {
//   const variant = group.variants[0];
//   if (!variant) return null;

//   return (
//     <Link
//       href={`/catalog/${variant.id}`}
//       className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800/60 dark:bg-slate-900"
//     >
//       <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 dark:bg-slate-800">
//         <Image
//           src={variant.imageUrl ?? DEFAULT_PLACEHOLDER}
//           alt={variant.name}
//           fill
//           sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
//           className="object-contain object-center p-6 transition duration-700 group-hover:scale-105"
//         />
//         <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-100">
//           {variant.category?.name ?? 'Uncategorized'}
//         </div>
//       </div>
//       <div className="flex flex-1 flex-col gap-3 p-5">
//         <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{group.baseName}</p>
//         <h2 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
//           {variant.name}
//         </h2>
//         <p className="text-sm text-muted line-clamp-2">
//           {truncate(variant.description ?? 'Tap to view full details.', 120)}
//         </p>
//         <div className="flex items-center justify-between pt-2">
//           <div className="flex flex-col">
//             <span className="text-xs uppercase tracking-[0.2em] text-slate-400">From</span>
//             <span className="text-xl font-semibold text-slate-900 dark:text-white">
//               {formatPrice(variant.price, variant.currency)}
//             </span>
//           </div>
//           <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
//             {group.variants.length} variants
//           </span>
//         </div>
//         <div className="flex items-center justify-between">
//           <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
//             {variant.currency || 'USD'}
//           </span>
//           <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
//             View details
//           </span>
//         </div>
//       </div>
//     </Link>
//   );
// }

// function StatPill({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center shadow-sm backdrop-blur">
//       <dt className="text-[11px] uppercase tracking-[0.35em] text-slate-200/80">{label}</dt>
//       <dd className="mt-2 text-lg font-semibold text-white">{value}</dd>
//     </div>
//   );
// }

// function InfoBubble({
//   label,
//   value,
//   tone
// }: {
//   label: string;
//   value: string;
//   tone?: 'success' | 'warning' | 'neutral';
// }) {
//   const toneClasses =
//     tone === 'success'
//       ? 'text-emerald-600 dark:text-emerald-300'
//       : tone === 'warning'
//         ? 'text-amber-600 dark:text-amber-300'
//         : 'text-slate-900 dark:text-slate-100';
//   return (
//     <div className="flex flex-col rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left dark:border-slate-800/60 dark:bg-slate-900/60">
//       <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{label}</p>
//       <p className={`mt-1 text-base font-semibold break-words ${toneClasses}`}>{value}</p>
//     </div>
//   );
// }

// function DescriptionWithReadMore({
//   label,
//   description
// }: {
//   label: string;
//   description: string;
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const preview = truncate(description, 140);
//   const shouldShowButton = description.length > 140;

//   return (
//     <>
//       <p className="text-sm leading-relaxed break-words text-slate-600 dark:text-slate-300">
//         {preview}
//         {shouldShowButton && (
//           <button
//             type="button"
//             onClick={() => setIsOpen(true)}
//             className="ml-2 text-xs font-semibold text-brand hover:underline"
//           >
//             Read more
//           </button>
//         )}
//       </p>
//       {isOpen && typeof document !== 'undefined'
//         ? createPortal(
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
//               <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="text-base font-semibold text-slate-900 dark:text-white">
//                     {label}
//                   </h3>
//                   <button
//                     type="button"
//                     onClick={() => setIsOpen(false)}
//                     className="text-sm font-semibold text-brand hover:underline"
//                   >
//                     Close
//                   </button>
//                 </div>
//                 <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
//                   {description}
//                 </p>
//               </div>
//             </div>,
//             document.body
//           )
//         : null}
//     </>
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

// function formatNumber(value: number) {
//   return value.toLocaleString('en-US');
// }

// function truncate(value: string, max = 120) {
//   if (!value) return '';
//   return value.length > max ? `${value.slice(0, max - 3)}...` : value;
// }

// function deriveCategoriesFromProducts(products: CatalogProduct[]): CatalogCategory[] {
//   const map = new Map<string, CatalogCategory>();
//   products.forEach((product) => {
//     const displayName = product.category?.name ?? product.categoryId ?? 'Uncategorized';
//     const normalizedId = normalizeCategoryIdentifier(product.category?.id ?? product.categoryId);
//     if (!normalizedId) {
//       return;
//     }
//     if (!map.has(normalizedId)) {
//       map.set(normalizedId, {
//         id: normalizedId,
//         name: displayName ?? 'Uncategorized',
//         description: product.category?.description ?? null
//       });
//     }
//   });
//   return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
// }

// function deriveBaseName(name: string) {
//   if (!name) {
//     return '';
//   }
//   const normalized = name.replace(/\s*[-(]?\s*\d+(\.\d+)?\s*(ltr|l|kg|ml|g)\s*[)]?/gi, '').trim();
//   return normalized.replace(/[-–—]\s*$/, '').trim();
// }

// function normalizeCategoryIdentifier(value?: string | null) {
//   if (!value) {
//     return null;
//   }
//   return value
//     .toString()
//     .toLowerCase()
//     .replace(/&/g, 'and')
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '');
// }
// function groupProducts(products: CatalogProduct[]): VariantGroup[] {
//   const map = new Map<string, CatalogProduct[]>();
//   for (const product of products) {
//     const base = deriveBaseName(product.name);
//     if (!map.has(base)) {
//       map.set(base, []);
//     }
//     map.get(base)?.push(product);
//   }

//   return Array.from(map.entries()).map(([baseName, variants]) => ({
//     baseName,
//     variants: variants.sort((a, b) => a.price - b.price)
//   }));
// }




















// 'use client';

// import Image from 'next/image';
// import {
//   useCallback,
//   useDeferredValue,
//   useEffect,
//   useMemo,
//   useRef,
//   useState
// } from 'react';
// import Link from 'next/link';
// import { createPortal } from 'react-dom';
// // Ensure this path matches your project structure
// import { catalogApi } from '../../../src/lib/api-client';

// // --- TYPES ---
// // Defined inline for clarity, or import from your types file
// export interface CatalogProduct {
//   id: string;
//   name: string;
//   description: string | null;
//   price: number;
//   currency: string;
//   landingUrl: string;
//   imageUrl: string | null;
//   sku: string | null;
//   categoryId: string | null;
//   category: {
//     id: string;
//     name: string;
//     description: string | null;
//   } | null;
// }

// export interface CatalogCategory {
//   id: string;
//   name: string;
//   description: string | null;
// }

// const DEFAULT_PLACEHOLDER = 'https://placehold.co/640x384/png?text=Product+Image';

// type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

// export default function CatalogPage() {
//   const PAGE_VIEW_BATCH = 9;
//   const pageSize = 100;

//   // State
//   const [products, setProducts] = useState<CatalogProduct[]>([]);
//   const [availableCategories, setAvailableCategories] = useState<CatalogCategory[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const deferredSearchTerm = useDeferredValue(searchTerm);
//   const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
//   const [sort, setSort] = useState<SortOption>('relevance');
//   const [stats, setStats] = useState({ total: 0 });
//   const [visibleCount, setVisibleCount] = useState(PAGE_VIEW_BATCH);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const loadMoreRef = useRef<HTMLDivElement | null>(null);

//   // --- DATA FETCHING ---
//   useEffect(() => {
//     let isMounted = true;
//     const fetchProducts = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const aggregated: CatalogProduct[] = [];
//         let nextPage = 1;
//         let hasNextPage = true;
//         let lastFilters: CatalogCategory[] | undefined;
//         let totalFromServer = 0;

//         // Fetch all pages to enable client-side filtering/sorting
//         // Note: For very large datasets, move filtering to the backend.
//         while (hasNextPage) {
//           const response = await catalogApi.list({
//             page: nextPage,
//             pageSize
//           });

//           // @ts-ignore - Adapting to your API response structure
//           aggregated.push(...response.data);

//           // @ts-ignore
//           if (response.filters?.categories?.length) {
//             // @ts-ignore
//             lastFilters = response.filters.categories;
//           }
//           // @ts-ignore
//           if (typeof response.meta?.total === 'number') {
//             // @ts-ignore
//             totalFromServer = response.meta.total;
//           }

//           // @ts-ignore
//           hasNextPage = response.meta?.hasNextPage ?? false;
//           nextPage += 1;

//           // Safety break
//           if (!hasNextPage || response.data.length === 0) {
//             break;
//           }
//         }

//         if (!isMounted) return;

//         const resolved = aggregated.length ? aggregated : [];
//         setProducts(resolved);

//         // Use categories from server or derive them
//         setAvailableCategories(
//           lastFilters?.length ? lastFilters : deriveCategoriesFromProducts(resolved)
//         );

//         setStats({
//           total: totalFromServer || resolved.length
//         });
//       } catch (err) {
//         if (!isMounted) return;
//         console.error(err);
//         setError('Unable to load products right now.');
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     fetchProducts();
//     return () => { isMounted = false; };
//   }, [pageSize]);

//   // --- FILTERING LOGIC ---
//   const filteredProducts = useMemo(() => {
//     const query = deferredSearchTerm.trim().toLowerCase();

//     return products.filter((product) => {
//       // 1. Search Text
//       const matchesSearch =
//         !query ||
//         product.name.toLowerCase().includes(query) ||
//         (product.description && product.description.toLowerCase().includes(query)) ||
//         (product.sku && product.sku.toLowerCase().includes(query));

//       // 2. Category
//       const matchesCategory =
//         selectedCategory === 'all' ||
//         product.categoryId === selectedCategory ||
//         product.category?.id === selectedCategory;

//       return matchesSearch && matchesCategory;
//     });
//   }, [products, deferredSearchTerm, selectedCategory]);

//   // --- SORTING LOGIC ---
//   const sortedProducts = useMemo(() => {
//     if (sort === 'relevance') return filteredProducts;

//     const copy = [...filteredProducts];
//     switch (sort) {
//       case 'price-asc':
//         return copy.sort((a, b) => a.price - b.price);
//       case 'price-desc':
//         return copy.sort((a, b) => b.price - a.price);
//       case 'name-asc':
//         return copy.sort((a, b) => a.name.localeCompare(b.name));
//       default:
//         return copy;
//     }
//   }, [filteredProducts, sort]);

//   // --- PAGINATION / VIEW LOGIC ---
//   const highlightedCategories = useMemo(() => availableCategories.slice(0, 8), [availableCategories]);
//   const hasMore = visibleCount < sortedProducts.length;

//   useEffect(() => {
//     setVisibleCount(PAGE_VIEW_BATCH);
//   }, [sortedProducts]);

//   const handleLoadMore = useCallback(() => {
//     if (!hasMore) return;
//     setVisibleCount((current) => Math.min(current + PAGE_VIEW_BATCH, sortedProducts.length));
//   }, [hasMore, sortedProducts.length]);

//   // Infinite Scroll Observer
//   useEffect(() => {
//     if (!hasMore) return;
//     const target = loadMoreRef.current;
//     if (!target) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             handleLoadMore();
//           }
//         });
//       },
//       { rootMargin: '200px' }
//     );
//     observer.observe(target);
//     return () => observer.disconnect();
//   }, [hasMore, handleLoadMore]);

//   // --- RENDER ---
//   return (
//     <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">

//       {/* Header Banner */}
//       <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 shadow-lg dark:border-slate-800">
//         <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
//           <div className="max-w-2xl space-y-3 text-white">
//             <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand/80">
//               Affiliate catalog
//             </p>
//             <h1 className="text-4xl font-semibold leading-tight">
//               Pick the perfect SKU in under a minute.
//             </h1>
//             <p className="text-sm text-slate-200">
//               Search, filter, and ship links without wading through PDFs.
//             </p>
//           </div>
//           <dl className="grid w-full max-w-md gap-3 text-xs uppercase tracking-[0.35em] text-slate-200 sm:grid-cols-3">
//             <StatPill label="Products live" value={formatNumber(stats.total)} />
//             <StatPill label="Categories" value={availableCategories.length.toString()} />
//           </dl>
//         </div>
//       </header>

//       {/* Controls Section */}
//       <section className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
//         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//           <div>
//             <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Filters</p>
//             <p className="text-base font-semibold text-slate-900 dark:text-white">Dial in the catalog</p>
//           </div>
//           <div className="flex flex-wrap gap-2 text-sm">
//             {/* Sort Dropdown */}
//             <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
//               <span>Sort</span>
//               <div className="relative flex items-center">
//                 <select
//                   value={sort}
//                   onChange={(event) => setSort(event.target.value as SortOption)}
//                   className="appearance-none rounded-full border-none bg-transparent px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 focus:outline-none dark:text-slate-100"
//                 >
//                   <option value="relevance">Relevance</option>
//                   <option value="price-asc">Price: Low to High</option>
//                   <option value="price-desc">Price: High to Low</option>
//                   <option value="name-asc">Name A-Z</option>
//                 </select>
//               </div>
//             </label>

//             {(searchTerm || selectedCategory !== 'all') && (
//               <button
//                 type="button"
//                 onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSort('relevance'); }}
//                 className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
//               >
//                 Reset
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
//           <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//             <span>Search catalog</span>
//             <input
//               value={searchTerm}
//               onChange={(event) => setSearchTerm(event.target.value)}
//               placeholder='Try "Road Repair" or "Wood Shield"'
//               className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
//             />
//           </label>
//           <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//             <span>Filter by category</span>
//             <select
//               value={selectedCategory}
//               onChange={(event) => setSelectedCategory(event.target.value)}
//               className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
//             >
//               <option value="all">All categories</option>
//               {availableCategories.map((category) => (
//                 <option key={category.id} value={category.id}>
//                   {category.name}
//                 </option>
//               ))}
//             </select>
//           </label>
//         </div>

//         {/* Category Chips */}
//         {highlightedCategories.length > 0 && (
//           <div className="mt-4 flex gap-2 overflow-x-auto pb-2 text-sm no-scrollbar">
//             {highlightedCategories.map((category) => {
//               const isActive = category.id === selectedCategory;
//               return (
//                 <button
//                   key={category.id}
//                   type="button"
//                   onClick={() => setSelectedCategory(isActive ? 'all' : category.id)}
//                   className={`rounded-full border px-4 py-1 text-sm transition whitespace-nowrap ${isActive
//                       ? 'border-blue-500 bg-blue-50 text-blue-600'
//                       : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300'
//                     }`}
//                 >
//                   {category.name}
//                 </button>
//               );
//             })}
//           </div>
//         )}
//       </section>

//       {/* Error State */}
//       {error && (
//         <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
//           {error}
//         </div>
//       )}

//       {/* Loading State Skeletons */}
//       {loading && products.length === 0 && (
//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {Array.from({ length: 8 }).map((_, idx) => (
//             <div key={idx} className="h-96 rounded-3xl border border-slate-200/70 bg-slate-50/80 shadow-sm animate-pulse" />
//           ))}
//         </div>
//       )}

//       {/* Empty State */}
//       {!loading && filteredProducts.length === 0 && (
//         <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/80 p-10 text-center text-sm text-slate-500">
//           <p className="mb-4">Nothing matches that filter yet.</p>
//           <button
//             onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
//             className="rounded-full border border-slate-300 px-4 py-2 font-semibold"
//           >
//             Reset filters
//           </button>
//         </div>
//       )}

//       {/* Product Grid */}
//       <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//         {sortedProducts.slice(0, visibleCount).map((product) => (
//           <CatalogCard key={product.id} product={product} />
//         ))}
//       </section>

//       <div ref={loadMoreRef} />

//       {/* Footer Stats */}
//       <section className="rounded-[32px] border border-slate-200/80 bg-white/95 px-5 py-5 text-sm text-slate-700 shadow-lg sm:flex sm:items-center sm:justify-between">
//         <p>
//           Showing <span className="font-semibold">{Math.min(visibleCount, sortedProducts.length)}</span> of <span className="font-semibold">{sortedProducts.length}</span> products
//         </p>
//         {!loading && hasMore && (
//           <button onClick={handleLoadMore} className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:underline">
//             Load more
//           </button>
//         )}
//       </section>
//     </div>
//   );
// }

// // --- SUB-COMPONENTS ---

// function CatalogCard({ product }: { product: CatalogProduct }) {
//   return (
//     <Link
//       href={`/catalog/${product.id}`}
//       className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900"
//     >
//       <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 dark:bg-slate-800">
//         <Image
//           src={product.imageUrl ?? DEFAULT_PLACEHOLDER}
//           alt={product.name}
//           fill
//           sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
//           className="object-contain object-center p-6 transition duration-700 group-hover:scale-105"
//         />
//         {product.category && (
//           <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm">
//             {product.category.name}
//           </div>
//         )}
//       </div>

//       <div className="flex flex-1 flex-col gap-3 p-5">
//         <h2 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
//           {product.name}
//         </h2>
//         <p className="text-sm text-slate-500 line-clamp-2">
//           {truncate(product.description ?? 'View details', 100)}
//         </p>

//         <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
//           <div className="flex flex-col">
//             <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</span>
//             <span className="text-xl font-semibold text-slate-900 dark:text-white">
//               {formatPrice(product.price, product.currency)}
//             </span>
//           </div>

//           <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 group-hover:underline">
//             View details
//           </span>
//         </div>
//       </div>
//     </Link>
//   );
// }

// function StatPill({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center shadow-sm backdrop-blur">
//       <dt className="text-[11px] uppercase tracking-[0.35em] text-slate-200/80">{label}</dt>
//       <dd className="mt-2 text-lg font-semibold text-white">{value}</dd>
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

// function formatNumber(value: number) {
//   return value.toLocaleString('en-US');
// }

// function truncate(value: string, max = 120) {
//   if (!value) return '';
//   return value.length > max ? `${value.slice(0, max - 3)}...` : value;
// }

// function deriveCategoriesFromProducts(products: CatalogProduct[]): CatalogCategory[] {
//   const map = new Map<string, CatalogCategory>();
//   products.forEach((product) => {
//     if (product.category) {
//       map.set(product.category.id, product.category);
//     }
//   });
//   return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
// }











































// 'use client';

// import Image from 'next/image';
// import {
//   useCallback,
//   useDeferredValue,
//   useEffect,
//   useMemo,
//   useRef,
//   useState
// } from 'react';
// import Link from 'next/link';
// import { catalogApi } from '../../../src/lib/api-client';
// import { Search, Filter, ArrowRight, PackageX, Loader2 } from 'lucide-react';

// // --- TYPES ---
// export interface CatalogProduct {
//   id: string;
//   name: string;
//   description: string | null;
//   price: number;
//   currency: string;
//   landingUrl: string;
//   imageUrl: string | null;
//   sku: string | null;
//   categoryId: string | null;
//   category: {
//     id: string;
//     name: string;
//     description: string | null;
//   } | null;
// }

// export interface CatalogCategory {
//   id: string;
//   name: string;
//   description: string | null;
// }

// const DEFAULT_PLACEHOLDER = 'https://placehold.co/640x384/png?text=Product+Image';

// type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

// export default function CatalogPage() {
//   const PAGE_VIEW_BATCH = 12; // Increased batch size for better grid fill
//   const pageSize = 100;

//   // State
//   const [products, setProducts] = useState<CatalogProduct[]>([]);
//   const [availableCategories, setAvailableCategories] = useState<CatalogCategory[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const deferredSearchTerm = useDeferredValue(searchTerm);
//   const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
//   const [sort, setSort] = useState<SortOption>('relevance');
//   const [stats, setStats] = useState({ total: 0 });
//   const [visibleCount, setVisibleCount] = useState(PAGE_VIEW_BATCH);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const loadMoreRef = useRef<HTMLDivElement | null>(null);

//   // --- DATA FETCHING ---
//   useEffect(() => {
//     let isMounted = true;
//     const fetchProducts = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const aggregated: CatalogProduct[] = [];
//         let nextPage = 1;
//         let hasNextPage = true;
//         let lastFilters: CatalogCategory[] | undefined;
//         let totalFromServer = 0;

//         while (hasNextPage) {
//           const response = await catalogApi.list({
//             page: nextPage,
//             pageSize
//           });

//           // @ts-ignore
//           aggregated.push(...response.data);

//           // @ts-ignore
//           if (response.filters?.categories?.length) {
//             // @ts-ignore
//             lastFilters = response.filters.categories;
//           }
//           // @ts-ignore
//           if (typeof response.meta?.total === 'number') {
//             // @ts-ignore
//             totalFromServer = response.meta.total;
//           }

//           // @ts-ignore
//           hasNextPage = response.meta?.hasNextPage ?? false;
//           nextPage += 1;

//           if (!hasNextPage || response.data.length === 0) {
//             break;
//           }
//         }

//         if (!isMounted) return;

//         const resolved = aggregated.length ? aggregated : [];
//         setProducts(resolved);

//         setAvailableCategories(
//           lastFilters?.length ? lastFilters : deriveCategoriesFromProducts(resolved)
//         );

//         setStats({
//           total: totalFromServer || resolved.length
//         });
//       } catch (err) {
//         if (!isMounted) return;
//         console.error(err);
//         setError('Unable to load products right now.');
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     fetchProducts();
//     return () => { isMounted = false; };
//   }, [pageSize]);

//   // --- FILTERING LOGIC ---
//   const filteredProducts = useMemo(() => {
//     const query = deferredSearchTerm.trim().toLowerCase();

//     return products.filter((product) => {
//       const matchesSearch =
//         !query ||
//         product.name.toLowerCase().includes(query) ||
//         (product.description && product.description.toLowerCase().includes(query)) ||
//         (product.sku && product.sku.toLowerCase().includes(query));

//       const matchesCategory =
//         selectedCategory === 'all' ||
//         product.categoryId === selectedCategory ||
//         product.category?.id === selectedCategory;

//       return matchesSearch && matchesCategory;
//     });
//   }, [products, deferredSearchTerm, selectedCategory]);

//   // --- SORTING LOGIC ---
//   const sortedProducts = useMemo(() => {
//     if (sort === 'relevance') return filteredProducts;

//     const copy = [...filteredProducts];
//     switch (sort) {
//       case 'price-asc': return copy.sort((a, b) => a.price - b.price);
//       case 'price-desc': return copy.sort((a, b) => b.price - a.price);
//       case 'name-asc': return copy.sort((a, b) => a.name.localeCompare(b.name));
//       default: return copy;
//     }
//   }, [filteredProducts, sort]);

//   // --- PAGINATION / VIEW LOGIC ---
//   const highlightedCategories = useMemo(() => availableCategories, [availableCategories]); // Show all categories
//   const hasMore = visibleCount < sortedProducts.length;

//   useEffect(() => {
//     setVisibleCount(PAGE_VIEW_BATCH);
//   }, [sortedProducts]);

//   const handleLoadMore = useCallback(() => {
//     if (!hasMore) return;
//     setVisibleCount((current) => Math.min(current + PAGE_VIEW_BATCH, sortedProducts.length));
//   }, [hasMore, sortedProducts.length]);

//   useEffect(() => {
//     if (!hasMore) return;
//     const target = loadMoreRef.current;
//     if (!target) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             handleLoadMore();
//           }
//         });
//       },
//       { rootMargin: '200px' }
//     );
//     observer.observe(target);
//     return () => observer.disconnect();
//   }, [hasMore, handleLoadMore]);

//   // --- RENDER ---
//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
//       <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">

//         {/* Minimal Header */}
//         <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
//               Product Catalog
//             </h1>
//             <p className="mt-2 text-slate-600 dark:text-slate-400">
//               Browse {formatNumber(stats.total)} products available for promotion.
//             </p>
//           </div>

//           {/* Quick Stats Row */}
//           <div className="hidden md:flex gap-4">
//             <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-slate-800">
//               <span className="text-xs font-medium text-slate-500 uppercase">Categories</span>
//               <p className="font-semibold text-slate-900 dark:text-white">{availableCategories.length}</p>
//             </div>
//           </div>
//         </div>

//         {/* Sticky Filters Bar */}
//         <div className="sticky top-4 z-10 space-y-4 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-xl ring-1 ring-slate-900/5 dark:bg-slate-900/80 dark:ring-slate-800">
//           <div className="flex flex-col gap-4 md:flex-row md:items-center">

//             {/* Search Input */}
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//               <input
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Search products, SKUs..."
//                 className="h-10 w-full rounded-lg border-0 bg-slate-100 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-brand dark:bg-slate-800 dark:text-white"
//               />
//             </div>

//             {/* Sort & Category Controls */}
//             <div className="flex flex-wrap gap-2">
//               <select
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//                 className="h-10 rounded-lg border-0 bg-slate-100 px-3 pr-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand dark:bg-slate-800 dark:text-slate-200"
//               >
//                 <option value="all">All Categories</option>
//                 {availableCategories.map((c) => (
//                   <option key={c.id} value={c.id}>{c.name}</option>
//                 ))}
//               </select>

//               <select
//                 value={sort}
//                 onChange={(e) => setSort(e.target.value as SortOption)}
//                 className="h-10 rounded-lg border-0 bg-slate-100 px-3 pr-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand dark:bg-slate-800 dark:text-slate-200"
//               >
//                 <option value="relevance">Relevance</option>
//                 <option value="price-asc">Price: Low to High</option>
//                 <option value="price-desc">Price: High to Low</option>
//                 <option value="name-asc">Name: A-Z</option>
//               </select>
//             </div>
//           </div>

//           {/* Quick Filter Chips (Mobile/Desktop) */}
//           <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
//             <button
//               onClick={() => setSelectedCategory('all')}
//               className={`flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors ${selectedCategory === 'all'
//                   ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
//                   : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
//                 }`}
//             >
//               All
//             </button>
//             {highlightedCategories.map((cat) => (
//               <button
//                 key={cat.id}
//                 onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
//                 className={`flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors whitespace-nowrap ${selectedCategory === cat.id
//                     ? 'bg-brand text-white'
//                     : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
//                   }`}
//               >
//                 {cat.name}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Error State */}
//         {error && (
//           <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
//             {error}
//           </div>
//         )}

//         {/* Initial Loading State */}
//         {loading && products.length === 0 && (
//           <div className="flex h-64 w-full flex-col items-center justify-center">
//             <Loader2 className="h-8 w-8 animate-spin text-brand" />
//             <p className="mt-4 text-sm font-medium text-slate-500">Loading catalog...</p>
//           </div>
//         )}

//         {/* Empty State */}
//         {!loading && filteredProducts.length === 0 && (
//           <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
//             <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
//               <PackageX className="h-8 w-8 text-slate-400" />
//             </div>
//             <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No products found</h3>
//             <p className="mt-2 max-w-sm text-sm text-slate-500">
//               We couldn't find anything matching "{searchTerm}" in the {selectedCategory === 'all' ? 'catalog' : 'selected category'}.
//             </p>
//             <button
//               onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
//               className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/10 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
//             >
//               Clear filters
//             </button>
//           </div>
//         )}

//         {/* Product Grid */}
//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {sortedProducts.slice(0, visibleCount).map((product) => (
//             <CatalogCard key={product.id} product={product} />
//           ))}
//         </div>

//         {/* Load More Trigger */}
//         <div ref={loadMoreRef} className="h-10 w-full" />

//         {/* Loading Indicator for Infinite Scroll */}
//         {hasMore && (
//           <div className="flex justify-center py-4">
//             <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }

// // --- SUB-COMPONENTS ---

// function CatalogCard({ product }: { product: CatalogProduct }) {
//   return (
//     <Link
//       href={`/catalog/${product.id}`}
//       className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-brand/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
//     >
//       {/* Image Area */}
//       <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
//         <Image
//           src={product.imageUrl ?? DEFAULT_PLACEHOLDER}
//           alt={product.name}
//           fill
//           sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
//           className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
//         />

//         {/* Category Badge */}
//         {product.category && (
//           <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-300">
//             {product.category.name}
//           </div>
//         )}
//       </div>

//       {/* Content Area */}
//       <div className="flex flex-1 flex-col p-4">
//         <h3 className="line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-brand dark:text-white">
//           {product.name}
//         </h3>

//         <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
//           {product.description || 'No description available.'}
//         </p>

//         <div className="mt-auto pt-4">
//           <div className="flex items-end justify-between">
//             <div>
//               <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Starting at</p>
//               <p className="text-lg font-bold text-slate-900 dark:text-white">
//                 {formatPrice(product.price, product.currency)}
//               </p>
//             </div>

//             {/* CTA Button */}
//             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand group-hover:text-white dark:bg-slate-800 dark:text-slate-300">
//               <ArrowRight className="h-4 w-4" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </Link>
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

// function formatNumber(value: number) {
//   return value.toLocaleString('en-US');
// }

// function deriveCategoriesFromProducts(products: CatalogProduct[]): CatalogCategory[] {
//   const map = new Map<string, CatalogCategory>();
//   products.forEach((product) => {
//     if (product.category) {
//       map.set(product.category.id, product.category);
//     }
//   });
//   return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
// }


















'use client';

import Image from 'next/image';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Link from 'next/link';
import { catalogApi } from '../../../src/lib/api-client';
import { Search, ArrowRight, PackageX, Loader2 } from 'lucide-react';

// --- TYPES ---
export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  landingUrl: string;
  imageUrl: string | null;
  sku: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface CatalogCategory {
  id: string;
  name: string;
  description: string | null;
}

// Group structure for merging variants
type VariantGroup = {
  baseName: string;
  variants: CatalogProduct[];
};

const DEFAULT_PLACEHOLDER = 'https://placehold.co/640x384/png?text=Product+Image';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

export default function CatalogPage() {
  const PAGE_VIEW_BATCH = 12;
  const pageSize = 100;

  // State
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CatalogCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [stats, setStats] = useState({ total: 0 });
  const [visibleCount, setVisibleCount] = useState(PAGE_VIEW_BATCH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const aggregated: CatalogProduct[] = [];
        let nextPage = 1;
        let hasNextPage = true;
        let lastFilters: CatalogCategory[] | undefined;
        let totalFromServer = 0;

        while (hasNextPage) {
          const response = await catalogApi.list({ page: nextPage, pageSize });

          // @ts-ignore
          aggregated.push(...response.data);

          // @ts-ignore
          if (response.filters?.categories?.length) lastFilters = response.filters.categories;
          // @ts-ignore
          if (typeof response.meta?.total === 'number') totalFromServer = response.meta.total;

          // @ts-ignore
          hasNextPage = response.meta?.hasNextPage ?? false;
          nextPage += 1;

          if (!hasNextPage || response.data.length === 0) break;
        }

        if (!isMounted) return;

        const resolved = aggregated.length ? aggregated : [];
        setProducts(resolved);

        setAvailableCategories(
          lastFilters?.length ? lastFilters : deriveCategoriesFromProducts(resolved)
        );

        setStats({ total: totalFromServer || resolved.length });
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError('Unable to load products right now.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [pageSize]);

  // --- 1. GROUPING LOGIC (Collapses Variants) ---
  const groupedProducts = useMemo(() => groupProducts(products), [products]);

  // --- 2. FILTERING LOGIC (Applied to Groups) ---
  const filteredGroups = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    return groupedProducts.filter((group) => {
      const baseProduct = group.variants[0]; // Use first variant for metadata checking

      const matchesSearch =
        !query ||
        group.baseName.toLowerCase().includes(query) ||
        group.variants.some(v => v.sku?.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'all' ||
        baseProduct.categoryId === selectedCategory ||
        baseProduct.category?.id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [groupedProducts, deferredSearchTerm, selectedCategory]);

  // --- 3. SORTING LOGIC ---
  const sortedGroups = useMemo(() => {
    if (sort === 'relevance') return filteredGroups;

    const copy = [...filteredGroups];
    switch (sort) {
      case 'price-asc': return copy.sort((a, b) => a.variants[0].price - b.variants[0].price);
      case 'price-desc': return copy.sort((a, b) => b.variants[0].price - a.variants[0].price);
      case 'name-asc': return copy.sort((a, b) => a.baseName.localeCompare(b.baseName));
      default: return copy;
    }
  }, [filteredGroups, sort]);

  // --- PAGINATION / VIEW LOGIC ---
  const highlightedCategories = useMemo(() => availableCategories, [availableCategories]);
  const hasMore = visibleCount < sortedGroups.length;

  useEffect(() => {
    setVisibleCount(PAGE_VIEW_BATCH);
  }, [sortedGroups]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((current) => Math.min(current + PAGE_VIEW_BATCH, sortedGroups.length));
  }, [hasMore, sortedGroups.length]);

  useEffect(() => {
    if (!hasMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleLoadMore();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Product Catalog
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Browse {stats.total} items grouped into {groupedProducts.length} base products.
            </p>
          </div>

          <div className="hidden md:flex gap-4">
            <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-slate-800">
              <span className="text-xs font-medium text-slate-500 uppercase">Categories</span>
              <p className="font-semibold text-slate-900 dark:text-white">{availableCategories.length}</p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="sticky top-4 z-10 space-y-4 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-xl ring-1 ring-slate-900/5 dark:bg-slate-900/80 dark:ring-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="h-10 w-full rounded-lg border-0 bg-slate-100 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-brand dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-lg border-0 bg-slate-100 px-3 pr-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="h-10 rounded-lg border-0 bg-slate-100 px-3 pr-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors ${selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
            >
              All
            </button>
            {highlightedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
                className={`flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors whitespace-nowrap ${selectedCategory === cat.id
                    ? 'bg-brand text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && products.length === 0 && (
          <div className="flex h-64 w-full flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading catalog...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGroups.length === 0 && (
          <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
              <PackageX className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No products found</h3>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/10 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product Grid - RENDERING GROUPS NOT RAW PRODUCTS */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedGroups.slice(0, visibleCount).map((group, idx) => (
            <CatalogCard
              key={group.variants[0]?.id || idx}
              group={group}
            />
          ))}
        </section>

        <div ref={loadMoreRef} className="h-10 w-full" />
        {hasMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

// NOTE: This now accepts a 'group', finds the base product, and renders ONE card
function CatalogCard({ group }: { group: VariantGroup }) {
  const product = group.variants[0]; // Base product is the lowest priced / first one
  if (!product) return null;

  return (
    <Link
      href={`/catalog/${product.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-brand/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={product.imageUrl ?? DEFAULT_PLACEHOLDER}
          alt={group.baseName}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
        {product.category && (
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-300">
            {product.category.name}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Uses Base Name (e.g. "Star Paint") instead of Variant Name ("Star Paint 1L") */}
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-brand dark:text-white">
          {group.baseName}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {product.description || 'No description available.'}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Starting at</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatPrice(product.price, product.currency)}
              </p>
            </div>

            {/* Show Variant Count Badge if grouped */}
            {group.variants.length > 1 ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {group.variants.length} sizes
              </span>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand group-hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- UTILS ---

function formatPrice(value: number, currency?: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${currency || ''} ${value}`;
  }
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function deriveCategoriesFromProducts(products: CatalogProduct[]): CatalogCategory[] {
  const map = new Map<string, CatalogCategory>();
  products.forEach((product) => {
    if (product.category) {
      map.set(product.category.id, product.category);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// --- GROUPING LOGIC RESTORED ---
function deriveBaseName(name: string) {
  if (!name) return '';
  // Removes "1L", "5kg", "200ml", etc. from the end or middle of names
  const normalized = name.replace(/\s*[-(]?\s*\d+(\.\d+)?\s*(ltr|l|kg|ml|g|gm)\s*[)]?/gi, '').trim();
  return normalized.replace(/[-–—]\s*$/, '').trim();
}

function groupProducts(products: CatalogProduct[]): VariantGroup[] {
  const map = new Map<string, CatalogProduct[]>();

  for (const product of products) {
    const base = deriveBaseName(product.name);
    if (!map.has(base)) {
      map.set(base, []);
    }
    map.get(base)?.push(product);
  }

  return Array.from(map.entries()).map(([baseName, variants]) => ({
    baseName,
    // Sort variants so lowest price is first (for "Starting at..." logic)
    variants: variants.sort((a, b) => a.price - b.price)
  }));
}