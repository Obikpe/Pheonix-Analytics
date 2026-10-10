"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Clock3, Search, SlidersHorizontal } from "lucide-react";
import PublicNav from "../../components/public/PublicNav";
import PublicFooter from "../../components/public/PublicFooter";
import EmptyState from "../../components/feedback/EmptyState";
import { courses } from "../../lib/api";
import { IMAGES } from "../../lib/constants";

export default function Courses() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");

  async function loadCourses() {
    setLoading(true);
    setError("");
    try {
      const result = await courses();
      setItems(result.data || result.courses || []);
    } catch (e: any) {
      setError(e.message || "Courses could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCourses(); }, []);

  const levels = useMemo(() => ["all", ...Array.from(new Set(items.map(c => String(c.level || "").trim()).filter(Boolean)))], [items]);
  const filtered = useMemo(() => items.filter(c => {
    const text = [c.title, c.short_description, c.description, c.level].filter(Boolean).join(" ").toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (level === "all" || c.level === level);
  }), [items, query, level]);

  const usedImages = new Set<string>(Object.values(IMAGES).map(url => url.split("?")[0]));

  return <>
    <PublicNav />
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 lg:px-8">
      <section className="grid gap-10 border-b border-white/[.1] pb-12 lg:grid-cols-[1fr_.6fr] lg:items-end">
        <div>
          <p className="section-kicker">The Learnora catalogue</p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.02] tracking-[-.04em] sm:text-6xl lg:text-7xl">Find the skill. Put it to work.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">Explore published learning, compare the curriculum and choose a useful next step. Course availability and enrolment rules are based on live platform records.</p>
        </div>
        <div className="border-l border-[#d7ad35]/50 pl-5">
          <BookOpen size={22} className="gold"/>
          <p className="mt-4 text-lg font-semibold">A catalogue grounded in what’s live</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">No invented courses or placeholder enrolment counts. If a course is not published by the platform, it will not appear here.</p>
        </div>
      </section>

      <section className="mt-8" aria-label="Course search and filters">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex min-h-12 flex-1 items-center gap-3 border border-white/10 bg-[#10151b] px-4 focus-within:border-[#d7ad35]/60">
            <Search size={17} className="shrink-0 text-slate-500"/>
            <input aria-label="Search courses" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search skills, topics or course names" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"/>
          </label>
          <label className="flex min-h-12 items-center gap-3 border border-white/10 bg-[#10151b] px-4">
            <SlidersHorizontal size={16} className="text-slate-500"/>
            <span className="text-xs text-slate-500">Level</span>
            <select aria-label="Filter by level" value={level} onChange={e => setLevel(e.target.value)} className="max-w-40 bg-transparent py-3 text-sm text-slate-200 outline-none">
              {levels.map(x => <option key={x} value={x} className="bg-[#10151b]">{x === "all" ? "All levels" : x}</option>)}
            </select>
          </label>
          <span className="text-xs tabular-nums text-slate-500">{loading ? "Loading catalogue…" : `${filtered.length} ${filtered.length === 1 ? "course" : "courses"}`}</span>
        </div>
      </section>

      <section className="mt-8" aria-live="polite">
        {loading ? <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="animate-pulse bg-[#10151b]"><div className="h-52 bg-[#171e27]"/><div className="space-y-3 p-5"><div className="h-4 w-2/3 bg-white/[.06]"/><div className="h-3 w-full bg-white/[.04]"/><div className="h-3 w-4/5 bg-white/[.04]"/></div></div>)}</div>
        : error ? <div className="border border-white/10 bg-[#10151b] p-8 sm:p-10"><EmptyState title="Courses unavailable" message={error}/><button onClick={loadCourses} className="mt-4 border border-white/15 px-4 py-2.5 text-sm font-semibold hover:border-[#d7ad35]/50">Try again</button></div>
        : filtered.length ? <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course, i) => {
            const candidate = typeof course.thumbnail_url === "string" ? course.thumbnail_url.trim() : "";
            const imageKey = candidate ? candidate.split("?")[0] : "";
            const image = imageKey && !usedImages.has(imageKey) ? candidate : "";
            if (image) usedImages.add(imageKey);
            return <a key={course.id} href={"/courses/" + course.id} className="group min-w-0 bg-[#0b0f14] transition-colors hover:bg-[#10151b]">
              <div className="relative h-52 overflow-hidden bg-[#151c24]">
                {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/> : <div className="flex h-full items-end justify-between p-5"><span className="font-display text-6xl text-white/10">{String(i+1).padStart(2,"0")}</span><span className="text-xs uppercase tracking-[.18em] text-[#f2d477]">Learnora / Course</span></div>}
                <span className="absolute left-4 top-4 border border-white/15 bg-[#080a0d] px-3 py-1.5 text-[10px] uppercase tracking-[.15em] text-slate-200">{course.level || "All levels"}</span>
              </div>
              <div className="p-5 sm:p-6">
                <h2 className="font-display text-2xl leading-snug">{course.title}</h2>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{course.short_description || course.description || "Explore the curriculum and available access options."}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[.08] pt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2"><Clock3 size={14}/>{course.estimated_hours ? course.estimated_hours + " hours" : "Self-paced"}</span>
                  <span className="inline-flex items-center gap-2 font-semibold text-[#f2d477]">View course <ArrowRight size={14}/></span>
                </div>
              </div>
            </a>;
          })}
        </div> : <EmptyState title={query || level !== "all" ? "No courses match those filters" : "No published courses yet"} message={query || level !== "all" ? "Try a broader search or choose another level." : "Learnora has not returned published courses from the backend yet. Draft content is intentionally not shown as available learning."}/>}
      </section>
    </main>
    <PublicFooter/>
  </>;
}
