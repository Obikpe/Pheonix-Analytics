import Sidebar from "./Sidebar";
import { Bell, ChevronRight } from "lucide-react";

export default function Shell({children,roles,active}:{children:React.ReactNode;roles:string[];active:string}) {
  const title=active.replaceAll("-"," ").replace(/\b\w/g,c=>c.toUpperCase());
  return <div className="min-h-screen bg-[var(--bg)]">
    <Sidebar roles={roles} active={active}/>
    <div className="lg:pl-72">
      <header className="sticky top-16 z-20 flex h-16 items-center justify-between border-b border-white/[.07] bg-[#090b0e]/95 px-5 backdrop-blur-xl lg:top-0 lg:h-20 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 text-sm"><span className="hidden text-slate-600 sm:inline">Workspace</span><ChevronRight size={14} className="hidden text-slate-700 sm:block"/><span className="truncate font-medium text-slate-200">{title}</span></div>
        <a href="/notifications" aria-label="Notifications" className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/[.1] text-slate-400 transition-colors hover:border-white/[.2] hover:text-white"><Bell size={17}/></a>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 pb-10 pt-6 sm:px-5 lg:px-8 lg:py-8">{children}</main>
    </div>
  </div>;
}
