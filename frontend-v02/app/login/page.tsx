"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Logo from "../../components/brand/Logo";
import { IMAGES } from "../../lib/constants";
import Toast from "../../components/feedback/Toast";
import { login,setToken,currentUser,organisationContext,setOrganisationContext,clearOrganisationContext } from "../../lib/api";

export default function Login() {
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false);
  const router=useRouter();
  async function submit(e:any) {
    e.preventDefault();setError("");setBusy(true);
    try {
      const result:any=await login(email,password);setToken(result.token||result.access_token);
      if(result.account_type==="admin"){if(["super_admin","staff_admin"].includes(result.role)){clearOrganisationContext();router.push("https://teamslearnora.vercel.app/login");return;}if(result.role==="witstart_admin"){router.push("/dashboard/admin/witstart_admin");return;}setError("This administrator account is not configured for learner sign-in. Please contact your organisation administrator.");return;}
      const me:any=await currentUser().catch(()=>result);
      const memberships=me.organisation_memberships||[];
      const privileged=memberships.filter((m:any)=>["owner","admin"].includes(m.role));
      const savedId=organisationContext();
      const selected=(me.organisation_id?memberships.find((m:any)=>String(m.organisation_id)===String(me.organisation_id)):null)||(savedId?memberships.find((m:any)=>String(m.organisation_id)===String(savedId)&&["owner","admin"].includes(m.role)):null)||(privileged.length===1?privileged[0]:null);
      if(selected&&["owner","admin"].includes(selected.role))setOrganisationContext(String(selected.organisation_id));else clearOrganisationContext();
      router.push(me.role==="organisation_prospect"?"/organisation-portal":me.role==="witstart"?"/dashboard/witstart":selected&&["owner","admin"].includes(selected.role)?"/dashboard/organisation":privileged.length>1?"/dashboard/organisation?choose=1":"/dashboard");
    } catch(e:any) {setError(e.message||"We could not sign you in. Check your details and try again.");}
    finally {setBusy(false);}
  }
  return <main className="grid min-h-screen bg-[var(--bg)] lg:grid-cols-[1fr_.92fr]">
    <aside className="relative hidden min-h-screen overflow-hidden border-r border-white/[.1] bg-[#11171e] lg:block">
      <img src={IMAGES.login} alt="A quiet study space ready for focused learning" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high"/>
      <div className="absolute inset-0 bg-[#090b0e]/65"/>
      <div className="absolute inset-x-0 bottom-0 p-12 xl:p-16"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--gold-light)]">Learnora ME</p><h2 className="mt-5 max-w-xl font-display text-5xl leading-[1.04] xl:text-6xl">Make the work you do to learn count.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-300">Pick up where you left off. Keep practising, building and collecting evidence of your progress.</p><div className="mt-8 flex items-center gap-3 text-xs text-slate-400"><span className="grid size-9 place-items-center border border-white/20"><LockKeyhole size={15}/></span><span>Secure access to your learning workspace</span></div></div>
    </aside>
    <section className="flex min-h-screen items-center px-5 py-12 sm:px-8 lg:px-12 xl:px-20">
      <form onSubmit={submit} className="mx-auto w-full max-w-md">
        <a href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-200"><ArrowLeft size={14}/> Back to Learnora</a>
        <div className="mt-8"><Logo/></div>
        <p className="mt-12 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--gold-light)]">Your learning workspace</p>
        <h1 className="mt-4 font-display text-5xl leading-tight tracking-[-.04em] sm:text-6xl">Welcome back.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">Sign in to continue with the courses, people and work connected to your account.</p>
        <div className="mt-8 grid gap-5">
          <label htmlFor="login-email" className="grid gap-2 text-xs font-medium text-slate-300">Email address<input id="login-email" value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoComplete="email" className="field" placeholder="you@example.com"/></label>
          <label htmlFor="login-password" className="grid gap-2 text-xs font-medium text-slate-300">Password<span className="relative block"><input id="login-password" value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} required autoComplete="current-password" className="field pr-12" placeholder="Enter your password"/><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-slate-200">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>
          <button disabled={busy} className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-5 text-sm font-bold text-[#17140d] transition-colors hover:bg-[var(--gold-light)] disabled:cursor-wait disabled:opacity-60">{busy?"Signing in…":"Sign in"}{!busy&&<ArrowRight size={16}/>}</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><a className="gold hover:underline" href="/forgot-password">Forgot password?</a><a href="/resend-verification" className="hover:text-slate-300">Resend verification</a></div>
        <div className="mt-8 border-t border-white/[.1] pt-6 text-sm text-slate-500">New to Learnora? <a className="ml-1 font-semibold gold hover:underline" href="/register">Create an account</a></div>
        <p className="mt-8 text-[10px] leading-5 text-slate-600">Use only your own account. Access to organisation and internal workspaces depends on your assigned permissions.</p>
      </form>
    </section>
    {error&&<Toast title="Sign in failed" message={error} type="error" onClose={()=>setError("")}/>}
  </main>;
}
