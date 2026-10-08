"use client";

import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import EmptyState from "../../components/EmptyState";
import { teamMe } from "../../lib/api";

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    teamMe().then(setUser).catch(() => { location.href = "/login"; });
  }, []);
  if (!user) return <div className="p-10">Loading secure workspace…</div>;
  return (
    <Shell roles={user.roles || []} active="notifications">
      <p className="text-xs uppercase tracking-[0.2em] text-[#d7ad35]">Operational centre</p>
      <h1 className="mt-2 text-4xl font-semibold">Notifications</h1>
      <p className="mt-2 text-slate-500">Context-aware internal alerts will appear here when the notification service is connected.</p>
      <div className="mt-8">
        <EmptyState title="No notifications" message="There are no live internal notifications available right now." />
      </div>
    </Shell>
  );
}
