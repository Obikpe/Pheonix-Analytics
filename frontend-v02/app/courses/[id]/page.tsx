"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Clock3, LockKeyhole, Check, ChevronDown } from "lucide-react";
import { course, structure } from "../../../lib/api/learning";
import { request } from "../../../lib/api/client";
import PublicNav from "../../../components/public/PublicNav";
import PublicFooter from "../../../components/public/PublicFooter";
import EmptyState from "../../../components/feedback/EmptyState";

export default function CourseDetail({params}:{params:{id:string}}) {
  const [c,setC]=useState<any>(),[s,setS]=useState<any>(),[error,setError]=useState(""),[enrolError,setEnrolError]=useState(""),[enrolling,setEnrolling]=useState(false),[enrolled,setEnrolled]=useState(false);
  useEffect(()=>{let active=true;Promise.all([course(params.id),structure(params.id)]).then(([a,b])=>{if(active){setC(a.course||a);setS(b)}}).catch(x=>{if(active)setError(x.message||"Course could not be loaded.")});return()=>{active=false}},[params.id]);
  async function enrol(){setEnrolError("");setEnrolling(true);try{await request<any>("/courses/"+encodeURIComponent(params.id)+"/enrol",{method:"POST"});setEnrolled(true);location.href="/dashboard/learning/"+encodeURIComponent(params.id)}catch(e:any){setEnrolError(e.message||"Enrolment is not available for this course.")}finally{setEnrolling(false)}}
  if(error)return <><PublicNav/><main className="mx-auto max-w-5xl px-5 pb-24 pt-36"><EmptyState title="Course unavailable" message={error}/><a href="/courses" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold gold">Back to courses <ArrowRight size={15}/></a></main><PublicFooter/></>;
  if(!c)return <><PublicNav/><main className="mx-auto max-w-5xl px-5 py-40 text-slate-500">Loading course details…</main><PublicFooter/></>;
  const modules=s?.modules||s?.structure?.modules||[];
  const isFree=c.settings?.is_free===true||c.settings?.access_type==="free"||c.settings?.price===0;
  const lessonCount=modules.reduce((n:number,m:any)=>n+(m.lessons||[]).length,0);
  return <>
    <PublicNav/>
    <main className="mx-auto max-w-[82rem] px-5 pb-24 pt-32 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-600"><a href="/" className="hover:text-slate-300">Home</a><span>/</span><a href="/courses" className="hover:text-slate-300">Courses</a><span>/</span><span className="max-w-[18rem] truncate text-slate-400">{c.title}</span></nav>
      <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_23rem] xl:gap-16">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3"><span className="section-kicker">{c.level||"Learnora course"}</span><span className="h-px w-8 bg-white/20"/><span className="text-xs text-slate-500">{c.ownership==="organisation"?"Organisation programme":c.ownership==="creator"?"Creator course":"Learnora learning"}</span></div>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">{c.title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{c.description||c.short_description||"Explore the curriculum and course objectives."}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-y border-white/[.1] py-5 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2"><Clock3 size={16} className="text-[var(--gold-light)]"/>{c.estimated_hours?c.estimated_hours+" estimated hours":"Self-paced"}</span>
            <span className="inline-flex items-center gap-2"><BookOpen size={16} className="text-[var(--gold-light)]"/>{modules.length} modules</span>
            <span className="inline-flex items-center gap-2"><Check size={16} className="text-[var(--gold-light)]"/>{lessonCount} lessons listed</span>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="border-l border-[var(--gold)]/60 pl-4"><p className="text-sm font-semibold">Learn with structure</p><p className="mt-2 text-sm leading-6 text-slate-500">Follow the published curriculum in sequence, with clear lesson context.</p></div>
            <div className="border-l border-[var(--gold)]/60 pl-4"><p className="text-sm font-semibold">Build a record of progress</p><p className="mt-2 text-sm leading-6 text-slate-500">Your activity can help you see what you have completed and what comes next.</p></div>
          </div>
        </div>

        <aside className="h-fit border border-white/[.12] bg-[#11171e] xl:sticky xl:top-28">
          <div className="border-b border-white/[.1] px-6 py-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Course access</p><h2 className="mt-2 font-display text-3xl">{isFree?"Your next step starts here":"Access by arrangement"}</h2></div>
          <div className="p-6">
            <p className="text-sm leading-7 text-slate-400">{isFree?"This published course is marked as free. Enrol to start learning and keep your progress with your account.":"Self-enrolment is not enabled for this course. Access may depend on an organisation assignment or another access policy; Learnora will not bypass that requirement."}</p>
            <div className="my-5 border-y border-white/[.09] py-4"><div className="flex items-center justify-between py-1.5 text-sm"><span className="text-slate-500">Modules</span><span className="tabular-nums">{modules.length}</span></div><div className="flex items-center justify-between py-1.5 text-sm"><span className="text-slate-500">Lessons</span><span className="tabular-nums">{lessonCount}</span></div><div className="flex items-center justify-between py-1.5 text-sm"><span className="text-slate-500">Pace</span><span>{c.estimated_hours?c.estimated_hours+" hours":"Flexible"}</span></div></div>
            {isFree?<button onClick={enrol} disabled={enrolling||enrolled} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-5 text-sm font-bold text-[#17140d] transition-colors hover:bg-[var(--gold-light)] disabled:cursor-not-allowed disabled:opacity-50">{enrolling?"Enrolling…":enrolled?"Opening course…":"Enrol and start learning"}<ArrowRight size={16}/></button>:<a href="/get-started" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/[.16] px-5 text-sm font-semibold transition-colors hover:border-white/30 hover:bg-white/[.03]">Ask about access <ArrowRight size={15}/></a>}
            {enrolError&&<div role="alert" className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[.04] p-3 text-xs leading-5 text-amber-100/80">{enrolError} <a href="/login" className="font-semibold gold">Sign in</a></div>}
          </div>
        </aside>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
        <div><p className="section-kicker">Course outline</p><h2 className="mt-4 max-w-md font-display text-4xl leading-tight sm:text-5xl">What you will work through.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">This outline reflects the published course structure. Missing lessons are not replaced with invented content.</p></div>
        <div className="min-w-0">
          {modules.length? <div className="divide-y divide-white/[.1] border-y border-white/[.1]">{modules.map((m:any,i:number)=><details key={m.id} open={i===0} className="group">
            <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden"><div className="flex min-w-0 items-start gap-4"><span className="pt-1 text-xs tabular-nums text-[var(--gold-light)]">{String(i+1).padStart(2,"0")}</span><div className="min-w-0"><h3 className="font-semibold text-slate-100">{m.title}</h3>{m.description&&<p className="mt-1 text-sm leading-6 text-slate-500">{m.description}</p>}<p className="mt-2 text-xs text-slate-600">{(m.lessons||[]).length} lessons</p></div></div><ChevronDown size={17} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180"/></summary>
            <div className="pb-5 pl-8 sm:pl-10"><div className="divide-y divide-white/[.06]">{(m.lessons||[]).map((l:any)=><div key={l.id} className="flex items-start justify-between gap-4 py-3"><div><p className="text-sm text-slate-300">{l.title}</p>{l.description&&<p className="mt-1 text-xs leading-5 text-slate-500">{l.description}</p>}</div><span className="shrink-0 pt-0.5 text-xs text-slate-600">{l.duration_minutes?l.duration_minutes+" min":l.lesson_type||""}</span></div>)}</div></div>
          </details>)}</div>:<EmptyState title="Curriculum not published" message="This course has no published modules or lessons available yet."/>}
        </div>
      </section>

      <section className="mt-16 border border-white/[.1] bg-[#0d1217] p-6 sm:p-8"><div className="flex items-start gap-4"><LockKeyhole className="mt-1 shrink-0 gold" size={20}/><div><h2 className="text-lg font-semibold">Progress and evidence</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">Course progress is stored for your account. Completing lessons records activity; skill verification should be based on appropriate assessment or reviewed evidence rather than course completion alone.</p></div></div></section>
    </main>
    <PublicFooter/>
  </>;
}
