"use client";

import Header from "./Header";
import MarketingFooter from "./MarketingFooter";
import { ArrowRight, BookOpen, CheckCircle2, Compass, FileCheck2, GraduationCap, Layers3, Network, ShieldCheck, Sparkles, Target, Users } from "lucide-react";

type PageKind = "about" | "how" | "learner" | "instructor" | "organisation";

const content: Record<PageKind, {
  eyebrow: string; title: string; intro: string; primary: string; primaryHref: string;
  secondary: string; secondaryHref: string; steps: { title: string; text: string }[];
  principles: { title: string; text: string }[];
}> = {
  about: {
    eyebrow: "About Learnora ME",
    title: "Learning should lead to something you can demonstrate.",
    intro: "Learnora ME is being built to connect structured learning with practice, projects, feedback and evidence. The aim is to help people move beyond consuming information and towards work they can explain, improve and share.",
    primary: "Explore how it works", primaryHref: "/how-it-works", secondary: "Browse courses", secondaryHref: "/courses",
    steps: [
      { title: "Learning with purpose", text: "Courses should make the goal clear and help people understand why a concept matters." },
      { title: "Practice in context", text: "Learners need opportunities to apply ideas, make mistakes and receive useful feedback." },
      { title: "Evidence over assumption", text: "Progress should distinguish completion, self-reported skill and reviewed work." },
      { title: "Room to grow", text: "The platform is designed to support individuals, instructors, cohorts and organisations." },
    ],
    principles: [
      { title: "Useful before impressive", text: "Features should solve a real learning or work problem rather than exist only to make the product look advanced." },
      { title: "Honest by design", text: "A course or capability is only shown as available when the product can support it; examples are labelled as examples." },
      { title: "Different roles, clear boundaries", text: "Learners, tutors, organisation admins and Learnora staff need the right tools for their responsibilities." },
    ],
  },
  how: {
    eyebrow: "How it works",
    title: "Connect learning, practice and proof.",
    intro: "Learnora is designed around a repeatable cycle: understand a concept, practise it, apply it in a task or project, and reflect on what the work demonstrates.",
    primary: "Explore courses", primaryHref: "/courses", secondary: "Find your starting point", secondaryHref: "/get-started",
    steps: [
      { title: "Learn", text: "Follow structured lessons with context, examples and learning objectives." },
      { title: "Practise", text: "Use exercises and guided activities to check understanding before moving on." },
      { title: "Build", text: "Apply knowledge to practical assignments, projects and challenges." },
      { title: "Review", text: "Use assessment criteria, feedback and reflection to understand the quality of the work." },
      { title: "Show your progress", text: "Keep evidence that helps explain what you have done and what you are ready to learn next." },
    ],
    principles: [
      { title: "Learning paths", text: "Courses and lessons provide structure while allowing learners to return to topics that need more work." },
      { title: "Skills evidence", text: "A completed course is not automatically proof of mastery; the type and source of evidence should remain clear." },
      { title: "Guidance", text: "Instructors, peers and AI assistance can support learning where those features are enabled." },
    ],
  },
  learner: {
    eyebrow: "For learners",
    title: "Learn something useful. Build something real.",
    intro: "Build understanding through lessons, practise concepts, complete practical work and keep a clearer record of what you can demonstrate.",
    primary: "Explore courses", primaryHref: "/courses", secondary: "Create your account", secondaryHref: "/get-started",
    steps: [
      { title: "Find a direction", text: "Explore the published courses and choose a useful next skill." },
      { title: "Learn at your pace", text: "Work through concepts, examples and guided practice." },
      { title: "Apply the knowledge", text: "Use assignments and projects to turn ideas into something concrete." },
      { title: "Reflect and improve", text: "Review feedback and keep evidence of the work you have completed." },
    ],
    principles: [
      { title: "A next step, not just a finish line", text: "Progress should help you decide what to practise next, not only show a completion percentage." },
      { title: "A growing portfolio", text: "Projects can carry context and explanation so others can understand your contribution." },
      { title: "Clear evidence", text: "Self-reported, automatically assessed and instructor-reviewed evidence should not be confused." },
    ],
  },
  instructor: {
    eyebrow: "For instructors",
    title: "Turn what you know into learning people can use.",
    intro: "Learnora aims to help instructors structure expertise into learning experiences that invite application, support review and help learners improve—not simply publish more content.",
    primary: "Apply to teach", primaryHref: "/apply-to-teach", secondary: "Meet instructors", secondaryHref: "/tutors",
    steps: [
      { title: "Structure", text: "Organise expertise into clear learning objectives and a logical progression." },
      { title: "Teach", text: "Pair explanations and examples with activities that invite learners to apply ideas." },
      { title: "Review", text: "Use criteria and feedback to help learners understand what is working and what needs improvement." },
      { title: "Improve", text: "Use learner progress and submissions to refine the learning experience." },
    ],
    principles: [
      { title: "Creator access is reviewed", text: "Submitting an application does not automatically approve an instructor or publish a course." },
      { title: "Evidence-led teaching", text: "Learning activities should help learners demonstrate understanding, not only consume content." },
      { title: "AI as support", text: "AI tools can assist with drafting and explanation where enabled; instructors remain responsible for quality." },
    ],
  },
  organisation: {
    eyebrow: "For organisations",
    title: "Build the capabilities your people and work need next.",
    intro: "Schools, academies, teams and businesses have different structures and goals. Learnora is being designed to support learning programmes that reflect those differences while keeping access and responsibilities clear.",
    primary: "Start an organisation enquiry", primaryHref: "/get-started", secondary: "See the approach", secondaryHref: "/how-it-works",
    steps: [
      { title: "Shape the workspace", text: "Define the organisation, its learning priorities and the roles that need access." },
      { title: "Organise learning", text: "Configure courses, teams, cohorts and tutors according to the agreed setup." },
      { title: "Support people", text: "Give learners, tutors, team leads and admins appropriately scoped workspaces." },
      { title: "Understand outcomes", text: "Review participation, assessment and practical work without treating attendance as mastery." },
    ],
    principles: [
      { title: "Multi-tenant by design", text: "An organisation's data and permissions should remain scoped to that organisation." },
      { title: "Contract-aware access", text: "Capacity and enabled modules depend on the agreed contract and platform configuration." },
      { title: "A considered rollout", text: "An enquiry or signed contract does not, by itself, activate a workspace." },
    ],
  },
};

