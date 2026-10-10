"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { request } from "../../lib/api/client";

export default function AccountSettings({ user }: { user: any }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (form.new_password !== form.confirm_password) {
      setError("The new passwords do not match.");
      return;
    }
    if (form.new_password.length < 8) {
      setError("Choose a new password with at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await request("/auth/change-password", { method: "POST", body: JSON.stringify(form) });
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      setNotice("Your password has been changed.");
    } catch (e: any) {
      setError(e.message || "Your password could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  const access = user?.access_state || user?.sub_status || "Not provided";
  return <div className="mt-7 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
    <section className="h-fit rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-[#d7ad35]/10 p-2.5"><UserRound className="gold" size={19}/></div><div><h2 className="font-semibold">Account information</h2><p className="mt-1 text-xs text-slate-500">Details currently held by Learnora.</p></div></div>
      <dl className="mt-6 divide-y divide-white/[.06]">
        <div className="py-4 first:pt-0"><dt className="text-xs text-slate-500">Display name</dt><dd className="mt-1 break-words text-sm text-slate-200">{user?.name || "Not set"}</dd></div>
        <div className="py-4"><dt className="text-xs text-slate-500">Email address</dt><dd className="mt-1 break-words text-sm text-slate-200">{user?.email || "Not available"}</dd></div>
        <div className="py-4"><dt className="text-xs text-slate-500">Account type</dt><dd className="mt-1 text-sm capitalize text-slate-200">{String(user?.account_type || user?.role || "Learner").replaceAll("_", " ")}</dd></div>
        <div className="py-4 last:pb-0"><dt className="text-xs text-slate-500">Access status</dt><dd className="mt-1 inline-flex items-center gap-2 text-sm capitalize text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-[#d7ad35]"/>{String(access).replaceAll("_", " ")}</dd></div>
      </dl>
      <div className="mt-6 rounded-xl border border-white/[.06] bg-black/15 p-4"><p className="text-xs font-semibold text-slate-300">Profile editing</p><p className="mt-2 text-xs leading-5 text-slate-500">Name and email are shown from your account record. Editing them is not enabled here, so this page will not pretend a change has been saved.</p></div>
    </section>
    <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-[#d7ad35]/10 p-2.5"><KeyRound className="gold" size={19}/></div><div><h2 className="font-semibold">Change password</h2><p className="mt-1 text-xs text-slate-500">Verify your current password before choosing a new one.</p></div></div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[.05] p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[.05] p-3 text-sm text-emerald-200"><CheckCircle2 size={15}/>{notice}</p>}
      <form onSubmit={changePassword} className="mt-6 space-y-4">
        <label className="block text-xs text-slate-400">Current password<input required type="password" autoComplete="current-password" value={form.current_password} onChange={e => setForm(old => ({ ...old, current_password: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm text-white outline-none focus:border-[#d7ad35]/50"/></label>
        <label className="block text-xs text-slate-400">New password<input required minLength={8} type="password" autoComplete="new-password" value={form.new_password} onChange={e => setForm(old => ({ ...old, new_password: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm text-white outline-none focus:border-[#d7ad35]/50"/><span className="mt-1 block text-[11px] text-slate-600">At least 8 characters.</span></label>
        <label className="block text-xs text-slate-400">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={form.confirm_password} onChange={e => setForm(old => ({ ...old, confirm_password: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm text-white outline-none focus:border-[#d7ad35]/50"/></label>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><ShieldCheck size={15}/>{busy ? "Updating password…" : "Update password"}</button>
      </form>
      <p className="mt-5 text-[11px] leading-5 text-slate-600">Learnora verifies your current password on the server. Your password is never displayed or stored in this interface.</p>
    </section>
  </div>;
}
