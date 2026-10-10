"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Logo from "../brand/Logo";

const paths = [
  { href: "/for-learners", title: "For learners", detail: "Build skills, projects and evidence." },
  { href: "/for-instructors", title: "For instructors", detail: "Teach, guide and grow your practice." },
  { href: "/for-organisations", title: "For organisations", detail: "Develop people and capability." },
];

const links = [
  { href: "/courses", title: "Explore courses" },
  { href: "/how-it-works", title: "How it works" },
  { href: "/about", title: "About" },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.08] bg-[#080a0d]">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="/" aria-label="Learnora ME home" onClick={close}><Logo /></a>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          <div className="group relative">
            <button type="button" className="inline-flex items-center gap-2 py-3 text-sm text-slate-300 transition-colors hover:text-white" aria-haspopup="true">
              Who it’s for <ChevronDown size={14} className="text-slate-500"/>
            </button>
            <div className="invisible absolute left-0 top-full w-[340px] translate-y-1 border border-white/10 bg-[#10151b] p-2 opacity-0 shadow-2xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {paths.map(item => <a key={item.href} href={item.href} className="block border-b border-white/[.05] p-4 last:border-0 hover:bg-white/[.035]">
                <span className="block text-sm font-semibold text-slate-100">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span>
              </a>)}
            </div>
          </div>
          {links.map(item => <a key={item.href} href={item.href} className="text-sm text-slate-300 transition-colors hover:text-white">{item.title}</a>)}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a href="/login" className="text-sm text-slate-300 transition-colors hover:text-white">Log in</a>
          <a href="/get-started" className="inline-flex items-center gap-2 bg-[#d7ad35] px-4 py-3 text-sm font-bold text-[#11110d] transition-colors hover:bg-[#f2d477]">Get started <ArrowRight size={15}/></a>
        </div>

        <button type="button" className="inline-flex h-11 w-11 items-center justify-center border border-white/10 text-slate-200 lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-white/[.08] bg-[#080a0d] px-5 pb-6 pt-3 lg:hidden">
        <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">Explore Learnora</p>
        {[...paths, ...links].map(item => <a key={item.href} href={item.href} onClick={close} className="flex items-center justify-between border-b border-white/[.06] px-3 py-4 text-sm text-slate-300 hover:text-white"><span>{item.title}</span><ArrowRight size={14} className="text-slate-600"/></a>)}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href="/login" onClick={close} className="border border-white/15 px-4 py-3 text-center text-sm font-semibold">Log in</a>
          <a href="/get-started" onClick={close} className="bg-[#d7ad35] px-4 py-3 text-center text-sm font-bold text-[#11110d]">Get started</a>
        </div>
      </nav>}
    </header>
  );
}
