import { Bell } from "lucide-react";
export default function Topbar({admin=false}:{admin?:boolean}) {
  return <header className="sticky top-16 z-30 flex h-16 items-center justify-between border-b border-white/[.08] bg-[#090b0e]/95 px-5 backdrop-blur-xl lg:top-0 lg:h-20 lg:px-8">
    <div className="min-w-0 truncate text-sm text-slate-500">{admin?"Learnora administration":"Your learning workspace"}</div>
    <div className="ml-4 flex shrink-0 items-center gap-2">
      <a href="/dashboard/notifications" aria-label="Notifications" className="grid size-10 place-items-center rounded-lg border border-white/[.1] text-slate-400 transition-colors hover:border-white/[.2] hover:text-white"><Bell size={17}/></a>
    </div>
  </header>;
}
