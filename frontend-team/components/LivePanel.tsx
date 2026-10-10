import EmptyState from "./EmptyState";
export default function LivePanel({title,children,empty=false}:{title:string;children?:React.ReactNode;empty?:boolean}) {
  return <section className="border border-white/[.1] bg-[#11171e] p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3 border-b border-white/[.08] pb-4"><h2 className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">{title}</h2><span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--gold2)]/70"/></div>
    <div className="pt-5">{empty?<EmptyState title="No live records" message="The backend returned no records for this view."/>:children}</div>
  </section>;
}