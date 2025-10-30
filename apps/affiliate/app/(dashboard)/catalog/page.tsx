import Image from 'next/image';

const products = [
  {
    id: '1',
    name: 'StarShield Elite Helmet',
    category: 'Protective Gear',
    price: '$249',
    conversion: '4.2%',
    link: 'https://starshield.io/p/elite-helmet',
    image: 'https://placehold.co/640x384/png?text=Elite+Helmet'
  },
  {
    id: '2',
    name: 'Photon Filter Visor',
    category: 'Optics',
    price: '$189',
    conversion: '5.1%',
    link: 'https://starshield.io/p/photon-visor',
    image: 'https://placehold.co/640x384/png?text=Photon+Visor'
  },
  {
    id: '3',
    name: 'Nova Impact Armor',
    category: 'Apparel',
    price: '$329',
    conversion: '3.7%',
    link: 'https://starshield.io/p/nova-armor',
    image: 'https://placehold.co/640x384/png?text=Nova+Armor'
  }
];

export default function CatalogPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Product Catalog</p>
        <h1 className="text-3xl font-semibold text-white">Curated for Performance</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Filter products by category, download creatives, and generate deep links with your tracking
          parameters baked in. Conversions refresh every 15 minutes.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="group flex flex-col rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-brand/10 hover:shadow-accent"
          >
            <div className="relative h-48 overflow-hidden rounded-t-3xl">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/0" />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="space-y-1">
                <span className="rounded-full border border-brand/40 bg-brand/15 px-3 py-1 text-xs font-medium text-brand">
                  {product.category}
                </span>
                <h2 className="text-lg font-semibold text-white">{product.name}</h2>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-xs text-slate-300">
                <div>
                  <dt className="uppercase tracking-wide text-slate-400">Price</dt>
                  <dd className="text-base font-semibold text-white">{product.price}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-slate-400">Conv. rate</dt>
                  <dd className="text-base font-semibold text-white">{product.conversion}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-col gap-2 text-xs text-slate-400">
                <p className="rounded-2xl border border-slate-800/60 bg-slate-950/60 px-4 py-3 font-mono text-[11px] text-slate-200">
                  {product.link}?aff=alex&utm_source=instagram
                </p>
                <div className="flex gap-2">
                  <button className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark">
                    Create Link
                  </button>
                  <button className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand hover:text-brand">
                    Download kit
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
