"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Users } from "lucide-react";
import { currentUser } from "../../../../lib/api";
import { request } from "../../../../lib/api/client";
import Logo from "../../../../components/brand/Logo";
import EmptyState from "../../../../components/feedback/EmptyState";

export default function TeamWorkspace({ params }: { params: { teamId: string } }) {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setError("");
    try {
      const me = await currentUser();
      setUser(me);
      const workspace = await request<any>("/organisations/team-workspace/" + encodeURIComponent(params.teamId));
      setData(workspace);
    } catch (e: any) {
      setError(e.message || "This team workspace could not be loaded.");
    }
  }

  useEffect(() => { void load(); }, [params.teamId]);

  async function addMember(e: any) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/organisations/team-workspace/" + encodeURIComponent(params.teamId) + "/members", {
        method: "POST",
        body: JSON.stringify({ user_id: userId.trim(), role }),
      });
      setUserId("");
      setNotice("Team membership updated.");
      await load();
    } catch (e: any) {
      setError(e.message || "The member could not be added.");
    } finally {
      setBusy(false);
    }
  }

  const teamRole = data?.team_membership?.role || "organisation administrator";
  return (
    <div className="min-h-screen bg-[#07090c] text-white">
      <header className="border-b border-white/[.07] bg-[#080b0f]">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <a href="/"><Logo /></a>
          <a href="/dashboard" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14} /> Back to learning</a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        {error && <div role="alert" className="mb-6 rounded-xl border border-red-400/20 bg-red-400/[.05] p-4 text-sm text-red-200">{error}</div>}
        {notice && <div role="status" className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[.05] p-4 text-sm text-emerald-200">{notice}</div>}
        {!data ? <div className="rounded-2xl border border-white/10 p-8 text-sm text-slate-500">Loading team workspace…</div> : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] gold">Team workspace</p>
                <h1 className="mt-3 font-display text-4xl sm:text-5xl">{data.team.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{data.team.description || "A focused workspace for members of this organisation team."}</p>
              </div>
              <div className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-4">
                <p className="text-[10px] uppercase tracking-[.15em] text-slate-500">Your team role</p>
                <p className="mt-2 text-lg font-semibold capitalize">{teamRole}</p>
                <p className="mt-1 text-xs text-slate-500">{data.can_manage_team ? "Team-scoped management enabled" : "Member access"}</p>
              </div>
            </div>

            {data.can_manage_team && (
              <section className="mt-8 rounded-2xl border border-[#d7ad35]/15 bg-[#d7ad35]/[.03] p-5">
                <h2 className="font-semibold">Team lead controls</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">You can manage membership within this team. Organisation-wide contracts, billing, capacity and permissions remain with organisation administrators.</p>
                <form onSubmit={addMember} className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                  <label className="text-xs text-slate-400">Existing organisation member ID<input required value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm outline-none focus:border-[#d7ad35]/50" placeholder="User UUID" /></label>
                  <label className="text-xs text-slate-400">Team role<select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] p-3 text-sm outline-none"><option value="member">Member</option>{data.organisation_role === "owner" || data.organisation_role === "admin" ? <><option value="lead">Team lead</option><option value="manager">Manager</option></> : null}</select></label>
                  <button disabled={busy || !userId.trim()} className="self-end rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50">{busy ? "Adding…" : "Add member"}</button>
                </form>
              </section>
            )}

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_.8fr]">
              <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                <div className="flex items-center gap-3"><Users className="gold" size={20} /><div><h2 className="font-semibold">Team members</h2><p className="mt-1 text-xs text-slate-500">{data.members.length} active team members</p></div></div>
                <div className="mt-5 divide-y divide-white/[.06]">
                  {data.members.map((member: any) => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="text-sm font-medium">{member.user?.name || "Learnora member"}</p><p className="mt-1 text-xs text-slate-500">{member.user?.email || "Email unavailable"}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-slate-400">{member.role}</span></div>)}
                  {!data.members.length && <EmptyState title="No active members" message="Add existing organisation members to this team to begin collaboration." />}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                <div className="flex items-center gap-3"><CheckCircle2 className="gold" size={20} /><h2 className="font-semibold">Team work</h2></div>
                <p className="mt-4 text-sm leading-7 text-slate-400">This team has a scoped workspace and membership record. Task assignment, internal team deliverables and team-specific performance reporting are not yet enabled, so no placeholder tasks or activity counts are shown.</p>
                <a href="/courses" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold gold">Browse published courses <ArrowLeft className="rotate-180" size={14} /></a>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
