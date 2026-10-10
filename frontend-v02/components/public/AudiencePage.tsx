import { IMAGES } from "../../lib/constants";
import { ArrowRight, CheckCircle2, Compass, FileCheck2, FolderKanban, GraduationCap, Network, Users } from "lucide-react";

const data:any={
  learner:{eyebrow:"For learners",title:"Learn something useful. Build something real. Keep proof of your progress.",intro:"Learnora is being built for people who want to move beyond watching lessons. Learn concepts, practise them, create work and gradually build a clearer picture of what you can do.",image:IMAGES.learnerPage,cta:"Explore courses",href:"/courses",promise:"A learning journey you can return to, reflect on and build on.",steps:[["Learn","Follow lessons with clear objectives and examples."],["Practise","Use exercises and feedback to work through the hard parts."],["Build","Apply your knowledge to projects and practical challenges."],["Show your work","Collect evidence, feedback and projects in a portfolio."]],notes:["Progress that helps you decide what to do next","Practice and project work connected to learning","A Skills Passport designed to distinguish claimed skills from reviewed evidence","An AI tutor and coach where access is available"]},
  instructor:{eyebrow:"For instructors",title:"Turn what you know into learning people can use.",intro:"Learnora aims to support instructors and creators as they turn expertise into structured, practical learning. The goal is not only to publish content, but to help learners apply it and receive useful feedback.",image:IMAGES.instructorPage,cta:"Browse instructors",href:"/tutors",secondaryCta:"Apply to teach",secondaryHref:"/apply-to-teach",promise:"A creator experience that connects teaching, practice and learner progress.",steps:[["Structure","Organise your expertise into clear learning outcomes."],["Teach","Create learning material and activities that invite application."],["Review","Use criteria, rubrics and feedback to support improvement."],["Grow","Understand engagement and build your teaching practice."]],notes:["Course and learning-product creation as creator access is enabled","Learner progress and submission review","AI support for explanations, activities and rubric drafts","Creator earnings and commerce features as they become available"]},
  organisation:{eyebrow:"For organisations",title:"Build the capabilities your people and work need next.",intro:"Every organisation has its own shape. Learnora is being designed to support schools, academies, teams and businesses with learning programmes that reflect their people, priorities and operating model.",image:IMAGES.organisationPage,cta:"Start an organisation enquiry",href:"/get-started",promise:"Learning programmes that connect people, practice and evidence—not just attendance.",steps:[["Shape the workspace","Choose an organisational model and configure the relevant modules."],["Organise learning","Set up programmes, cohorts, teams and course access as needed."],["Support people","Give admins, tutors, team leads and learners scoped workspaces."],["Understand outcomes","Review participation, assessments, practical work and skill evidence."]],notes:["Flexible structure: not every organisation needs the same hierarchy","Organisation-owned learning alongside Learnora courses","Role-scoped administration for teams, tutors and learners","Capacity and access governed by the agreed contract"]}
};
export default function AudiencePage({type}:{type:"learner"|"instructor"|"organisation"}) {
  const d=data[type];
  const Icon=type==="learner"?GraduationCap:type==="instructor"?Users:Network;
  const finalHref=type==="organisation"?"/get-started":type==="instructor"?"/tutors":"/courses";
  const finalLabel=type==="organisation"?"Contact Learnora":type==="instructor"?"Meet instructors":"Explore learning";
  return <main className="pt-20">
    <section className="border-b border-white/[.1]">
      <div className="mx-auto grid max-w-[82rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <p className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--gold-light)]"><span className="h-px w-7 bg-[var(--gold)]"/>{d.eyebrow}</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">{d.title}</h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">{d.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href={d.href} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--gold)] px-5 text-sm font-bold text-[#17140d] transition-colors hover:bg-[var(--gold-light)]">{d.cta}<ArrowRight size={16}/></a>{d.secondaryHref&&<a href={d.secondaryHref} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/[.15] px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30">{d.secondaryCta}<ArrowRight size={15}/></a>}</div>
          <p className="mt-5 max-w-lg text-[11px] leading-5 text-slate-600">Learnora is evolving. Features shown as part of the product direction may not all be available to every account today.</p>
        </div>
        <div className="relative">
          <div className="mb-3 flex items-center justify-between border-b border-white/[.12] pb-3 text-[10px] uppercase tracking-[.18em] text-slate-500"><span>Designed around your work</span><span>Learnora / {type==="learner"?"01":type==="instructor"?"02":"03"}</span></div>
          <div className="relative aspect-[4/4.3] overflow-hidden border border-white/[.12] bg-[#151c24]">
            <img src={d.image} alt={type==="learner"?"A learner studying and developing practical skills":type==="instructor"?"An instructor preparing and sharing learning": "A collaborative professional workspace"} loading="lazy" decoding="async" className="h-full w-full object-cover"/>
            <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-[#090b0e]/95 p-5 sm:p-6"><Icon className="gold" size={21}/><p className="mt-3 max-w-md font-display text-2xl leading-snug sm:text-3xl">{d.promise}</p></div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">One experience, shaped by your role and access.</p>
        </div>
      </div>
    </section>

    <section className="site-section">
      <div className="mx-auto max-w-[82rem] px-5 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr] lg:items-end"><div><p className="section-kicker">How the journey works</p><h2 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">A practical rhythm, not a race to the end.</h2></div><p className="max-w-xl text-sm leading-7 text-slate-400 lg:justify-self-end">Each stage has a purpose. Learnora is designed to connect the material, the work people do with it and the feedback that helps them move forward.</p></div>
        <div className="mt-10 grid gap-0 border-y border-white/[.12] md:grid-cols-2 xl:grid-cols-4">{d.steps.map((s:string[],i:number)=><article key={s[0]} className="border-b border-white/[.1] py-6 md:px-5 md:even:border-l xl:border-b-0 xl:first:pl-0 xl:last:pr-0 xl:not(:first-child){ }"><span className="text-xs tabular-nums text-[var(--gold-light)]">0{i+1}</span><h3 className="mt-5 font-display text-2xl">{s[0]}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{s[1]}</p></article>)}</div>
      </div>
    </section>

    <section className="border-y border-white/[.1] bg-[#0c1015] py-16 sm:py-20">
      <div className="mx-auto grid max-w-[82rem] gap-10 px-5 lg:grid-cols-[.78fr_1.22fr] lg:px-8"><div><p className="section-kicker">What this path supports</p><h2 className="mt-4 max-w-md font-display text-4xl leading-tight sm:text-5xl">A clearer view of the work and the next step.</h2></div><div className="divide-y divide-white/[.1] border-y border-white/[.1]">{d.notes.map((note:string,i:number)=><div key={note} className="flex gap-4 py-4"><CheckCircle2 className="mt-1 shrink-0 gold" size={17}/><div className="flex-1 text-sm leading-7 text-slate-300">{note}</div><span className="pt-1 text-[10px] tabular-nums text-slate-600">0{i+1}</span></div>)}</div></div>
    </section>

    <section className="mx-auto max-w-[82rem] px-5 py-16 sm:py-20 lg:px-8"><div className="grid gap-6 border border-white/[.12] bg-[#11171e] p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center"><div><p className="section-kicker">Take the next step</p><h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">Start with what you need today.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Explore what is available now, and use the contact path that matches your role.</p></div><a href={finalHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-5 text-sm font-bold text-[#17140d] transition-colors hover:bg-[var(--gold-light)]">{finalLabel}<ArrowRight size={16}/></a></div></section>
  </main>;
}
