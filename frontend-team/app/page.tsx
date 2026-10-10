"use client";

import { useEffect,useState } from "react";
import { ArrowUpRight, Users, Network, UserRoundCog, Building2, BookOpen, Layers3, ShieldCheck, Activity } from "lucide-react";
import { teamMe,staff,departments,teams } from "../lib/api";
import Shell from "../components/Shell";
import LivePanel from "../components/LivePanel";

const shortcuts=[
  {href:"/organisations",title:"Organisation workspace",detail:"Review organisation requests, contracts and capacity.",icon:Building2},
  {href:"/content",title:"Learning content",detail:"Manage courses, modules, lessons and media.",icon:Layers3},
  {href:"/staff",title:"People and access",detail:"Review team records and assigned access.",icon:Users},
  {href:"/security",title:"Security and controls",detail:"Review security posture and operational safeguards.",icon:ShieldCheck},
];

export default function Home() {
  const [user,setUser]=useState<any>(),[data,setData]=useState<any>(null),[error,setError]=useState("");
  useEffect(()=>{teamMe().then(setUser).catch(()=>location.href="/login")},[]);
  useEffect(()=>{if(!user)return;Promise.all([staff(),departments(),teams()]).then(([s,d,t])=>setData({staff:s.staff||[],departments:d.departments||[],teams:t.teams||[]})).catch(e=>{setError(e.message||"Some workspace summaries could not be loaded.");setData({staff:[],departments:[],teams:[]})})},[user]);
  if(!user)return <div className="grid min-h-screen place-items-center bg-[var(--bg)] text-sm text-slate-500">Loading secure workspace…</div>;
  const roles=user.roles||[];
  return <Shell roles={roles} active="overview">
    <section className="border-b border-white/[.1] pb-7 sm:pb-9">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="section-kicker">Learnora Team / Overview</p><h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">Good to see you, {user.name||user.email}.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Your internal workspace for people, learning operations and platform oversight.</p></div>
        <div className="border border-white/[.12] bg-[#11171e] px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[.17em] text-slate-600">Current access</p><p className="mt-1 text-sm font-semibold text-[var(--gold2)]">{roles.join(" · ")||"Staff"}</p></div>
      </div>
    </section>

    <section className="mt-7" aria-label="Live workspace records">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Workspace records</h2><span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.15em] text-slate-600"><span className="size-1.5 rounded-full bg-emerald-400"/>Live records</span></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <LivePanel title="Staff records" empty={!data||!data.staff?.length}>{data&&<div className="flex items-end justify-between"><p className="text-4xl font-semibold tracking-tight tabular-nums">{data.staff.length}</p><Users size={19} className="text-[var(--gold2)]"/></div>}</LivePanel>
        <LivePanel title="Departments" empty={!data||!data.departments?.length}>{data&&<div className="flex items-end justify-between"><p className="text-4xl font-semibold tracking-tight tabular-nums">{data.departments.length}</p><Network size={19} className="text-[var(--gold2)]"/></div>}</LivePanel>
        <LivePanel title="Teams" empty={!data||!data.teams?.length}>{data&&<div className="flex items-end justify-between"><p className="text-4xl font-semibold tracking-tight tabular-nums">{data.teams.length}</p><UserRoundCog size={19} className="text-[var(--gold2)]"/></div>}</LivePanel>
      </div>
      {error&&<p role="status" className="mt-3 text-xs leading-5 text-amber-200/80">{error}</p>}
    </section>

    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="section-kicker">Go to work</p><h2 className="mt-2 font-display text-3xl">Operational workspaces</h2></div><p className="text-xs text-slate-600">Available sections depend on your role.</p></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {shortcuts.map(({href,title,detail,icon:Icon},i)=><a key={href} href={href} className="group flex min-h-32 items-start gap-4 border border-white/[.1] bg-[#11171e] p-5 transition-colors hover:border-white/[.2] hover:bg-[#151c24] sm:p-6"><span className="grid size-11 shrink-0 place-items-center border border-white/[.1] text-[var(--gold2)]"><Icon size={19} strokeWidth={1.7}/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3 text-sm font-semibold">{title}<ArrowUpRight size={16} className="shrink-0 text-slate-600 transition-colors group-hover:text-[var(--gold2)]"/></span><span className="mt-2 block text-sm leading-6 text-slate-500">{detail}</span><span className="mt-4 block text-[10px] uppercase tracking-[.16em] text-slate-600">Workspace 0{i+1}</span></span></a>)}
      </div>
    </section>
    <div className="mt-8 flex items-start gap-3 border-l border-[var(--gold)]/50 px-4 py-2"><Activity size={16} className="mt-1 shrink-0 text-[var(--gold2)]"/><p className="text-xs leading-6 text-slate-500">This overview shows records returned by the live backend. It does not substitute placeholder counts when a data source is unavailable.</p></div>
  </Shell>;
}
