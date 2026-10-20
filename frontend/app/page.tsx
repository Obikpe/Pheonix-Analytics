"use client";

import Header from "../components/Header";
import Library from "../components/Library";
import Playground from "../components/Playground";
import Pricing from "../components/Pricing";
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Code2,
  Compass,
  FileCheck2,
  GraduationCap,
  Layers3,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const stages = [
  { n: "01", title: "Learn with intention", text: "Follow structured learning that helps you understand ideas, not simply move through a list of lessons." },
  { n: "02", title: "Practise with feedback", text: "Try concepts, make mistakes safely, and use feedback to decide what to revisit." },
  { n: "03", title: "Build something real", text: "Apply what you know in projects, assignments and practical challenges with a clear purpose." },
  { n: "04", title: "Keep evidence", text: "Bring together work, assessment results and reviews that show what you have actually demonstrated." },
  { n: "05", title: "Show your growth", text: "Build a portfolio you can explain, share and continue improving over time." },
];

const audiences = [
  { icon: GraduationCap, title: "For learners", text: "Build practical skills through lessons, practice, projects and an honest record of progress.", href: "#library", link: "Explore learning" },
  { icon: Compass, title: "For instructors", text: "Guide learners, review practical work and create learning experiences with clear outcomes.", href: "#playground", link: "Explore the learning tools" },
  { icon: Network, title: "For organisations", text: "Shape learning around your people, programmes, teams and agreed outcomes.", href: "#organisations", link: "Explore organisation learning" },
];

const tracks = [
  { icon: BarChart3, title: "Data & business analytics", detail: "Excel, Power BI, Tableau, SQL and decision-ready reporting", tag: "ANALYTICS" },
  { icon: Code2, title: "Software & web development", detail: "Programming foundations, modern web development and practical builds", tag: "DEVELOPMENT" },
  { icon: Target, title: "Data science & AI", detail: "Statistics, Python, machine learning and applied AI workflows", tag: "DATA SCIENCE" },
  { icon: ShieldCheck, title: "Cybersecurity & cloud", detail: "Security principles, cloud foundations and operational practice", tag: "INFRASTRUCTURE" },
];

function openAuth(mode: "login" | "register") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-auth", { detail: { mode } }));
  }
}

