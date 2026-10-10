import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Compass } from "lucide-react";
import { IMAGES } from "../../lib/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[.08] pt-20">
      <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 border-l-2 border-[#d7ad35] pl-3 text-xs font-semibold uppercase tracking-[.2em] text-[#f2d477]">
            Learn · Practise · Build · Prove
          </div>
          <h1 className="mt-7 max-w-3xl font-display text-[3.5rem] leading-[.98] tracking-[-.045em] sm:text-7xl lg:text-[5.7rem]">
            Make learning <span className="gold">count</span> in the real world.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            Learnora brings lessons, practice, projects, feedback and skills evidence into one connected experience—so you can move from understanding an idea to using it with confidence.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="/courses" className="inline-flex items-center gap-3 rounded-lg bg-[#d7ad35] px-5 py-3.5 text-sm font-bold text-[#11110d] transition-colors hover:bg-[#f2d477]">
              Explore learning <ArrowRight size={16}/>
            </a>
            <a href="/how-it-works" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/35 hover:bg-white/[.03]">
              How Learnora works <ArrowUpRight size={16}/>
            </a>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 border-t border-white/[.1] pt-5">
            <div className="pr-3"><BookOpen size={18} className="gold"/><p className="mt-3 text-sm font-semibold">Learn clearly</p><p className="mt-1 text-xs leading-5 text-slate-500">Structured lessons</p></div>
            <div className="border-l border-white/[.1] px-4"><Compass size={18} className="gold"/><p className="mt-3 text-sm font-semibold">Practise deeply</p><p className="mt-1 text-xs leading-5 text-slate-500">Work that teaches</p></div>
            <div className="border-l border-white/[.1] pl-4"><CheckCircle2 size={18} className="gold"/><p className="mt-3 text-sm font-semibold">Show your work</p><p className="mt-1 text-xs leading-5 text-slate-500">Evidence with context</p></div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[580px] lg:ml-auto">
          <div className="absolute -left-4 top-10 hidden h-24 w-24 border-l border-t border-[#d7ad35]/45 sm:block"/>
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[12rem] rounded-b-[1.5rem] border border-white/10 bg-[#121820]">
            <img src={IMAGES.hero} alt="Learners collaborating around a table" className="h-full w-full object-cover" fetchPriority="high"/>
          </div>
          <div className="absolute -bottom-5 left-4 right-4 border border-white/10 bg-[#0e1319] p-5 shadow-2xl sm:-left-10 sm:right-12 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] gold">The Learnora approach</p>
            <p className="mt-3 max-w-sm font-display text-2xl leading-snug sm:text-3xl">A course is a beginning. What you do with it is the story.</p>
            <div className="mt-4 flex items-center justify-between border-t border-white/[.08] pt-4 text-xs text-slate-500"><span>Learning · Practice · Projects · Evidence</span><span className="gold">01 / 04</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
