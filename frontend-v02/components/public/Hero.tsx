import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Compass } from "lucide-react";
import { IMAGES } from "../../lib/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[.08] pt-20">
      <div className="mx-auto grid min-h-[700px] max-w-[82rem] items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="relative z-10 pb-3">
          <div className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.2em] text-[var(--gold-light)]">
            <span className="h-px w-8 bg-[var(--gold)]"/>
            Learn · Practise · Build · Prove
          </div>
          <h1 className="mt-7 max-w-3xl font-display text-[3.45rem] leading-[.99] tracking-[-.055em] sm:text-7xl lg:text-[5.35rem]">
            Make learning <span className="gold">count</span> beyond the classroom.
          </h1>
          <p className="mt-7 max-w-[34rem] text-base leading-8 text-slate-300 sm:text-lg">
            Learnora connects lessons to practice, projects, feedback and skills evidence—so the work you put into learning becomes work you can use, explain and build on.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="/courses" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-[var(--gold)] px-5 text-sm font-bold text-[#17140d] transition-colors hover:bg-[var(--gold-light)]">
              Explore learning <ArrowRight size={16}/>
            </a>
            <a href="/how-it-works" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/[.16] px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/[.35] hover:bg-white/[.035]">
              How it works <ArrowUpRight size={16}/>
            </a>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 border-t border-white/[.12] pt-5">
            <div className="pr-3"><BookOpen size={18} className="gold"/><p className="mt-3 text-sm font-semibold">Learn clearly</p><p className="mt-1 text-xs leading-5 text-slate-500">Structured lessons</p></div>
            <div className="border-l border-white/[.1] px-4"><Compass size={18} className="gold"/><p className="mt-3 text-sm font-semibold">Practise deeply</p><p className="mt-1 text-xs leading-5 text-slate-500">Work that teaches</p></div>
            <div className="border-l border-white/[.1] pl-4"><CheckCircle2 size={18} className="gold"/><p className="mt-3 text-sm font-semibold">Show your work</p><p className="mt-1 text-xs leading-5 text-slate-500">Evidence with context</p></div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
          <div className="mb-3 flex items-center justify-between border-b border-white/[.12] pb-3 text-[10px] uppercase tracking-[.18em] text-slate-500"><span>Learning in motion</span><span>01 — 04</span></div>
          <div className="relative aspect-[4/4.6] overflow-hidden border border-white/[.12] bg-[#151c24]">
            <img src={IMAGES.hero} alt="Learners working together at a table" className="h-full w-full object-cover" fetchPriority="high" decoding="async"/>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 border-t border-white/20 bg-[#090b0e]/90 p-5 sm:p-6">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] gold">The Learnora approach</p><p className="mt-2 max-w-sm font-display text-2xl leading-snug sm:text-3xl">A course is a beginning. What you do with it is the story.</p></div>
              <span className="hidden shrink-0 border-l border-white/20 pl-4 text-xs leading-5 text-slate-400 sm:block">Learning<br/>Practice<br/>Projects<br/>Evidence</span>
            </div>
          </div>
          <div className="mt-3 flex items-start justify-between gap-6 text-xs leading-5 text-slate-500"><span className="max-w-[18rem]">One connected path from understanding an idea to applying it.</span><span className="shrink-0 text-[var(--gold-light)]">Built for real progress ↗</span></div>
        </div>
      </div>
    </section>
  );
}
