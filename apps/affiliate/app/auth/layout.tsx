export const metadata = {};
export const dynamic = "force-static";


import type { ReactNode } from 'react';
import { ArrowUpRight, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { ThemeToggle } from '../../src/components/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-body)] px-4 py-12 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
      <DecorativeBackdrop />
      <div className="pointer-events-none absolute top-4 right-4 z-50 flex justify-end sm:right-6 lg:right-8">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
      <div className="relative mx-auto flex max-w-5xl flex-col-reverse gap-8 lg:flex-row">
        <HeroPanel />
        <section className="flex w-full flex-col rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.15)] transition dark:text-white md:p-8">
          <div className="mx-auto w-full max-w-md space-y-6">{children}</div>
        </section>
      </div>
    </div>
  );
}

function HeroPanel() {
  return (
    <section className="flex w-full flex-col justify-between rounded-3xl border border-[var(--panel-border)] bg-white/90 p-6 text-slate-900 shadow-[0_50px_150px_rgba(15,23,42,0.12)] transition-colors dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/50 dark:to-black/80 dark:text-white md:p-8">
      <div className="space-y-6">
        <div
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-1 text-[0.65rem] uppercase tracking-[0.4em] text-brand shadow-sm dark:border-white/10 dark:bg-white/5 animate-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          <Sparkles className="h-3 w-3 text-sky-500 dark:text-brand" />
          Affiliate Cloud
        </div>

        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 dark:text-white lg:text-4xl">
            One portal for trusted partners, payouts, and attribution intelligence.
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 lg:text-base">
            Monitor every conversion, lock commissions automatically, and share launch-ready assets
            with affiliates across the globe.
          </p>
        </div>
        <FeatureList />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <StatCard
          title="Fraud detection"
          subtitle="powered by inference"
          value="98.7%"
          trend="+3.2%"
          delay="200ms"
        />
        <StatCard title="Avg. payout release" subtitle="after verification" value="6 days" delay="260ms" />
        <StatCard title="Live campaigns" subtitle="across regions" value="184" trend="+12" delay="320ms" />
        <StatCard title="Creative refresh" subtitle="median cadence" value="10 days" delay="380ms" />
      </div>
    </section>
  );
}

function FeatureList() {
  const features = [
    { icon: ShieldCheck, label: 'Zero-guess payouts' },
    { icon: Target, label: 'Attribution radar' },
    { icon: ArrowUpRight, label: 'Live revenue pulse' },
    { icon: Sparkles, label: 'Global launch kits' }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {features.map(({ icon: Icon, label }, index) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-sm text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 animate-fade-up"
          style={{ animationDelay: `${180 + index * 40}ms` }}
        >
          <span className="rounded-xl bg-gradient-to-br from-brand/20 to-emerald-400/20 p-2 text-brand dark:from-brand/20 dark:to-sky-400/30">
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

function StatCard({
  title,
  subtitle,
  value,
  trend,
  delay
}: {
  title: string;
  subtitle?: string;
  value: string;
  trend?: string;
  delay: string;
}) {
  return (
    <div
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-sm text-slate-600 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-emerald-300/60 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 animate-fade-up"
      style={{ animationDelay: delay }}
    >
      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{title}</p>
      {subtitle && (
        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-slate-900 dark:text-white">
        <p className="text-2xl font-semibold">{value}</p>
        {trend && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[0.7rem] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function DecorativeBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.08),_transparent_60%)]" />
      </div>
      <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-brand/15 blur-[140px]" />
      <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-cyan-500/15 blur-[140px]" />
    </div>
  );
}
