import { ArrowUpRight, BookOpen, FileCheck2, FolderKanban, Target } from "lucide-react";
import { IMAGES } from "../../lib/constants";

const items = [
  { number: "01", title: "Learn", description: "Build understanding with structured lessons, useful examples and clear outcomes.", image: IMAGES.library, icon: BookOpen, href: "/courses", note: "Understand the idea" },
  { number: "02", title: "Practise", description: "Try the ideas, make mistakes safely and use feedback to decide what to revisit.", image: IMAGES.workshop, icon: Target, href: "/courses", note: "Work through the hard parts" },
  { number: "03", title: "Build", description: "Turn knowledge into projects, assignments and practical work with a purpose.", image: IMAGES.tutors, icon: FolderKanban, href: "/for-learners", note: "Apply what you know" },
  { number: "04", title: "Prove", description: "Keep the work, context and feedback that make your progress easier to explain.", image: IMAGES.community, icon: FileCheck2, href: "/for-learners", note: "Keep the evidence" },
];

export default function Journey() {
  return <section className="site-section">
    <div className="mx-auto max-w-[82rem] px-5 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
        <div><p className="section-kicker">The Learnora loop</p><h2 className="mt-5 max-w-xl font-display text-4xl leading-[1.04] sm:text-5xl lg:text-6xl">Learning should leave a <span className="gold">trace.</span></h2></div>
        <p className="max-w-xl text-base leading-7 text-slate-400 lg:justify-self-end">A connected journey from understanding an idea to using it, reflecting on it and keeping a record of the work. Each stage has a purpose; none is a substitute for the next.</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({number,title,description,image,icon:Icon,href,note}) => <a href={href} key={title} className="group min-w-0">
          <div className="relative aspect-[4/4.7] overflow-hidden border border-white/[.1] bg-[#151c24]">
            <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"/>
            <span className="absolute left-4 top-4 border border-white/20 bg-[#090b0e]/90 px-3 py-2 text-[10px] font-semibold tracking-[.16em] text-[var(--gold-light)]">{number} / 04</span>
            <span className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-[#090b0e]/90 px-4 py-3 text-xs text-slate-300">{note}</span>
          </div>
          <div className="border-b border-white/[.12] pb-5 pt-5 transition-colors group-hover:border-[var(--gold)]/60">
            <div className="flex items-center justify-between"><Icon size={19} className="gold"/><ArrowUpRight size={17} className="text-slate-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--gold-light)]"/></div>
            <h3 className="mt-4 font-display text-3xl">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </a>)}
      </div>
    </div>
  </section>;
}
