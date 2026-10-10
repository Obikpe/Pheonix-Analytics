"use client";

import { useState } from "react";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import Logo from "../../components/brand/Logo";
import Toast from "../../components/feedback/Toast";
import { request } from "../../lib/api/client";

export default function ApplyToTeach() {
  const [form, setForm] = useState<any>({ display_name: "", expertise: "", bio: "", teaching_experience: "", portfolio_url: "", sample_course: "" });
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/creator/apply", {
        method: "POST",
        body: JSON.stringify({ application_data: form }),
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || "Your application could not be submitted. Sign in with your Learnora account and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07090c] px-5 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/"><Logo /></a>
        <div className="mt-12 rounded-[2rem] border border-white/[.08] bg-[#0e1319] p-7 sm:p-10">
          <BookOpenCheck className="gold" size={26} />
          <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] gold">Creator application</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">Teach what you know. Help people put it to work.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Tell Learnora about your expertise and teaching approach. Applications are reviewed; submission does not automatically create an approved creator account or publish a course.</p>

          {submitted ? (
            <div role="status" className="mt-8 rounded-xl border border-emerald-300/20 bg-emerald-300/[.05] p-5">
              <p className="font-semibold text-emerald-200">Application submitted</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Your application has been recorded for review. You can return to your dashboard while Learnora reviews it.</p>
              <a href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold gold">Go to dashboard <ArrowRight size={14} /></a>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field label="Public name"><input required minLength={2} value={form.display_name} onChange={(e) => setForm((old: any) => ({ ...old, display_name: e.target.value }))} className={inputClass} /></Field>
              <Field label="Main area of expertise"><input required minLength={2} value={form.expertise} onChange={(e) => setForm((old: any) => ({ ...old, expertise: e.target.value }))} className={inputClass} placeholder="e.g. Data analysis, design, finance" /></Field>
              <div className="sm:col-span-2"><Field label="Short bio and teaching approach"><textarea required minLength={10} rows={4} maxLength={4000} value={form.bio} onChange={(e) => setForm((old: any) => ({ ...old, bio: e.target.value }))} className={inputClass} /></Field></div>
              <div className="sm:col-span-2"><Field label="Teaching or mentoring experience"><textarea rows={3} maxLength={3000} value={form.teaching_experience} onChange={(e) => setForm((old: any) => ({ ...old, teaching_experience: e.target.value }))} className={inputClass} /></Field></div>
              <Field label="Portfolio or professional profile (optional)"><input type="url" value={form.portfolio_url} onChange={(e) => setForm((old: any) => ({ ...old, portfolio_url: e.target.value }))} className={inputClass} placeholder="https://…" /></Field>
              <Field label="Sample course idea"><input value={form.sample_course} onChange={(e) => setForm((old: any) => ({ ...old, sample_course: e.target.value }))} className={inputClass} placeholder="What would you teach?" /></Field>
              <div className="sm:col-span-2"><button disabled={busy} className="rounded-xl bg-[#d7ad35] px-5 py-3.5 text-sm font-bold text-black disabled:opacity-50">{busy ? "Submitting…" : "Submit creator application"}</button><p className="mt-3 text-xs leading-5 text-slate-600">You must be signed in. If you are not signed in, <a href="/login" className="gold">sign in first</a> and return to this page.</p></div>
            </form>
          )}
          {error && <Toast title="Application not submitted" message={error} type="error" onClose={() => setError("")} />}
        </div>
      </div>
    </main>
  );
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm outline-none focus:border-[#d7ad35]/50";
function Field({ label, children }: { label: string; children: any }) {
  return <label className="block text-xs text-slate-400">{label}{children}</label>;
}
