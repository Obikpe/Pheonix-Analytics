"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2, FileText, RefreshCw, Users } from "lucide-react";
import { currentUser } from "../../../lib/api";
import { request } from "../../../lib/api/client";
import Logo from "../../../components/brand/Logo";
import StatCard from "../../../components/dashboard/StatCard";
import EmptyState from "../../../components/feedback/EmptyState";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] px-3 py-3 text-sm outline-none focus:border-[#d7ad35]/50";

export default function OrganisationWorkspace() {
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [programmeForm, setProgrammeForm] = useState<any>({ name: "", description: "", start_date: "", end_date: "" });
  const [cohortForm, setCohortForm] = useState<any>({ name: "", description: "", programme_id: "", start_date: "", end_date: "", capacity: "", instructor_capacity: "" });
  const [teamForm, setTeamForm] = useState<any>({ name: "", slug: "", description: "", manager_user_id: "" });
  const [cohortUserIds, setCohortUserIds] = useState<Record<string, string>>({});
  const [teamUserIds, setTeamUserIds] = useState<Record<string, string>>({});
  const [teamRoles, setTeamRoles] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<any>({});
  const [contract, setContract] = useState<any>(null);
  const [capacity, setCapacity] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [memberId, setMemberId] = useState("");
  const [role, setRole] = useState("learner");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const me = await currentUser();
      setUser(me);
      if (!me.organisation_id || !["owner", "admin"].includes(me.organisation_role)) {
        location.href = "/dashboard";
        return;
      }
      const id = encodeURIComponent(me.organisation_id);
      const [orgResult, memberResult, summaryResult, contractResult, capacityResult, programmeResult, cohortResult, teamResult] = await Promise.all([
        request<any>("/organisations/" + id),
        request<any>("/organisations/" + id + "/members"),
        request<any>("/organisations/" + id + "/members/summary"),
        request<any>("/commercial/organisations/" + id + "/contract"),
        request<any>("/commercial/organisations/" + id + "/capacity"),
        request<any>("/organisations/" + id + "/programmes"),
        request<any>("/organisations/" + id + "/cohorts"),
        request<any>("/organisations/" + id + "/teams"),
      ]);
      setOrg(orgResult.organisation || orgResult);
      setMembers(memberResult.members || []);
      setSummary(summaryResult.summary || {});
      setContract(contractResult.contract || null);
      setCapacity(capacityResult || {});
      setProgrammes(programmeResult.programmes || []);
      setCohorts(cohortResult.cohorts || []);
      setTeams(teamResult.teams || []);
    } catch (e: any) {
      setError(e.message || "The organisation workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function addMember(e: any) {
    e.preventDefault();
    if (!user?.organisation_id) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/organisations/" + encodeURIComponent(user.organisation_id) + "/members", {
        method: "POST",
        body: JSON.stringify({ user_id: memberId, role }),
      });
      setMemberId("");
      setNotice("Existing Learnora account added to the organisation.");
      await load();
    } catch (e: any) {
      setError(e.message || "Member could not be added.");
    } finally {
      setBusy(false);
    }
  }

  async function changeMember(id: string, patch: any) {
    if (!user?.organisation_id) return;
    setError("");
    setNotice("");
    try {
      await request("/organisations/" + encodeURIComponent(user.organisation_id) + "/members/" + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setNotice("Membership updated.");
      await load();
    } catch (e: any) {
      setError(e.message || "Membership could not be updated.");
    }
  }

  async function createProgramme(e: any) {
    e.preventDefault();
    if (!user?.organisation_id) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("/organisations/" + encodeURIComponent(user.organisation_id) + "/programmes", { method: "POST", body: JSON.stringify(programmeForm) });
      setProgrammeForm({ name: "", description: "", start_date: "", end_date: "" });
      setNotice("Programme created.");
      await load();
    } catch (e: any) { setError(e.message || "Programme could not be created."); }
    finally { setBusy(false); }
  }

  async function createCohort(e: any) {
    e.preventDefault();
    if (!user?.organisation_id) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("/organisations/" + encodeURIComponent(user.organisation_id) + "/cohorts", {
        method: "POST",
        body: JSON.stringify({
          ...cohortForm,
          programme_id: cohortForm.programme_id || null,
          start_date: cohortForm.start_date || null,
          end_date: cohortForm.end_date || null,
          capacity: cohortForm.capacity === "" ? null : Number(cohortForm.capacity),
          instructor_capacity: cohortForm.instructor_capacity === "" ? null : Number(cohortForm.instructor_capacity),
        }),
      });
      setCohortForm({ name: "", description: "", programme_id: "", start_date: "", end_date: "", capacity: "", instructor_capacity: "" });
      setNotice("Cohort created.");
      await load();
    } catch (e: any) { setError(e.message || "Cohort could not be created."); }
    finally { setBusy(false); }
  }

  async function createTeam(e: any) {
    e.preventDefault();
    if (!user?.organisation_id) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("/organisations/" + encodeURIComponent(user.organisation_id) + "/teams", {
        method: "POST",
        body: JSON.stringify({ ...teamForm, slug: teamForm.slug || null, manager_user_id: teamForm.manager_user_id || null }),
      });
      setTeamForm({ name: "", slug: "", description: "", manager_user_id: "" });
      setNotice("Team created.");
      await load();
    } catch (e: any) { setError(e.message || "Team could not be created."); }
    finally { setBusy(false); }
  }

  async function addCohortMember(cohortId: string) {
    if (!user?.organisation_id || !cohortUserIds[cohortId]?.trim()) return;
    setError(""); setNotice("");
    try {
      await request("/organisations/" + encodeURIComponent(user.organisation_id) + "/cohorts/" + encodeURIComponent(cohortId) + "/members", {
        method: "POST", body: JSON.stringify({ user_id: cohortUserIds[cohortId].trim() }),
      });
      setCohortUserIds((old) => ({ ...old, [cohortId]: "" }));
      setNotice("Learner added to cohort.");
      await load();
    } catch (e: any) { setError(e.message || "Learner could not be added to the cohort."); }
  }

  async function addTeamMember(teamId: string) {
    if (!user?.organisation_id || !teamUserIds[teamId]?.trim()) return;
    setError(""); setNotice("");
    try {
      await request("/organisations/" + encodeURIComponent(user.organisation_id) + "/teams/" + encodeURIComponent(teamId) + "/members", {
        method: "POST",
        body: JSON.stringify({ user_id: teamUserIds[teamId].trim(), role: teamRoles[teamId] || "member" }),
      });
      setTeamUserIds((old) => ({ ...old, [teamId]: "" }));
      setNotice("Member added to team.");
      await load();
    } catch (e: any) { setError(e.message || "Member could not be added to the team."); }
  }

  const modules = Array.isArray(org?.settings?.enabled_modules) ? org.settings.enabled_modules : [];
  const entitlements = Array.isArray(capacity?.entitlements) ? capacity.entitlements : Array.isArray(capacity?.capacity) ? capacity.capacity : [];

  return (
    <div className="min-h-screen bg-[#07090c] text-white">
      <header className="border-b border-white/[.07] bg-[#080b0f]">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <a href="/"><Logo /></a>
          <nav aria-label="Organisation workspace" className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <a href="#overview" className="hover:text-white">Overview</a>
            <a href="#people" className="hover:text-white">People</a>
            <a href="#configuration" className="hover:text-white">Configuration</a>
            <a href="#contract" className="hover:text-white">Contract</a>
            <a href="/courses" className="hover:text-white">Courses</a>
          </nav>
          <button onClick={() => { localStorage.removeItem("phx_token"); location.href = "/login"; }} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div id="overview" className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] gold">Organisation workspace</p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">{org?.name || "Your organisation"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Manage the people and learning access attached to your organisation. Available controls depend on your role and approved contract entitlements.</p>
          </div>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"><RefreshCw size={15} /> Refresh</button>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[.05] p-4 text-sm text-red-200">{error}</div>}
        {notice && <div role="status" className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[.05] p-4 text-sm text-emerald-200">{notice}</div>}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 p-8 text-sm text-slate-500">Loading organisation records…</div>
        ) : org ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="People in workspace" value={summary.total ?? members.length} />
              <StatCard label="Active members" value={summary.active ?? members.filter((m) => m.status === "active").length} />
              <StatCard label="Tutors / instructors" value={summary.instructors ?? members.filter((m) => m.role === "instructor").length} />
              <StatCard label="Learners" value={summary.learners ?? members.filter((m) => m.role === "learner").length} />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
              <section id="people" className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="text-lg font-semibold">People and membership</h2><p className="mt-1 text-xs text-slate-500">Memberships currently returned for your organisation.</p></div>
                  <Users className="gold" size={20} />
                </div>
                {members.length ? (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="border-b border-white/10 text-[10px] uppercase tracking-[.12em] text-slate-500"><tr><th className="py-3 pr-3">Person</th><th className="py-3 pr-3">Role</th><th className="py-3 pr-3">Status</th><th className="py-3">Update status</th></tr></thead>
                      <tbody className="divide-y divide-white/[.06]">
                        {members.map((m) => (
                          <tr key={m.membership_id || m.id}>
                            <td className="py-4 pr-3"><p className="font-medium">{m.user?.name || "Learnora member"}</p><p className="mt-1 text-xs text-slate-500">{m.user?.email || "Email unavailable"}</p></td>
                            <td className="py-4 pr-3 text-slate-300">{m.role}</td>
                            <td className="py-4 pr-3 text-slate-400">{m.status}</td>
                            <td className="py-4"><select aria-label={"Update status for " + (m.user?.email || m.membership_id)} value={m.status} onChange={(e) => void changeMember(String(m.membership_id || m.id), { status: e.target.value })} className="rounded-lg border border-white/10 bg-[#090c10] px-2 py-2 text-xs"><option value="active">Active</option><option value="invited">Invited</option><option value="suspended">Suspended</option></select></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="mt-5"><EmptyState title="No members listed" message="No organisation memberships were returned for this workspace." /></div>}

                <form onSubmit={addMember} className="mt-6 rounded-xl border border-white/[.07] bg-black/20 p-4">
                  <h3 className="font-semibold">Add an existing Learnora account</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">The current membership API accepts an existing account ID. Invitations by email are not yet available here.</p>
                  <label className="mt-4 block text-xs text-slate-400">User ID<input required value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputClass} placeholder="UUID of an existing Learnora account" /></label>
                  <label className="mt-4 block text-xs text-slate-400">Organisation role<select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}><option value="learner">Learner</option><option value="instructor">Instructor</option><option value="admin">Administrator</option></select></label>
                  <button disabled={busy || !memberId.trim()} className="mt-4 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50">{busy ? "Adding…" : "Add member"}</button>
                </form>
              </section>

              <div className="space-y-5">
                <section id="configuration" className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                  <div className="flex items-center gap-3"><Building2 className="gold" size={20} /><h2 className="font-semibold">Workspace configuration</h2></div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{org.description || "No workspace description has been set."}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-black/20 p-3"><p className="text-slate-500">Model</p><p className="mt-1 font-medium">{org.organisation_type || "—"}</p></div><div className="rounded-xl bg-black/20 p-3"><p className="text-slate-500">Template</p><p className="mt-1 font-medium">{org.template || "—"}</p></div></div>
                  <div className="mt-5"><p className="text-xs text-slate-500">Enabled modules</p><div className="mt-2 flex flex-wrap gap-2">{modules.length ? modules.map((m: string) => <span key={m} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">{m.replaceAll("_", " ")}</span>) : <span className="text-xs text-slate-600">No module configuration recorded.</span>}</div></div>
                </section>

                <section id="contract" className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                  <div className="flex items-center gap-3"><FileText className="gold" size={20} /><h2 className="font-semibold">Contract and access</h2></div>
                  {contract ? <><p className="mt-4 text-sm text-slate-300">Contract {contract.contract_number || "—"}</p><p className="mt-2 text-sm text-slate-500">Status: {contract.status}</p><p className="mt-2 text-sm text-slate-500">Term: {contract.start_date || "—"} to {contract.end_date || "—"}</p></> : <p className="mt-4 text-sm leading-6 text-slate-500">No active contract was returned. Contact Learnora if your workspace should have an active contract.</p>}
                  <div className="mt-5 border-t border-white/[.06] pt-4"><p className="text-xs text-slate-500">Contract entitlements</p>{entitlements.length ? <div className="mt-3 space-y-2">{entitlements.map((e: any) => <div key={e.id || e.entitlement_key} className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{e.entitlement_key?.replaceAll("_", " ") || e.key}</span><span className="text-slate-300">{e.enabled === false ? "Disabled" : e.limit_value ?? "Enabled"}</span></div>)}</div> : <p className="mt-2 text-xs text-slate-600">No active entitlement records returned.</p>}</div>
                </section>

                <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5"><h2 className="font-semibold">Continue learning</h2><p className="mt-2 text-sm leading-6 text-slate-500">Browse published Learnora courses. Course assignment and programme management controls appear only where backend operations are available.</p><a href="/courses" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold gold">Browse courses <ArrowRight size={15} /></a></section>
              </div>
            </div>
          </>
        ) : <EmptyState title="Organisation workspace unavailable" message="Your account does not have an active organisation workspace attached." />}
      </main>
    </div>
  );
}