export default function Page() {
  return (
    <main className="learnora-home min-h-screen antialiased">
      <Header />

      <section className="learnora-hero relative isolate overflow-hidden">
        <div aria-hidden="true" className="learnora-hero-grid absolute inset-0" />
        <div aria-hidden="true" className="learnora-orb learnora-orb-one" />
        <div aria-hidden="true" className="learnora-orb learnora-orb-two" />
        <div className="relative mx-auto grid min-h-[calc(100svh-76px)] max-w-[82rem] items-center gap-14 px-5 pb-20 pt-24 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-24 lg:pt-28">
          <div className="max-w-3xl">
            <div className="learnora-eyebrow">
              <span className="learnora-eyebrow-icon"><Sparkles size={13} /></span>
              Learn. Practise. Build. Prove.
            </div>
            <h1 className="learnora-display mt-7 text-[clamp(3.2rem,7vw,6.65rem)] leading-[.96] tracking-[-.055em]">
              Learn skills that <span className="learnora-gold-gradient">move you forward.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg sm:leading-9">
              Learnora ME connects structured learning with hands-on practice, real projects and evidence of what you can do. Build knowledge you can use—not just courses you can finish.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => openAuth("register")} className="learnora-primary-cta">
                Start learning <ArrowRight size={17} />
              </button>
              <a href="#how-it-works" className="learnora-secondary-cta">
                See how it works <ArrowDownRight size={16} />
              </a>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><Check size={14} className="learnora-gold" /> Structured learning paths</span>
              <span className="inline-flex items-center gap-2"><Check size={14} className="learnora-gold" /> Practical projects</span>
              <span className="inline-flex items-center gap-2"><Check size={14} className="learnora-gold" /> Evidence-led progress</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="learnora-preview-window">
              <div className="flex items-center justify-between border-b border-white/[.09] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#d7ad35]/10 text-[#f2d477]"><Layers3 size={17}/></span>
                  <div><p className="text-sm font-semibold text-white">Your learning workspace</p><p className="mt-0.5 text-[11px] text-slate-500">A connected path from learning to doing</p></div>
                </div>
                <span className="learnora-live-dot">WORKSPACE</span>
              </div>
              <div className="grid gap-4 p-5 sm:p-6">
                <div className="learnora-preview-feature">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f2d477]">Continue your journey</p><h2 className="mt-2 font-display text-2xl text-white">Data analytics foundations</h2><p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">Move from concepts to analysis with guided lessons and practical exercises.</p></div>
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-[#f2d477]"><BarChart3 size={20}/></span>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[11px] text-slate-400"><span>Learning progress</span><span className="text-slate-200">Your pace, your path</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#9b7627] to-[#f2d477]"/></div>
                  <p className="mt-2 text-[10px] text-slate-600">Illustrative workspace preview</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="learnora-preview-tile"><span className="learnora-preview-icon"><BookOpen size={16}/></span><p className="mt-3 text-sm font-semibold text-slate-100">Lessons</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Build understanding step by step</p></div>
                  <div className="learnora-preview-tile"><span className="learnora-preview-icon"><FileCheck2 size={16}/></span><p className="mt-3 text-sm font-semibold text-slate-100">Evidence</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Keep track of work you can show</p></div>
                </div>
                <div className="flex items-center gap-3 border-t border-white/[.08] pt-4">
                  <span className="grid size-9 place-items-center rounded-full border border-[#d7ad35]/25 bg-[#d7ad35]/10 text-[#f2d477]"><Sparkles size={15}/></span>
                  <p className="text-xs leading-5 text-slate-400">A course is a starting point. <span className="text-slate-200">Your work tells the bigger story.</span></p>
                  <ChevronRight size={16} className="ml-auto shrink-0 text-slate-600"/>
                </div>
              </div>
            </div>
            <div className="learnora-float-note"><span className="grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Check size={15}/></span><span><strong className="block text-xs text-white">Progress with purpose</strong><small className="mt-0.5 block text-[10px] text-slate-500">Practice · Projects · Feedback</small></span></div>
          </div>
        </div>
        <div className="relative mx-auto flex max-w-[82rem] items-center justify-between border-t border-white/[.08] px-5 py-5 text-[10px] uppercase tracking-[.18em] text-slate-500 sm:px-8 lg:px-10">
          <span>Designed for learning that leads somewhere</span><a href="#how-it-works" className="inline-flex items-center gap-2 hover:text-[#f2d477]">Explore the approach <ArrowDownRight size={14}/></a>
        </div>
      </section>

      <section id="how-it-works" className="learnora-section learnora-section-soft">
        <div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div><p className="learnora-kicker">The Learnora approach</p><h2 className="learnora-section-title mt-5">A course can start the journey. It should not have to be the end.</h2></div>
            <p className="max-w-2xl text-base leading-8 text-slate-400 lg:justify-self-end">Learning can be scattered across videos, notes, practice files, projects and certificates. Learnora is designed to connect those pieces—so the work you do, the feedback you receive and the progress you make can tell a more complete story.</p>
          </div>
          <div className="mt-12 grid gap-0 border-y border-white/[.09] md:grid-cols-2 lg:grid-cols-5">
            {stages.map((stage, i) => <article key={stage.n} className="learnora-stage border-b border-white/[.08] p-5 last:border-0 md:border-r md:last:border-r-0 lg:border-b-0 lg:px-5 lg:py-7">
              <p className="font-mono text-xs tracking-[.16em] text-[#d7ad35]">{stage.n}</p><h3 className="mt-5 text-base font-semibold text-slate-100">{stage.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{stage.text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="learnora-section">
        <div className="mx-auto grid max-w-[82rem] gap-12 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10">
          <div className="learnora-evidence-visual">
            <div className="learnora-evidence-grid" />
            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex items-center justify-between"><span className="learnora-kicker">Evidence of progress</span><FileCheck2 size={19} className="text-[#f2d477]"/></div>
              <div className="mt-8 space-y-3">
                <div className="learnora-evidence-row"><span className="learnora-evidence-check"><Check size={13}/></span><span><strong>Practical project</strong><small>Work completed and explained</small></span><span className="learnora-evidence-status">SUBMITTED</span></div>
                <div className="learnora-evidence-row"><span className="learnora-evidence-check"><Check size={13}/></span><span><strong>Assessment</strong><small>Knowledge checked against criteria</small></span><span className="learnora-evidence-status">ASSESSED</span></div>
                <div className="learnora-evidence-row"><span className="learnora-evidence-pending"><Play size={11}/></span><span><strong>Instructor feedback</strong><small>Review when available</small></span><span className="learnora-evidence-status muted">OPTIONAL</span></div>
              </div>
              <p className="mt-5 text-[10px] leading-5 text-slate-600">Conceptual example only—not a real learner record.</p>
            </div>
          </div>
          <div>
            <p className="learnora-kicker">From learning to evidence</p>
            <h2 className="learnora-section-title mt-5">Progress should mean more than a percentage.</h2>
            <p className="mt-6 text-base leading-8 text-slate-300">Finishing a course tells you that you reached the end of its material. It does not, by itself, tell the whole story of what you can do.</p>
            <p className="mt-4 text-sm leading-7 text-slate-500">Learnora's direction is to connect progress with practical work, assessment criteria, feedback and evidence. Self-reported, automatically assessed and instructor-reviewed evidence should remain clearly distinct.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="border-l border-[#d7ad35]/50 pl-4"><p className="font-semibold text-slate-100">Skills Passport</p><p className="mt-2 text-sm leading-6 text-slate-500">A structured view of skills and the evidence that supports them.</p></div>
              <div className="border-l border-[#d7ad35]/50 pl-4"><p className="font-semibold text-slate-100">Portfolio</p><p className="mt-2 text-sm leading-6 text-slate-500">Projects with context, contribution and feedback—not just file uploads.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="organisations" className="learnora-section learnora-section-soft">
        <div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl"><p className="learnora-kicker">Different journeys, one foundation</p><h2 className="learnora-section-title mt-5">A learning experience shaped around the person doing the work.</h2><p className="mt-5 text-base leading-8 text-slate-400">Learners need room to practise. Instructors need tools to teach and review. Organisations need visibility into capability and outcomes. Learnora is designed around those different needs without assuming everyone works the same way.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {audiences.map(({icon: Icon, title, text, href, link}) => <article key={title} className="learnora-audience-card group">
              <span className="learnora-audience-icon"><Icon size={21}/></span><h3 className="mt-6 text-xl font-semibold text-white">{title}</h3><p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">{text}</p><a href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477] hover:text-white">{link} <ArrowRight size={15}/></a>
            </article>)}
          </div>
        </div>
      </section>

      <section className="learnora-section">
        <div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="learnora-kicker">Explore learning paths</p><h2 className="learnora-section-title mt-5 max-w-3xl">Build a foundation. Then put it to work.</h2></div><a href="#library" className="inline-flex items-center gap-2 text-sm font-semibold text-[#f2d477] hover:text-white">Browse the library <ArrowRight size={16}/></a></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {tracks.map(({icon: Icon, title, detail, tag}, i) => <a key={title} href="#library" className="learnora-track-card group">
              <div className="flex items-start justify-between gap-4"><span className="learnora-track-icon"><Icon size={20}/></span><span className="font-mono text-[9px] tracking-[.17em] text-slate-600">{tag}</span></div><h3 className="mt-6 text-lg font-semibold text-slate-100">{title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{detail}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#f2d477]">Explore path <ArrowRight size={14} className="transition-transform group-hover:translate-x-1"/></span>
            </a>)}
          </div>
        </div>
      </section>

      <section className="learnora-catalogue-intro">
        <div className="mx-auto grid max-w-[82rem] gap-5 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10">
          <div><p className="learnora-kicker">The course library</p><h2 className="learnora-section-title mt-4">Find your next useful skill.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Explore the available courses below. Course access and progress depend on your account and enrolment.</p></div>
          <span className="inline-flex items-center gap-2 text-xs text-slate-500"><BookOpen size={15} className="text-[#f2d477]"/> Browse the available catalogue</span>
        </div>
      </section>
      <div id="library" className="learnora-existing-feature"><Library /></div>
      <div id="playground" className="learnora-existing-feature"><Playground /></div>
      <div id="pricing" className="learnora-existing-feature"><Pricing /></div>

      <section className="learnora-final-cta">
        <div className="mx-auto grid max-w-[82rem] gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-20">
          <div><p className="learnora-kicker">Start where you are</p><h2 className="learnora-display mt-4 max-w-3xl text-4xl leading-tight text-white sm:text-5xl">Your next step does not have to be your whole future.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Explore a course, bring your teaching experience, or tell us what your organisation is trying to build. We will be clear about what is available as Learnora grows.</p></div>
          <button type="button" onClick={() => openAuth("register")} className="learnora-primary-cta w-full sm:w-auto">Find your starting point <ArrowRight size={16}/></button>
        </div>
      </section>

      <footer className="border-t border-white/[.08] bg-[#080a0d]">
        <div className="mx-auto flex max-w-[82rem] flex-col gap-5 px-5 py-8 text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <a href="/" className="flex items-center gap-3 text-sm font-semibold text-slate-200"><span className="grid size-8 place-items-center rounded-lg bg-[#d7ad35]/10 text-[#f2d477]"><Layers3 size={16}/></span>Learnora ME</a>
          <p>Learn. Practise. Build. Prove.</p>
          <div className="flex flex-wrap gap-5"><a href="#how-it-works" className="hover:text-[#f2d477]">How it works</a><a href="#library" className="hover:text-[#f2d477]">Courses</a><button type="button" onClick={() => openAuth("login")} className="hover:text-[#f2d477]">Sign in</button><button type="button" onClick={() => openAuth("register")} className="hover:text-[#f2d477]">Get started</button></div>
        </div>
      </footer>
    </main>
  );
}
