"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Logo from "../brand/Logo";

const audiences = [
  { href: "/for-learners", title: "For learners", detail: "Build skills, projects and evidence." },
  { href: "/for-instructors", title: "For instructors", detail: "Teach, guide and grow your practice." },
  { href: "/for-organisations", title: "For organisations", detail: "Develop people and capability." },
];
const links = [
  { href: "/courses", title: "Explore courses" },
  { href: "/how-it-works", title: "How it works" },
  { href: "/about", title: "About Learnora" },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const close = () => { setOpen(false); setAudienceOpen(false); };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.09] bg-[#090b0e]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[82rem] items-center justify-between px-5 lg:px-8">
        <a href="/" aria-label="Learnora ME home" onClick={close} className="shrink-0"><Logo /></a>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          <div className="group relative">
            <button type="button" onClick={() => setAudienceOpen(v => !v)} aria-expanded={audienceOpen} aria-haspopup="true" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-offset-2">
              Who it’s for <ChevronDown size={14} className={audienceOpen ? "rotate-180 transition-transform" : "transition-transform"}/>
            </button>
            <div className={`absolute left-0 top-full w-[340px] pt-2 ${audienceOpen ? "visible opacity-100" : "invisible opacity-0"} transition-opacity duration-150`}>
              <div className="border border-white/[.12] bg-[#11171e] p-2 shadow-2xl shadow-black/40">
                {audiences.map((item, i) => <a key={item.href} href={item.href} onClick={close} className="group/item flex items-start justify-between gap-4 border-b border-white/[.06] p-4 last:border-0 hover:bg-white/[.035]">
                  <span><span className="block text-sm font-semibold text-slate-100">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span></span>
                  <span className="pt-1 text-xs text-slate-600">0{i+1}</span>
                </a>)}
              </div>
            </div>
          </div>
          {links.map(item => <a key={item.href} href={item.href} className="rounded-lg px-1 py-3 text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-offset-2">{item.title}</a>)}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a href="/login" className="rounded-lg px-2 py-3 text-sm text-slate-300 transition-colors hover:text-white">Sign in</a>
          <a href="/register" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--gold)] px-4 text-sm font-semibold text-[#16140f] transition-colors hover:bg-[var(--gold-light)]">Get started <ArrowRight size={15}/></a>
        </div>

        <button type="button" className="grid size-11 place-items-center rounded-xl border border-white/[.12] text-slate-200 transition-colors hover:bg-white/[.05] lg:hidden" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} onClick={() => setOpen(v => !v)}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {open && <div className="border-t border-white/[.08] bg-[#090b0e] px-5 pb-6 pt-3 lg:hidden">
        <nav aria-label="Mobile navigation" className="mx-auto grid max-w-[82rem]">
          <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">Explore Learnora</p>
          {links.map(item => <a key={item.href} href={item.href} onClick={close} className="flex min-h-12 items-center justify-between border-b border-white/[.06] px-3 text-sm text-slate-200">{item.title}<ArrowRight size={15} className="text-slate-600"/></a>)}
          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">Choose your path</p>
          {audiences.map(item => <a key={item.href} href={item.href} onClick={close} className="rounded-lg px-3 py-3 hover:bg-white/[.04]"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs text-slate-500">{item.detail}</span></a>)}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href="/login" onClick={close} className="grid min-h-12 place-items-center rounded-lg border border-white/[.14] text-sm font-semibold">Sign in</a>
            <a href="/register" onClick={close} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--gold)] text-sm font-semibold text-[#16140f]">Get started <ArrowRight size={15}/></a>
          </div>
        </nav>
      </div>}
    </header>
  );
}
