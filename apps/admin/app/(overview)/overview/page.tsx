"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  Clock4,
  CloudDrizzle,
  Database,
  DollarSign,
  FileText,
  Headset,
  Download,
  PieChart,
  ShieldCheck,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { cn } from "../../../src/utils/cn";
import type { OverviewResponse } from "../../../src/types/overview";
import { adminApi } from "../../../src/lib/api-client";

const defaultKpis = [
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

const revenueAttribution = [
  { label: "MTD Revenue", value: "$820K", detail: "All channels", icon: TrendingUp },
  { label: "Attributed Revenue", value: "$610K", detail: "Affiliates & partners", icon: Target },
  { label: "Commission Cost", value: "$118K", detail: "Payout exposure", icon: DollarSign },
  { label: "Gross Margin", value: "74%", detail: "Post commissions", icon: PieChart }
];

const activationFunnel = [
  { label: "Signed up", value: "1,420", drop: "100%" },
  { label: "KYC verified", value: "1,088", drop: "77%", badge: "Median: 15h" },
  { label: "First order", value: "764", drop: "54%", badge: "Median: 2.3d" },
  { label: "Payout ready", value: "488", drop: "34%", badge: "Median: 5.1d" }
];

const riskRadar = [
  { label: "Velocity", score: "0.68", status: "watch", icon: ShieldAlert },
  { label: "Self-purchase", score: "0.35", status: "normal", icon: ShieldCheck },
  { label: "Duplicate device", score: "0.51", status: "watch", icon: ShieldAlert },
  { label: "Chargebacks", score: "0.12", status: "normal", icon: ShieldCheck }
];

const payoutReadiness = [
  { label: "Ready", value: "182", amount: "$142K" },
  { label: "Missing KYC", value: "64", amount: "$38K" },
  { label: "Bank validation", value: "22", amount: "$14K" }
];

const opsHealth = [
  { label: "API latency (p95)", value: "128 ms", tone: "good" },
  { label: "Error rate", value: "0.21%", tone: "warn" },
  { label: "Webhook backlog", value: "34", tone: "warn" }
];

const ordersSnapshot = [
  { label: "Today", orders: "624", refundRate: "1.9%" },
  { label: "7d", orders: "4,388", refundRate: "2.1%" },
  { label: "Manual overrides", orders: "62", refundRate: "--" }
];

const commissionCoverage = [
  { label: "Catalog coverage", value: "84%", detail: "Rules applied to SKUs" },
  { label: "Expiring soon", value: "6", detail: "Need review" },
  { label: "Recent changes", value: "3", detail: "Past 24h" }
];

const supportPulse = [
  { label: "Open tickets", value: "12", detail: "3 high / 9 normal" },
  { label: "Top issue", value: "KYC delays", detail: "41% of tickets" },
  { label: "SLA breach risk", value: "2", detail: "Escalate" }
];

const exportsQuick = [
  { label: "Generate 30d payout CSV", action: "Generate", icon: Download },
  { label: "Export orders 7d", action: "Export", icon: Download },
  { label: "Audit log CSV", action: "Export", icon: Download }
];

const engagement = [
  { label: "Top affiliate", value: "aff_102 ( $58K )" },
  { label: "Top channel", value: "Influencers (27%)" },
  { label: "Stalled", value: "17 need nudges" }
];

export default function OverviewPage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.overview();
        setOverview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load overview");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = useMemo(() => {
    if (!overview) return defaultKpis;
    return [
      {
        label: "GMV (30d)",
        value: formatCurrency(overview.kpis.gmv30d, "INR"),
        delta: defaultKpis[0].delta,
        tone: "success",
        icon: DollarSign
      },
      {
        label: "Attributed Orders",
        value: overview.kpis.attributedOrders.toLocaleString("en-US"),
        delta: defaultKpis[1].delta,
        tone: "info",
        icon: ArrowUpRight
      },
      {
        label: "Active Affiliates",
        value: overview.kpis.activeAffiliates.toLocaleString("en-US"),
        delta: defaultKpis[2].delta,
        tone: "info",
        icon: Users
      },
      {
        label: "Alerts",
        value: overview.kpis.openAlerts.toLocaleString("en-US"),
        delta: defaultKpis[3].delta,
        tone: "warn",
        icon: AlertTriangle
      }
    ];
  }, [overview]);

  const ordersSnapshotData = useMemo(() => {
    if (!overview) return ordersSnapshot;
    return [
      { label: "Today", orders: overview.orders.today.toString(), refundRate: `${overview.orders.refundRate}%` },
      { label: "7d", orders: overview.orders.last7d.toString(), refundRate: `${overview.orders.refundRate}%` },
      { label: "Manual overrides", orders: overview.orders.manualOverrides.toString(), refundRate: "--" }
    ];
  }, [overview]);

  const activationFunnelData = useMemo(() => {
    if (!overview) return activationFunnel;
    return [
      { label: "Signed up", value: overview.activationFunnel.signedUp.toString(), drop: "100%", badge: undefined },
      { label: "KYC verified", value: overview.activationFunnel.kycVerified.toString(), drop: "—", badge: undefined },
      { label: "First order", value: overview.activationFunnel.firstOrder.toString(), drop: "—", badge: undefined },
      { label: "Payout ready", value: overview.activationFunnel.payoutReady.toString(), drop: "—", badge: undefined }
    ];
  }, [overview]);

  const payoutReadinessData = useMemo(() => {
    if (!overview) return payoutReadiness;
    return [
      { label: "Ready", value: overview.payouts.readyCount.toString(), amount: formatCurrency(overview.payouts.readyAmount, "INR") },
      { label: "Processing", value: overview.payouts.processingCount.toString(), amount: "—" },
      { label: "Failed", value: overview.payouts.failedCount.toString(), amount: "—" }
    ];
  }, [overview]);

  const riskData = useMemo(() => {
    if (!overview) return riskRadar;
    return [
      { label: "Velocity", score: "—", status: "watch", icon: ShieldAlert },
      { label: "Self-purchase", score: "—", status: "normal", icon: ShieldCheck },
      { label: "Duplicate device", score: "—", status: "watch", icon: ShieldAlert },
      { label: "Open alerts", score: overview.risk.openAlerts.toString(), status: "watch", icon: ShieldAlert }
    ];
  }, [overview]);

  const payoutBacklogData = useMemo(() => {
    if (!overview?.payoutsQueue) return payoutBacklog;
    return [
      { label: "Queued", value: overview.payoutsQueue.queued.toString(), tone: "warn" },
      { label: "Processing", value: overview.payoutsQueue.processing.toString(), tone: "info" },
      { label: "Failed", value: overview.payoutsQueue.failed.toString(), tone: "warn" }
    ];
  }, [overview]);
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

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
          {error}
        </div>
      )}

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
            {payoutBacklogData.map((item) => (
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

      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Revenue & Attribution" description="Costs and coverage across channels" icon={<TrendingUp className="h-4 w-4 text-brand" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {revenueAttribution.map((item) => (
              <div key={item.label} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {item.label}
                  <span className="rounded-full bg-brand/10 p-2 text-brand">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.value}</p>
                <p className="text-xs text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Activation funnel" description="Signup to payout readiness" icon={<Target className="h-4 w-4 text-brand" />}>
          <div className="space-y-2">
            {activationFunnelData.map((step, idx) => (
              <div key={step.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">{idx + 1}. {step.label}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{step.drop}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{step.value}</span>
                  {step.badge && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">{step.badge}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Risk radar" description="Live risk signals" icon={<ShieldAlert className="h-4 w-4 text-brand" />}>
          <div className="space-y-2">
            {riskData.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-brand/10 p-2 text-brand">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.status}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.score}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Payout readiness" description="Blocked vs ready vs pending" icon={<DollarSign className="h-4 w-4 text-brand" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            {payoutReadinessData.map((item) => (
              <div key={item.label} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{item.label}</span>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">{item.value}</span>
                <span className="text-xs text-muted">{item.amount}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Ops health" description="SLOs and queues" icon={<Activity className="h-4 w-4 text-brand" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            {opsHealth.map((item) => (
              <div key={item.label} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{item.label}</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">{item.value}</span>
                <span className={cn("text-[11px] uppercase tracking-wide", item.tone === "good" ? "text-emerald-600 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
                  {item.tone === "good" ? "Healthy" : "Watch"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Orders snapshot" description="Volume and refunds" icon={<Check className="h-4 w-4 text-brand" />}>
          <div className="space-y-2">
            {ordersSnapshotData.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.orders}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Refunds {item.refundRate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Commission coverage" description="Rules applied and changes" icon={<PieChart className="h-4 w-4 text-brand" />}>
          <div className="space-y-2">
            {commissionCoverage.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                  <span className="text-xs text-muted">{item.detail}</span>
                </div>
                <span className="text-base font-semibold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Support pulse" description="Tickets and trends" icon={<Headset className="h-4 w-4 text-brand" />}>
          <div className="space-y-2 text-sm">
            {supportPulse.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                  <span className="text-xs text-muted">{item.detail}</span>
                </div>
                <span className="text-base font-semibold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Exports & reports" description="One-click pulls" icon={<Download className="h-4 w-4 text-brand" />}>
          <div className="space-y-2 text-sm">
            {exportsQuick.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                <button className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Engagement" description="Leaders and nudges" icon={<Users className="h-4 w-4 text-brand" />}>
          <div className="space-y-2 text-sm">
            {engagement.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                <span className="text-xs text-muted">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Card({
  title,
  description,
  icon,
  children
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              {title}
            </h3>
          </div>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function formatCurrency(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}
