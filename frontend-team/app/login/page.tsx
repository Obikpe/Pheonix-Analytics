"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "../../components/Brand";
import Toast from "../../components/Toast";
import { teamLogin, setToken } from "../../lib/api";

function hasSuperAdminRole(value: any) {
  const roles = Array.isArray(value?.roles)
    ? value.roles
    : Array.isArray(value?.staff?.roles)
      ? value.staff.roles
      : [];
  return roles.some((role: any) =>
    String(typeof role === "string" ? role : role?.slug || role?.name || "").toLowerCase() === "super_admin"
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: any) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result: any = await teamLogin(email, password);
      setToken(result.token || result.access_token);
      router.push(hasSuperAdminRole(result) ? "/super-admin" : "/");
    } catch (err: any) {
      setError(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-md">
        <Brand />
        <div className="mt-3 text-sm text-slate-500">Internal staff access only.</div>
        <h1 className="mt-12 text-4xl font-semibold">Sign in</h1>
        <div className="mt-8 grid gap-5">
          <label>Email<input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="username" required className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.03] p-3" /></label>
          <label>Password<input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.03] p-3" /></label>
          <button disabled={busy} className="rounded-xl bg-[#d7ad35] p-3 font-bold text-black disabled:opacity-60">{busy ? "Signing in…" : "Enter team workspace"}</button>
        </div>
      </form>
      {error && <Toast title="Access denied" message={error} close={() => setError("")} />}
    </main>
  );
}
