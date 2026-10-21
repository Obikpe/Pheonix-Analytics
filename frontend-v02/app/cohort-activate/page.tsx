"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import Logo from "../../components/brand/Logo";
import { request } from "../../lib/api/client";

export default function CohortActivatePage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This activation link is missing its token. Ask your organisation to send a new link.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await request("/cohort-auth/activate", {
        method: "POST",
        body: JSON.stringify({ token, password, confirm_password: confirmPassword }),
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "We could not activate this account. Request a fresh activation link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#090c10] px-5 py-10 text-slate-100 sm:px-8">
    <div className="mx-auto max-w-lg">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200"><ArrowLeft size={14}/> Back to Learnora</Link>
      <div className="mt-10 rounded-3xl border border-white/[.08] bg-[#0e1319] p-6 sm:p-10">
        <Logo />
        {done ? <div className="mt-10">
          <CheckCircle2 className="text-[#d7ad35]" size={34}/>
          <h1 className="mt-5 font-display text-4xl">Account activated.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">Your password has been set. You can now sign in with the username supplied by your organisation.</p>
          <Link href="/cohort-login" className="mt-7 inline-flex rounded-xl bg-[#d7ad35] px-5 py-3 text-sm font-bold text-black">Go to cohort sign in</Link>
        </div> : <form onSubmit={submit} className="mt-10">
          <KeyRound className="text-[#d7ad35]" size={28}/>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#f2d477]">Cohort learner access</p>
          <h1 className="mt-3 font-display text-4xl">Set your password.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">Create a password to activate the Learnora account your organisation prepared for you. Activation links expire after a short period and can only be used once.</p>
          {!token && <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[.05] p-3 text-xs leading-5 text-amber-100">Waiting for the activation link. If you opened this page directly, use the complete link from your email.</p>}
          <div className="mt-7 grid gap-4">
            <label className="grid gap-2 text-xs font-medium text-slate-300">New password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090c10] px-4 py-3 text-sm outline-none focus:border-[#d7ad35]/50" /></label>
            <label className="grid gap-2 text-xs font-medium text-slate-300">Confirm password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090c10] px-4 py-3 text-sm outline-none focus:border-[#d7ad35]/50" /></label>
            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[.05] p-3 text-sm text-red-200">{error}</p>}
            <button disabled={busy || !token} className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#d7ad35] px-5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">{busy && <LoaderCircle className="animate-spin" size={16}/>} {busy ? "Activating account…" : "Activate account"}</button>
          </div>
          <p className="mt-6 text-xs leading-6 text-slate-500">Already activated? <Link href="/cohort-login" className="font-semibold text-[#f2d477] hover:underline">Sign in here</Link>.</p>
        </form>}
      </div>
    </div>
  </main>;
}
