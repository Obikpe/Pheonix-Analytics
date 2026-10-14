"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { request } from "../../lib/api/client";

type NoticePreview = { id: string; title: string; body: string; action_url?: string | null };

export default function Topbar({admin=false}:{admin?:boolean}) {
  const [unread,setUnread] = useState(0);
  const lastSeenIds = useRef<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    if (admin) return;
    try {
      const result = await request<{unread_count?:number}>("/notifications/unread-count");
      setUnread(Math.max(0, Number(result.unread_count || 0)));
    } catch {
      // A temporarily unavailable notification service should never break navigation.
    }

    try {
      const desktopEnabled = localStorage.getItem("learnora_desktop_notifications") === "enabled";
      if (!desktopEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
      const feed = await request<{notifications?:NoticePreview[]}>("/notifications/me?limit=10");
      const notices = Array.isArray(feed.notifications) ? feed.notifications : [];
      const currentIds = new Set(notices.map(n => n.id));
      let previousIds = lastSeenIds.current;
      if (!previousIds) {
        try {
          const saved = localStorage.getItem("learnora_last_notification_ids");
          if (saved) previousIds = new Set<string>(JSON.parse(saved));
        } catch {
          previousIds = null;
        }
      }
      if (previousIds) {
        const fresh = notices.filter(n => !previousIds!.has(n.id)).slice(0, 3).reverse();
        fresh.forEach(n => {
          try {
            const alert = new Notification(n.title, { body: n.body, tag: n.id });
            alert.onclick = () => {
              window.focus();
              if (n.action_url && n.action_url.startsWith("/") && !n.action_url.startsWith("//")) window.location.href = n.action_url;
            };
          } catch {
            // Browser alerts are optional; the in-app inbox remains the source of truth.
          }
        });
      }
      lastSeenIds.current = currentIds;
      localStorage.setItem("learnora_last_notification_ids", JSON.stringify([...currentIds]));
    } catch {
      // Notification previews are optional and should not interrupt the workspace.
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
