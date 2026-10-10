import PublicNav from "../components/public/PublicNav";
import PublicFooter from "../components/public/PublicFooter";
import Hero from "../components/public/Hero";
import Journey from "../components/public/Journey";
import AudienceCards from "../components/public/AudienceCards";
import { IMAGES } from "../lib/constants";
import { ArrowDownRight, ArrowRight, Compass, FileCheck2, GraduationCap, Network, Sparkles } from "lucide-react";

const stages = [
  { n: "01", title: "Learn with intention", text: "Follow structured learning that helps you understand the ideas, not simply move through a list of lessons." },
  { n: "02", title: "Practise with feedback", text: "Try concepts, make mistakes safely, and use feedback to decide what to revisit." },
  { n: "03", title: "Build something real", text: "Apply what you know in projects, assignments and practical challenges that have a clear purpose." },
  { n: "04", title: "Keep evidence", text: "Collect work, assessment results and reviews that show what you have actually demonstrated." },
  { n: "05", title: "Show your growth", text: "Bring your skills, projects and learning record together in a portfolio you can explain and share." },
];

export default function Home() {
  return <>
    <PublicNav />
    <Hero />
    <section className="border-y border-white/[.06] bg-[#0b0f14] py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] gold">The idea behind Learnora</p>
          <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">A course can start the journey. It should not have to be the end.</h2>
        </div>
        <div className="max-w-2xl lg:justify-self-end">
          <p className="text-lg leading-8 text-slate-300">People learn for many reasons: to change careers, deepen their craft, support a team, teach others or solve a problem they care about. But learning often gets scattered across videos, notes, practice files and certificates.</p>
          <p className="mt-5 leading-7 text-slate-500">Learnora ME is being built to connect those pieces. It brings learning, practice, projects, assessment, evidence and the people who support growth into one connected experience.</p>
          <a href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold gold">Read our story <ArrowRight size={16}/></a>
        </div>
      </div>
    </section>

    <Journey />

    <section className="py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10">
          <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{backgroundImage:"url("+IMAGES.portfolio+")"}} />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#090c10]/85 p-5 backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7">
            <div className="flex items-center gap-3"><FileCheck2 className="gold" size={20}/><div><p className="font-semibold">A record of demonstrated work</p><p className="mt-1 text-sm text-slate-400">Projects · Feedback · Skills · Evidence</p></div></div>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] gold">From learning to evidence</p>
          <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">Progress should mean more than a percentage.</h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">Finishing a course can tell you that you reached the end of its material. It cannot, by itself, tell the whole story of what you can do.</p>
          <p className="mt-4 leading-7 text-slate-500">Learnora's direction is to connect progress with practical work, assessment criteria, feedback and evidence. Where a person has not yet been reviewed, the platform should say so clearly. Credibility depends on being honest about what has—and has not—been demonstrated.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border-l border-[#d7ad35]/50 pl-4"><p className="font-semibold">Skills Passport</p><p className="mt-1 text-sm leading-6 text-slate-500">A structured view of skills and the evidence supporting them.</p></div>
            <div className="border-l border-[#d7ad35]/50 pl-4"><p className="font-semibold">Portfolio</p><p className="mt-1 text-sm leading-6 text-slate-500">Projects with context, contribution and feedback—not just file uploads.</p></div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-white/[.06] bg-[#0b0f14] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] gold">A connected ecosystem</p><h2 className="mt-5 font-display text-4xl sm:text-5xl">Different journeys. One shared foundation.</h2></div>
          <p className="max-w-2xl leading-7 text-slate-400 lg:justify-self-end">Learners need room to practise. Instructors need tools to teach and review. Organisations need visibility into capability and outcomes. Learnora is designed around those different needs without pretending every person or institution works the same way.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {icon:GraduationCap,title:"For learners",body:"Build useful skills through lessons, practice, projects and an honest record of progress.",href:"/for-learners",image:IMAGES.learners},
            {icon:Compass,title:"For instructors",body:"Create practical learning, support learners, review work and grow your teaching practice.",href:"/for-instructors",image:IMAGES.instructors},
            {icon:Network,title:"For organisations",body:"Shape learning around your people, programmes, teams and agreed outcomes.",href:"/for-organisations",image:IMAGES.organisations},
          ].map(({icon:Icon,title,body,href,image})=><a key={title} href={href} className="group overflow-hidden rounded-[1.7rem] border border-white/[.08] bg-[#0e1319] transition hover:-translate-y-1 hover:border-[#d7ad35]/30">
            <div className="h-48 overflow-hidden bg-[#151c24]"><img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/></div>
            <div className="px-6 pb-6"><Icon className="gold" size={22}/><h3 className="mt-4 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{body}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold gold">Explore this path <ArrowRight size={15}/></span></div>
          </a>)}
        </div>
      </div>
    </section>

    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] gold">The principles</p><h2 className="mt-5 font-display text-4xl sm:text-5xl">Built around progress people can explain.</h2></div>
          <div className="divide-y divide-white/[.08] border-y border-white/[.08]">
            {[
              ["Practice matters","Understanding grows when people use ideas, make decisions and learn from feedback."],
              ["Evidence should be honest","Self-reported, automatically assessed and instructor-reviewed evidence should never be presented as the same thing."],
              ["People learn together","Tutors, peers and teams can make learning more supported and more connected to real needs."],
              ["Access should have context","A learner's experience should reflect their courses, cohort, role and permissions—not a one-size-fits-all dashboard."],
            ].map(([title,body])=><div key={title} className="grid gap-3 py-6 sm:grid-cols-[.55fr_1fr] sm:gap-8"><h3 className="font-semibold">{title}</h3><p className="text-sm leading-7 text-slate-400">{body}</p></div>)}
          </div>
        </div>
      </div>
    </section>

    <AudienceCards />

    <section className="px-5 pb-24 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#d7ad35]/20 bg-[#10151b]">
        <div className="grid lg:grid-cols-[1fr_.8fr]">
          <div className="p-8 sm:p-12 lg:p-16"><p className="text-xs font-bold uppercase tracking-[.22em] gold">Start where you are</p><h2 className="mt-5 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Your next step does not have to be your whole future.</h2><p className="mt-5 max-w-xl leading-7 text-slate-400">Explore a course, bring your teaching experience, or tell us what your organisation is trying to build. Learnora is a work in progress, and we will be clear about what is available as it grows.</p><a href="/get-started" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-5 py-3.5 font-bold text-black">Find your starting point <ArrowRight size={16}/></a></div>
          <div className="relative min-h-[280px] lg:min-h-full"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:"url("+IMAGES.studio+")"}}/><div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs text-slate-200 backdrop-blur"><Sparkles size={14} className="gold"/> A place to keep growing <ArrowDownRight size={14}/></div></div>
        </div>
      </div>
    </section>
    <PublicFooter />
  </>;
}