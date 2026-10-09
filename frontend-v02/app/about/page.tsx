import PublicNav from "../../components/public/PublicNav";
import PublicFooter from "../../components/public/PublicFooter";
import { IMAGES } from "../../lib/constants";
import { ArrowRight, Compass, HeartHandshake, Layers3, ShieldCheck } from "lucide-react";

export default function Page() {
  return <>
    <PublicNav />
    <main className="pt-20">
      <section className="relative overflow-hidden border-b border-white/[.06]">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{backgroundImage:"linear-gradient(90deg,#07090c,#07090c88),url("+IMAGES.community+")"}}/>
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:py-32 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.22em] gold">About Learnora ME</p>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">Learning should open a door—not leave you standing at the finish line.</h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">Learnora is being built around a simple belief: learning becomes more useful when people can practise what they learn, build something with it, show what they have demonstrated and keep growing from there.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:py-24 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
        <div><p className="text-xs font-bold uppercase tracking-[.22em] gold">The problem we want to solve</p><h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">Knowledge is valuable. Being able to use it matters too.</h2></div>
        <div className="space-y-5 text-base leading-8 text-slate-400">
          <p>Learning today can happen almost anywhere, but the journey is often fragmented. A lesson lives on one platform, practice files somewhere else, feedback in a message, a project on a drive, and a certificate in an inbox. The learner is left to connect the story alone.</p>
          <p>At the same time, a completed course and a demonstrated skill are not identical. Employers, clients, instructors and teams need context to understand what someone can do; learners need feedback that helps them recognise what they have learned and what they should practise next.</p>
          <p>Learnora's purpose is to make that journey more connected. The platform is designed to bring learning, deliberate practice, practical work, assessment, feedback, skills evidence and a portfolio closer together.</p>
        </div>
      </section>

      <section className="border-y border-white/[.06] bg-[#0b0f14] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.22em] gold">Our approach</p>
          <h2 className="mt-5 max-w-3xl font-display text-4xl sm:text-5xl">A connected path from curiosity to capability.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {icon:Compass,title:"Learn with purpose",body:"Understand concepts through structured lessons, examples and clear objectives."},
              {icon:Layers3,title:"Practise and build",body:"Apply knowledge in exercises, projects, assignments and practical scenarios."},
              {icon:ShieldCheck,title:"Show what is demonstrated",body:"Keep evidence and feedback, while making the level of review visible and honest."},
              {icon:HeartHandshake,title:"Grow with people",body:"Connect learners with instructors, peers and organisations that support development."},
            ].map(({icon:Icon,title,body},i)=><article key={title} className="rounded-2xl border border-white/[.08] bg-[#10161d] p-6">
              <span className="text-xs gold">0{i+1}</span><Icon size={24} className="mt-5 gold"/><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:py-24 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-white/10"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:"linear-gradient(0deg,#07090c55,#07090c00),url("+IMAGES.projects+")"}}/></div>
        <div><p className="text-xs font-bold uppercase tracking-[.22em] gold">Our long-term vision</p><h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">A learning record that grows with the person.</h2><p className="mt-6 leading-8 text-slate-400">We want Learnora to become a place where learning is not isolated from doing. A learner could build a body of work over time; an instructor could guide and assess practical progress; an organisation could understand its learning programmes and capability gaps; and evidence could help people explain their strengths with more confidence and context.</p><p className="mt-4 leading-8 text-slate-400">That is a direction, not a claim that every part is already available. We intend to build deliberately, test with real learners and organisations, and be transparent about what works today and what is still developing.</p><a href="/how-it-works" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold gold">Explore how it works <ArrowRight size={16}/></a></div>
      </section>

      <section className="px-5 pb-24 lg:px-8"><div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d7ad35]/20 bg-[#10151b] p-8 sm:p-12"><p className="text-xs font-bold uppercase tracking-[.22em] gold">What we believe</p><h2 className="mt-4 max-w-3xl font-display text-3xl sm:text-4xl">People deserve a clearer way to learn, practise, reflect and show their growth.</h2><p className="mt-5 max-w-3xl leading-7 text-slate-400">Learnora ME is being built for learners, instructors and organisations who want education to connect more meaningfully with real capability. The platform will continue to evolve, but the principle should remain: be practical, be honest about evidence, and help people take the next useful step.</p><a href="/get-started" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-5 py-3.5 font-bold text-black">Find your path <ArrowRight size={16}/></a></div></section>
    </main>
    <PublicFooter />
  </>;
}