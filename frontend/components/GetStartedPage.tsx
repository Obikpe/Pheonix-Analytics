"use client";

import { useState } from "react";
import Header from "./Header";
import MarketingFooter from "./MarketingFooter";
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Users } from "lucide-react";
import type { FormEvent } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");
type Path = "learner" | "instructor" | "organisation" | null;

function openAuth(mode: "login" | "register") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: { mode } }));
}

export default function GetStartedPage() {
  const [path, setPath] = useState<Path>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [form, setForm] = useState({
    organisation_name: "", contact_name: "", email: "", phone: "", country: "Nigeria",
    organisation_type: "business", website: "", notes: "", portal_password: "", confirm_password: "",
  });
  function update(key: string, value: string) { setForm(old => ({ ...old, [key]: value })); }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    if (form.portal_password !== form.confirm_password) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      const payload = {
        organisation_name: form.organisation_name,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || null,
        country: form.country || null,
        organisation_type: form.organisation_type,
        website: form.website || null,
        notes: form.notes || null,
        portal_password: form.portal_password,
        request_type: "organisation_learning",
        requirements: [],
      };
      const response = await fetch(API_BASE + "/api/commercial/organisation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : "The organisation enquiry could not be submitted.");
      setSuccess(body);
      setForm(old => ({ ...old, portal_password: "", confirm_password: "" }));
    } catch (e: any) {
      setError(e?.message || "Learnora could not be reached. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="learnora-home min-h-screen antialiased">
    <Header/>
    <section className="learnora-hero relative overflow-hidden border-b border-white/[.08]">
      <div aria-hidden="true" className="learnora-hero-grid absolute inset-0"/>
      <div className="relative mx-auto max-w-[82rem] px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-10 lg:py-24">
        <p className="learnora-kicker">Find your starting point</p>
        <h1 className="learnora-display mt-5 max-w-4xl text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">Every learning journey starts somewhere.</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Choose the path that best describes you. Learnora supports individual learners, instructors and organisations—with different workflows for each.</p>
        {!path ? <div className="mt-11 grid gap-4 md:grid-cols-3">
          {[
            {key:"learner" as const,icon:GraduationCap,title:"I want to learn",body:"Explore published courses, practise new skills and build a record of your work.",cta:"Create a learner account"},
            {key:"instructor" as const,icon:Users,title:"I want to teach",body:"Share your expertise and submit an instructor application for review.",cta:"Explore teaching"},
            {key:"organisation" as const,icon:Building2,title:"I'm here for an organisation",body:"Tell Learnora about your people, learning priorities and programme needs.",cta:"Start an enquiry"}
          ].map(({key,icon:Icon,title,body,cta})=><button key={key} type="button" onClick={()=>{setError("");setPath(key);}} className="learnora-audience-card text-left"><span className="learnora-audience-icon"><Icon size={22}/></span><h2 className="mt-6 text-xl font-semibold text-white">{title}</h2><p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">{body}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477]">{cta}<ArrowRight size={15}/></span></button>)}
        </div> : path === "learner" ? <div className="mt-10 max-w-2xl border border-white/10 bg-[#10151b] p-6 sm:p-8"><GraduationCap className="text-[#f2d477]" size={25}/><h2 className="mt-4 text-xl font-semibold text-white">Start with your learner account</h2><p className="mt-3 text-sm leading-7 text-slate-400">Create your account to access the learning experience. Available courses and features depend on your enrolment and account permissions.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={()=>openAuth("register")} className="learnora-primary-cta">Create account <ArrowRight size={15}/></button><button type="button" onClick={()=>openAuth("login")} className="learnora-secondary-cta">I already have an account</button><button type="button" onClick={()=>setPath(null)} className="px-3 text-sm text-slate-500 hover:text-white">Back</button></div></div>
        : path === "instructor" ? <div className="mt-10 max-w-2xl border border-white/10 bg-[#10151b] p-6 sm:p-8"><Users className="text-[#f2d477]" size={25}/><h2 className="mt-4 text-xl font-semibold text-white">Share your expertise</h2><p className="mt-3 text-sm leading-7 text-slate-400">Instructor applications are reviewed. Creating an account or submitting an application does not automatically approve a creator or publish a course.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/apply-to-teach" className="learnora-primary-cta">Continue to application <ArrowRight size={15}/></a><button type="button" onClick={()=>setPath(null)} className="px-3 text-sm text-slate-500 hover:text-white">Back</button></div></div>
        : <div className="mt-10 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <aside className="h-fit border border-white/10 bg-[#10151b] p-6 sm:p-8"><Building2 className="text-[#f2d477]" size={25}/><h2 className="learnora-display mt-5 text-3xl">Tell us what you need.</h2><p className="mt-4 text-sm leading-7 text-slate-400">This starts an organisation request. It does not provision a workspace or bypass review and contract approval.</p><button type="button" onClick={()=>setPath(null)} className="mt-6 text-sm text-slate-500 hover:text-white">← Choose a different path</button></aside>
          <form onSubmit={submit} className="border border-white/10 bg-[#10151b] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">Organisation enquiry</h2><p className="mt-2 text-sm leading-6 text-slate-500">Required fields are marked. Use an email address that can receive verification messages.</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="text-sm text-slate-300 sm:col-span-2">Organisation name<input required minLength={2} maxLength={200} value={form.organisation_name} onChange={e=>update("organisation_name",e.target.value)} className="modalInput mt-2"/></label>
              <label className="text-sm text-slate-300">Contact name<input required minLength={2} maxLength={150} value={form.contact_name} onChange={e=>update("contact_name",e.target.value)} className="modalInput mt-2"/></label>
              <label className="text-sm text-slate-300">Contact email<input required type="email" value={form.email} onChange={e=>update("email",e.target.value)} className="modalInput mt-2"/></label>
              <label className="text-sm text-slate-300">Phone (optional)<input value={form.phone} onChange={e=>update("phone",e.target.value)} className="modalInput mt-2"/></label>
              <label className="text-sm text-slate-300">Country<input value={form.country} onChange={e=>update("country",e.target.value)} className="modalInput mt-2"/></label>
              <label className="text-sm text-slate-300">Organisation type<select value={form.organisation_type} onChange={e=>update("organisation_type",e.target.value)} className="modalInput mt-2"><option value="business">Business</option><option value="school">School</option><option value="academy">Academy / training provider</option><option value="nonprofit">Non-profit</option><option value="team">Team / department</option><option value="other">Other</option></select></label>
              <label className="text-sm text-slate-300">Website (optional)<input type="url" placeholder="https://" value={form.website} onChange={e=>update("website",e.target.value)} className="modalInput mt-2"/></label>
              <label className="text-sm text-slate-300 sm:col-span-2">Learning priorities and goals<textarea rows={4} maxLength={4000} value={form.notes} onChange={e=>update("notes",e.target.value)} className="modalInput mt-2" placeholder="Who will learn, what skills matter, and what outcomes are you aiming for?"/></label>
              <div className="sm:col-span-2 rounded-xl border border-white/[.08] p-4"><p className="text-sm font-semibold text-white">Create a prospect portal account</p><p className="mt-1 text-xs leading-5 text-slate-500">Use at least 10 characters. Email verification is required before portal sign-in.</p><div className="mt-4 grid gap-5 sm:grid-cols-2"><label className="text-sm text-slate-300">Portal password<input type="password" required minLength={10} maxLength={72} autoComplete="new-password" value={form.portal_password} onChange={e=>update("portal_password",e.target.value)} className="modalInput mt-2"/></label><label className="text-sm text-slate-300">Confirm password<input type="password" required minLength={10} maxLength={72} autoComplete="new-password" value={form.confirm_password} onChange={e=>update("confirm_password",e.target.value)} className="modalInput mt-2"/></label></div></div>
            </div>
            {error && <p role="alert" className="mt-5 border border-rose-400/20 bg-rose-400/[.05] p-3 text-sm leading-6 text-rose-200">{error}</p>}
            <button disabled={busy} className="learnora-primary-cta mt-6 disabled:cursor-not-allowed disabled:opacity-50">{busy?"Submitting enquiry…":"Submit organisation enquiry"} <ArrowRight size={15}/></button>
            <p className="mt-4 text-[11px] leading-5 text-slate-600">Submitting asks Learnora to review and respond to this organisation request. Do not include passwords or sensitive personal data in the notes field.</p>
          </form>
        </div>}
        {success && <div role="status" className="mt-8 border border-emerald-400/20 bg-emerald-400/[.05] p-6"><CheckCircle2 className="text-emerald-300" size={23}/><h2 className="mt-3 text-lg font-semibold text-white">Organisation request submitted</h2><p className="mt-2 text-sm leading-6 text-slate-300">Reference: <span className="font-mono text-emerald-200">{success.request?.id || "submitted"}</span>. {success.portal?.verification_email_sent ? "A verification email was sent to your contact address." : "Email verification is required; delivery was not confirmed."} Learnora will review the request before provisioning a workspace.</p>{success.portal?.verification_message && <p className="mt-3 text-sm text-amber-200">{success.portal.verification_message}</p>}</div>}
      </div>
    </section>
    <MarketingFooter/>
  </main>;
}
