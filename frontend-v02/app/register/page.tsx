"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Layers3, Target, FolderKanban } from "lucide-react";
import Logo from "../../components/brand/Logo";
import Toast from "../../components/feedback/Toast";
import { register } from "../../lib/api";

export default function Register() {
  const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[created,setCreated]=useState(false),[acceptedTerms,setAcceptedTerms]=useState(false),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false);
  async function submit(e:any) {
    e.preventDefault();setError("");setBusy(true);
    try { await register(name,email,password);setCreated(true); }
    catch(e:any) { setError(e.message||"Your account could not be created."); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen bg-[var(--bg)] lg:grid-cols-[.92fr_1.08fr]">
    <aside className="relative hidden min-h-screen flex-col justify-between border-r border-white/[.1] bg-[#0e141a] p-10 lg:flex xl:p-16">
      <a href="/" className="inline-flex w-fit"><Logo/></a>
      <div className="max-w-xl">
        <p className="section-kicker">A better learning record</p>
        <h1 className="mt-5 font-display text-5xl leading-[1.04] xl:text-6xl">Knowledge grows when you put it to work.</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">Learnora is designed to connect learning with practice, projects and feedback—so your progress becomes something you can reflect on and build from.</p>
        <div className="mt-10 divide-y divide-white/[.1] border-y border-white/[.1]">
          {[{icon:Layers3,title:"Learn with structure",text:"Follow clear lessons and outcomes."},{icon:Target,title:"Practise with purpose",text:"Try ideas and improve with feedback."},{icon:FolderKanban,title:"Keep evidence",text:"Build a record of projects and progress."}].map(({icon:Icon,title,text},i)=><div key={title} className="flex items-center gap-4 py-4"><span className="grid size-10 shrink-0 place-items-center border border-white/[.1] text-[var(--gold-light)]"><Icon size={18}/></span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{text}</p></div><span className="ml-auto text-xs text-slate-600">0{i+1}</span></div>)}
        </div>
      </div>
      <p className="text-[10px] leading-5 text-slate-600">Learnora ME · Learn. Practise. Build. Prove.</p>
    </aside>

    <section className="flex min-h-screen items-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto w-full max-w-lg">
        <a href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-200 lg:hidden"><ArrowLeft size={14}/> Back to Learnora</a>
        <div className="mt-8 lg:mt-0"><a href="/" className="hidden lg:inline-flex"><Logo/></a></div>
        {!created ? <>
          <p className="mt-10 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--gold-light)]">Create your account</p>
          <h2 className="mt-3 font-display text-5xl leading-tight tracking-[-.04em] sm:text-6xl">Start with one step.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">Create your Learnora account. You can explore the learning experiences and access available to your account.</p>
          <form onSubmit={submit} className="mt-8 grid gap-5">
            <label htmlFor="register-name" className="grid gap-2 text-xs font-medium text-slate-300">Your name<input id="register-name" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" className="field" placeholder="Full name"/></label>
            <label htmlFor="register-email" className="grid gap-2 text-xs font-medium text-slate-300">Email address<input id="register-email" value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoComplete="email" className="field" placeholder="you@example.com"/></label>
            <label htmlFor="register-password" className="grid gap-2 text-xs font-medium text-slate-300">Create a password<span className="relative block"><input id="register-password" value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} required minLength={10} autoComplete="new-password" className="field pr-12" placeholder="At least 10 characters"/><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-slate-200">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></span><span className="text-[11px] leading-5 text-slate-600">Use a strong password. If your request is rejected, follow the requirements shown in the error.</span></label>
            <label className="flex items-start gap-3 text-xs leading-6 text-slate-400"><input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} required className="mt-1 size-4 shrink-0 accent-[#d5b15b]"/><span>I agree to the <a className="gold underline underline-offset-2" href="/terms" target="_blank" rel="noreferrer">Terms of Use</a> and acknowledge the <a className="gold underline underline-offset-2" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>, including how account and learning data are processed.</span></label>
            <button disabled={!acceptedTerms||busy} className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-5 text-sm font-bold text-[#17140d] transition-colors hover:bg-[var(--gold-light)] disabled:cursor-not-allowed disabled:opacity-40">{busy?"Creating account…":"Create account"}{!busy&&<ArrowRight size={16}/>}</button>
          </form>
          <p className="mt-5 text-[10px] leading-5 text-slate-600">Learnora uses essential browser storage to operate securely. Read the <a className="gold underline underline-offset-2" href="/cookies">Cookies & Storage Notice</a>.</p>
          <div className="mt-7 border-t border-white/[.1] pt-5 text-sm text-slate-500">Already have an account? <a className="ml-1 font-semibold gold hover:underline" href="/login">Sign in</a></div>
        </> : <div role="status" className="mt-12 border border-emerald-300/20 bg-emerald-300/[.04] p-6 sm:p-8"><CheckCircle2 size={28} className="text-emerald-200"/><h2 className="mt-5 font-display text-4xl">Check your email.</h2><p className="mt-3 text-sm leading-7 text-slate-300">Your account has been created. Verify your email using the link we sent before signing in.</p><div className="mt-6 flex flex-wrap gap-4 text-sm"><a href="/resend-verification" className="gold hover:underline">Resend verification email</a><a href="/login" className="gold hover:underline">Sign in <ArrowRight className="ml-1 inline" size={14}/></a></div></div>}
      </div>
    </section>
    {error&&<Toast title="Could not create account" message={error} type="error" onClose={()=>setError("")}/>}
  </main>;
}
