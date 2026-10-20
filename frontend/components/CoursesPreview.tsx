"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");

type Course = { id: string; title: string; short_description?: string; description?: string; level?: string; track?: string; estimated_hours?: number; settings?: { track?: string } };

export default function CoursesPreview() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/public/courses`, { cache: "no-store" })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : "The published course catalogue is unavailable.");
        return body;
      })
      .then(body => {
        if (!active) return;
        setItems((body.courses || body.data || []).slice(0, 3));
      })
      .catch((e: Error) => { if (active) setError(e.message || "The published course catalogue is unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section id="library" className="learnora-section learnora-section-soft">
    <div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="learnora-kicker">Published learning</p><h2 className="learnora-section-title mt-4">Find a useful next skill.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">This preview is loaded from Learnora's published course catalogue, not a hard-coded marketing list.</p></div><a href="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477] hover:text-white">Browse all courses <ArrowRight size={16}/></a></div>
      {loading ? <div className="mt-9 grid gap-4 md:grid-cols-3">{[0,1,2].map(n=><div key={n} className="animate-pulse border border-white/[.08] bg-[#10151b] p-6"><div className="h-3 w-24 bg-white/[.07]"/><div className="mt-5 h-6 w-3/4 bg-white/[.07]"/><div className="mt-4 h-12 bg-white/[.04]"/></div>)}</div>
      : error ? <div className="mt-9 border border-white/[.1] bg-[#10151b] p-6"><p className="text-sm font-semibold text-slate-200">Course catalogue temporarily unavailable</p><p className="mt-2 text-sm leading-6 text-slate-500">{error}</p><a href="/courses" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477]">Open catalogue <ArrowRight size={14}/></a></div>
      : items.length ? <div className="mt-9 grid gap-px border border-white/[.1] bg-white/[.1] md:grid-cols-3">{items.map((course,i)=><a key={course.id} href={`/courses/${encodeURIComponent(course.id)}`} className="group bg-[#0c1015] p-6 transition-colors hover:bg-[#121920]"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#f2d477]">{course.settings?.track || course.track || "Learnora course"}</span><span className="font-mono text-xs text-slate-600">0{i+1}</span></div><h3 className="learnora-display mt-5 text-2xl leading-snug text-white">{course.title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{course.short_description || course.description || "Explore the published curriculum and access options."}</p><div className="mt-5 flex items-center justify-between border-t border-white/[.08] pt-4 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><BookOpen size={14}/>{course.level || "All levels"}</span><span className="inline-flex items-center gap-2">{course.estimated_hours ? <><Clock3 size={13}/>{course.estimated_hours}h</> : "Self-paced"}</span></div><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#f2d477]">View course <ArrowRight size={14} className="transition-transform group-hover:translate-x-1"/></span></a>)}</div>
      : <div className="mt-9 border border-white/[.1] bg-[#10151b] p-7"><BookOpen className="text-[#f2d477]" size={22}/><h3 className="mt-4 text-lg font-semibold text-white">No published courses yet</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">When Learnora publishes courses to the catalogue, they will appear here. Draft and unpublished content is intentionally not presented as available learning.</p></div>}
    </div>
  </section>;
}
