import { LibraryBig } from "lucide-react";
export default function EmptyState({title,message,action}:{title:string;message:string;action?:React.ReactNode}) {
  return <section className="border border-dashed border-white/[.14] bg-[#0d1217] px-6 py-10 text-center sm:px-10" aria-live="polite">
    <div className="mx-auto grid size-12 place-items-center border border-white/[.1] bg-white/[.025]"><LibraryBig size={20} strokeWidth={1.6} className="text-[var(--gold-light)]"/></div>
    <h3 className="mt-5 text-base font-semibold text-slate-200">{title}</h3>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">{message}</p>
    {action&&<div className="mt-6">{action}</div>}
  </section>;
}