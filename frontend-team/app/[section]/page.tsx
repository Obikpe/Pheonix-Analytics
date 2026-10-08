"use client";
import {useEffect,useState} from "react";
import {teamMe,staff,departments,teams} from "../../lib/api";
import Shell from "../../components/Shell";
import EmptyState from "../../components/EmptyState";
import OrganisationWorkspace from "../../components/OrganisationWorkspace";
const loaders:any={staff,departments,teams};
export default function Section({params}:{params:{section:string}}){
 const [u,setU]=useState<any>();const [d,setD]=useState<any>(null);
 useEffect(()=>{teamMe().then(setU).catch(()=>location.href="/login")},[]);
 useEffect(()=>{if(u&&loaders[params.section])loaders[params.section]().then(setD).catch(()=>setD({}))},[u,params.section]);
 if(params.section==="organisations")return <OrganisationWorkspace/>;
 if(!u)return <div className="p-10">Loading secure workspace…</div>;
 const key=params.section,rows=d?.[key]||[];
 return <Shell roles={u.roles||[]} active={key}><h1 className="text-4xl font-semibold capitalize">{key.replaceAll("-"," ")}</h1><p className="mt-2 text-slate-500">Live records available to your internal role.</p><div className="mt-8">{loaders[key]?rows.length?<div className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0e1319]"><div className="divide-y divide-white/[.05]">{rows.map((r:any,i:number)=><div key={String(r.id??i)} className="grid gap-2 p-5 md:grid-cols-4"><span className="font-medium text-slate-200">{r.name||r.email||r.slug||"Record"}</span><span className="text-sm text-slate-500">{r.description||r.job_title||r.status||"—"}</span><span className="text-sm text-slate-500">{r.role||r.team_role||""}</span><span className="text-sm text-slate-600">{r.created_at||r.joined_at||""}</span></div>)}</div></div>:<EmptyState title="No records yet" message="There are currently no live records for this area."/>:<EmptyState title="Operational surface not connected" message="This area will remain empty until its backend operation is available."/>}</div></Shell>
}