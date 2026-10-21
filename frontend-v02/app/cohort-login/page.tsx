"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, LoaderCircle } from "lucide-react";
import Logo from "../../components/brand/Logo";
import { request, setToken } from "../../lib/api/client";

export default function CohortLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result: any = await request("/cohort-auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const authToken = result.token || result.access_token;
      if (!authToken || !result.account?.cohort_id) throw new Error("The server did not return a valid cohort learner session.");
      setToken(authToken);
      window.location.assign("/dashboard/cohort");
    } catch (e: any) {
      setError(e?.message || "We could not sign you in. Check your username and password.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen bg-[#090c10] text-slate-100 lg:grid-cols-[1fr_.9fr]">
    <aside className="relative hidden min-h-screen overflow-hidden border-r border-white/[.08] bg-[#11171e] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
      <Logo />
      <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#f2d477]">Your cohort. Your progress.</p><h2 className="mt-5 max-w-xl font-display text-5xl leading-tight xl:text-6xl">Learn with a clear next step.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-400">Open the courses and lessons assigned to you by your organisation, and keep track of the work you complete.</p></div>
      <p className="text-xs text-slate-600">Learnora ME · Cohort learning workspace</p>
    </aside>
    <section className="flex min-h-screen items-center px-5 py-12 sm:px-8 lg:px-12 xl:px-20">
      <form onSubmit={submit} className="mx-auto w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200"><ArrowLeft size={14}/> Back to Learnora</Link>
        <div className="mt-10 lg:hidden"><Logo/></div>
        <div className="mt-12 grid size-12 place-items-center rounded-2xl border border-[#d7ad35]/20 bg-[#d7ad35]/[.06]"><BookOpen className="text-[#f2d477]" size={22}/></div>
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[.2em] text-[#f2d477]">Cohort learner sign in</p>
        <h1 className="mt-4 font-display text-5xl leading-tight">Welcome back.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">Use the username and password connected to your cohort account. This sign-in is separate from regular Learnora accounts.</p>
        <div className="mt-8 grid gap-5">
          <label className="grid gap-2 text-xs font-medium text-slate-300">Username<input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0e1319] px-4 py-3 text-sm outline-none focus:border-[#d7ad35]/50" placeholder="your.username" /></label>
          <label className="grid gap-2 text-xs font-medium text-slate-300">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0e1319] px-4 py-3 text-sm outline-none focus:border-[#d7ad35]/50" placeholder="Your password" /></label>
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[.05] p-3 text-sm text-red-200">{error}</p>}
          <button disabled={busy} className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#d7ad35] px-5 text-sm font-bold text-black disabled:opacity-50">{busy && <LoaderCircle className="animate-spin" size={16}/>} {busy ? "Signing in…" : "Sign in"} {!busy && <ArrowRight size={16}/>}</button>
        </div>
        <p className="mt-7 text-xs leading-6 text-slate-500">Not activated yet? <Link href="/cohort-activate" className="font-semibold text-[#f2d477] hover:underline">Activate your account</Link>. If you need a new link, contact your organisation.</p>
      </form>
    </section>
  </main>;
}
