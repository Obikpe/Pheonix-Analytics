"use client";

import { useState } from "react";
import Header from "./Header";
import MarketingFooter from "./MarketingFooter";
import { ArrowRight, BookOpenCheck, CheckCircle2 } from "lucide-react";
import type { FormEvent } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");

export default function ApplyToTeachPage() {
  const [form,setForm] = useState({display_name:"",expertise:"",bio:"",teaching_experience:"",portfolio_url:"",sample_course:""});
  const [busy,setBusy] = useState(false);
  const [submitted,setSubmitted] = useState(false);
  const [error,setError] = useState("");
  function update(key:string,value:string){setForm(old=>({...old,[key]:value}));}
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");
    const token=localStorage.getItem("phx_token");
    if(!token){setBusy(false);setError("Sign in with your Learnora account, then return here to submit your application.");window.dispatchEvent(new CustomEvent("open-auth",{detail:{mode:"login"}}));return;}
    try{
      const response=await fetch(API_BASE+"/api/creator/apply",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({application_data:form})});
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body.detail==="string"?body.detail:"Your application could not be submitted.");
      setSubmitted(true);
    }catch(e:any){setError(e?.message||"Your application could not be submitted. Please try again.");}
    finally{setBusy(false);}
  }
  return <main className="learnora-home min-h-screen antialiased"><Header/><section className="learnora-hero relative overflow-hidden border-b border-white/[.08]"><div aria-hidden="true" className="learnora-hero-grid absolute inset-0"/><div className="relative mx-auto max-w-4xl px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-10 lg:py-24"><BookOpenCheck className="text-[#f2d477]" size={26}/><p className="learnora-kicker mt-5">Instructor application</p><h1 className="learnora-display mt-4 text-5xl leading-[1.02] sm:text-6xl">Teach what you know. Help people put it to work.</h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">Tell Learnora about your expertise and teaching approach. Applications are reviewed; submission does not automatically approve a creator or publish a course.</p>
    <div className="mt-10 border border-white/10 bg-[#10151b] p-6 sm:p-9">{submitted?<div role="status"><CheckCircle2 className="text-emerald-300" size={26}/><h2 className="mt-4 text-xl font-semibold text-white">Application submitted</h2><p className="mt-3 text-sm leading-7 text-slate-400">Your application has been recorded for review. Learnora will review your details before enabling creator access.</p><a href="/tutors" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477]">Explore instructors <ArrowRight size={14}/></a></div>:<form onSubmit={submit} className="grid gap-5 sm:grid-cols-2"><label className="text-sm text-slate-300">Public name<input required minLength={2} maxLength={120} value={form.display_name} onChange={e=>update("display_name",e.target.value)} className="modalInput mt-2"/></label><label className="text-sm text-slate-300">Main expertise<input required minLength={2} maxLength={200} value={form.expertise} onChange={e=>update("expertise",e.target.value)} className="modalInput mt-2" placeholder="e.g. data analysis, design, finance"/></label><label className="text-sm text-slate-300 sm:col-span-2">Short bio and teaching approach<textarea required minLength={10} maxLength={4000} rows={4} value={form.bio} onChange={e=>update("bio",e.target.value)} className="modalInput mt-2"/></label><label className="text-sm text-slate-300 sm:col-span-2">Teaching or mentoring experience<textarea maxLength={3000} rows={3} value={form.teaching_experience} onChange={e=>update("teaching_experience",e.target.value)} className="modalInput mt-2"/></label><label className="text-sm text-slate-300">Portfolio or profile (optional)<input type="url" value={form.portfolio_url} onChange={e=>update("portfolio_url",e.target.value)} className="modalInput mt-2" placeholder="https://…"/></label><label className="text-sm text-slate-300">Sample course idea<input maxLength={200} value={form.sample_course} onChange={e=>update("sample_course",e.target.value)} className="modalInput mt-2"/></label>{error&&<p role="alert" className="sm:col-span-2 border border-rose-400/20 bg-rose-400/[.05] p-3 text-sm leading-6 text-rose-200">{error}</p>}<div className="sm:col-span-2"><button disabled={busy} className="learnora-primary-cta disabled:opacity-50">{busy?"Submitting application…":"Submit creator application"} <ArrowRight size={15}/></button><p className="mt-4 text-xs leading-5 text-slate-600">You must be signed in. Application submission does not grant approval or publishing permissions.</p></div></form>}</div>
  </div></section><MarketingFooter/></main>;
}
