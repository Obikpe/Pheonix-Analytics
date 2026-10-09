"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Clock3, FileCheck2, FileText, RefreshCw, Send, ShieldCheck, Users } from "lucide-react";
import { teamMe } from "../../lib/api";
import { organisations, organisationMembers, memberSummary, organisationCapacity, organisationContract, contractPreparation, contractRules, organisationRequests, saveContractPreparation, generateContractDraft, sendOrganisationContract, approveOrganisationContract, activateOrganisationContract } from "../../lib/operations";
import Shell from "../../components/Shell";
import EmptyState from "../../components/EmptyState";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#090c10] px-3 py-3 text-sm text-white outline-none focus:border-[#d7ad35]/50";
const emptyForm = {
  contract_number: "", currency: "NGN", start_date: "", end_date: "",
  payment_terms: "", pricing_summary: "", learner_capacity: "",
  instructor_capacity: "", cohort_capacity: "", custom_requirements: "", notes: "",
};

export default function Organisations() {
  const [user, setUser] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadBase() {
    setLoading(true);
    setError("");
    try {
      const [me, orgResponse, requestResponse] = await Promise.all([
        teamMe(), organisations(), organisationRequests(),
      ]);
      setUser(me);
      setOrgs(orgResponse.organisations || []);
      setRequests(requestResponse.requests || []);
    } catch (e: any) {
      setError(e.message || "Unable to load organisation operations.");
    } finally {
      setLoading(false);
    }
  }

  async function inspect(org: any) {
    setSelected(org);
    setError("");
    setNotice("");
    setDetail(null);
    try {
      const [membersResponse, summaryResponse, contractResponse, capacityResponse, preparation, rules] = await Promise.all([
        organisationMembers(org.id),
        memberSummary(org.id),
        organisationContract(org.id),
        organisationCapacity(org.id),
        contractPreparation(org.id),
        contractRules(org.id),
      ]);
      const versions = preparation.versions || [];
      const latest = versions[0] || null;
      let terms: any = {};
      try {
        terms = latest?.terms ? JSON.parse(latest.terms) : {};
      } catch {
        terms = {};
      }
      setDetail({
        members: membersResponse.members || [],
        summary: summaryResponse.summary || {},
        contract: contractResponse.contract || null,
        capacity: capacityResponse,
        preparation,
        rules,
        versions,
        latest,
      });
      const contractNumber = preparation.contract?.status === "draft" && preparation.contract?.contract_number
        ? preparation.contract.contract_number
        : "LR-" + String(org.slug || org.id).slice(0, 8).toUpperCase() + "-" + String(Date.now()).slice(-6);
      setForm({
        ...emptyForm,
        contract_number: contractNumber,
        currency: terms.currency || "NGN",
        start_date: terms.start_date || "",
        end_date: terms.end_date || "",
        payment_terms: terms.payment_terms || "",
        pricing_summary: terms.pricing_summary || "",
        learner_capacity: terms.learner_capacity == null ? "" : String(terms.learner_capacity),
        instructor_capacity: terms.instructor_capacity == null ? "" : String(terms.instructor_capacity),
        cohort_capacity: terms.cohort_capacity == null ? "" : String(terms.cohort_capacity),
        custom_requirements: (terms.custom_requirements || []).join("\n"),
        notes: terms.notes || "",
      });
    } catch (e: any) {
      setError(e.message || "Could not inspect this organisation.");
    }
  }

  async function refresh() {
    await loadBase();
    if (selected) {
      const found = orgs.find((org) => String(org.id) === String(selected.id));
      if (found) await inspect(found);
    }
  }

  useEffect(() => { void loadBase(); }, []);

  async function save(e: any) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveContractPreparation(String(selected.id), {
        contract_number: form.contract_number,
        currency: form.currency,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        payment_terms: form.payment_terms || null,
        pricing_summary: form.pricing_summary || null,
        learner_capacity: form.learner_capacity === "" ? null : Number(form.learner_capacity),
        instructor_capacity: form.instructor_capacity === "" ? null : Number(form.instructor_capacity),
        cohort_capacity: form.cohort_capacity === "" ? null : Number(form.cohort_capacity),
        custom_requirements: form.custom_requirements.split("\n").map((line: string) => line.trim()).filter(Boolean),
        notes: form.notes || null,
      });
      setNotice("Commercial terms saved as a new contract version.");
      await inspect(selected);
    } catch (e: any) {
      setError(e.message || "Contract preparation could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function draft() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await generateContractDraft(String(selected.id));
      setNotice(result.qa?.status === "pass"
        ? "Draft generated and quality checks passed. Review the text before sending."
        : "Draft generated, but it requires correction before it can be sent.");
      await inspect(selected);
    } catch (e: any) {
      setError(e.message || "Contract draft could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  async function runContractAction(fn: () => Promise<any>, successMessage: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(successMessage);
      await loadBase();
      const found = orgs.find((org) => String(org.id) === String(selected?.id)) || selected;
      if (found) await inspect(found);
    } catch (e: any) {
      setError(e.message || "The contract action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const isPlatformAdmin = (user?.roles || []).some((role: string) => ["super_admin", "platform_admin"].includes(role));
  const currentRequest = requests.find((request: any) => String(request.organisation_id || "") === String(selected?.id));
  const contract = detail?.preparation?.contract || detail?.contract;
  const latest = detail?.latest;
  const qa = latest?.qa_result || {};

  return (
    <Shell roles={user?.roles || []} active="organisations">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d7ad35]">Learnora control plane</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Organisation operations</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Inspect customer workspaces, prepare commercial terms, review contract drafts and follow the explicit send → sign → approve → activate sequence.</p>
        </div>
        <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"><RefreshCw size={15} /> Refresh</button>
      </div>

      {error && <div role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[.05] p-4 text-sm text-red-200">{error}</div>}
      {notice && <div role="status" className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[.05] p-4 text-sm text-emerald-200">{notice}</div>}

      {loading ? (
        <div className="mt-8 rounded-2xl border border-white/10 p-8 text-sm text-slate-500">Loading live organisation records…</div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-4">
              <div className="flex items-center gap-3 px-2 pb-3"><Building2 className="text-[#d7ad35]" size={19} /><div><h2 className="font-semibold">Workspaces</h2><p className="text-xs text-slate-500">{orgs.length} organisation records</p></div></div>
              <div className="space-y-2">
                {orgs.map((org) => (
                  <button key={org.id} onClick={() => void inspect(org)} className={"w-full rounded-xl border p-4 text-left transition " + (String(selected?.id) === String(org.id) ? "border-[#d7ad35]/30 bg-[#d7ad35]/[.07]" : "border-white/[.06] hover:border-white/15 hover:bg-white/[.02]")}>
                    <div className="flex items-start justify-between gap-3"><p className="font-medium">{org.name}</p><span className={"rounded-full px-2 py-1 text-[10px] " + (org.is_active ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200")}>{org.is_active ? "Active" : "Inactive"}</span></div>
                    <p className="mt-1 text-xs text-slate-500">{org.organisation_type} · {org.template}</p>
                  </button>
                ))}
                {!orgs.length && <EmptyState title="No organisations" message="No live organisation records are available." />}
              </div>
            </section>

            <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-4">
              <div className="flex items-center gap-3 px-2 pb-3"><Clock3 className="text-[#d7ad35]" size={19} /><div><h2 className="font-semibold">Recent requests</h2><p className="text-xs text-slate-500">Onboarding lifecycle</p></div></div>
              <div className="space-y-2">
                {requests.slice(0, 8).map((request) => (
                  <div key={request.id} className="rounded-xl border border-white/[.06] p-3">
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{request.organisation_name}</p><span className="text-[10px] uppercase tracking-wider text-slate-500">{String(request.status || "submitted").replaceAll("_", " ")}</span></div>
                    <p className="mt-1 text-xs text-slate-500">{request.contact_name} · {request.email}</p>
                    {request.organisation_id && <button onClick={() => { const org = orgs.find((item) => String(item.id) === String(request.organisation_id)); if (org) void inspect(org); }} className="mt-3 text-xs font-semibold text-[#d7ad35]">Inspect linked workspace →</button>}
                  </div>
                ))}
                {!requests.length && <EmptyState title="No requests" message="New organisation enquiries appear here." />}
              </div>
            </section>
          </aside>

          <main>
            {selected && detail ? (
              <div className="space-y-5">
                <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><p className="text-xs uppercase tracking-[.18em] text-[#d7ad35]">Selected organisation</p><h2 className="mt-2 text-2xl font-semibold">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.slug} · {selected.organisation_type} · {selected.is_active ? "Active workspace" : "Inactive workspace"}</p></div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Metric label="Members" value={detail.summary.total} /><Metric label="Learners" value={detail.summary.learners} /><Metric label="Contract" value={contract?.status || "None"} /></div>
                  </div>
                  {currentRequest && <p className="mt-4 rounded-xl border border-white/[.06] bg-black/20 p-3 text-xs leading-5 text-slate-400">Linked request: {currentRequest.id} · {String(currentRequest.status).replaceAll("_", " ")}</p>}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Capacity records" value={JSON.stringify(detail.capacity?.capacity || [])} /><Info label="Required contract sections" value={(detail.rules?.required_sections || []).join(", ") || "—"} /></div>
                </section>

                <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                  <div className="flex items-center gap-3"><FileText className="text-[#d7ad35]" size={20} /><div><h2 className="font-semibold">Contract preparation</h2><p className="mt-1 text-xs text-slate-500">Commercial terms are versioned. Drafts must pass QA and be reviewed before they are sent.</p></div></div>
                  <form onSubmit={save} className="mt-6 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Contract number"><input required value={form.contract_number} onChange={(e) => setForm((old: any) => ({ ...old, contract_number: e.target.value }))} className={inputClass} /></Field>
                      <Field label="Currency"><select value={form.currency} onChange={(e) => setForm((old: any) => ({ ...old, currency: e.target.value }))} className={inputClass}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option><option>CAD</option></select></Field>
                      <Field label="Start date"><input type="date" value={form.start_date} onChange={(e) => setForm((old: any) => ({ ...old, start_date: e.target.value }))} className={inputClass} /></Field>
                      <Field label="End date"><input type="date" value={form.end_date} onChange={(e) => setForm((old: any) => ({ ...old, end_date: e.target.value }))} className={inputClass} /></Field>
                      <Field label="Learner capacity"><input type="number" min="0" value={form.learner_capacity} onChange={(e) => setForm((old: any) => ({ ...old, learner_capacity: e.target.value }))} className={inputClass} /></Field>
                      <Field label="Instructor capacity"><input type="number" min="0" value={form.instructor_capacity} onChange={(e) => setForm((old: any) => ({ ...old, instructor_capacity: e.target.value }))} className={inputClass} /></Field>
                      <Field label="Cohort capacity"><input type="number" min="0" value={form.cohort_capacity} onChange={(e) => setForm((old: any) => ({ ...old, cohort_capacity: e.target.value }))} className={inputClass} /></Field>
                      <Field label="Pricing summary"><input value={form.pricing_summary} onChange={(e) => setForm((old: any) => ({ ...old, pricing_summary: e.target.value }))} className={inputClass} placeholder="Fees, billing cycle, included services" /></Field>
                    </div>
                    <Field label="Payment terms"><textarea rows={3} value={form.payment_terms} onChange={(e) => setForm((old: any) => ({ ...old, payment_terms: e.target.value }))} className={inputClass} /></Field>
                    <Field label="Custom requirements (one per line)"><textarea rows={3} value={form.custom_requirements} onChange={(e) => setForm((old: any) => ({ ...old, custom_requirements: e.target.value }))} className={inputClass} /></Field>
                    <Field label="Internal notes"><textarea rows={3} value={form.notes} onChange={(e) => setForm((old: any) => ({ ...old, notes: e.target.value }))} className={inputClass} /></Field>
                    <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50">{busy ? "Saving…" : "Save commercial terms"}<ArrowRight size={15} /></button>
                  </form>
                </section>

                <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Contract draft review</h2><p className="mt-1 text-xs text-slate-500">AI-generated content is a draft, not legal advice. Human review is required before sending.</p></div><button disabled={busy || !latest} onClick={() => void draft()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={14} /> Generate / regenerate draft</button></div>
                  {latest?.draft_content ? (
                    <>
                      <div className="mt-4 flex flex-wrap items-center gap-3"><span className={"rounded-full px-3 py-1.5 text-xs " + (qa.status === "pass" ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200")}>QA: {qa.status || "not recorded"}</span><span className="text-xs text-slate-500">Review state: {latest.review_status || "draft"} · Version {latest.version_number}</span></div>
                      <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[.06] bg-black/20 p-4 text-xs leading-6 text-slate-300">{latest.draft_content}</pre>
                      {qa.status !== "pass" && <p className="mt-3 text-xs leading-5 text-amber-200/70">This draft did not pass quality checks. Correct the commercial inputs and regenerate before sending.</p>}
                    </>
                  ) : <EmptyState title="No contract draft generated" message="Save commercial terms first, then generate a draft and review its QA result." />}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {contract?.status === "draft" && latest?.draft_content && qa.status === "pass" && <button disabled={busy} onClick={() => void runContractAction(() => sendOrganisationContract(String(selected.id)), "Contract sent to the prospect portal.")} className="inline-flex items-center gap-2 rounded-xl bg-[#d7ad35] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><Send size={14} /> Send for signature</button>}
                    {contract?.status === "sent" && <p className="rounded-xl border border-blue-300/10 bg-blue-300/[.04] px-4 py-3 text-sm text-blue-100/70">Waiting for the prospect to sign in their portal.</p>}
                    {contract?.status === "signed" && !contract.approved_at && isPlatformAdmin && <button disabled={busy} onClick={() => void runContractAction(() => approveOrganisationContract(String(contract.id)), "Signed contract approved. Activate it separately when ready.")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-3 text-sm font-semibold text-emerald-200 disabled:opacity-50"><ShieldCheck size={14} /> Approve signed contract</button>}
                    {contract?.status === "signed" && contract.approved_at && isPlatformAdmin && <button disabled={busy} onClick={() => void runContractAction(() => activateOrganisationContract(String(contract.id)), "Contract activated and organisation workspace enabled.")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-black disabled:opacity-50"><CheckCircle2 size={14} /> Activate workspace</button>}
                    {contract?.status === "active" && <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.05] px-4 py-3 text-sm text-emerald-200">Contract active · workspace enabled</p>}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/[.08] bg-[#0e1319] p-5 sm:p-6">
                  <div className="flex items-center gap-3"><Users className="text-[#d7ad35]" size={20} /><h2 className="font-semibold">Membership snapshot</h2></div>
                  <div className="mt-4 divide-y divide-white/[.06]">
                    {detail.members.slice(0, 12).map((member: any) => <div key={member.membership_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p>{member.user?.name || member.user?.email || "Member"}</p><p className="mt-1 text-xs text-slate-500">{member.user?.email}</p></div><span className="text-xs text-slate-400">{member.role} · {member.status}</span></div>)}
                    {!detail.members.length && <EmptyState title="No members" message="The workspace has no membership records." />}
                  </div>
                </section>
              </div>
            ) : <EmptyState title="Select a workspace" message="Choose an organisation from the list to inspect its membership and prepare a contract." />}
          </main>
        </div>
      )}
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return <label className="block text-xs text-slate-400">{label}{children}</label>;
}
function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-white/[.06] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold">{String(value ?? "—")}</p></div>;
}
function Info({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-white/[.06] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 break-words text-xs leading-5 text-slate-300">{String(value ?? "—")}</p></div>;
}
