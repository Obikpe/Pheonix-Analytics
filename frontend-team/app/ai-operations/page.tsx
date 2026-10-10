"use client";

import {useEffect,useState} from "react";
import Shell from "../../components/Shell";
import {aiHealth,aiProfiles,teamMe,updateAiProfile,testAiProfile} from "../../lib/api";

type TestState={status:string;success?:boolean;latency_ms?:number;provider?:string;model?:string;fallback_used?:boolean;fallback_reason?:string;error?:string;errors?:string[]};

export default function AIOperations(){
  const [user,setUser]=useState<any>(null);
  const [profiles,setProfiles]=useState<any[]>([]);
  const [health,setHealth]=useState<any>(null);
  const [saving,setSaving]=useState("");
  const [testing,setTesting]=useState("");
  const [tests,setTests]=useState<Record<string,TestState>>({});
  const [error,setError]=useState("");

  const load=async()=>{
    const [result,healthResult]=await Promise.all([aiProfiles(),aiHealth()]);
    setProfiles(result.profiles||[]);
    setHealth(healthResult);
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
      setProfiles(prev=>prev.map(p=>p.profile_key===profile.profile_key?{...result.profile,validation_errors:[],provider_supported:true}:p));
      const fresh=await aiHealth();
      setHealth(fresh);
    }catch(e:any){setError(e?.message||"Unable to save AI profile.")}
    finally{setSaving("")}
  };

  const test=async(profile:any)=>{
    setTesting(profile.profile_key);setError("");
    try{
      const result=await testAiProfile(profile.profile_key);
      setTests(prev=>({...prev,[profile.profile_key]:result}));
      const fresh=await aiHealth();
      setHealth(fresh);
    }catch(e:any){
      setTests(prev=>({...prev,[profile.profile_key]:{status:"error",error:e?.message||"Health test failed."}}));
    }finally{setTesting("")}
  };

  if(!user)return <div className="p-10">Loading secure workspace…</div>;

  const summary=health?.summary;

  return <Shell roles={user.roles||[]} active="ai-operations">
    <div className="mb-8">
      <p className="section-kicker">Platform controls / Intelligence</p><h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">AI operations</h1>
      <p className="mt-2 max-w-3xl text-slate-500">
        Configure, validate, test and monitor Learnora AI without changing feature code.
      </p>
    </div>

    {error&&<div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}

    {summary&&<div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Profiles",summary.profiles+"/"+summary.enabled_profiles+" enabled"],
        ["Providers",summary.providers+"/"+summary.enabled_providers+" enabled"],
        ["Recent requests",summary.recent_requests],
        ["Failures",summary.recent_failures],
        ["Avg latency",summary.average_latency_ms!=null?summary.average_latency_ms+" ms":"—"],
      ].map(([label,value])=><div key={String(label)} className="border border-white/[.1] bg-[#11171e] p-4">
        <div className="text-xs uppercase tracking-wide text-slate-600">{label}</div>
        <div className="mt-2 text-xl font-semibold text-slate-100">{value}</div>
      </div>)}
    </div>}

    <div className="mb-6 border border-white/[.1] bg-[#11171e] p-5">
      <div className="font-medium text-slate-200">AI control path</div>
      <div className="mt-2 text-sm text-slate-500">Learnora feature → AI profile → provider → model → gateway → LLM.</div>
      <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-3">
        <div>Configuration changes stay in the database.</div>
        <div>Health tests use a fixed harmless prompt.</div>
        <div>Fallback is reported when the primary attempt fails.</div>
      </div>
      {health?.providers?.length>0&&<div className="mt-4 flex flex-wrap gap-2">
        {health.providers.map((provider:any)=><span key={provider.provider_key} className="rounded-full border border-white/[.08] px-3 py-1 text-xs text-slate-400">
          {provider.display_name}: {provider.enabled?(provider.api_key_configured?"ready":"key missing"):"disabled"}
        </span>)}
      </div>}
      {health?.limits?.length>0&&<div className="mt-3 text-xs text-slate-500">
        Active global limit: {health.limits[0].requests_per_day ?? "—"} requests/day{health.limits[0].requests_per_month!=null?(" · "+health.limits[0].requests_per_month+" requests/month"):""} · max {health.limits[0].max_input_chars} input chars · max {health.limits[0].max_output_tokens} output tokens.
      </div>}
    </div>

    <div className="space-y-4">
      {profiles.map(profile=>{
        const validation=profile.validation_errors||[];
        const testResult=tests[profile.profile_key];
        const healthy=testResult?.success;
        return <div key={profile.profile_key} className="border border-white/[.1] bg-[#11171e] p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-medium text-slate-100">{profile.display_name}</h2>
                <p className="mt-1 text-sm text-slate-500">{profile.description}</p>
                <div className="mt-2 text-xs text-slate-600">{profile.profile_key}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/[.08] px-2.5 py-1 text-slate-400">
                  {profile.provider_configured?"Provider key configured":"Provider key missing"}
                </span>
                <span className={validation.length?"rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-red-300":"rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-300"}>
                  {validation.length?(validation.length+" config issue"+(validation.length>1?"s":"")):"Configuration valid"}
                </span>
                {testResult&&<span className={healthy?"rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-300":"rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-red-300"}>
                  {healthy?("Healthy"+(testResult.latency_ms!=null?(" · "+testResult.latency_ms+"ms"):"")):"Test failed"}
                </span>}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
              <label className="text-xs text-slate-500">Provider
                <input value={profile.provider_key||""} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,provider_key:e.target.value}:p))} className="mt-1 w-full rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-slate-200"/>
              </label>
              <label className="text-xs text-slate-500">Primary model
                <input value={profile.model||""} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,model:e.target.value}:p))} className="mt-1 w-full rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-slate-200"/>
              </label>
              <label className="text-xs text-slate-500">Fallback provider
                <input value={profile.fallback_provider_key||""} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,fallback_provider_key:e.target.value}:p))} placeholder="Optional" className="mt-1 w-full rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-slate-200"/>
              </label>
              <label className="text-xs text-slate-500">Fallback model
                <input value={profile.fallback_model||""} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,fallback_model:e.target.value}:p))} placeholder="Optional" className="mt-1 w-full rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-slate-200"/>
              </label>
              <label className="text-xs text-slate-500">Temperature
                <input type="number" min="0" max="2" step="0.1" value={profile.temperature??0.3} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,temperature:e.target.value}:p))} className="mt-1 w-full rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-slate-200"/>
              </label>
              <label className="text-xs text-slate-500">Max output tokens
                <input type="number" min="100" max="16000" value={profile.max_output_tokens??1200} onChange={e=>setProfiles(ps=>ps.map(p=>p.profile_key===profile.profile_key?{...p,max_output_tokens:e.target.value}:p))} className="mt-1 w-full rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-slate-200"/>
              </label>
            </div>

            {validation.length>0&&<div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">{validation.join(" ")}</div>}

            {testResult&&<div className="border border-white/[.1] bg-[#0c1015] p-3 text-xs text-slate-400">
              <div>Status: {testResult.status}{testResult.provider?(" · "+testResult.provider):""}{testResult.model?(" · "+testResult.model):""}</div>
              {testResult.fallback_used&&<div className="mt-1 text-amber-300">Primary failed; fallback succeeded{testResult.fallback_reason?(" ("+testResult.fallback_reason+")"):""}.</div>}
              {testResult.error&&<div className="mt-1 text-red-300">{testResult.error}</div>}
              {testResult.errors?.length&&<div className="mt-1 text-red-300">{testResult.errors.join(" ")}</div>}
            </div>}

            <div className="flex flex-wrap gap-2">
              <button disabled={saving===profile.profile_key||testing===profile.profile_key} onClick={()=>save(profile)} className="rounded-lg bg-[#d7ad35] px-4 py-2 text-sm font-medium text-black disabled:opacity-50">{saving===profile.profile_key?"Saving…":"Save configuration"}</button>
              <button disabled={saving===profile.profile_key||testing===profile.profile_key} onClick={()=>test(profile)} className="rounded-lg border border-white/[.1] px-4 py-2 text-sm text-slate-200 disabled:opacity-50">{testing===profile.profile_key?"Testing…":"Test live connection"}</button>
            </div>
          </div>
        </div>
      })}
    </div>
  </Shell>;
}
