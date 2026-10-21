"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, LogOut, RefreshCw } from "lucide-react";
import Logo from "../../../components/brand/Logo";
import { clearToken, request } from "../../../lib/api/client";

export default function CohortDashboardPage() {
  const [learner, setLearner] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [me, learning]: any[] = await Promise.all([
        request("/cohort-auth/me"),
        request("/cohort-learning/me/courses"),
      ]);
      setLearner(learning.learner || me.account);
      setCourses(learning.courses || []);
    } catch (e: any) {
      setError(e?.message || "Your cohort workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return <main className="min-h-screen bg-[#090c10] px-5 py-8 text-slate-100 sm:px-8 lg:px-12">
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-white/[.08] pb-6"><Logo/><button onClick={()=>{clearToken();window.location.assign("/cohort-login")}} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-[#d7ad35]/30"><LogOut size={15}/> Sign out</button></header>
    <div className="mx-auto max-w-7xl">
      <section className="mt-10 rounded-3xl border border-[#d7ad35]/15 bg-gradient-to-br from-[#151a20] to-[#0e1319] p-6 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#f2d477]">Cohort learning workspace</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Your next step starts here{learner?.first_name ? ", " + learner.first_name : ""}.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">These are the courses your organisation has assigned to your cohort account. Your access follows your current cohort membership and assigned lessons.</p>
      </section>
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f2d477]">Your learning plan</p><h2 className="mt-2 text-2xl font-semibold">Assigned courses</h2></div><span className="text-xs text-slate-500">{courses.length} {courses.length === 1 ? "course" : "courses"}</span></div>
        {loading ? <p role="status" className="mt-8 text-sm text-slate-500">Loading your assigned courses…</p> : error ? <div role="alert" className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[.04] p-5"><p className="text-sm text-red-200">{error}</p><button onClick={()=>void load()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477]"><RefreshCw size={14}/> Try again</button></div> : courses.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((row:any)=>{const course=row.course||{};return <article key={row.id} className="flex min-h-64 flex-col rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 transition hover:border-[#d7ad35]/30"><div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl border border-[#d7ad35]/20 bg-[#d7ad35]/[.06]"><BookOpen size={18} className="text-[#f2d477]"/></span>{course.estimated_hours!=null&&<span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock3 size={12}/>{course.estimated_hours}h</span>}</div><h3 className="mt-5 text-lg font-semibold leading-6">{course.title||"Assigned course"}</h3><p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{course.short_description||course.description||"Open this course to view the lessons selected for you."}</p><Link href={"/dashboard/cohort/courses/"+encodeURIComponent(course.id)} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black">Open course <ArrowRight size={15}/></Link></article>})}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center"><CheckCircle2 className="mx-auto text-slate-600" size={26}/><h3 className="mt-4 font-semibold">Your learning plan is being prepared</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Your organisation has not assigned a course to your account yet. Check back later or contact your cohort coordinator.</p></div>}
      </section>
    </div>
  </main>;
}
