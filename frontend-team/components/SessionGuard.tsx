"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, token } from "../lib/api";

const IDLE_LIMIT_MS = 10 * 60 * 1000;

export default function SessionGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login") return;

    if (!token()) {
      router.replace("/login");
      return;
    }

    let lastWrite = 0;
    const markActivity = () => {
      if (!token()) return;
      const now = Date.now();
      if (now - lastWrite >= 5000) {
        localStorage.setItem("learnora_team_last_activity", String(now));
        lastWrite = now;
      }
    };

    const checkIdle = () => {
      if (!token()) {
        router.replace("/login");
        return;
      }
      const raw = localStorage.getItem("learnora_team_last_activity");
      const last = raw ? Number(raw) : Date.now();
      if (!Number.isFinite(last) || Date.now() - last >= IDLE_LIMIT_MS) {
        clearToken();
        router.replace("/login?reason=idle");
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "learnora_team_token" && !event.newValue) {
        router.replace("/login");
      }
    };

    markActivity();
    const timer = window.setInterval(checkIdle, 15000);
    const events = ["pointerdown", "keydown", "mousemove", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", checkIdle);

    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, markActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", checkIdle);
    };
  }, [pathname, router]);

  return null;
}
