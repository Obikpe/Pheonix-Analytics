"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import MarketingFooter from "./MarketingFooter";
import { ArrowRight, BookOpen, Clock3, Search, SlidersHorizontal } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");
type Course = { id: string; title: string; slug?: string; short_description?: string; description?: string; level?: string; track?: string; estimated_hours?: number; thumbnail_url?: string; settings?: { track?: string; topics?: string[] } };

export default function CoursesPage() {
  const [items,setItems] = useState<Course[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [query,setQuery] = useState("");
  const [level,setLevel] = useState("all");
  const [track,setTrack] = useState("all");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch(API_BASE + "/api/public/courses", { cache: "no-store" });
      const body = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : "The published course catalogue is unavailable.");
      setItems(body.courses || body.data || []);
    } catch(e:any) { setError(e?.message || "The published course catalogue is unavailable."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); },[]);
  const levels = useMemo(()=>["all",...Array.from(new Set(items.map(c=>String(c.level||"").trim()).filter(Boolean)))],[items]);
  const tracks = useMemo(()=>["all",...Array.from(new Set(items.map(c=>String(c.settings?.track||c.track||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b))],[items]);
  const filtered = useMemo(()=>items.filter(c=>{
    const t = String(c.settings?.track||c.track||"").trim();
    const topics = Array.isArray(c.settings?.topics) ? c.settings.topics.join(" ") : "";
    const searchable = [c.title,c.short_description,c.description,c.level,t,topics].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(query.trim().toLowerCase()) && (level==="all"||String(c.level||"")===level) && (track==="all"||t===track);
  }),[items,query,level,track]);

  return <main className="learnora-home min-h-screen antialiased"><Header/>
    <section className="learnora-hero relative overflow-hidden border-b border-white/[.08]"><div aria-hidden="true" className="learnora-hero-grid absolute inset-0"/><div className="relative mx-auto max-w-[82rem] px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-10 lg:py-24">
      <p className="learnora-kicker">Published learning</p><h1 className="learnora-display mt-5 max-w-4xl text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">Find the skill. Put it to work.</h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Explore courses published by Learnora. Search the curriculum, compare topics and choose a useful next step. Access and enrolment rules come from live platform records.</p>
      <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><BookOpen size={15} className="text-[#f2d477]"/>Published courses only</span><span className="h-1 w-1 rounded-full bg-slate-700"/><span>Access depends on your account and enrolment</span></div>
    </div></section>
    <section className="learnora-section"><div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><label className="flex min-h-12 flex-1 items-center gap-3 border border-white/10 bg-[#10151b] px-4 focus-within:border-[#d7ad35]/60"><Search size={17} className="shrink-0 text-slate-500"/><input aria-label="Search courses" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search course names, skills or topics" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"/></label>
      <label className="flex min-h-12 items-center gap-3 border border-white/10 bg-[#10151b] px-4"><SlidersHorizontal size={16} className="text-slate-500"/><span className="text-xs text-slate-500">Level</span><select aria-label="Filter by level" value={level} onChange={e=>setLevel(e.target.value)} className="max-w-40 bg-transparent py-3 text-sm text-slate-200 outline-none">{levels.map(x=><option key={x} value={x} className="bg-[#10151b]">{x==="all"?"All levels":x}</option>)}</select></label>
      <label className="flex min-h-12 items-center gap-3 border border-white/10 bg-[#10151b] px-4"><span className="text-xs text-slate-500">Track</span><select aria-label="Filter by track" value={track} onChange={e=>setTrack(e.target.value)} className="max-w-52 bg-transparent py-3 text-sm text-slate-200 outline-none">{tracks.map(x=><option key={x} value={x} className="bg-[#10151b]">{x==="all"?"All tracks":x}</option>)}</select></label>
      <span aria-live="polite" className="min-w-24 text-xs tabular-nums text-slate-500">{loading?"Loading…":filtered.length+" "+(filtered.length===1?"course":"courses")}</span></div>
      {(query||level!=="all"||track!=="all")&&!loading&&<button type="button" onClick={()=>{setQuery("");setLevel("all");setTrack("all");}} className="mt-4 text-xs font-semibold text-[#f2d477] hover:text-white">Clear filters</button>}
      <div className="mt-8" aria-live="polite">{loading?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0,1,2].map(i=><div key={i} className="animate-pulse border border-white/[.08] bg-[#10151b] p-6"><div className="h-3 w-24 bg-white/[.07]"/><div className="mt-5 h-6 w-3/4 bg-white/[.07]"/><div className="mt-4 h-12 bg-white/[.04]"/></div>)}</div>
      :error?<div className="border border-white/10 bg-[#10151b] p-8"><h2 className="text-lg font-semibold text-white">Catalogue unavailable</h2><p className="mt-3 text-sm leading-6 text-slate-400">{error}</p><button type="button" onClick={()=>void load()} className="mt-5 border border-white/15 px-4 py-2.5 text-sm font-semibold hover:border-[#d7ad35]/50">Try again</button></div>
      :filtered.length?<div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">{filtered.map((c,i)=><a key={c.id} href={"/courses/"+encodeURIComponent(c.id)} className="group min-w-0 bg-[#0b0f14] transition-colors hover:bg-[#10151b]">
        <div className="relative h-48 overflow-hidden bg-[#151c24]">{c.thumbnail_url?<img src={c.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/>:<div className="flex h-full items-end justify-between p-5"><span className="font-mono text-5xl text-white/10">{String(i+1).padStart(2,"0")}</span><span className="text-[10px] uppercase tracking-[.16em] text-[#f2d477]">Learnora course</span></div>}<span className="absolute left-4 top-4 border border-white/15 bg-[#080a0d] px-3 py-1.5 text-[10px] uppercase tracking-[.12em] text-slate-200">{c.level||"All levels"}</span></div>
        <div className="p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#f2d477]">{c.settings?.track||c.track||"Learning path"}</p><h2 className="learnora-display mt-3 text-2xl leading-snug text-white">{c.title}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{c.short_description||c.description||"Explore the published curriculum and access options."}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[.08] pt-4 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><Clock3 size={14}/>{c.estimated_hours?c.estimated_hours+" hours":"Self-paced"}</span><span className="inline-flex items-center gap-2 font-semibold text-[#f2d477]">View course <ArrowRight size={14}/></span></div></div>
      </a>)}</div>:<div className="border border-white/10 bg-[#10151b] p-8"><BookOpen className="text-[#f2d477]" size={22}/><h2 className="mt-4 text-lg font-semibold text-white">{query||level!=="all"||track!=="all"?"No courses match those filters":"No published courses yet"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{query||level!=="all"||track!=="all"?"Try a broader search, another level or a different learning track.":"Learnora has not returned published courses from the backend. Draft content is intentionally not shown as available learning."}</p></div>}</div>
    </div></section><MarketingFooter/></main>;
}
