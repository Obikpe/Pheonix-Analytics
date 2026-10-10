import { ArrowRight, Compass } from "lucide-react";
export default function AudienceCards() {
  return <section className="px-5 pb-24 pt-10 lg:px-8">
    <div className="mx-auto max-w-[82rem] border-y border-white/[.12] py-10 sm:py-14">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div><p className="section-kicker">Your next chapter</p><h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">Start with what you want to be able to do.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Explore the live catalogue, find a learning path or understand how Learnora can support your teaching or organisation.</p></div>
        <div className="flex flex-wrap gap-3 md:flex-col"><a href="/courses" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-5 text-sm font-bold text-[#17140d] transition-colors hover:bg-[var(--gold-light)]">Explore courses <ArrowRight size={15}/></a><a href="/how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/[.14] px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30"><Compass size={15}/> How it works</a></div>
      </div>
    </div>
  </section>;
}
