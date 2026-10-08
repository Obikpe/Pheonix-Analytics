"use client";
import {useEffect,useState} from "react";
import Shell from "../../components/Shell";
import EmptyState from "../../components/EmptyState";
import {teamMe} from "../../lib/api";

export default function Content(){
 const [user,setUser]=useState<any>(null);
 useEffect(()=>{teamMe().then(setUser).catch(()=>{location.href="/login"})},[]);
 if(!user)return <div className="p-10">Loading secure workspace…</div>;
 return <Shell roles={user.roles||[]} active="content">
  <p className="text-xs uppercase tracking-[.2em] text-[#d7ad35]">Learning operations</p>
  <h1 className="mt-2 text-4xl font-semibold">Course content</h1>
  <p className="mt-2 text-slate-500">Content management is being surfaced from the live course-content and media services.</p>
  <div className="mt-8"><EmptyState/></div>
 </Shell>
}