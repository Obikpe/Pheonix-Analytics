"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clock3, RefreshCw } from "lucide-react";
import Logo from "../../../../../components/brand/Logo";
import { request } from "../../../../../lib/api/client";

export default function CohortCoursePage() {
  const params = useParams();
  const courseId = String(params.courseId || "");
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [lessonResult, progressResult]: any[] = await Promise.all([
        request("/cohort-learning/me/courses/" + encodeURIComponent(courseId) + "/lessons"),
        request("/cohort-learning/me/courses/" + encodeURIComponent(courseId) + "/progress"),
      ]);
      setLessons(lessonResult.lessons || []);
      setProgress(Object.fromEntries((progressResult.progress || []).map((row: any) => [String(row.lesson_id), row])));
    } catch (e: any) {
      setError(e?.message || "The assigned lessons could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (courseId) void load(); }, [courseId]);

  return <main className="min-h-screen bg-[#090c10] px-5 py-8 text-slate-100 sm:px-8 lg:px-12">
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 border-b border-white/[.08] pb-6"><Logo/><Link href="/dashboard/cohort" className="text-xs text-slate-400 hover:text-[#f2d477]">My courses</Link></header>
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/cohort" className="mt-8 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200"><ArrowLeft size={14}/> Back to assigned courses</Link>
      <p className="mt-8 text-[10px] font-bold uppercase tracking-[.2em] text-[#f2d477]">Your course</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Course lessons</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Only lessons selected for your account are listed here. Your progress is saved against this cohort assignment.</p>
      {loading ? <p role="status" className="mt-8 text-sm text-slate-500">Loading your assigned lessons…</p> : error ? <div role="alert" className="mt-7 rounded-2xl border border-red-400/20 p-5 text-sm text-red-200">{error}<button onClick={()=>void load()} className="mt-4 flex items-center gap-2 text-[#f2d477]"><RefreshCw size={14}/> Try again</button></div> : lessons.length ? <div className="mt-8 divide-y divide-white/[.07] rounded-2xl border border-white/[.08] bg-[#0e1319] px-5 sm:px-7">{lessons.map((lesson:any,index:number)=>{const p=progress[String(lesson.id)];const done=Boolean(p?.completed);return <Link key={lesson.id} href={"/dashboard/cohort/courses/"+encodeURIComponent(courseId)+"/lessons/"+encodeURIComponent(lesson.id)} className="flex items-center gap-4 py-5 first:pt-6 last:pb-6"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.02] text-xs text-slate-500">{String(index+1).padStart(2,"0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{lesson.title||"Lesson"}</h2>{done&&<span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><CheckCircle2 size={12}/> Completed</span>}</div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{lesson.description||lesson.module?.title||"Open the lesson to study the material and record your progress."}</p><div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 size={12}/>{lesson.duration_minutes||0} min</span><span>{p?.progress_percent||0}% complete</span></div></div>{done?<CheckCircle2 className="shrink-0 text-emerald-300" size={18}/>:<Circle className="shrink-0 text-slate-600" size={18}/>}</Link>})}</div> : <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center"><BookOpen className="mx-auto text-slate-600" size={25}/><h2 className="mt-4 font-semibold">No lessons assigned yet</h2><p className="mt-2 text-sm text-slate-500">Your organisation may still be configuring your learning plan.</p></div>}
    </div>
  </main>;
}
