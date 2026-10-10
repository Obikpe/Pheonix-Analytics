"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Clock3, Search, SlidersHorizontal } from "lucide-react";
import PublicNav from "../../components/public/PublicNav";
import PublicFooter from "../../components/public/PublicFooter";
import EmptyState from "../../components/feedback/EmptyState";
import { courses } from "../../lib/api";

const catalogueArt = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1000&q=82",
];

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

  const usedImages = new Set<string>();

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
            const preferred = typeof course.thumbnail_url === "string" && course.thumbnail_url.trim() && !usedImages.has(course.thumbnail_url.trim()) ? course.thumbnail_url.trim() : "";
            const fallback = catalogueArt.find(url => !usedImages.has(url)) || "";
            const image = preferred || fallback;
            if (image) usedImages.add(image);
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
