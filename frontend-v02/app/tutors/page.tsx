"use client";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Search, Users } from "lucide-react";
import PublicNav from "../../components/public/PublicNav";
import PublicFooter from "../../components/public/PublicFooter";
import EmptyState from "../../components/feedback/EmptyState";
import { publicTutors } from "../../lib/api/public";

export default function TutorsPage() {
  const [tutors,setTutors]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  useEffect(()=>{publicTutors().then(r=>setTutors(r.tutors||[])).catch(e=>setError(e.message||"Tutors could not be loaded.")).finally(()=>setLoading(false));},[]);
  const filtered=tutors.filter(t=>[t.display_name,t.bio].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase()));
  return <><PublicNav/><main className="mx-auto max-w-7xl px-5 pb-24 pt-36 lg:px-8">
    <div className="grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] gold">Learn from people</p><h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">Meet instructors who help turn ideas into practice.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">Explore instructor profiles that have been approved for public discovery. Learnora will only show profiles when they are available in the platform directory.</p></div><div className="rounded-2xl border border-white/10 bg-[#0e1319] p-5"><Users className="gold" size={22}/><p className="mt-4 font-semibold">A directory built on real profiles</p><p className="mt-2 text-sm leading-6 text-slate-500">No invented instructor listings or placeholder ratings. If a profile is not available, it will not be displayed as a real person.</p></div></div>
    <div className="mt-12 flex max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-[#0e1319] px-4"><Search className="text-slate-500" size={18}/><input aria-label="Search instructors" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search names or expertise" className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-slate-600"/></div>
    <div className="mt-10">{loading?<div className="rounded-2xl border border-white/10 p-8 text-sm text-slate-500">Loading approved instructor profiles…</div>:error?<EmptyState title="Instructor directory unavailable" message={error}/>:filtered.length?<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map(t=><article key={t.id} className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-6"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d7ad35]/25 bg-[#d7ad35]/10 font-display text-2xl gold">{(t.display_name||"I").trim().charAt(0).toUpperCase()}</div><h2 className="mt-5 text-xl font-semibold">{t.display_name||"Learnora instructor"}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{t.bio||"An approved Learnora instructor profile."}</p><div className="mt-6 flex items-center gap-2 text-xs text-slate-500"><BookOpen size={14}/> Approved creator profile</div></article>)}</div>:<EmptyState title={query?"No instructors match that search":"No public instructor profiles yet"} message={query?"Try another name or expertise area.":"Approved instructors will appear here when creator profiles are available. You can still explore courses or create a learner account."}/>}</div>
    <div className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#d7ad35]/20 bg-[#10151b] p-6"><div><h2 className="font-semibold">Interested in teaching on Learnora?</h2><p className="mt-2 text-sm text-slate-400">Start with an account and follow the instructor application path as it becomes available.</p></div><a href="/apply-to-teach" className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black">Apply to teach <ArrowRight size={15}/></a></div>
  </main><PublicFooter/></>;
}
