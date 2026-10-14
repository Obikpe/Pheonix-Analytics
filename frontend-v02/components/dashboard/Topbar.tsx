"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { request } from "../../lib/api/client";

export default function Topbar({admin=false}:{admin?:boolean}) {
  const [unread,setUnread] = useState(0);
  const refresh = useCallback(async () => {
    if (admin) return;
    try {
      const result = await request<{unread_count?:number}>("/notifications/unread-count");
      setUnread(Math.max(0, Number(result.unread_count || 0)));
    } catch {
      // A temporarily unavailable notification service should never break navigation.
    }
  }, [admin]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  return <header className="sticky top-16 z-30 flex h-16 items-center justify-between border-b border-white/[.08] bg-[#090b0e]/95 px-5 backdrop-blur-xl lg:top-0 lg:h-20 lg:px-8">
    <div className="min-w-0 truncate text-sm text-slate-500">{admin?"Learnora administration":"Your learning workspace"}</div>
    <div className="ml-4 flex shrink-0 items-center gap-2">
      <Link href="/dashboard/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative grid size-10 place-items-center rounded-lg border border-white/[.1] text-slate-400 transition-colors hover:border-[#d7ad35]/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d7ad35]">
        <Bell size={17}/>
        {unread > 0 && <span aria-label={`${unread} unread notifications`} className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#090b0e] bg-[#d7ad35] px-1 text-[10px] font-bold text-[#11151a]">{unread > 99 ? "99+" : unread}</span>}
      </Link>
    </div>
  </header>;
}
