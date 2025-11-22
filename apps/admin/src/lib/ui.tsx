"use client";

import { ChevronDown, Loader2, Search } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "../utils/cn";

export function PageHeader({
  title,
  eyebrow,
  description,
  actions
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.35em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function FilterPill({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
      <span>{label}</span>
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-inner transition focus:border-brand focus:outline-none focus:ring-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      </div>
    </label>
  );
}

export function SearchInput({
  value,
  placeholder,
  onChange
}: {
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-within:border-brand focus-within:ring-0 dark:border-slate-800 dark:bg-slate-900/70">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        className="w-full border-none bg-transparent text-slate-800 outline-none placeholder:text-slate-400 ring-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 dark:text-white"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TableShell({
  headers,
  children
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="grid auto-cols-fr grid-flow-col gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {headers.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">{children}</div>
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="px-4 py-6 text-sm text-muted">
      {title}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function Badge({
  children,
  tone
}: {
  children: ReactNode;
  tone?: "success" | "warn" | "info" | "muted";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : tone === "info"
      ? "bg-sky-50 text-sky-700 ring-sky-100"
      : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1",
        toneClasses
      )}
    >
      {children}
    </span>
  );
}
