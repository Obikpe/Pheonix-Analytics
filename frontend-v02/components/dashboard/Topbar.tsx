"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, X } from "lucide-react";
import { request } from "../../lib/api/client";

type NoticePreview = {
  id: string;
  title: string;
  body: string;
  action_url?: string | null;
  created_at?: string;
};

type ToastNotice = NoticePreview & { extraCount?: number };

const POLL_INTERVAL_MS = 15000;
const MAX_TRACKED_IDS = 100;

function safeInternalPath(value?: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard/notifications";
}

export default function Topbar({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const lastSeenIds = useRef<Set<string> | null>(null);
  const browserSeenIds = useRef<Set<string> | null>(null);
  const inFlight = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((notice: ToastNotice) => {
    setToast(notice);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 9000);
  }, []);

  const refresh = useCallback(async () => {
    if (admin || inFlight.current || typeof window === "undefined") return;
    inFlight.current = true;
    try {
      const [countResult, feed] = await Promise.all([
        request<{ unread_count?: number }>("/notifications/unread-count"),
        request<{ notifications?: NoticePreview[] }>("/notifications/me?limit=10"),
      ]);
      setUnread(Math.max(0, Number(countResult.unread_count || 0)));
      const notices = Array.isArray(feed.notifications) ? feed.notifications : [];
      const currentIds = new Set(notices.map((notice) => notice.id));

      if (lastSeenIds.current === null) {
        // Establish a quiet baseline on first load so old inbox items do not
        // suddenly appear as new alerts every time a learner opens Learnora.
        lastSeenIds.current = currentIds;
        let savedBrowserIds: string[] | null = null;
        try {
          const saved = localStorage.getItem("learnora_last_notification_ids");
          if (saved) savedBrowserIds = JSON.parse(saved);
        } catch {
          savedBrowserIds = null;
        }
        browserSeenIds.current = savedBrowserIds ? new Set(savedBrowserIds) : currentIds;
        // If desktop alerts were enabled earlier, surface notices created while
        // the learner was away, without replaying the entire historical inbox.
        if (savedBrowserIds) {
          const savedSet = new Set(savedBrowserIds);
          const missed = notices
            .filter((notice) => !savedSet.has(notice.id))
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          if (missed.length) {
            showToast({ ...missed[0], extraCount: Math.max(0, missed.length - 1) });
            if (
              localStorage.getItem("learnora_desktop_notifications") === "enabled" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              missed.slice(0, 3).reverse().forEach((notice) => {
                try {
                  const alert = new Notification(notice.title, { body: notice.body, tag: notice.id });
                  alert.onclick = () => {
                    window.focus();
                    router.push(safeInternalPath(notice.action_url));
                    alert.close();
                  };
                } catch {
                  // Browser notifications are optional; in-app inbox remains authoritative.
                }
              });
            }
          }
        }
      } else {
        const fresh = notices
          .filter((notice) => !lastSeenIds.current!.has(notice.id))
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        if (fresh.length) {
          showToast({ ...fresh[0], extraCount: Math.max(0, fresh.length - 1) });
          const browserEnabled =
            localStorage.getItem("learnora_desktop_notifications") === "enabled" &&
            "Notification" in window &&
            Notification.permission === "granted";

          if (browserEnabled) {
            const alreadyBrowserSeen = browserSeenIds.current || new Set<string>();
            fresh.slice(0, 3).reverse().forEach((notice) => {
              if (alreadyBrowserSeen.has(notice.id)) return;
              try {
                const alert = new Notification(notice.title, {
                  body: notice.body,
                  tag: notice.id,
                });
                alert.onclick = () => {
                  window.focus();
                  router.push(safeInternalPath(notice.action_url));
                  alert.close();
                };
              } catch {
                // Browser notifications are optional; the in-app inbox remains authoritative.
              }
            });
          }
        }
        lastSeenIds.current = currentIds;
      }

      // Keep browser alert deduplication bounded and scoped to recent notices.
      const priorBrowserIds = browserSeenIds.current || new Set<string>();
      currentIds.forEach((id) => priorBrowserIds.add(id));
      browserSeenIds.current = new Set(Array.from(priorBrowserIds).slice(-MAX_TRACKED_IDS));
      try {
        localStorage.setItem(
          "learnora_last_notification_ids",
          JSON.stringify(Array.from(browserSeenIds.current)),
        );
      } catch {
        // Storage may be disabled; in-memory deduplication still works.
      }
    } catch {
      // Notification service outages must never interrupt dashboard navigation.
    } finally {
      inFlight.current = false;
    }
  }, [admin, router, showToast]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_INTERVAL_MS);
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [refresh]);

  return (
    <>
      <header className="sticky top-16 z-30 flex h-16 items-center justify-between border-b border-white/[.08] bg-[#090b0e]/95 px-5 backdrop-blur-xl lg:top-0 lg:h-20 lg:px-8">
        <div className="min-w-0 truncate text-sm text-slate-500">
          {admin ? "Learnora administration" : "Your learning workspace"}
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/notifications"
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative grid size-10 place-items-center rounded-lg border border-white/[.1] text-slate-400 transition-colors hover:border-[#d7ad35]/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d7ad35]"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span
                aria-label={`${unread} unread notifications`}
                className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#090b0e] bg-[#d7ad35] px-1 text-[10px] font-bold text-[#11151a]"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </div>
      </header>

      {toast && !admin && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-20 z-[70] w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#d7ad35]/30 bg-[#11161d] shadow-2xl shadow-black/40"
        >
          <div className="flex items-start gap-3 p-4">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[#d7ad35]/10 text-[#f2d477]">
              <Bell size={17} />
            </span>
            <button
              type="button"
              onClick={() => {
                router.push(safeInternalPath(toast.action_url));
                setToast(null);
              }}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block text-[10px] font-bold uppercase tracking-[.16em] text-[#f2d477]">
                New learning update
              </span>
              <span className="mt-1 block text-sm font-semibold text-white">{toast.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">{toast.body}</span>
              {!!toast.extraCount && (
                <span className="mt-2 block text-[11px] font-medium text-[#f2d477]">
                  +{toast.extraCount} more update{toast.extraCount === 1 ? "" : "s"}
                </span>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#f2d477]">
                View update <Check size={13} />
              </span>
            </button>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white/[.06] hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
          <div className="h-0.5 bg-[#d7ad35]/20">
            <div className="h-full w-full origin-left animate-[toast-progress_9s_linear_forwards] bg-[#d7ad35]" />
          </div>
        </div>
      )}
    </>
  );
}