export default function MarketingPage({ page }: { page: PageKind }) {
  const d = content[page];
  const Icon = page === "about" ? Layers3 : page === "how" ? Compass : page === "learner" ? GraduationCap : page === "instructor" ? Users : Network;
  return <main className="learnora-home min-h-screen antialiased">
    <Header/>
    <section className="learnora-hero relative overflow-hidden border-b border-white/[.08]">
      <div aria-hidden="true" className="learnora-hero-grid absolute inset-0"/>
      <div className="relative mx-auto grid max-w-[82rem] gap-12 px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-10 lg:py-24">
        <div><p className="learnora-kicker">{d.eyebrow}</p><h1 className="learnora-display mt-6 max-w-4xl text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">{d.title}</h1><p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{d.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href={d.primaryHref} className="learnora-primary-cta">{d.primary}<ArrowRight size={16}/></a><a href={d.secondaryHref} className="learnora-secondary-cta">{d.secondary}<ArrowRight size={15}/></a></div>
        </div>
        <div className="learnora-preview-window p-6 sm:p-8"><div className="flex items-center justify-between border-b border-white/[.1] pb-5"><span className="grid size-12 place-items-center rounded-xl border border-[#d7ad35]/20 bg-[#d7ad35]/10 text-[#f2d477]"><Icon size={23}/></span><span className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Learnora / {page.toUpperCase()}</span></div><h2 className="learnora-display mt-7 text-3xl leading-tight sm:text-4xl">Learn. Practise. Build. Prove.</h2><p className="mt-4 text-sm leading-7 text-slate-400">Connect lessons to practical work, feedback and evidence—while keeping the status of each feature clear.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{[{icon:BookOpen,title:"Structured learning"},{icon:Target,title:"Purposeful practice"},{icon:FileCheck2,title:"Work and evidence"},{icon:ShieldCheck,title:"Clear permissions"}].map(({icon:Item,title})=><div key={title} className="flex items-center gap-3 border border-white/[.08] bg-white/[.02] p-3"><Item size={17} className="text-[#f2d477]"/><span className="text-xs font-semibold text-slate-200">{title}</span></div>)}</div><p className="mt-5 text-[10px] leading-5 text-slate-600">Product direction and examples; feature availability varies by account and rollout.</p></div>
      </div>
    </section>
    <section className="learnora-section learnora-section-soft">
      <div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10"><div className="max-w-3xl"><p className="learnora-kicker">A connected journey</p><h2 className="learnora-section-title mt-4">Every stage should help you move forward.</h2><p className="mt-5 text-sm leading-7 text-slate-400">Learnora connects the material people study with the work they do and the feedback that helps them improve. The experience can look different by role, but the underlying principle remains the same.</p></div>
        <div className="mt-10 grid gap-0 border-y border-white/[.09] md:grid-cols-2 xl:grid-cols-4">{d.steps.map((step,i)=><article key={step.title} className="border-b border-white/[.08] p-5 last:border-0 md:border-r md:last:border-r-0 xl:border-b-0 xl:px-6 xl:py-7"><span className="font-mono text-xs tracking-[.16em] text-[#d7ad35]">0{i+1}</span><h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{step.text}</p></article>)}</div>
      </div>
    </section>
    <section className="learnora-section"><div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="learnora-kicker">Principles</p><h2 className="learnora-section-title mt-4">Designed around the work, not the hype.</h2></div><p className="max-w-2xl text-sm leading-7 text-slate-400 lg:justify-self-end">A useful platform should make it easier to learn, teach, organise work and understand outcomes—without making promises the product cannot yet support.</p></div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{d.principles.map((p,i)=><article key={p.title} className="learnora-audience-card"><span className="grid size-9 place-items-center rounded-lg border border-[#d7ad35]/20 bg-[#d7ad35]/10 text-[#f2d477]"><CheckCircle2 size={17}/></span><h3 className="mt-5 text-lg font-semibold text-white">{p.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{p.text}</p></article>)}</div>
    </div></section>
    <section className="learnora-final-cta"><div className="mx-auto flex max-w-[82rem] flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10"><div><p className="learnora-kicker"><Sparkles size={13} className="mr-2 inline"/>Take the next step</p><h2 className="learnora-display mt-3 max-w-3xl text-3xl leading-tight sm:text-4xl">Start with the goal you have today.</h2></div><a href="/get-started" className="learnora-primary-cta shrink-0">Find your starting point <ArrowRight size={16}/></a></div></section>
    <MarketingFooter/>
  </main>;
}
