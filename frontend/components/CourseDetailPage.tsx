"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import MarketingFooter from "./MarketingFooter";
import { ArrowRight, BookOpen, Check, Clock3, LockKeyhole } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://learnora-backend.vercel.app").replace(/\/$/, "");

export default function CourseDetailPage({ courseId }: { courseId: string }) {
  const [course,setCourse] = useState<any>(null);
  const [structure,setStructure] = useState<any>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [enrolError,setEnrolError] = useState("");
  const [enrolling,setEnrolling] = useState(false);

  useEffect(()=>{
    let active = true;
    const read = async (url:string) => {
      const response = await fetch(url,{cache:"no-store"});
      const body = await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(typeof body.detail==="string"?body.detail:"Course details could not be loaded.");
      return body;
    };
    Promise.all([
      read(API_BASE + "/api/public/courses/" + encodeURIComponent(courseId)),
      read(API_BASE + "/api/public/courses/" + encodeURIComponent(courseId) + "/structure")
    ]).then(([c,s])=>{if(active){setCourse(c.course||c.data||c);setStructure(s.structure||s);}})
      .catch(e=>{if(active)setError(e?.message||"Course could not be loaded.");})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[courseId]);

  async function enrol() {
    setEnrolError("");
    const token = typeof window !== "undefined" ? localStorage.getItem("phx_token") : "";
    if(!token){window.dispatchEvent(new CustomEvent("open-auth",{detail:{mode:"login"}}));setEnrolError("Sign in to check your enrolment permissions, then try again.");return;}
    setEnrolling(true);
    try {
      const response = await fetch(API_BASE + "/api/courses/" + encodeURIComponent(courseId) + "/enrol",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"}});
      const body = await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body.detail==="string"?body.detail:"Enrolment is not available for this course.");
      location.assign("/dashboard/learning/" + encodeURIComponent(courseId));
    } catch(e:any) { setEnrolError(e?.message||"Enrolment is not available for this course."); }
    finally { setEnrolling(false); }
  }

  const modules = structure?.modules || structure?.structure?.modules || [];
  const lessons = modules.reduce((total:number,m:any)=>total+(Array.isArray(m.lessons)?m.lessons.length:0),0);
  const isFree = course?.settings?.is_free===true || course?.settings?.access_type==="free" || course?.settings?.price===0;

  return <main className="learnora-home min-h-screen antialiased"><Header/>
    <section className="learnora-hero relative overflow-hidden border-b border-white/[.08]"><div aria-hidden="true" className="learnora-hero-grid absolute inset-0"/><div className="relative mx-auto max-w-[82rem] px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-10 lg:py-24">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-600"><a href="/" className="hover:text-slate-300">Home</a><span>/</span><a href="/courses" className="hover:text-slate-300">Courses</a><span>/</span><span className="text-slate-400">Course details</span></nav>
      {loading?<p className="py-16 text-sm text-slate-500">Loading published course details…</p>:error?<div className="max-w-2xl border border-white/10 bg-[#10151b] p-7"><h1 className="learnora-display text-3xl text-white">Course unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-400">{error}</p><a href="/courses" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477]">Back to courses <ArrowRight size={14}/></a></div>:course&&<div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_23rem] xl:gap-16"><div className="min-w-0"><p className="learnora-kicker">{course.level||"Learnora course"}{(course.settings?.track||course.track)?" · "+(course.settings?.track||course.track):""}</p><h1 className="learnora-display mt-6 max-w-4xl text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">{course.title}</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{course.description||course.short_description||"Explore the published curriculum and course objectives."}</p><div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-y border-white/[.1] py-5 text-sm text-slate-400"><span className="inline-flex items-center gap-2"><Clock3 size={16} className="text-[#f2d477]"/>{course.estimated_hours?course.estimated_hours+" estimated hours":"Self-paced"}</span><span className="inline-flex items-center gap-2"><BookOpen size={16} className="text-[#f2d477]"/>{modules.length} modules</span><span className="inline-flex items-center gap-2"><Check size={16} className="text-[#f2d477]"/>{lessons} lessons listed</span></div>
      <section className="mt-10"><h2 className="learnora-display text-3xl text-white">Course structure</h2>{modules.length?<div className="mt-5 divide-y divide-white/[.1] border-y border-white/[.1]">{modules.map((m:any,i:number)=><article key={m.id||m.title||i} className="py-5"><div className="flex items-start gap-4"><span className="font-mono text-xs text-[#d7ad35]">0{i+1}</span><div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-100">{m.title||m.name||"Module "+(i+1)}</h3>{m.description&&<p className="mt-2 text-sm leading-6 text-slate-400">{m.description}</p>}<p className="mt-2 text-xs text-slate-600">{Array.isArray(m.lessons)?m.lessons.length:0} lessons</p></div></div></article>)}</div>:<p className="mt-4 text-sm leading-6 text-slate-500">The published course structure is not available yet.</p>}</section></div>
      <aside className="h-fit border border-white/[.12] bg-[#11171e] xl:sticky xl:top-28"><div className="border-b border-white/[.1] px-6 py-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Course access</p><h2 className="learnora-display mt-2 text-3xl text-white">{isFree?"Start learning":"Access by arrangement"}</h2></div><div className="p-6"><p className="text-sm leading-7 text-slate-400">{isFree?"This published course is marked as free. Sign in and enrol to start learning.":"Self-enrolment is not shown as free for this course. Access may depend on an organisation assignment or another access policy."}</p>{isFree?<button type="button" disabled={enrolling} onClick={enrol} className="learnora-primary-cta mt-6 w-full disabled:opacity-50">{enrolling?"Checking access…":"Enrol in course"} <ArrowRight size={15}/></button>:<a href="/get-started" className="learnora-primary-cta mt-6 w-full"><LockKeyhole size={15}/> Ask about access <ArrowRight size={15}/></a>}{enrolError&&<p role="alert" className="mt-4 text-xs leading-6 text-rose-200">{enrolError}</p>}<div className="mt-6 border-t border-white/[.08] pt-4 text-xs leading-6 text-slate-600">Enrolment and progress are controlled by Learnora's live access rules. This page does not bypass organisation or account permissions.</div></div></aside>
      </div>}
    </div></section><MarketingFooter/></main>;
}
