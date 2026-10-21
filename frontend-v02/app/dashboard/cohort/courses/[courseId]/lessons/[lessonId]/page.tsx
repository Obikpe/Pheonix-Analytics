"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import Logo from "../../../../../../../components/brand/Logo";
import { request } from "../../../../../../../lib/api/client";

export default function CohortLessonPage() {
  const params = useParams();
  const courseId = String(params.courseId || "");
  const lessonId = String(params.lessonId || "");
  const [lesson, setLesson] = useState<any>(null);
  const [progress, setProgress] = useState<any>({ progress_percent: 0, completed: false, last_position_seconds: 0 });
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [lessonResult, progressResult]: any[] = await Promise.all([
        request("/cohort-learning/me/courses/" + encodeURIComponent(courseId) + "/lessons/" + encodeURIComponent(lessonId)),
        request("/cohort-learning/me/courses/" + encodeURIComponent(courseId) + "/progress"),
      ]);
      setLesson(lessonResult.lesson);
      const saved = (progressResult.progress || []).find((row: any) => String(row.lesson_id) === lessonId) || { progress_percent: 0, completed: false, last_position_seconds: 0 };
      setProgress(saved);
      setPercent(Number(saved.progress_percent || 0));
    } catch (e: any) {
      setError(e?.message || "This lesson could not be loaded. It may no longer be assigned to your account.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (courseId && lessonId) void load(); }, [courseId, lessonId]);

  async function saveProgress(completed = false) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result: any = await request("/cohort-learning/me/courses/" + encodeURIComponent(courseId) + "/lessons/" + encodeURIComponent(lessonId) + "/progress", {
        method: "PUT",
        body: JSON.stringify({
          progress_percent: completed ? 100 : percent,
          completed,
          last_position_seconds: Number(progress.last_position_seconds || 0),
        }),
      });
      const saved = result.progress || { progress_percent: completed ? 100 : percent, completed };
      setProgress(saved);
      setPercent(Number(saved.progress_percent || 0));
      setNotice(saved.completed ? "Lesson marked complete. Your progress is saved." : "Your progress has been saved.");
    } catch (e: any) {
      setError(e?.message || "Progress could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="min-h-screen bg-[#090c10] px-5 py-8 text-slate-100 sm:px-8 lg:px-12">
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 border-b border-white/[.08] pb-6"><Logo/><Link href={"/dashboard/cohort/courses/"+encodeURIComponent(courseId)} className="text-xs text-slate-400 hover:text-[#f2d477]">Course lessons</Link></header>
    <div className="mx-auto max-w-5xl">
      <Link href={"/dashboard/cohort/courses/"+encodeURIComponent(courseId)} className="mt-8 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200"><ArrowLeft size={14}/> Back to lessons</Link>
      {loading ? <p role="status" className="mt-10 text-sm text-slate-500">Loading assigned lesson…</p> : error && !lesson ? <div role="alert" className="mt-8 rounded-2xl border border-red-400/20 p-5 text-sm text-red-200">{error}<button onClick={()=>void load()} className="mt-4 block underline">Try again</button></div> : lesson && <>
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[.2em] text-[#f2d477]">{lesson.module?.title || "Lesson"}</p>
        <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight sm:text-5xl">{lesson.title}</h1>
        {lesson.description&&<p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">{lesson.description}</p>}
        <article className="mt-8 min-h-64 rounded-2xl border border-white/[.08] bg-[#0e1319] p-6 sm:p-9">
          {lesson.content ? <div className="whitespace-pre-wrap break-words text-sm leading-8 text-slate-300">{typeof lesson.content === "string" ? lesson.content : JSON.stringify(lesson.content, null, 2)}</div> : <div className="py-10 text-center"><p className="font-semibold">Lesson material is not available in text form.</p><p className="mt-2 text-sm leading-6 text-slate-500">Your assigned lesson is accessible, but it does not currently contain readable text content.</p></div>}
        </article>
        <section className="mt-6 rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold">Your progress</h2><p className="mt-1 text-xs leading-5 text-slate-500">Progress is private to your cohort account and assigned lesson.</p></div>{progress.completed&&<span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 px-3 py-1.5 text-xs text-emerald-300"><CheckCircle2 size={13}/> Completed</span>}</div>
          <label className="mt-6 block text-xs text-slate-400">Completion: <strong className="text-slate-100">{percent}%</strong><input aria-label="Lesson completion percentage" type="range" min="0" max="100" step="5" value={percent} onChange={e=>setPercent(Number(e.target.value))} className="mt-3 w-full accent-[#d7ad35]"/></label>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-[#d7ad35] transition-all" style={{width:percent+"%"}}/></div>
          {error&&<p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
          {notice&&<p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}
          <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} onClick={()=>void saveProgress(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:border-[#d7ad35]/30 disabled:opacity-50">{saving?<LoaderCircle className="animate-spin" size={15}/>:<Save size={15}/>} Save progress</button><button disabled={saving} onClick={()=>void saveProgress(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><CheckCircle2 size={15}/> Mark complete</button></div>
        </section>
      </>}
    </div>
  </main>;
}
