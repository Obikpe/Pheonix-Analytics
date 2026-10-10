import { ArrowUpRight, BookOpen, FileCheck2, FolderKanban, Target } from "lucide-react";
import { IMAGES } from "../../lib/constants";

const items = [
  { number: "01", title: "Learn", description: "Build understanding with structured lessons and useful examples.", image: IMAGES.library, icon: BookOpen, href: "/courses" },
  { number: "02", title: "Practise", description: "Try the ideas, get feedback and return to what needs work.", image: IMAGES.workshop, icon: Target, href: "/courses" },
  { number: "03", title: "Build", description: "Turn knowledge into projects, assignments and practical work.", image: IMAGES.tutors, icon: FolderKanban, href: "/for-learners" },
  { number: "04", title: "Prove", description: "Keep the work, context and feedback that show your progress.", image: IMAGES.community, icon: FileCheck2, href: "/for-learners" },
];

export default function Journey() {
  return (
    <section className="site-section">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div><p className="section-kicker">The Learnora loop</p><h2 className="mt-5 max-w-xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">Learning should leave a <span className="gold">trace.</span></h2></div>
          <p className="max-w-xl leading-7 text-slate-400 lg:justify-self-end">A connected journey from understanding an idea to using it, reflecting on it and keeping a record of the work. Each stage has a purpose; none is a substitute for the next.</p>
        </div>
        <div className="mt-12 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          {items.map(({number,title,description,image,icon:Icon,href}) => <a href={href} key={title} className="group bg-[#0b0f14]">
            <div className="relative h-56 overflow-hidden bg-[#151c24] sm:h-64"><img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/><span className="absolute left-5 top-5 bg-[#080a0d] px-3 py-2 text-xs font-semibold tracking-[.12em] text-[#f2d477]">{number}</span></div>
            <div className="p-6 sm:p-7"><div className="flex items-center justify-between"><Icon size={20} className="gold"/><ArrowUpRight size={18} className="text-slate-600 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#f2d477]"/></div><h3 className="mt-6 font-display text-3xl">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">{description}</p></div>
          </a>)}
        </div>
      </div>
    </section>
  );
}
