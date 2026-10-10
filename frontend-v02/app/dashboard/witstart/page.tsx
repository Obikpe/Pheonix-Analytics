"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Award, BookOpen, CheckCircle2, Compass, LogOut, MessageCircle, Sparkles, Users } from "lucide-react";
import Logo from "../../../components/brand/Logo";
import EmptyState from "../../../components/feedback/EmptyState";
import { currentUser, clearToken } from "../../../lib/api";
import { progress, evidence } from "../../../lib/api/learning";
import { request } from "../../../lib/api/client";

export default function WitStartDashboard() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await currentUser();
        if (me.role !== "witstart") {
          if (me.role === "organisation_prospect") location.href = "/organisation-portal";
          else if (me.organisation_id && ["owner", "admin"].includes(me.organisation_role)) location.href = "/dashboard/organisation";
          else location.href = "/dashboard";
          return;
        }
        if (cancelled) return;
        setUser(me);
        const [p, e, teamResult] = await Promise.all([progress(), evidence(), request<any>("/organisations/my-teams").catch(() => ({ teams: [] }))]);
        const enrolled = p.courses || [];
        const enriched = await Promise.all(enrolled.map(async (item: any) => {
          const id = item.course?.id || item.enrolment?.course_id;
          if (!id) return { ...item, course_progress: null };
          try { const result = await request<any>("/progress/courses/" + encodeURIComponent(id)); return { ...item, course_progress: result.progress || null }; }
          catch { return { ...item, course_progress: null }; }
        }));
        if (!cancelled) { setCourses(enriched); setEvidenceCount((e.evidence || []).length); setTeams(teamResult.teams || []); }
      } catch (e: any) {
        if (!cancelled) { setError(e.message || "Your WitStart learning space could not be loaded."); if (/401|unauthor/i.test(e.message || "")) location.href = "/login"; }
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const completed = courses.reduce((total, item) => total + Number(item.completed_lessons || 0), 0);
  const tracked = courses.reduce((total, item) => total + Number(item.tracked_lessons || 0), 0);
  return <main className="min-h-screen bg-[#080b0f] text-white">
    <header className="border-b border-white/[.07]"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8"><a href="/"><Logo/></a><div className="flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user?.name || "WitStart learner"}</p><p className="mt-1 text-xs text-slate-500">WitStart Academy learner</p></div><button onClick={() => { clearToken(); location.href = "/login"; }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-slate-400 hover:text-white"><LogOut size={14}/> Sign out</button></div></div></header>
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8 sm:pt-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#d7ad35]/20 bg-[radial-gradient(ellipse_at_top_right,rgba(215,173,53,.12),transparent_50%),#0e1319] p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.22em] gold">WitStart Academy · Powered by Learnora</p><h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">Keep learning. Keep building.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Return to your assigned courses, continue lessons and keep your learning record in one place.</p><div className="mt-7 flex flex-wrap gap-3"><a href="/dashboard/learning" className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black">Continue learning <ArrowRight size={15}/></a><a href="/courses" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200"><Compass size={15}/> Explore courses</a></div>
      </section>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[.05] p-4 text-sm text-red-200">{error}</p>}
      {loading ? <div className="mt-7 rounded-2xl border border-white/10 bg-[#0e1319] p-6 text-sm text-slate-500">Loading your learning record…</div> : <>
        <section className="mt-6 grid gap-4 sm:grid-cols-3"><Stat icon={<BookOpen size={18}/>} label="Enrolled courses" value={courses.length}/><Stat icon={<CheckCircle2 size={18}/>} label="Completed lessons" value={completed}/><Stat icon={<Award size={18}/>} label="Evidence records" value={evidenceCount}/></section>
        <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] gold">Your learning</p><h2 className="mt-2 font-display text-3xl sm:text-4xl">Pick up where you left off.</h2></div><a href="/dashboard/learning" className="inline-flex items-center gap-2 text-sm font-semibold gold">All learning <ArrowRight size={14}/></a></div>
          {courses.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((item: any) => { const course = item.course || {}; const detail = item.course_progress; const percent = Number(detail?.progress_percent || 0); return <article key={course.id || item.enrolment?.id} className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-[#d7ad35]/10 p-2.5"><BookOpen className="gold" size={18}/></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] capitalize text-slate-500">{item.enrolment?.status || "Enrolled"}</span></div><h3 className="mt-5 text-lg font-semibold">{course.title || "Enrolled course"}</h3><p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">{course.short_description || "Continue your learning and practical work."}</p><div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>{detail ? `${detail.completed_lessons || 0} of ${detail.total_lessons || 0} lessons complete` : `${item.completed_lessons || 0} lessons completed`}</span><span>{detail ? `${percent}%` : "Progress loading"}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d7ad35]" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}/></div><a href={"/dashboard/learning/" + encodeURIComponent(course.id)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold gold">Open course <ArrowRight size={14}/></a></article>; })}</div> : <div className="mt-5"><EmptyState title="No active courses yet" message="When a course is assigned or you enrol in a published free course, it will appear here." action={<a href="/courses" className="rounded-xl bg-[#d7ad35] px-4 py-2.5 text-sm font-bold text-black">Explore courses</a>}/></div>}
        </section>
        {teams.length > 0 && <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] gold">Collaboration</p><h2 className="mt-2 font-display text-3xl">Your team workspaces.</h2></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team: any) => <a key={team.id} href={"/dashboard/team/" + encodeURIComponent(team.id)} className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 transition hover:border-[#d7ad35]/25"><div className="flex items-center gap-3"><Users className="gold" size={18}/><h3 className="font-semibold">{team.name}</h3></div><p className="mt-3 text-sm leading-6 text-slate-500">{team.description || "Open your organisation team workspace."}</p><p className="mt-4 text-xs capitalize text-slate-600">{team.membership?.role || team.organisation_role || "Member"}</p></a>)}</div></section>}
        <section className="mt-10 grid gap-4 md:grid-cols-2"><Action href="/dashboard/ai" icon={<Sparkles size={19}/>} title="AI learning support" text="Ask for an explanation, a worked example or a new practice question."/><Action href="/dashboard/community" icon={<MessageCircle size={19}/>} title="Learner community" text="Ask questions and share useful explanations with other learners."/></section>
        <p className="mt-8 text-xs leading-6 text-slate-600">Course progress records activity. Skill verification and certificates appear only when the relevant evidence and issuance records exist.</p>
      </>}
    </div>
  </main>;
}
function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) { return <div className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5"><div className="flex items-center gap-3 text-slate-500">{icon}<span className="text-xs">{label}</span></div><p className="mt-4 text-3xl font-semibold">{value}</p></div>; }
function Action({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) { return <a href={href} className="group rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 transition hover:border-[#d7ad35]/25"><div className="flex items-center gap-3"><span className="gold">{icon}</span><h3 className="font-semibold">{title}</h3></div><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold gold">Open <ArrowRight size={13}/></span></a>; }
