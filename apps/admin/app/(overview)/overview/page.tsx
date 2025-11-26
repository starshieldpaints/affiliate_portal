"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../src/lib/api-client";
import type { OverviewResponse } from "../../../src/types/overview";
import type { AdminOrder } from "../../../src/types/orders";
import type { AdminPayoutLine } from "../../../src/types/payouts";
import type { AdminFraudAlert } from "../../../src/types/fraud";
import type { AdminReport } from "../../../src/types/reports";
import type { AdminAuditLog } from "../../../src/types/audit";
import type { AdminAffiliate } from "../../../src/types/affiliates";
import type { CommissionRulesListResponse } from "../../../src/types/commission-rules";
import { cn } from "../../../src/utils/cn";
import { AlertTriangle, ArrowUpRight, DollarSign, Users, ShieldAlert, RefreshCw } from "lucide-react";

type KpiCard = { label: string; value: string; hint?: string; tone?: "success" | "warn" | "info" };

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [payouts, setPayouts] = useState<AdminPayoutLine[]>([]);
  const [alerts, setAlerts] = useState<AdminFraudAlert[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [audits, setAudits] = useState<AdminAuditLog[]>([]);
  const [kycQueue, setKycQueue] = useState<AdminAffiliate[]>([]);
  const [rulesSummary, setRulesSummary] = useState<{ active: number; inactive: number }>({ active: 0, inactive: 0 });

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, ordersRes, payoutsRes, alertsRes, reportsRes, auditRes, kycRes, rulesRes] = await Promise.all([
          adminApi.overview(),
          adminApi.listOrders({ page: 1, pageSize: 5 }),
          adminApi.listPayoutLines({ page: 1, pageSize: 5 }),
          adminApi.listFraudAlerts({ status: "open", page: 1, pageSize: 5 }),
          adminApi.listReports({ type: "summary" }),
          adminApi.listAuditLogs({ page: 1, pageSize: 10 }),
          adminApi.listAffiliates({ kycStatus: "pending" }),
          adminApi.listCommissionRules()
        ]);
        setData(overviewRes);
        setOrders(ordersRes.data ?? []);
        setPayouts(payoutsRes.data ?? []);
        setAlerts(alertsRes.data ?? []);
        setReports(reportsRes.data ?? []);
        setAudits(auditRes.data ?? []);
        setKycQueue(kycRes.data ?? []);
        const rules = (rulesRes as CommissionRulesListResponse).data ?? [];
        setRulesSummary({
          active: rules.filter((r) => r.status === "active").length,
          inactive: rules.filter((r) => r.status !== "active").length
        });
      } catch (err: any) {
        setError(err?.message ?? "Unable to load overview");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const kpis: KpiCard[] = data
    ? [
        {
          label: "GMV (30d)",
          value: currency(data.kpis.gmv30d),
          hint: "Gross merchandise value",
          tone: "info"
        },
        {
          label: "Attributed Orders",
          value: number(data.kpis.attributedOrders),
          tone: "success"
        },
        {
          label: "Active Affiliates",
          value: number(data.kpis.activeAffiliates),
          tone: "info"
        },
        {
          label: "Open Alerts",
          value: number(data.kpis.openAlerts),
          tone: data.kpis.openAlerts > 0 ? "warn" : "success"
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Overview</h1>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-800 transition hover:border-brand hover:text-brand disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-50">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map((kpi) => <Kpi key={kpi.label} {...kpi} />)}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Orders">
          <KeyMetric label="Today" value={number(data?.orders.today)} />
          <KeyMetric label="Last 7d" value={number(data?.orders.last7d)} />
          <KeyMetric label="Refund rate" value={`${data?.orders.refundRate ?? 0}%`} />
        </Panel>
        <Panel title="Payouts">
          <KeyMetric label="Ready" value={number(data?.payouts.readyCount)} />
          <KeyMetric label="Processing" value={number(data?.payouts.processingCount)} />
          <KeyMetric label="Failed" value={number(data?.payouts.failedCount)} tone="warn" />
        </Panel>
        <Panel title="Activation Funnel">
          <KeyMetric label="Signed up" value={number(data?.activationFunnel.signedUp)} />
          <KeyMetric label="KYC verified" value={number(data?.activationFunnel.kycVerified)} />
          <KeyMetric label="First order" value={number(data?.activationFunnel.firstOrder)} />
          <KeyMetric label="Payout ready" value={number(data?.activationFunnel.payoutReady)} />
        </Panel>
        <Panel title="Risk">
          <KeyMetric label="Open alerts" value={number(data?.risk.openAlerts)} tone="warn" />
          <KeyMetric label="High risk" value={number(data?.risk.highRiskAlerts)} tone="warn" />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DataCard
          title="Recent orders"
          items={orders.map((o) => ({
            id: o.id,
            primary: o.orderNumber || o.id,
            secondary: new Date(o.createdAt).toLocaleString(),
            meta: `${currency(o.amount, o.currency)} · ${o.status}`
          }))}
          empty="No recent orders"
        />

        <DataCard
          title="Payouts ready"
          items={payouts.map((p) => ({
            id: p.id,
            primary: `${currency(p.amount, p.currency)} · ${p.affiliateId}`,
            secondary: new Date(p.createdAt).toLocaleString(),
            meta: p.status
          }))}
          empty="No payouts ready"
        />

        <DataCard
          title="Open fraud alerts"
          items={alerts.map((a) => ({
            id: a.id,
            primary: a.reason ?? a.type ?? a.id,
            secondary: new Date(a.createdAt).toLocaleString(),
            meta: a.status ?? "open"
          }))}
          empty="No fraud alerts"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">Reports</p>
            <p className="text-sm text-muted">Latest generated exports</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand dark:border-white/10 dark:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Reload
          </button>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-muted">No reports yet.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {reports.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{r.filename ?? r.type}</p>
                <p className="text-xs text-muted">{new Date(r.generatedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DataCard
          title="KYC queue"
          items={kycQueue.slice(0, 6).map((a) => ({
            id: a.id,
            primary: a.name ?? a.email ?? a.id,
            secondary: a.email ?? "",
            meta: "pending KYC"
          }))}
          empty="No pending KYC"
        />
        <DataCard
          title="Recent admin actions"
          items={audits.slice(0, 8).map((a) => ({
            id: a.id,
            primary: a.action,
            secondary: new Date(a.createdAt).toLocaleString(),
            meta: a.performedBy ?? "system"
          }))}
          empty="No recent actions"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DataCard
          title="Refunded / chargeback orders"
          items={orders
            .filter((o) => (o.status ?? "").toLowerCase().includes("refund"))
            .map((o) => ({
              id: o.id,
              primary: o.orderNumber || o.id,
              secondary: new Date(o.createdAt).toLocaleString(),
              meta: `${currency(o.amount, o.currency)} · ${o.status}`
            }))}
          empty="No refunds"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-white">Commission rules</p>
            <ShieldAlert className="h-4 w-4 text-slate-400" />
          </div>
          <div className="grid gap-2">
            <KeyMetric label="Active rules" value={number(rulesSummary.active)} tone="info" />
            <KeyMetric label="Inactive rules" value={number(rulesSummary.inactive)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, tone = "info" }: KpiCard) {
  const icon =
    tone === "success" ? (
      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
    ) : tone === "warn" ? (
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    ) : (
      <DollarSign className="h-4 w-4 text-sky-500" />
    );
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-300">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-white">{title}</p>
        <ShieldAlert className="h-4 w-4 text-slate-400" />
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function KeyMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "warn" | "info";
}) {
  const toneClasses =
    tone === "warn"
      ? "text-amber-500"
      : tone === "info"
        ? "text-sky-500"
        : "text-slate-900 dark:text-white";
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-white/5">
      <span className="text-slate-500 dark:text-slate-300">{label}</span>
      <span className={cn("font-semibold", toneClasses)}>{value}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-3 h-3 w-24 rounded bg-slate-200/60 dark:bg-slate-700/60" />
      <div className="h-6 w-16 rounded bg-slate-200/60 dark:bg-slate-700/60" />
    </div>
  );
}

function currency(value?: number, currencyCode = "INR") {
  if (value === undefined || value === null || Number.isNaN(value)) return "$0";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);
}

function number(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat().format(value);
}

function DataCard({
  title,
  items,
  empty
}: {
  title: string;
  items: { id: string; primary: string; secondary?: string; meta?: string }[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-white">{title}</p>
        <Users className="h-4 w-4 text-slate-400" />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-100 px-3 py-2 text-sm transition hover:border-brand dark:border-white/5"
            >
              <p className="font-semibold text-slate-900 dark:text-white">{item.primary}</p>
              {item.secondary && <p className="text-xs text-muted">{item.secondary}</p>}
              {item.meta && <p className="text-xs text-slate-500 dark:text-slate-300">{item.meta}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
