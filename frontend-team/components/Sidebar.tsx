"use client";

import { useState } from "react";
import { LayoutDashboard, Users, Building2, BookOpen, Layers3, CircleDollarSign, UserCog, LineChart, BrainCircuit, Activity, ShieldCheck, Settings, Bell, LogOut, Network, UserRoundCog, Menu, X, ChevronRight } from "lucide-react";
import { clearToken } from "../lib/api";

const all: any[] = [
  ["overview","Overview",LayoutDashboard],
  ["staff","People",Users],
  ["departments","Departments",Network],
  ["teams","Teams",UserRoundCog],
  ["organisations","Organisations",Building2],
  ["courses","Courses",BookOpen],
  ["content","Learning content",Layers3],
  ["commerce","Commerce",CircleDollarSign],
  ["creators","Creators",UserCog],
  ["analytics","Analytics",LineChart],
  ["ai-operations","AI operations",BrainCircuit],
  ["activity","Activity",Activity],
  ["security","Security",ShieldCheck],
  ["notifications","Notifications",Bell],
  ["settings","Settings",Settings],
];

function NavItems({items,active,onNavigate}:{items:any[];active:string;onNavigate?:()=>void}) {
  return <nav aria-label="Team navigation" className="grid gap-1">
    {items.map(([key,title,Icon])=><a key={key} href={"/"+key} onClick={onNavigate} aria-current={active===key?"page":undefined} className={"group flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors "+(active===key?"bg-[rgba(213,177,91,.12)] text-[var(--gold2)]":"text-slate-400 hover:bg-white/[.045] hover:text-slate-100")}>
      <Icon size={17} strokeWidth={1.8}/><span className="flex-1">{title}</span>{active===key&&<ChevronRight size={14} className="opacity-70"/>}
    </a>)}
  </nav>;
}

export default function Sidebar({roles,active}:{roles:string[];active:string}) {
  const [mobileOpen,setMobileOpen]=useState(false);
  const platform=roles.includes("super_admin")||roles.includes("platform_admin");
  const items=platform?all:all.filter(x=>["overview","staff","teams","courses","activity","notifications","settings"].includes(x[0]));
  const logout=()=>{clearToken();location.href="/login"};
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-white/[.09] bg-[#0c1015] lg:block">
      <div className="flex h-20 items-center border-b border-white/[.09] px-6">
        <div><div className="text-xl font-semibold tracking-tight">Learnora <span className="text-[var(--gold2)]">TEAM</span></div><div className="mt-1 text-[9px] uppercase tracking-[.22em] text-slate-600">Internal operations</div></div>
      </div>
      <div className="px-4 pb-5 pt-6"><p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Workspace</p><NavItems items={items} active={active}/></div>
      <div className="absolute inset-x-0 bottom-0 border-t border-white/[.08] p-4"><button onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-500 transition-colors hover:bg-red-400/[.06] hover:text-red-200"><LogOut size={16}/>Sign out</button><p className="px-3 pt-2 text-[10px] text-slate-700">Learnora ME · Team workspace</p></div>
    </aside>

    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/[.09] bg-[#090b0e]/95 px-4 backdrop-blur-xl lg:hidden">
      <a href="/" aria-label="Learnora Team overview" className="text-lg font-semibold tracking-tight">Learnora <span className="text-[var(--gold2)]">TEAM</span></a>
      <button type="button" onClick={()=>setMobileOpen(v=>!v)} aria-label={mobileOpen?"Close team navigation":"Open team navigation"} aria-expanded={mobileOpen} className="grid size-10 place-items-center rounded-lg border border-white/[.12] text-slate-200 hover:bg-white/[.05]">{mobileOpen?<X size={19}/>:<Menu size={19}/>}</button>
    </div>

    {mobileOpen&&<div className="fixed inset-0 z-40 bg-black/65 pt-16 lg:hidden" onClick={()=>setMobileOpen(false)}>
      <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/[.1] bg-[#0c1015] px-4 pb-5 pt-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Workspace navigation</p>
        <NavItems items={items} active={active} onNavigate={()=>setMobileOpen(false)}/>
        <button onClick={logout} className="mt-4 flex min-h-11 w-full items-center gap-3 border-t border-white/[.08] px-3 pt-3 text-sm text-slate-500 hover:text-red-200"><LogOut size={16}/>Sign out</button>
      </div>
    </div>}
  </>;
}
