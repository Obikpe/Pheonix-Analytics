export default function StatCard({label,value,detail}:{label:string;value:any;detail?:string}) {
  return <section className="group min-w-0 border border-white/[.1] bg-[#11171e] p-5 transition-colors hover:border-white/[.18] sm:p-6">
    <div className="flex items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-[.13em] text-slate-500">{label}</p><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]/70"/></div>
    <div className="mt-4 break-words text-3xl font-semibold tracking-tight tabular-nums text-[var(--text)] sm:text-4xl">{value??"—"}</div>
    {detail&&<p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>}
  </section>;
}