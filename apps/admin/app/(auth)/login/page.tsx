"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../src/store/auth-store";

export default function AdminLoginPage() {
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const [form, setForm] = useState({ email: "admin@example.com", password: "demo" });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(form);
      router.replace("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand/80">Admin</p>
          <h1 className="text-3xl font-semibold">Console login</h1>
          <p className="text-sm text-slate-200">Use demo credentials to preview the admin UI.</p>
        </header>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm">
            <span className="block text-slate-200">Email</span>
            <input
              type="email"
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:border-brand"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block text-slate-200">Password</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:border-brand"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </label>
          {error && <p className="text-sm text-rose-200">{error}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-60"
          >
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
