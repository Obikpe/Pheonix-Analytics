"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import MarketingFooter from "./MarketingFooter";
import { ArrowRight, BookOpen, Search, Users } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");

export default function TutorsPage() {
  const [tutors,setTutors] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [query,setQuery] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch(API_BASE + "/api/public/tutors",{cache:"no-store"});
      const body = await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof body.detail==="string"?body.detail:"Instructor profiles are unavailable.");
      setTutors(body.tutors||[]);
    } catch(e:any) { setError(e?.message||"Instructor profiles are unavailable."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load();},[]);
  const filtered = tutors.filter(t=>[t.display_name,t.expertise,t.bio,t.sample_course].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase()));

  return <main className="learnora-home min-h-screen antialiased"><Header/>
    <section className="learnora-hero relative overflow-hidden border-b border-white/[.08]"><div aria-hidden="true" className="learnora-hero-grid absolute inset-0"/><div className="relative mx-auto grid max-w-[82rem] gap-8 px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:grid-cols-[1fr_.65fr] lg:items-end lg:px-10 lg:py-24"><div><p className="learnora-kicker">Learn from people</p><h1 className="learnora-display mt-5 max-w-4xl text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl">Meet instructors who help turn ideas into practice.</h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">Explore approved instructor profiles when they are available in Learnora's live directory. This page will not invent listings, ratings or biographies.</p></div><div className="border border-white/10 bg-[#10151b] p-6"><Users className="text-[#f2d477]" size={22}/><p className="mt-4 font-semibold text-white">A directory built on real profiles</p><p className="mt-2 text-sm leading-6 text-slate-500">Only profiles returned by the published directory are shown.</p></div></div></section>
    <section className="learnora-section"><div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10"><label className="flex min-h-12 max-w-xl items-center gap-3 border border-white/[.12] bg-[#10151b] px-4 focus-within:border-[#d7ad35]/60"><Search size={17} className="text-slate-500"/><input aria-label="Search instructors" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search names or expertise" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"/></label>
      <div className="mt-8" aria-live="polite">{loading?<p className="border border-white/10 bg-[#10151b] p-7 text-sm text-slate-500">Loading approved instructor profiles…</p>:error?<div className="border border-white/10 bg-[#10151b] p-7"><h2 className="font-semibold text-white">Instructor directory unavailable</h2><p className="mt-3 text-sm leading-6 text-slate-400">{error}</p><button type="button" onClick={()=>void load()} className="mt-5 border border-white/15 px-4 py-2.5 text-sm hover:border-[#d7ad35]/50">Try again</button></div>:filtered.length?<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map(t=><article key={t.id} className="learnora-audience-card"><div className="grid size-12 place-items-center rounded-xl border border-[#d7ad35]/20 bg-[#d7ad35]/10 font-display text-2xl text-[#f2d477]">{(t.display_name||"I").trim().charAt(0).toUpperCase()}</div><h2 className="mt-5 text-xl font-semibold text-white">{t.display_name||"Learnora instructor"}</h2>{t.expertise&&<p className="mt-2 text-xs font-semibold text-[#f2d477]">{t.expertise}</p>}<p className="mt-3 text-sm leading-6 text-slate-400">{t.bio||"An approved Learnora instructor profile."}</p>{t.sample_course&&<p className="mt-3 text-xs text-slate-500">Course idea: {t.sample_course}</p>}<div className="mt-5 flex items-center justify-between border-t border-white/[.08] pt-4"><span className="inline-flex items-center gap-2 text-xs text-slate-500"><BookOpen size={14}/> Approved profile</span>{t.portfolio_url&&<a href={t.portfolio_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#f2d477]">Portfolio ↗</a>}</div></article>)}</div>:<div className="border border-white/10 bg-[#10151b] p-8"><h2 className="text-lg font-semibold text-white">{query?"No instructors match that search":"No public instructor profiles yet"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{query?"Try another name or expertise area.":"Approved instructors will appear here when their public profiles are available. You can still explore courses or apply to teach."}</p></div>}</div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border border-[#d7ad35]/20 bg-[#10151b] p-6"><div><h2 className="font-semibold text-white">Interested in teaching on Learnora?</h2><p className="mt-2 text-sm text-slate-400">Submit an application for review.</p></div><a href="/apply-to-teach" className="learnora-primary-cta">Apply to teach <ArrowRight size={15}/></a></div>
    </div></section><MarketingFooter/></main>;
}
