"use client";

import { useState } from "react";
import Logo from "../../components/brand/Logo";
import Toast from "../../components/feedback/Toast";
import { register } from "../../lib/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      setCreated(true);
    } catch (e: any) {
      setError(e.message || "Your account could not be created.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#07090c] px-5 py-12 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/[.08] bg-[#0e1319] p-7 sm:p-9">
        <a href="/"><Logo /></a>
        {!created ? (
          <>
            <h1 className="mt-12 font-display text-5xl">Start your journey.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">Create your account to begin learning with Learnora.</p>
            <form onSubmit={submit} className="mt-8 grid gap-5">
              <label className="text-sm text-slate-300">Name<input value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#d7ad35]/50" /></label>
              <label className="text-sm text-slate-300">Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#d7ad35]/50" /></label>
              <label className="text-sm text-slate-300">Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={10} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#d7ad35]/50" /><span className="mt-2 block text-xs leading-5 text-slate-500">Use a strong password. If the request is rejected, follow the password requirements shown in the error.</span></label>
              <label className="flex items-start gap-3 text-xs leading-5 text-slate-400"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} required className="mt-1 accent-[#d7ad35]" /><span>I have read and agree to the <a className="gold underline" href="/terms" target="_blank" rel="noreferrer">Terms of Use</a> and acknowledge the <a className="gold underline" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>, including the processing of account and learning data as described there.</span></label>
              <button disabled={!acceptedTerms} className="rounded-xl bg-[#d7ad35] p-3.5 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">Create account</button>
            </form>
            <p className="mt-5 text-xs leading-5 text-slate-600">Learnora uses essential browser storage to operate securely. Read the <a className="gold underline" href="/cookies">Cookies & Storage Notice</a>.</p>
            <p className="mt-6 text-sm text-slate-500">Already have an account? <a className="gold" href="/login">Sign in</a></p>
          </>
        ) : (
          <div role="status" className="mt-10 rounded-xl border border-emerald-300/20 bg-emerald-300/[.05] p-5">
            <p className="font-semibold text-emerald-200">Check your email</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Your account has been created. Verify your email using the link we sent before signing in.</p>
            <a href="/resend-verification" className="mt-4 inline-block text-sm gold">Resend verification email</a>
            <span className="mx-2 text-slate-600">·</span>
            <a href="/login" className="text-sm gold">Sign in</a>
          </div>
        )}
        {error && <Toast title="Could not create account" message={error} type="error" onClose={() => setError("")} />}
      </div>
    </main>
  );
}
