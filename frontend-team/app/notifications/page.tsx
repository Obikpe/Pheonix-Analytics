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
      <p className="section-kicker">Operational centre / Signals</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Notifications</h1>
      <p className="mt-2 text-slate-500">Context-aware internal alerts will appear here when the notification service is connected.</p>
      <div className="mt-8">
        <EmptyState title="No notifications" message="There are no live internal notifications available right now." />
      </div>
    </Shell>
  );
}
