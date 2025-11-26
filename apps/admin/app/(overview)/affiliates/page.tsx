"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, ShieldX } from "lucide-react";
import { adminApi } from "../../../src/lib/api-client";
import {
  Badge,
  EmptyState,
  FilterPill,
  LoadingRow,
  PageHeader,
  SearchInput,
  TableShell
} from "../../../src/lib/ui";

type AffiliateRow = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  kycStatus: string;
  payoutOnHold?: boolean;
  country?: string | null;
  payoutMethod?: string | null;
  createdAt: string;
  phone?: string | null;
  notes?: string[];
  payoutDetails?: Record<string, unknown> | null;
  panImageUrl?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarBackUrl?: string | null;
};

export default function AffiliatesPage() {
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", kycStatus: "all", search: "" });
  const [selected, setSelected] = useState<AffiliateRow | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});

  const stats = useMemo(() => {
    const total = meta.total ?? rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const verified = rows.filter((r) => r.kycStatus === "verified").length;
    const onHold = rows.filter((r) => r.payoutOnHold).length;
    return { total, active, verified, onHold };
  }, [rows, meta]);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.listAffiliates({
          search: filters.search || undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          kycStatus: filters.kycStatus !== "all" ? filters.kycStatus : undefined,
          page,
          pageSize: 10
        } as any);

        setRows(
          res.data.map((item: any) => ({
            id: item.id,
            email: item.email,
            displayName: item.displayName ?? item.email,
            status: item.status,
            kycStatus: item.kycStatus ?? "pending",
            country: item.country ?? null,
            payoutMethod: item.payoutMethod ?? null,
            createdAt: item.createdAt,
            phone: item.phone ?? null,
            notes: [],
            payoutDetails: item.payoutDetails ?? null,
            panImageUrl: item.panImageUrl ?? null,
            aadhaarFrontUrl: item.aadhaarFrontUrl ?? null,
            aadhaarBackUrl: item.aadhaarBackUrl ?? null,
            payoutOnHold: Boolean(item.payoutOnHold)
          }))
        );
        setMeta(res.meta ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load affiliates");
      } finally {
        setLoading(false);
      }
    },
    [filters, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setLoading(true);
    try {
      await adminApi.updateAffiliateStatus(id, status);
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const updateKyc = async (id: string, decision: "approved" | "rejected") => {
    setLoading(true);
    try {
      await adminApi.decideAffiliateKyc(id, decision);
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update KYC");
    } finally {
      setLoading(false);
    }
  };

  const resetKyc = async (id: string) => {
    await updateKyc(id, "rejected");
    await updateKyc(id, "approved");
  };

  const togglePayoutHold = async (id: string) => {
    const target = rows.find((r) => r.id === id);
    const next = target?.status === "blocked" ? "active" : "blocked";
    await updateStatus(id, next);
  };

  const addNote = () => {
    setNoteInput("");
  };

  const totalPages = meta.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Directory & KYC"
        eyebrow="Affiliates"
        description="Search, filter, and review affiliate KYC and payout readiness."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <FilterPill
              label="Status"
              value={filters.status}
              onChange={(value) => {
                setFilters((f) => ({ ...f, status: value }));
                setPage(1);
              }}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending" },
                { value: "blocked", label: "Blocked" }
              ]}
            />
            <FilterPill
              label="KYC"
              value={filters.kycStatus}
              onChange={(value) => {
                setFilters((f) => ({ ...f, kycStatus: value }));
                setPage(1);
              }}
              options={[
                { value: "all", label: "All" },
                { value: "verified", label: "Verified" },
                { value: "in_review", label: "In Review" },
                { value: "pending", label: "Pending" },
                { value: "rejected", label: "Rejected" }
              ]}
            />
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard label="Active" value={stats.active.toString()} tone="success" />
        <StatCard label="Verified KYC" value={stats.verified.toString()} tone="info" />
        <StatCard label="Payout hold" value={stats.onHold.toString()} tone="warn" />
      </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">
            {(meta.total ?? rows.length) || 0} affiliates — Page {page} of {totalPages}
          </span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading affiliates..." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No affiliates found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Affiliate</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.displayName}</h3>
                      <p className="text-xs text-muted">{row.email}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge tone={row.status === "blocked" ? "warn" : row.status === "active" ? "success" : "muted"}>
                        {row.status}
                      </Badge>
                      <Badge
                        tone={
                          row.kycStatus === "verified"
                            ? "success"
                            : row.kycStatus === "rejected"
                            ? "warn"
                            : "info"
                        }
                      >
                        {row.kycStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Info label="Payout" value={row.payoutMethod ?? "-"} />
                    <Info label="Country" value={row.country ?? "-"} />
                    <Info label="Phone" value={row.phone ?? "-"} />
                    <Info label="Created" value={new Date(row.createdAt).toLocaleDateString()} />
                    <Info label="Payout hold" value={row.payoutOnHold ? "On hold" : "OK"} />
                    <Info label="KYC" value={row.kycStatus} />
                  </div>
                  <div className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    Notes: {(row.notes?.length ?? 0) || "None yet"}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted">
                      Status: <span className="font-semibold text-slate-900 dark:text-white">{row.status}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => setSelected(row)}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => updateKyc(row.id, "approved")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => updateStatus(row.id, row.status === "blocked" ? "active" : "blocked")}
                      >
                        {row.status === "blocked" ? "Unblock" : "Block"}
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => togglePayoutHold(row.id)}
                      >
                        {row.payoutOnHold ? "Release payouts" : "Hold payouts"}
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => resetKyc(row.id)}
                      >
                        Reset KYC
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 text-xs text-muted">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50 dark:border-white/10"
          >
            Next
          </button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Affiliate</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selected.displayName}
                </h3>
                <p className="text-sm text-muted">{selected.email}</p>
              </div>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard label="Status" value={selected.status} />
              <InfoCard label="KYC" value={selected.kycStatus} />
              <InfoCard label="Payout" value={selected.payoutMethod ?? "-"} />
              <InfoCard label="Country" value={selected.country ?? "-"} />
              <InfoCard label="Phone" value={selected.phone ?? "-"} />
              <InfoCard
                label="Created"
                value={new Date(selected.createdAt).toLocaleDateString()}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 text-sm shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/70 dark:text-slate-200">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Payout details
                </p>
                <div className="grid gap-2 text-xs text-slate-700 dark:text-slate-200">
                  {selected.payoutMethod === "upi" && (
                    <>
                      <PayoutField label="UPI ID" value={(selected.payoutDetails as any)?.upiId} />
                      <PayoutField label="PAN" value={(selected.payoutDetails as any)?.panNumber} />
                      <PayoutField label="Aadhaar" value={(selected.payoutDetails as any)?.aadhaarNumber} />
                    </>
                  )}
                  {selected.payoutMethod === "bank_transfer" && (
                    <>
                      <PayoutField label="Bank" value={(selected.payoutDetails as any)?.bank} />
                      <PayoutField label="Account" value={(selected.payoutDetails as any)?.account} />
                      <PayoutField label="IFSC" value={(selected.payoutDetails as any)?.ifsc} />
                      <PayoutField label="PAN" value={(selected.payoutDetails as any)?.panNumber} />
                      <PayoutField label="Aadhaar" value={(selected.payoutDetails as any)?.aadhaarNumber} />
                    </>
                  )}
                  {!selected.payoutMethod && <p className="text-slate-500 dark:text-slate-400">Not provided</p>}
                </div>
              </div>

              <div className="space-y-3">
                <DocPreview label="PAN" url={selected.panImageUrl} />
                <DocPreview label="Aadhaar front" url={selected.aadhaarFrontUrl} />
                <DocPreview label="Aadhaar back" url={selected.aadhaarBackUrl} />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                onClick={() => updateKyc(selected.id, "approved")}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve KYC
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                onClick={() => updateKyc(selected.id, "rejected")}
              >
                Mark In Review
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                onClick={() => updateKyc(selected.id, "rejected")}
              >
                <ShieldX className="h-4 w-4" />
                Reject KYC
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                onClick={() => updateStatus(selected.id, "active")}
              >
                Activate
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                onClick={() => updateStatus(selected.id, "blocked")}
              >
                Block
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Notes</p>
              <div className="flex items-center gap-2">
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  onClick={() => addNote()}
                  disabled={!noteInput.trim()}
                >
                  Save
                </button>
              </div>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {(selected.notes ?? []).map((note, idx) => (
                  <div
                    key={`${selected.id}-note-${idx}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {note}
                  </div>
                ))}
                {(!selected.notes || selected.notes.length === 0) && (
                  <p className="text-xs text-muted">No notes yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function DocPreview({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        {label}: not provided
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      <img src={url} alt={label} className="h-24 w-full rounded-xl object-cover" />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex text-xs font-semibold text-brand hover:underline"
      >
        Open
      </a>
    </div>
  );
}

function PayoutField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
      <span className="uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="truncate">{value || "-"}</span>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "info" | "warn" }) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "info"
        ? "bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
        : tone === "warn"
          ? "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
          : "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses} rounded-xl px-3 py-2`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
