import { ArrowUpRight } from "lucide-react";
import Logo from "../brand/Logo";

const groups=[
  {title:"Explore",links:[["Explore courses","/courses"],["How it works","/how-it-works"],["For learners","/for-learners"]]},
  {title:"Work with Learnora",links:[["For instructors","/for-instructors"],["For organisations","/for-organisations"],["Get started","/get-started"]]},
  {title:"Your account",links:[["Sign in","/login"],["Create account","/register"],["About Learnora","/about"]]},
  {title:"Policies",links:[["Privacy policy","/privacy"],["Terms of use","/terms"],["Cookies & storage","/cookies"]]}
];

export default function PublicFooter() {
  return <footer className="border-t border-white/[.1] bg-[#07090c]">
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:py-16 lg:px-8">
      <div className="grid gap-10 border-b border-white/[.1] pb-10 lg:grid-cols-[1.25fr_2fr] lg:gap-16">
        <div><Logo/><p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Practical learning, evidence and opportunity in one connected experience.</p><p className="mt-4 max-w-sm text-[11px] leading-6 text-slate-600">Learnora is being built in stages. Availability depends on the live product and your account permissions.</p></div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {groups.map(group=><div key={group.title}><h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{group.title}</h2><nav aria-label={group.title} className="mt-4 grid gap-3">{group.links.map(([label,href])=><a key={href} href={href} className="group flex items-center justify-between gap-2 text-xs leading-5 text-slate-400 transition-colors hover:text-[var(--gold-light)]"><span>{label}</span><ArrowUpRight size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"/></a>)}</nav></div>)}
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Learnora ME</span><span>Learn. Practise. Build. Prove.</span><a href="/privacy" className="w-fit hover:text-slate-300">Privacy and account data</a></div>
    </div>
  </footer>;
}
