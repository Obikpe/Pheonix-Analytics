"use client";

import { useState } from "react";
import { BookOpen, Compass, Target, FolderKanban, Sparkles, FileCheck2, Award, MessageCircle, BrainCircuit, Bell, Settings, LayoutDashboard, LogOut, Users, Building2, Activity, ShieldCheck, CircleDollarSign, Layers3, LineChart, LockKeyhole, Menu, X, ChevronRight } from "lucide-react";
import { clearToken } from "../../lib/api";

const learner:any[]=[
  ["overview","Overview",LayoutDashboard],["learning","My learning",BookOpen],["discover","Discover",Compass],["practice","Practise",Target],["projects","Projects",FolderKanban],["skills","Skills",Sparkles],["evidence","Evidence",FileCheck2],["certificates","Certificates",Award],["community","Community",MessageCircle],["ai","AI tutor",BrainCircuit],["creator","Creator studio",Users],["notifications","Notifications",Bell],["settings","Settings",Settings]
];
const superAdmin:any[]=[
  ["overview","Overview",LayoutDashboard],["users","Users",Users],["organisations","Organisations",Building2],["courses","Courses",BookOpen],["content","Content",Layers3],["commercial","Commerce",CircleDollarSign],["creators","Creators",Users],["analytics","Analytics",LineChart],["ai","AI operations",BrainCircuit],["activity","Activity",Activity],["security","Security",LockKeyhole],["admins","Admins",ShieldCheck],["settings","Settings",Settings]
];
const orgAdmin:any[]=[
  ["overview","Overview",LayoutDashboard],["learners","Learners",Users],["courses","Courses",BookOpen],["progress","Progress",LineChart],["activity","Activity",Activity],["settings","Settings",Settings]
];

function NavItems({items,active,admin,onNavigate}:{items:any[];active:string;admin:boolean;onNavigate?:()=>void}) {
  return <nav aria-label="Dashboard navigation" className="grid gap-1">
    {items.map(([key,title,Icon]:any)=><a key={key} href={admin?"/dashboard/admin/"+key:(key==="overview"?"/dashboard":"/dashboard/"+key)} onClick={onNavigate} aria-current={active===key?"page":undefined} className={"flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors "+(active===key?"bg-[rgba(213,177,91,.12)] text-[var(--gold-light)]":"text-slate-400 hover:bg-white/[.045] hover:text-slate-100")}><Icon size={17} strokeWidth={1.8}/><span className="flex-1">{title}</span>{active===key&&<ChevronRight size={14} className="opacity-70"/>}</a>)}
  </nav>;
}

export default function Sidebar({admin=false,role="",active}:{admin?:boolean;role?:string;active:string}) {
  const [mobileOpen,setMobileOpen]=useState(false);
  const items=admin?(role==="super_admin"?superAdmin:orgAdmin):learner;
  const logout=()=>{clearToken();location.href="/login"};
  const brand=<div className="flex h-20 items-center px-6 font-display text-2xl">Learnora <span className="ml-1 text-[var(--gold-light)]">ME</span></div>;
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/[.09] bg-[#0c1015] lg:block">
      {brand}
      <div className="px-4 pt-5"><div className="mb-4 rounded-lg border border-white/[.08] px-3 py-3 text-[10px] font-semibold tracking-[.15em] text-slate-500">{admin?"LEARNORA ADMINISTRATION":"YOUR LEARNORA"}</div><NavItems items={items} active={active} admin={admin}/></div>
      <div className="absolute inset-x-0 bottom-0 border-t border-white/[.08] p-4"><button onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-500 transition-colors hover:bg-red-400/[.06] hover:text-red-200"><LogOut size={16}/>Sign out</button></div>
    </aside>
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/[.09] bg-[#090b0e]/95 px-4 backdrop-blur-xl lg:hidden">
      <a href={admin?"/dashboard/admin/overview":"/dashboard"} className="font-display text-xl">Learnora <span className="text-[var(--gold-light)]">ME</span></a>
      <button type="button" onClick={()=>setMobileOpen(v=>!v)} aria-label={mobileOpen?"Close dashboard navigation":"Open dashboard navigation"} aria-expanded={mobileOpen} className="grid size-10 place-items-center rounded-lg border border-white/[.12] text-slate-200 hover:bg-white/[.05]">{mobileOpen?<X size={19}/>:<Menu size={19}/>}</button>
    </div>
    {mobileOpen&&<div className="fixed inset-0 z-40 bg-black/65 pt-16 lg:hidden" onClick={()=>setMobileOpen(false)}><div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/[.1] bg-[#0c1015] px-4 pb-5 pt-4 shadow-2xl" onClick={e=>e.stopPropagation()}><p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600">{admin?"Administration":"Your learning"}</p><NavItems items={items} active={active} admin={admin} onNavigate={()=>setMobileOpen(false)}/><button onClick={logout} className="mt-4 flex min-h-11 w-full items-center gap-3 border-t border-white/[.08] px-3 pt-3 text-sm text-slate-500 hover:text-red-200"><LogOut size={16}/>Sign out</button></div></div>}
  </>;
}
