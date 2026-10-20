import { ArrowUpRight, Layers3 } from "lucide-react";

const groups = [
  { title: "Explore", links: [["Courses", "/courses"], ["How it works", "/how-it-works"], ["For learners", "/for-learners"]] },
  { title: "Work with Learnora", links: [["For instructors", "/for-instructors"], ["For organisations", "/for-organisations"], ["Get started", "/get-started"]] },
  { title: "About", links: [["About Learnora", "/about"], ["Instructor directory", "/tutors"], ["Apply to teach", "/apply-to-teach"]] },
];

export default function MarketingFooter() {
  return <footer className="border-t border-white/[.1] bg-[#07090c]">
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:py-14 lg:px-10">
      <div className="grid gap-10 border-b border-white/[.1] pb-9 lg:grid-cols-[1fr_2fr]">
        <div>
          <a href="/" className="inline-flex items-center gap-3 text-sm font-semibold text-slate-100"><span className="grid size-9 place-items-center rounded-xl border border-[#d7ad35]/20 bg-[#d7ad35]/10 text-[#f2d477]"><Layers3 size={17}/></span>Learnora ME</a>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Practical learning, real work and evidence of what you can do—connected in one learning experience.</p>
          <p className="mt-3 max-w-sm text-[11px] leading-6 text-slate-600">Learnora is being built in stages. Availability depends on the live product and your account permissions.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {groups.map(group => <div key={group.title}>
            <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{group.title}</h2>
            <nav aria-label={group.title} className="mt-4 grid gap-3">
              {group.links.map(([label, href]) => <a key={href} href={href} className="group flex items-center justify-between gap-2 text-xs leading-5 text-slate-400 transition-colors hover:text-[#f2d477]"><span>{label}</span><ArrowUpRight size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"/></a>)}
            </nav>
          </div>)}
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Learnora ME</span><span>Learn. Practise. Build. Prove.</span></div>
    </div>
  </footer>;
}
