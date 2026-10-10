"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2, FileText, RefreshCw, Users } from "lucide-react";
import { currentUser, clearToken } from "../../../lib/api";
import { request, setOrganisationContext } from "../../../lib/api/client";
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
  const [courseCatalogue, setCourseCatalogue] = useState<any[]>([]);
  const [cohortCourses, setCohortCourses] = useState<any[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  const [orgCourseSelection, setOrgCourseSelection] = useState("");
  const [courseSelections, setCourseSelections] = useState<Record<string, string>>({});
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
  const [needsOrgSelection, setNeedsOrgSelection] = useState(false);
  const [orgChoices, setOrgChoices] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const me = await currentUser();
      const memberships = me.organisation_memberships || [];
      const privileged = memberships.filter((membership: any) => ["owner", "admin"].includes(membership.role));
      const savedId = typeof window !== "undefined" ? localStorage.getItem("learnora_organisation_id") : null;
      const forceChoose = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("choose") === "1";
      const selected = forceChoose ? null : ((me.organisation_id ? memberships.find((membership: any) => String(membership.organisation_id) === String(me.organisation_id)) : null)
        || (savedId ? memberships.find((membership: any) => String(membership.organisation_id) === String(savedId) && ["owner", "admin"].includes(membership.role)) : null)
        || (privileged.length === 1 ? privileged[0] : null));
      setOrgChoices(privileged);
      if (!selected && privileged.length > 1) {
        setUser(me);
        setNeedsOrgSelection(true);
        return;
      }
      if (!selected || !["owner", "admin"].includes(selected.role)) {
        location.href = "/dashboard";
        return;
      }
      setOrganisationContext(String(selected.organisation_id));
      me.organisation_id = selected.organisation_id;
      me.organisation_role = selected.role;
      setUser(me);
      setNeedsOrgSelection(false);
      const id = encodeURIComponent(selected.organisation_id);
      const [orgResult, memberResult, summaryResult, contractResult, capacityResult, programmeResult, cohortResult, teamResult, cohortCourseResult, publicCourseResult, assignedCourseResult] = await Promise.all([
        request<any>("/organisations/" + id),
        request<any>("/organisations/" + id + "/members"),
        request<any>("/organisations/" + id + "/members/summary"),
        request<any>("/commercial/organisations/" + id + "/contract"),
        request<any>("/commercial/organisations/" + id + "/capacity"),
        request<any>("/organisations/" + id + "/programmes"),
        request<any>("/organisations/" + id + "/cohorts"),
        request<any>("/organisations/" + id + "/teams"),
        request<any>("/organisations/" + id + "/cohort-courses"),
        request<any>("/organisations/" + id + "/available-courses"),
        request<any>("/organisations/" + id + "/assigned-courses"),
      ]);
      setOrg(orgResult.organisation || orgResult);
      setMembers(memberResult.members || []);
      setSummary(summaryResult.summary || {});
      setContract(contractResult.contract || null);
      setCapacity(capacityResult || {});
      setProgrammes(programmeResult.programmes || []);
      setCohorts(cohortResult.cohorts || []);
      setTeams(teamResult.teams || []);
      setCohortCourses(cohortCourseResult.assignments || []);
      setCourseCatalogue(publicCourseResult.courses || []);
      setAssignedCourses(assignedCourseResult.courses || []);
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

  async function assignCourseToOrganisation() {
    if (!user?.organisation_id || !orgCourseSelection) return;
    setError(""); setNotice("");
    try {
      const result = await request<any>("/organisations/" + encodeURIComponent(user.organisation_id) + "/assigned-courses", {
        method: "POST", body: JSON.stringify({ course_id: orgCourseSelection }),
      });
      setNotice("Course assigned to the organisation. " + (result.enrolments_created || 0) + " new learner enrolments created.");
      setOrgCourseSelection("");
      await load();
    } catch (e: any) { setError(e.message || "Course could not be assigned to the organisation."); }
  }

  async function assignCourseToCohort(cohortId: string) {
    if (!user?.organisation_id || !courseSelections[cohortId]) return;
    setError("");
    setNotice("");
    try {
      const result = await request<any>("/organisations/" + encodeURIComponent(user.organisation_id) + "/cohorts/" + encodeURIComponent(cohortId) + "/courses", {
        method: "POST",
        body: JSON.stringify({ course_id: courseSelections[cohortId] }),
      });
      setNotice("Course assigned. " + (result.enrolments_created || 0) + " new learner enrolments created.");
      await load();
    } catch (e: any) {
      setError(e.message || "Course could not be assigned to this cohort.");
    }
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

  if (needsOrgSelection && !loading) {
    return <main className="min-h-screen bg-[#080b0f] px-5 py-12 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/[.08] bg-[#0e1319] p-6 sm:p-9">
        <Building2 className="gold" size={25}/>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] gold">Organisation workspace</p>
        <h1 className="mt-3 font-display text-4xl">Choose your workspace</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">Your account can administer more than one organisation. Choose which organisation you want to manage for this session.</p>
        <div className="mt-6 grid gap-3">{orgChoices.map((choice: any) => <button key={choice.organisation_id} onClick={() => { history.replaceState(null, "", location.pathname); setOrganisationContext(String(choice.organisation_id)); setNeedsOrgSelection(false); void load(); }} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 p-4 text-left transition hover:border-[#d7ad35]/30 hover:bg-[#d7ad35]/[.03]"><div><p className="font-semibold">{choice.organisation_name || "Organisation workspace"}</p><p className="mt-1 text-xs text-slate-500">{choice.organisation_slug || choice.organisation_id}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-slate-400">{choice.role}</span></button>)}</div>
        <button onClick={() => { location.href = "/dashboard"; }} className="mt-6 text-sm text-slate-500 hover:text-white">Return to learner dashboard</button>
      </section>
    </main>;
  }

  const modules = Array.isArray(org?.settings?.enabled_modules) ? org.settings.enabled_modules : [];
  const entitlements = Array.isArray(capacity?.entitlements) ? capacity.entitlements : Array.isArray(capacity?.capacity) ? capacity.capacity : [];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      <header className="border-b border-white/[.07] bg-[#080b0f]">
        <div className="mx-auto flex min-h-20 max-w-[82rem] flex-wrap items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <a href="/"><Logo /></a>
          <nav aria-label="Organisation workspace" className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <a href="#overview" className="hover:text-white">Overview</a>
            <a href="#people" className="hover:text-white">People</a>
            <a href="#configuration" className="hover:text-white">Configuration</a>
            <a href="#structure" className="hover:text-white">Teams & cohorts</a>
            <a href="#contract" className="hover:text-white">Contract</a>
            <a href="/courses" className="hover:text-white">Courses</a>
          </nav>
          <button onClick={() => { clearToken(); location.href = "/login"; }} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-[82rem] px-5 py-10 lg:px-8">
        <div id="overview" className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] gold">Organisation workspace</p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">{org?.name || "Your organisation"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Manage the people and learning access attached to your organisation. Available controls depend on your role and approved contract entitlements.</p>
          </div>
          <div className="flex flex-wrap gap-2">{orgChoices.length > 1 && <button onClick={() => { history.replaceState(null, "", "/dashboard/organisation?choose=1"); setNeedsOrgSelection(true); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300">Switch workspace</button>}<button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"><RefreshCw size={15} /> Refresh</button></div>
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
              <section id="people" className="border border-white/[.12] bg-[#11171e] p-5 sm:p-6">
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
                <section id="configuration" className="border border-white/[.12] bg-[#11171e] p-5 sm:p-6">
                  <div className="flex items-center gap-3"><Building2 className="gold" size={20} /><h2 className="font-semibold">Workspace configuration</h2></div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{org.description || "No workspace description has been set."}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-black/20 p-3"><p className="text-slate-500">Model</p><p className="mt-1 font-medium">{org.organisation_type || "—"}</p></div><div className="rounded-xl bg-black/20 p-3"><p className="text-slate-500">Template</p><p className="mt-1 font-medium">{org.template || "—"}</p></div></div>
                  <div className="mt-5"><p className="text-xs text-slate-500">Enabled modules</p><div className="mt-2 flex flex-wrap gap-2">{modules.length ? modules.map((m: string) => <span key={m} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">{m.replaceAll("_", " ")}</span>) : <span className="text-xs text-slate-600">No module configuration recorded.</span>}</div></div>
                </section>

                <section id="contract" className="border border-white/[.12] bg-[#11171e] p-5 sm:p-6">
                  <div className="flex items-center gap-3"><FileText className="gold" size={20} /><h2 className="font-semibold">Contract and access</h2></div>
                  {org.settings?.pilot_mode ? <p className="mt-4 text-sm leading-6 text-emerald-200/80">This is the Learnora-approved free pilot workspace. Contract entitlements are exempted under the pilot configuration.</p> : contract ? <><p className="mt-4 text-sm text-slate-300">Contract {contract.contract_number || "—"}</p><p className="mt-2 text-sm text-slate-500">Status: {contract.status}</p><p className="mt-2 text-sm text-slate-500">Term: {contract.start_date || "—"} to {contract.end_date || "—"}</p></> : <p className="mt-4 text-sm leading-6 text-slate-500">No active contract was returned. Contact Learnora if your workspace should have an active contract.</p>}
                  <div className="mt-5 border-t border-white/[.06] pt-4"><p className="text-xs text-slate-500">Contract entitlements</p>{entitlements.length ? <div className="mt-3 space-y-2">{entitlements.map((e: any) => <div key={e.id || e.entitlement_key} className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{e.entitlement_key?.replaceAll("_", " ") || e.key}</span><span className="text-slate-300">{e.enabled === false ? "Disabled" : e.limit_value ?? "Enabled"}</span></div>)}</div> : <p className="mt-2 text-xs text-slate-600">No active entitlement records returned.</p>}</div>
                </section>

                <section className="border border-white/[.12] bg-[#11171e] p-5"><h2 className="font-semibold">Continue learning</h2><p className="mt-2 text-sm leading-6 text-slate-500">Browse published Learnora courses. Course assignment and programme management controls appear only where backend operations are available.</p><a href="/courses" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold gold">Browse courses <ArrowRight size={15} /></a></section>
              </div>
            </div>

            <section id="structure" className="mt-8 border border-white/[.12] bg-[#11171e] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.18em] gold">Organisation structure</p><h2 className="mt-2 text-2xl font-semibold">Programmes, cohorts and teams</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Programmes group learning initiatives, cohorts group learners in a defined period, and teams organise people around work. Contract entitlements are enforced by the backend.</p></div>
                <div className="rounded-xl border border-white/[.06] bg-black/20 p-3 text-xs text-slate-500">Use an existing member's user ID when assigning them to a cohort or team.</div>
              </div>

              <div className="mt-6 rounded-xl border border-white/[.07] bg-black/15 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">Organisation-wide course access</h3><p className="mt-1 text-xs leading-5 text-slate-500">Assign a published course to all active learners in this organisation. Cohort assignments can also target a smaller group.</p></div><span className="text-xs text-slate-500">{assignedCourses.length} active course access records</span></div>
                <div className="mt-4 flex flex-wrap gap-2"><select aria-label="Choose course for organisation-wide assignment" value={orgCourseSelection} onChange={(e) => setOrgCourseSelection(e.target.value)} className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-[#090c10] px-3 py-3 text-sm"><option value="">Choose a published course</option>{courseCatalogue.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><button disabled={!orgCourseSelection || !courseCatalogue.length} onClick={() => void assignCourseToOrganisation()} className="rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50">Assign to learners</button></div>
                {assignedCourses.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{assignedCourses.map((assignment) => <div key={assignment.id} className="rounded-lg border border-white/[.06] p-3"><p className="text-sm font-medium">{assignment.course?.title || assignment.course_id}</p><p className="mt-1 text-xs text-slate-500">{assignment.access_type} · Assigned {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString() : "date unavailable"}</p></div>)}</div>}
                {!courseCatalogue.length && <p className="mt-3 text-xs leading-5 text-slate-600">No published courses are currently available to assign. Draft courses are intentionally excluded.</p>}
              </div>
              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <form onSubmit={createProgramme} className="rounded-xl border border-white/[.07] bg-black/15 p-4">
                  <h3 className="font-semibold">Create programme</h3>
                  <label className="mt-4 block text-xs text-slate-400">Programme name<input required minLength={2} value={programmeForm.name} onChange={(e) => setProgrammeForm((old: any) => ({ ...old, name: e.target.value }))} className={inputClass} /></label>
                  <label className="mt-3 block text-xs text-slate-400">Description<textarea value={programmeForm.description} onChange={(e) => setProgrammeForm((old: any) => ({ ...old, description: e.target.value }))} rows={3} className={inputClass} /></label>
                  <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs text-slate-400">Start<input type="date" value={programmeForm.start_date} onChange={(e) => setProgrammeForm((old: any) => ({ ...old, start_date: e.target.value }))} className={inputClass} /></label><label className="text-xs text-slate-400">End<input type="date" value={programmeForm.end_date} onChange={(e) => setProgrammeForm((old: any) => ({ ...old, end_date: e.target.value }))} className={inputClass} /></label></div>
                  <button disabled={busy} className="mt-4 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50">{busy ? "Creating…" : "Create programme"}</button>
                </form>

                <form onSubmit={createCohort} className="rounded-xl border border-white/[.07] bg-black/15 p-4">
                  <h3 className="font-semibold">Create cohort</h3>
                  <label className="mt-4 block text-xs text-slate-400">Cohort name<input required minLength={2} value={cohortForm.name} onChange={(e) => setCohortForm((old: any) => ({ ...old, name: e.target.value }))} className={inputClass} /></label>
                  <label className="mt-3 block text-xs text-slate-400">Programme<select value={cohortForm.programme_id} onChange={(e) => setCohortForm((old: any) => ({ ...old, programme_id: e.target.value }))} className={inputClass}><option value="">No programme</option>{programmes.filter((p) => p.status !== "archived").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
                  <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs text-slate-400">Start<input type="date" value={cohortForm.start_date} onChange={(e) => setCohortForm((old: any) => ({ ...old, start_date: e.target.value }))} className={inputClass} /></label><label className="text-xs text-slate-400">End<input type="date" value={cohortForm.end_date} onChange={(e) => setCohortForm((old: any) => ({ ...old, end_date: e.target.value }))} className={inputClass} /></label></div>
                  <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs text-slate-400">Learner capacity<input type="number" min="1" value={cohortForm.capacity} onChange={(e) => setCohortForm((old: any) => ({ ...old, capacity: e.target.value }))} className={inputClass} /></label><label className="text-xs text-slate-400">Instructor capacity<input type="number" min="0" value={cohortForm.instructor_capacity} onChange={(e) => setCohortForm((old: any) => ({ ...old, instructor_capacity: e.target.value }))} className={inputClass} /></label></div>
                  <button disabled={busy} className="mt-4 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50">{busy ? "Creating…" : "Create cohort"}</button>
                </form>

                <form onSubmit={createTeam} className="rounded-xl border border-white/[.07] bg-black/15 p-4">
                  <h3 className="font-semibold">Create team</h3>
                  <label className="mt-4 block text-xs text-slate-400">Team name<input required minLength={2} value={teamForm.name} onChange={(e) => setTeamForm((old: any) => ({ ...old, name: e.target.value }))} className={inputClass} /></label>
                  <label className="mt-3 block text-xs text-slate-400">Slug (optional)<input value={teamForm.slug} onChange={(e) => setTeamForm((old: any) => ({ ...old, slug: e.target.value }))} className={inputClass} /></label>
                  <label className="mt-3 block text-xs text-slate-400">Manager user ID (optional)<input value={teamForm.manager_user_id} onChange={(e) => setTeamForm((old: any) => ({ ...old, manager_user_id: e.target.value }))} className={inputClass} /></label>
                  <label className="mt-3 block text-xs text-slate-400">Description<textarea value={teamForm.description} onChange={(e) => setTeamForm((old: any) => ({ ...old, description: e.target.value }))} rows={2} className={inputClass} /></label>
                  <button disabled={busy} className="mt-4 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50">{busy ? "Creating…" : "Create team"}</button>
                </form>
              </div>

              <div className="mt-8 grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-white/[.07] p-4"><h3 className="font-semibold">Programmes <span className="text-xs text-slate-500">({programmes.length})</span></h3><div className="mt-3 space-y-2">{programmes.map((p) => <div key={p.id} className="rounded-lg bg-black/20 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{p.name}</p><span className="text-[10px] uppercase text-slate-500">{p.status}</span></div><p className="mt-2 text-xs text-slate-500">{p.start_date || "Start not set"} → {p.end_date || "End not set"}</p></div>)}{!programmes.length && <p className="text-xs leading-5 text-slate-600">No programmes created yet.</p>}</div></div>
                <div className="rounded-xl border border-white/[.07] p-4"><h3 className="font-semibold">Cohorts <span className="text-xs text-slate-500">({cohorts.length})</span></h3><div className="mt-3 space-y-3">{cohorts.map((cohort) => <div key={cohort.id} className="rounded-lg bg-black/20 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{cohort.name}</p><span className="text-[10px] uppercase text-slate-500">{cohort.status}</span></div><p className="mt-2 text-xs text-slate-500">{cohort.start_date || "Start not set"} → {cohort.end_date || "End not set"} · Capacity {cohort.capacity ?? "—"}</p><div className="mt-3 space-y-2">{cohortCourses.filter((assignment) => String(assignment.cohort_id) === String(cohort.id) && assignment.status === "active").map((assignment) => <p key={assignment.id} className="rounded-lg border border-white/[.06] px-2 py-2 text-xs text-slate-400">Course: {assignment.course?.title || assignment.course_id}</p>)}</div><div className="mt-3 grid gap-2"><select aria-label={"Course for "+cohort.name} value={courseSelections[cohort.id] || ""} onChange={(e) => setCourseSelections((old) => ({ ...old, [cohort.id]: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-[#090c10] px-2 py-2 text-xs"><option value="">Choose a published course</option>{courseCatalogue.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><button disabled={!courseSelections[cohort.id] || !courseCatalogue.length} onClick={() => void assignCourseToCohort(String(cohort.id))} className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-50">Assign course</button></div><div className="mt-3 flex gap-2"><input aria-label={"Learner user ID for "+cohort.name} value={cohortUserIds[cohort.id] || ""} onChange={(e) => setCohortUserIds((old) => ({ ...old, [cohort.id]: e.target.value }))} placeholder="Learner user ID" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#090c10] px-2 py-2 text-xs" /><button onClick={() => void addCohortMember(String(cohort.id))} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Add</button></div></div>)}{!cohorts.length && <p className="text-xs leading-5 text-slate-600">No cohorts created yet.</p>}</div></div>
                <div className="rounded-xl border border-white/[.07] p-4"><h3 className="font-semibold">Teams <span className="text-xs text-slate-500">({teams.length})</span></h3><div className="mt-3 space-y-3">{teams.map((team) => <div key={team.id} className="rounded-lg bg-black/20 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{team.name}</p><span className="text-[10px] uppercase text-slate-500">{team.status}</span></div><p className="mt-2 text-xs text-slate-500">{team.description || "No description"} · {team.slug}</p><a href={"/dashboard/team/"+team.id} className="mt-3 inline-block text-xs font-semibold gold">Open team workspace →</a><div className="mt-3 grid gap-2"><input aria-label={"Member user ID for "+team.name} value={teamUserIds[team.id] || ""} onChange={(e) => setTeamUserIds((old) => ({ ...old, [team.id]: e.target.value }))} placeholder="Existing member user ID" className="w-full rounded-lg border border-white/10 bg-[#090c10] px-2 py-2 text-xs" /><div className="flex gap-2"><select aria-label={"Team role for "+team.name} value={teamRoles[team.id] || "member"} onChange={(e) => setTeamRoles((old) => ({ ...old, [team.id]: e.target.value }))} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#090c10] px-2 py-2 text-xs"><option value="member">Member</option><option value="lead">Team lead</option><option value="manager">Manager</option></select><button onClick={() => void addTeamMember(String(team.id))} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Add</button></div></div></div>)}{!teams.length && <p className="text-xs leading-5 text-slate-600">No teams created yet.</p>}</div></div>
              </div>
            </section>
          </>
        ) : <EmptyState title="Organisation workspace unavailable" message="Your account does not have an active organisation workspace attached." />}
      </main>
    </div>
  );
}
