'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { LinkBuilder } from '../../../../src/components/catalog/LinkBuilder';
import { catalogApi } from '../../../../src/lib/api-client';
import type { CatalogProductDetail } from '../../../../src/types/catalog';

const PLACEHOLDER = 'https://placehold.co/800x500/png?text=StarShield+Product';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<CatalogProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    catalogApi
      .product(id)
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
        if (!payload.product) {
          notFound();
        }
      })
      .catch((error) => {
        if (!mounted) return;
        const msg = error instanceof Error ? error.message : 'Unable to load product';
        toast.error(msg);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!data?.product && !loading) {
    notFound();
  }

  const product = data?.product;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-sm text-muted">
          <Link href="/catalog" className="text-brand hover:underline">
            Catalog
          </Link>
          <span aria-hidden="true">/</span>
          {product?.category ? (
            <>
              <span className="truncate">{product.category.name}</span>
              <span aria-hidden="true">/</span>
            </>
          ) : null}
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {product?.name ?? 'Product'}
          </span>
        </nav>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <div className="relative aspect-[4/3] w-full">
            {loading ? (
              <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800" />
            ) : (
              <Image
                src={product?.imageUrl || PLACEHOLDER}
                alt={product?.name ?? 'Product image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            )}
          </div>
          <div className="space-y-2 p-5">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {product?.name ?? 'Product'}
            </h1>
            <p className="text-sm text-muted">{product?.description || 'No description available.'}</p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xl font-semibold text-slate-900 dark:text-emerald-100">
                {product ? formatPrice(product.price, product.currency) : '--'}
              </span>
              {product?.sku && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-200">
                  <Tag className="h-3 w-3" />
                  {product.sku}
                </span>
              )}
            </div>
            {product?.landingUrl && (
              <Link
                href={product.landingUrl}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                View landing page
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand">Share</h2>
            <p className="mt-1 text-sm text-muted">
              Generate your tracked link for this SKU. Variants below let you switch sizes before creating the link.
            </p>
            {product && <LinkBuilder product={product} />}
          </div>

          {data?.variants?.length ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Variants
                </h3>
                <span className="text-xs text-muted">{data.variants.length} options</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.variants.map((variant) => (
                  <Link
                    key={variant.id}
                    href={`/catalog/${variant.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="relative mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
                      <Image
                        src={variant.imageUrl || PLACEHOLDER}
                        alt={variant.name}
                        width={180}
                        height={140}
                        className="h-24 w-auto object-contain transition group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="line-clamp-2 min-h-[44px] font-semibold leading-snug text-slate-900 dark:text-white">
                      {variant.name}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-emerald-100">
                      {formatPrice(variant.price, variant.currency)}
                    </p>
                    {variant.sku && (
                      <p className="truncate text-[11px] uppercase tracking-wide text-slate-400">
                        {variant.sku}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatPrice(value: number, currency?: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
}
