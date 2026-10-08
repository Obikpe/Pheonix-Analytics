"use client";

import {useEffect,useState} from "react";
import Shell from "../../components/Shell";
import {aiProfiles,teamMe,updateAiProfile} from "../../lib/api";

export default function AIOperations(){
  const [user,setUser]=useState<any>(null);
  const [profiles,setProfiles]=useState<any[]>([]);
  const [saving,setSaving]=useState<string>("");
  const [error,setError]=useState("");

  const load=async()=>{
    const result=await aiProfiles();
    setProfiles(result.profiles||[]);
  };

  useEffect(()=>{
    teamMe().then(async u=>{setUser(u);await load()}).catch(()=>location.href="/login");
  },[]);

  const save=async(profile:any)=>{
    setSaving(profile.profile_key);setError("");
    try{
      const result=await updateAiProfile(profile.profile_key,{
        model:profile.model,
        provider_key:profile.provider_key,
        fallback_provider_key:profile.fallback_provider_key||null,
        fallback_model:profile.fallback_model||null,
        temperature:Number(profile.temperature),
        max_output_tokens:Number(profile.max_output_tokens),
        enabled:Boolean(profile.enabled),
      });
      setProfiles(prev=>prev.map(p=>p.profile_key===profile.profile_key?result.profile:p));
    }catch(e:any){setError(e?.message||"Unable to save AI profile.")}
    finally{setSaving("")}
  };

  if(!user)return <div className="p-10">Loading secure workspace…</div>;

  return <Shell roles={user.roles||[]} active="ai-operations">
    <div className="mb-8">
      <h1 className="text-4xl font-semibold">AI Operations</h1>
      <p className="mt-2 max-w-3xl text-slate-500">
        Configure Learnora AI capabilities independently. Features use profiles;
        profiles select the provider and model.
      </p>
    </div>

    {error&&<div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}

    <div className="mb-6 rounded-2xl border border-white/[.07] bg-[#0e1319] p-5">
      <div className="font-medium text-slate-200">Current architecture</div>
      <div className="mt-2 text-sm text-slate-500">Learnora feature → AI profile → provider → model → gateway.</div>
      <div className="mt-3 text-sm text-slate-400">Changing a model here does not require changing feature code.</div>
    </div>

    <div className="space-y-4">
      {profiles.map(profile=><div key={profile.profile_key} className="rounded-2xl border border-white/[.07] bg-[#0e1319] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-medium text-slate-100">{profile.display_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{profile.description}</p>
            <div className="mt-2 text-xs text-slate-600">{profile.profile_key}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:min-w-[720px]">
            <input value={profile.provider_key||""} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,provider_key:e.target.value}:p))} placeholder="Provider" className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm"/>
            <input value={profile.model||""} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,model:e.target.value}:p))} placeholder="Model" className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm"/>
            <input type="number" min="0" max="2" step="0.1" value={profile.temperature??0.3} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,temperature:e.target.value}:p))} className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm"/>
            <input type="number" min="100" max="16000" value={profile.max_output_tokens??1200} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,max_output_tokens:e.target.value}:p))} className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm"/>
            <button disabled={saving===profile.profile_key} onClick={()=>save(profile)} className="rounded-lg bg-[#d7ad35] px-4 py-2 text-sm font-medium text-black disabled:opacity-50">{saving===profile.profile_key?"Saving…":"Save"}</button>
          </div>
        </div>
      </div>)}
    </div>
  </Shell>;
}
