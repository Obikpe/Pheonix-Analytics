"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "../../components/Shell";
import EmptyState from "../../components/EmptyState";
import { teamMe } from "../../lib/api";
import { creatorApplications, creatorPayouts, reviewCreatorApplication } from "../../lib/operations";

function money(minor: number | null | undefined, currency = "NGN") {
  if (minor == null) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(minor) / 100);
}

export default function CreatorsPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<"approved" | "declined" | null>(null);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    teamMe().then(setUser).catch(() => { location.href = "/login"; });
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([creatorApplications(), creatorPayouts()])
      .then(([a, p]) => {
        setApplications(a.applications || []);
        setPayouts(p.payouts || []);
      })
      .catch((e) => setError(e?.message || "Unable to load creator operations."));
  }, [user]);

  const pending = useMemo(
    () => applications.filter((x) => ["submitted", "under_review"].includes(x.status)).length,
    [applications]
  );
  const requested = useMemo(
    () => payouts.filter((x) => ["requested", "processing"].includes(x.status)).length,
    [payouts]
  );

  async function review(status: "approved" | "declined") {
    if (!selected || reviewing) return;
    setReviewing(status);
    setReviewError("");
    try {
      await reviewCreatorApplication(String(selected.id), status);
      const response = await creatorApplications();
      const next = response.applications || [];
      setApplications(next);
      setSelected(next.find((item: any) => String(item.id) === String(selected.id)) || null);
    } catch (e: any) {
      setReviewError(e?.message || "Unable to update creator application.");
    } finally {
      setReviewing(null);
    }
  }

  if (!user) return <div className="p-10">Loading secure workspace…</div>;

  return (
    <Shell roles={user.roles || []} active="creators">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#d7ad35]">Creator economy</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Creators</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Review creator applications and monitor payout operations from live platform records.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric label="Applications" value={applications.length} />
        <Metric label="Awaiting review" value={pending} />
        <Metric label="Payouts awaiting processing" value={requested} />
      </div>

      <section className="mt-8 border border-white/[.1] bg-[#11171e]">
        <div className="border-b border-white/[.06] p-5">
          <h2 className="font-semibold">Creator applications</h2>
          <p className="mt-1 text-sm text-slate-500">Every row below comes from the creator application store.</p>
        </div>
        {applications.length === 0 ? (
          <EmptyState title="No creator applications" message="There are no live creator applications to review." />
        ) : (
          <div className="divide-y divide-white/[.05]">
            {applications.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={"block w-full p-5 text-left transition hover:bg-white/[.025] " + (selected?.id === item.id ? "bg-[#d7ad35]/[.06]" : "")}
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="font-medium">{item.application_data?.display_name || item.application_data?.name || item.user_id}</p>
                    <p className="mt-1 text-xs text-slate-600">Submitted {item.created_at || "—"}</p>
                  </div>
                  <Status value={item.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <section className="mt-5 border border-white/[.1] bg-[#0e1319] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Application detail</h2>
              <p className="mt-1 text-sm text-slate-500">{selected.id}</p>
            </div>
            <Status value={selected.status} />
          </div>
          {["submitted", "under_review"].includes(selected.status) && (
            <div className="mt-5 rounded-xl border border-white/[.07] bg-black/20 p-4">
              <p className="text-sm text-slate-400">Review this application before activating creator access.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button disabled={!!reviewing} onClick={() => review("approved")} className="rounded-lg bg-[#d7ad35] px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
                  {reviewing === "approved" ? "Approving…" : "Approve creator"}
                </button>
                <button disabled={!!reviewing} onClick={() => review("declined")} className="rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-200 disabled:opacity-50">
                  {reviewing === "declined" ? "Declining…" : "Decline application"}
                </button>
              </div>
              {reviewError && <p className="mt-3 text-sm text-red-200">{reviewError}</p>}
            </div>
          )}

          <pre className="mt-5 max-h-96 overflow-auto rounded-xl bg-black/20 p-4 text-xs leading-6 text-slate-400">
            {JSON.stringify(selected.application_data || selected, null, 2)}
          </pre>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-white/[.07] bg-[#0e1319]">
        <div className="border-b border-white/[.06] p-5">
          <h2 className="font-semibold">Payout operations</h2>
          <p className="mt-1 text-sm text-slate-500">Live creator payout requests; no balances or transactions are fabricated.</p>
        </div>
        {payouts.length === 0 ? (
          <EmptyState title="No payout requests" message="No creator payout requests exist yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-4">Creator</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.05]">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-4 text-slate-300">{p.creator_id}</td>
                    <td className="px-5 py-4">{money(p.amount_minor, p.currency)}</td>
                    <td className="px-5 py-4"><Status value={p.status} /></td>
                    <td className="px-5 py-4 text-slate-500">{p.requested_at || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[.07] bg-[#0e1319] p-5">
    <p className="text-xs uppercase tracking-[.15em] text-slate-600">{label}</p>
    <p className="mt-3 text-3xl font-semibold">{value}</p>
  </div>;
}

function Status({ value }: { value: any }) {
  return <span className="rounded-full border border-white/[.08] px-3 py-1 text-xs text-slate-400">{String(value || "unknown").replaceAll("_", " ")}</span>;
}
