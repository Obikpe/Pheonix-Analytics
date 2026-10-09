import { IMAGES } from "../../lib/constants";
import { ArrowRight, CheckCircle2, Compass, FileCheck2, FolderKanban, GraduationCap, Network, Users } from "lucide-react";

const data:any={
  learner:{
    eyebrow:"For learners",title:"Learn something useful. Build something real. Keep proof of your progress.",
    intro:"Learnora is being built for people who want to move beyond watching lessons. Learn concepts, practise them, create work and gradually build a clearer picture of what you can do.",
    image:IMAGES.learners,cta:"Explore courses",href:"/courses",
    promise:"A learning journey you can return to, reflect on and build on.",
    steps:[["Learn","Follow lessons with clear objectives and examples."],["Practise","Use exercises and feedback to work through the hard parts."],["Build","Apply your knowledge to projects and practical challenges."],["Show your work","Collect evidence, feedback and projects in a portfolio."]],
    notes:["Progress that helps you decide what to do next","Practice and project work connected to learning","A Skills Passport designed to distinguish claimed skills from reviewed evidence","An AI tutor and coach where access is available"]
  },
  instructor:{
    eyebrow:"For instructors",title:"Turn what you know into learning people can use.",
    intro:"Learnora aims to support instructors and creators as they turn expertise into structured, practical learning. The goal is not only to publish content, but to help learners apply it and receive useful feedback.",
    image:IMAGES.instructors,cta:"Browse instructors",href:"/tutors",
    promise:"A creator experience that connects teaching, practice and learner progress.",
    steps:[["Structure","Organise your expertise into clear learning outcomes."],["Teach","Create learning material and activities that invite application."],["Review","Use criteria, rubrics and feedback to support improvement."],["Grow","Understand engagement and build your teaching practice."]],
    notes:["Course and learning-product creation as creator access is enabled","Learner progress and submission review","AI support for explanations, activities and rubric drafts","Creator earnings and commerce features as they become available"]
  },
  organisation:{
    eyebrow:"For organisations",title:"Build the capabilities your people and work need next.",
    intro:"Every organisation has its own shape. Learnora is being designed to support schools, academies, teams and businesses with learning programmes that reflect their people, priorities and operating model.",
    image:IMAGES.organisations,cta:"Start an organisation enquiry",href:"/get-started",
    promise:"Learning programmes that connect people, practice and evidence—not just attendance.",
    steps:[["Shape the workspace","Choose an organisational model and configure the relevant modules."],["Organise learning","Set up programmes, cohorts, teams and course access as needed."],["Support people","Give admins, tutors, team leads and learners scoped workspaces."],["Understand outcomes","Review participation, assessments, practical work and skill evidence."]],
    notes:["Flexible structure: not every organisation needs the same hierarchy","Organisation-owned learning alongside Learnora courses","Role-scoped administration for teams, tutors and learners","Capacity and access governed by the agreed contract"]
  }
};
export default function AudiencePage({type}:{type:"learner"|"instructor"|"organisation"}) {
  const d=data[type];
  const Icon=type==="learner"?GraduationCap:type==="instructor"?Users:Network;
  return <main className="pt-20">
    <section className="border-b border-white/[.06] py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_.85fr] lg:items-center lg:px-8">
        <div><p className="text-xs font-bold uppercase tracking-[.22em] gold">{d.eyebrow}</p><h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.04] sm:text-6xl">{d.title}</h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">{d.intro}</p><a href={d.href} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-5 py-3.5 font-bold text-black">{d.cta}<ArrowRight size={16}/></a><p className="mt-4 text-xs leading-5 text-slate-500">Learnora is evolving. Features shown as part of the product direction may not all be available to every account today.</p></div>
        <div className="relative min-h-[400px] overflow-hidden rounded-[2rem] border border-white/10 sm:min-h-[500px]"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:"linear-gradient(180deg,#07090c05,#07090c66),url("+d.image+")"}}/><div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#080b0f]/85 p-5 backdrop-blur-md"><Icon className="gold" size={22}/><p className="mt-3 text-lg font-semibold">{d.promise}</p></div></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-20 sm:py-24 lg:px-8">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.22em] gold">How the journey works</p><h2 className="mt-4 font-display text-4xl sm:text-5xl">A practical rhythm, not a race to the end.</h2></div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{d.steps.map((s:string[],i:number)=><article key={s[0]} className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-6"><span className="text-xs gold">0{i+1}</span><h3 className="mt-6 text-xl font-semibold">{s[0]}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{s[1]}</p></article>)}</div>
    </section>
    <section className="border-y border-white/[.06] bg-[#0b0f14] py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.22em] gold">What this path is designed to support</p><h2 className="mt-4 font-display text-4xl sm:text-5xl">A clearer view of the work and the next step.</h2></div><div className="grid gap-4 sm:grid-cols-2">{d.notes.map((n:string)=><div key={n} className="flex gap-3 rounded-xl border border-white/[.07] bg-[#10161d] p-5"><CheckCircle2 className="mt-0.5 shrink-0 gold" size={18}/><p className="text-sm leading-6 text-slate-300">{n}</p></div>)}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="flex flex-col gap-6 rounded-[2rem] border border-[#d7ad35]/20 bg-[#10151b] p-8 sm:p-12 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] gold">Take the next step</p><h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-4xl">Start with what you need today.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-400">Explore what is available now, and use the contact path that matches your role.</p></div><a href={type==="organisation"?"/get-started":type==="instructor"?"/tutors":"/courses"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d7ad35] px-5 py-3.5 font-bold text-black">{type==="organisation"?"Contact Learnora":type==="instructor"?"Meet instructors":"Explore learning"}<ArrowRight size={16}/></a></div></section>
  </main>;
}