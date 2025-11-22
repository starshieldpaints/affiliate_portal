"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock4,
  CloudDrizzle,
  Database,
  DollarSign,
  FileText,
  ShieldCheck,
  Users,
  Zap
} from "lucide-react";

const kpis = [
  { label: "GMV (30d)", value: "$2.4M", delta: "+6.3%", tone: "success", icon: DollarSign },
  { label: "Attributed Orders", value: "18,420", delta: "+4.1%", tone: "info", icon: ArrowUpRight },
  { label: "Active Affiliates", value: "642", delta: "+2.0%", tone: "info", icon: Users },
  { label: "Alerts", value: "7", delta: "+1", tone: "warn", icon: AlertTriangle }
];

const timeline = [
  { time: "17m ago", text: "ETL to ClickHouse finished", icon: CheckCircle2 },
  { time: "1h ago", text: "Risk model refreshed (0.61 threshold)", icon: Zap },
  { time: "Next", text: "Payout batch scheduled for May 26, 2025", icon: Clock4 }
];

const queues = [
  { label: "Webhooks", value: "99.1%", detail: "delivery success", tone: "success", icon: CloudDrizzle },
  { label: "Payout queue", value: "$182K", detail: "awaiting disbursal", tone: "info", icon: DollarSign },
  { label: "Jobs backlog", value: "42", detail: "pending tasks", tone: "warn", icon: Activity }
];

const alerts = [
  { label: "Fraud watchlist", value: "4", detail: "High-risk orders to review", tone: "warn", icon: ShieldCheck },
  { label: "Attribution overrides", value: "5", detail: "Manual reviews pending", tone: "info", icon: FileText },
  { label: "Audit trail", value: "OK", detail: "Immutable logs intact", tone: "success", icon: Database }
];

const recent = [
  { title: "Commission rule updated", by: "alex@starshield.io", when: "8m ago", tone: "info" },
  { title: "Refund approved (SO-1001)", by: "finance@starshield.io", when: "24m ago", tone: "success" },
  { title: "Affiliate blocked for fraud", by: "risk@starshield.io", when: "1h ago", tone: "warn" }
];

const channelMix = [
  { label: "Meta Ads", value: "38%" },
  { label: "Influencers", value: "27%" },
  { label: "Search", value: "19%" },
  { label: "Direct/Email", value: "16%" }
];

const payoutBacklog = [
  { label: "Queued", value: "$182K", tone: "warn" },
  { label: "Processing", value: "$64K", tone: "info" },
  { label: "Failed", value: "$4.2K", tone: "warn" }
];

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg dark:border-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-brand/80">Command console</p>
            <h1 className="text-4xl font-semibold leading-tight">Program Overview</h1>
            <p className="max-w-3xl text-sm text-slate-200">
              Live snapshot across GMV, conversions, affiliates, payouts, and risk. Built for fast decisioning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-white/40">
              <Bell className="h-4 w-4" />
              Live alerts
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-white/40">
              <ArrowUpRight className="h-4 w-4" />
              Export snapshot
            </button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-sm backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-200/90">{kpi.label}</p>
                <span className="rounded-xl bg-white/10 p-2 text-brand">
                  <kpi.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">{kpi.value}</p>
              <p className="text-xs text-slate-200/90">{kpi.delta}</p>
            </article>
          ))}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Automation timeline
          </h2>
          <ol className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
            {timeline.map((item) => (
              <li
                key={item.text}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70"
              >
                <item.icon className="mt-0.5 h-4 w-4 text-brand" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.time}
                  </span>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Ops & Queues
            </h2>
            <div className="mt-4 grid gap-3">
              {queues.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand/10 p-2 text-brand">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        {item.label}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{item.detail}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Health & Alerts
            </h2>
            <div className="mt-4 grid gap-3">
              {alerts.map((alert) => (
                <div
                  key={alert.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand/10 p-2 text-brand">
                      <alert.icon className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        {alert.label}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{alert.detail}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                    {alert.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Recent activity
            </h2>
            <button className="text-xs font-semibold uppercase tracking-wide text-brand">View audit</button>
          </div>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {recent.map((item) => (
              <div key={item.title} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-brand/10 p-2 text-brand">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">{item.title}</span>
                    <span className="text-xs text-muted">{item.by}</span>
                  </div>
                </div>
                <span className="text-xs text-muted">{item.when}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Risk & compliance
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-brand" />
                <span>Step-up auth required for critical actions</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Enabled</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-brand" />
                <span>Audit log retention</span>
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">180 days</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-brand" />
                <span>Fraud model threshold</span>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">0.61</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Channel mix
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {channelMix.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Payout backlog
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {payoutBacklog.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {item.label}
                </span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
