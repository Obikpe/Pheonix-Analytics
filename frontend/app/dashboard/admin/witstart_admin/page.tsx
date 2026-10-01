"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
"https://learnora-backend.vercel.app";

type Tab = "overview" | "learners" | "activity" | "billing";

type Learner = {
  id?: number | string;
  email: string;
  name?: string | null;
  role?: string;
  account_type?: string;
  sub_status?: string | null;
  subscription_tier?: string | null;
  is_paid?: boolean;
  is_active?: boolean;
  suspended?: boolean;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
};

type Activity = {
  id?: number | string;
  action?: string;
  event?: string;
  email?: string;
  account_type?: string;
  role?: string;
  ip?: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

type Stats = {
  total_users?: number;
  total_learners?: number;
  normal_users?: number;
  witstart_users?: number;
  paid_users?: number;
  free_users?: number;
  active_users?: number;
  inactive_users?: number;
  pending_users?: number;
  suspended_users?: number;
};

type CurrentAdmin = {
  id?: number | string;
  email: string;
  name?: string | null;
  role: string;
  account_type: string;
};

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "learners", label: "Learners", icon: "◉" },
  { id: "activity", label: "Activity", icon: "◌" },
  { id: "billing", label: "Billing", icon: "₦" },
];

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("phx_token") || "";
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

function normaliseArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.learners)) return value.learners;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.activity)) return value.activity;
  if (Array.isArray(value?.logs)) return value.logs;

  return [];
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayName(learner: Learner) {
  return learner.name?.trim() || learner.email.split("@")[0];
}

function statusLabel(learner: Learner) {
  if (learner.suspended) return "Suspended";
  if (learner.is_active === false) return "Inactive";

  if (
    learner.sub_status &&
    learner.sub_status.toLowerCase() !== "active"
  ) {
    return learner.sub_status;
  }

  if (learner.is_paid) return "Paid";

  return "Free";
}

function statusClass(learner: Learner) {
  const status = statusLabel(learner).toLowerCase();

  if (status === "paid" || status === "active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "suspended") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (status === "inactive") {
    return "border-zinc-400/20 bg-zinc-400/10 text-zinc-400";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-300";
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: number | string;
  detail?: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>

          {detail && (
            <p className="mt-1 text-xs text-zinc-500">{detail}</p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-zinc-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.09] bg-[#101114] px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-zinc-400">
        ◌
      </div>

      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

export default function WitStartAdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);

  const [learners, setLearners] = useState<Learner[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "free" | "active" | "inactive" | "suspended"
  >("all");

  const [selectedLearner, setSelectedLearner] =
    useState<Learner | null>(null);

  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);

  const verifyAdmin = useCallback(async () => {
    try {
      const me: any = await apiFetch("/api/auth/me");

      const current: CurrentAdmin = {
        id: me.id,
        email: me.email,
        name: me.name,
        role: me.role,
        account_type: me.account_type,
      };

      if (
        me.account_type !== "admin" ||
        me.role !== "witstart_admin"
      ) {
        if (me.account_type === "admin" && me.role === "super_admin") {
          router.replace("/dashboard/admin/super_admin");
        } else if (
          me.account_type === "admin" &&
          me.role === "staff_admin"
        ) {
          router.replace("/dashboard/admin/staff_admin");
        } else {
          router.replace("/");
        }

        return false;
      }

      setAdmin(current);
      return true;
    } catch {
      router.replace("/");
      return false;
    }
  }, [router]);

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const [usersResult, statsResult, activityResult] =
          await Promise.all([
            apiFetch<any>("/api/admin/users"),
            apiFetch<any>("/api/admin/stats"),
            apiFetch<any>("/api/admin/activity"),
          ]);

        const allUsers = normaliseArray<Learner>(usersResult);

        /*
         * The backend already restricts witstart_admin access to
         * WitStart learners. We still filter here so the UI never
         * accidentally renders another learner type.
         */
        const witstartLearners = allUsers.filter(
          (user) => user.role === "witstart"
        );

        const allActivity = normaliseArray<Activity>(activityResult);

        const witstartActivity = allActivity.filter(
          (item) =>
            item.role === "witstart" ||
            item.account_type === "witstart" ||
            (
              item.email &&
              witstartLearners.some(
                (learner) =>
                  learner.email.toLowerCase() ===
                  item.email?.toLowerCase()
              )
            )
        );

        setLearners(witstartLearners);
        setStats(statsResult || {});
        setActivity(witstartActivity);
      } catch (err: any) {
        setError(err?.message || "Unable to load WitStart data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      const allowed = await verifyAdmin();

      if (allowed && mounted) {
        await loadDashboard();
      }
    };

    initialise();

    return () => {
      mounted = false;
    };
  }, [verifyAdmin, loadDashboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const refresh = async () => {
    setRefreshing(true);
    await loadDashboard(true);
  };

  const filteredLearners = useMemo(() => {
    const query = search.trim().toLowerCase();

    return learners.filter((learner) => {
      const matchesSearch =
        !query ||
        displayName(learner).toLowerCase().includes(query) ||
        learner.email.toLowerCase().includes(query);

      const status = statusLabel(learner).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && learner.is_paid) ||
        (statusFilter === "free" && !learner.is_paid) ||
        (statusFilter === "active" && status === "active") ||
        (statusFilter === "inactive" && status === "inactive") ||
        (statusFilter === "suspended" && status === "suspended");

      return matchesSearch && matchesStatus;
    });
  }, [learners, search, statusFilter]);

  const counts = useMemo(() => {
    const paid = learners.filter((item) => item.is_paid).length;

    const suspended = learners.filter(
      (item) => item.suspended === true
    ).length;

    const inactive = learners.filter(
      (item) =>
        item.is_active === false &&
        item.suspended !== true
    ).length;

    const active = learners.filter(
      (item) =>
        item.suspended !== true &&
        item.is_active !== false
    ).length;

    return {
      total: learners.length,
      paid,
      free: learners.length - paid,
      active,
      inactive,
      suspended,
    };
  }, [learners]);

  const openLearner = (learner: Learner) => {
    setSelectedLearner(learner);
    setEditName(learner.name || "");
    setEditStatus(
      learner.suspended
        ? "suspended"
        : learner.is_active === false
          ? "inactive"
          : "active"
    );
  };

  const closeLearner = () => {
    if (saving || deleting) return;

    setSelectedLearner(null);
    setEditName("");
    setEditStatus("active");
  };

  const saveLearner = async () => {
    if (!selectedLearner?.email) return;

    setSaving(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        name: editName.trim() || null,
      };

      /*
       * The current backend UpdateLearner schema supports name,
       * role, is_paid and sub_status.
       *
       * We therefore translate the UI status into sub_status
       * rather than inventing unsupported backend fields.
       */
      if (editStatus === "active") {
        payload.sub_status = "active";
      } else if (editStatus === "inactive") {
        payload.sub_status = "inactive";
      } else {
        payload.sub_status = "suspended";
      }

      await apiFetch(
        `/api/admin/users/${encodeURIComponent(
          selectedLearner.email
        )}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      await loadDashboard(true);
      closeLearner();
    } catch (err: any) {
      setError(err?.message || "Unable to update learner.");
    } finally {
      setSaving(false);
    }
  };

  const deleteLearner = async () => {
    if (!selectedLearner?.email) return;

    const confirmed = window.confirm(
      `Delete the WitStart learner account for ${selectedLearner.email}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await apiFetch(
        `/api/admin/users/${encodeURIComponent(
          selectedLearner.email
        )}`,
        {
          method: "DELETE",
        }
      );

      await loadDashboard(true);
      closeLearner();
    } catch (err: any) {
      setError(err?.message || "Unable to delete learner.");
    } finally {
      setDeleting(false);
    }
  };

  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    setMobileMenu(false);
  };

  if (loading && !admin) {
    return (
      <main className="min-h-screen bg-[#090a0c] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
            <p className="mt-4 text-sm text-zinc-500">
              Verifying WitStart administrator access…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090a0c] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 border-r border-white/[0.07] bg-[#0c0d0f] lg:flex lg:flex-col">
          <div className="border-b border-white/[0.07] px-6 py-5">
            <button
              onClick={() => router.push("/dashboard")}
              className="group text-left"
            >
              <div className="text-lg font-semibold tracking-tight">
                Learnora<span className="text-zinc-500"> Me</span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  WitStart Admin
                </span>
              </div>
            </button>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              WitStart
            </p>

            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => goToTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    activeTab === tab.id
                      ? "bg-white/[0.07] text-white"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <span className="w-5 text-center text-xs">
                    {tab.icon}
                  </span>

                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 border-t border-white/[0.06] pt-6">
              <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Scope
              </p>

              <div className="space-y-2 px-3 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  WitStart learners
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Learner activity
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-red-400">×</span>
                  Learnora learners
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-red-400">×</span>
                  Administrator accounts
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-red-400">×</span>
                  Platform security
                </div>
              </div>
            </div>
          </nav>

          <div className="border-t border-white/[0.07] p-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="truncate text-xs font-medium text-zinc-300">
                {admin?.name || admin?.email}
              </p>

              <p className="mt-1 truncate text-[11px] text-zinc-600">
                {admin?.email}
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("phx_token");
                localStorage.removeItem("phx_name");
                localStorage.removeItem("phx_account_type");
                router.replace("/");
              }}
              className="mt-2 w-full rounded-xl px-3 py-2 text-left text-xs text-zinc-500 transition hover:bg-red-400/10 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* MOBILE HEADER */}
        <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#0c0d0f]/95 px-4 backdrop-blur lg:hidden">
          <button onClick={() => router.push("/dashboard")}>
            <div className="text-base font-semibold">
              Learnora<span className="text-zinc-500"> Me</span>
            </div>

            <div className="text-[9px] uppercase tracking-[0.15em] text-amber-400">
              WitStart Admin
            </div>
          </button>

          <button
            onClick={() => setMobileMenu((value) => !value)}
            className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-300"
          >
            Menu
          </button>
        </div>

        {mobileMenu && (
          <div className="fixed inset-x-0 top-16 z-30 border-b border-white/[0.07] bg-[#0c0d0f] p-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => goToTab(tab.id)}
                  className={`rounded-xl px-3 py-3 text-left text-xs ${
                    activeTab === tab.id
                      ? "bg-white/[0.08] text-white"
                      : "bg-white/[0.03] text-zinc-500"
                  }`}
                >
                  {tab.icon}{" "}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-24 sm:px-6 lg:px-10 lg:pt-10">
            {/* TOP BAR */}
            <div className="mb-8 flex flex-col gap-5 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-zinc-600">
                  <span>Admin</span>
                  <span>/</span>
                  <span className="text-zinc-400">
                    WitStart
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  WitStart administration
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Manage learners and learner activity for the WitStart
                  academy environment.
                </p>
              </div>

              <button
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                <span
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                >
                  ↻
                </span>
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                <span>{error}</span>

                <button
                  onClick={() => setError("")}
                  className="text-red-400/70 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            )}

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="WitStart learners"
                    value={
                      counts.total ||
                      stats.witstart_users ||
                      0
                    }
                    detail="Learner accounts in WitStart"
                    icon="◉"
                  />

                  <StatCard
                    label="Active"
                    value={counts.active}
                    detail="Not suspended or inactive"
                    icon="✓"
                  />

                  <StatCard
                    label="Paid"
                    value={counts.paid}
                    detail={`${counts.free} currently free`}
                    icon="₦"
                  />

                  <StatCard
                    label="Activity"
                    value={activity.length}
                    detail="Recent recorded events"
                    icon="◌"
                  />
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
                  <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-white">
                          Recent WitStart learners
                        </h2>

                        <p className="mt-1 text-xs text-zinc-600">
                          Latest accounts available to this admin.
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab("learners")}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        View all →
                      </button>
                    </div>

                    <div className="mt-5 divide-y divide-white/[0.05]">
                      {learners.slice(0, 6).map((learner) => (
                        <button
                          key={String(
                            learner.id || learner.email
                          )}
                          onClick={() => openLearner(learner)}
                          className="flex w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-white/[0.02]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-200">
                              {displayName(learner)}
                            </p>

                            <p className="mt-1 truncate text-xs text-zinc-600">
                              {learner.email}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${statusClass(
                              learner
                            )}`}
                          >
                            {statusLabel(learner)}
                          </span>
                        </button>
                      ))}

                      {!learners.length && (
                        <div className="py-8 text-center text-xs text-zinc-600">
                          No WitStart learners found.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-5">
                    <h2 className="text-sm font-semibold text-white">
                      WitStart scope
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      This account is intentionally isolated from
                      the wider Learnora administration system.
                    </p>

                    <div className="mt-6 space-y-3">
                      {[
                        ["WitStart learners", true],
                        ["Learner records", true],
                        ["Learner activity", true],
                        ["Learnora learners", false],
                        ["Staff administrators", false],
                        ["Super administrators", false],
                        ["Platform security", false],
                      ].map(([label, allowed]) => (
                        <div
                          key={String(label)}
                          className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                        >
                          <span className="text-xs text-zinc-400">
                            {label}
                          </span>

                          <span
                            className={
                              allowed
                                ? "text-xs text-emerald-400"
                                : "text-xs text-zinc-700"
                            }
                          >
                            {allowed ? "Allowed" : "Restricted"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Recent activity
                      </h2>

                      <p className="mt-1 text-xs text-zinc-600">
                        Activity associated with WitStart learner
                        accounts.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("activity")}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      View activity →
                    </button>
                  </div>

                  <div className="mt-5">
                    {activity.length ? (
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {activity.slice(0, 6).map((item, index) => (
                          <div
                            key={String(
                              item.id || `${item.email}-${index}`
                            )}
                            className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                          >
                            <p className="text-xs font-medium text-zinc-300">
                              {item.action ||
                                item.event ||
                                "Activity"}
                            </p>

                            <p className="mt-2 truncate text-xs text-zinc-600">
                              {item.email || "Unknown learner"}
                            </p>

                            <p className="mt-3 text-[10px] text-zinc-700">
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-6 text-center text-xs text-zinc-600">
                        No recent activity recorded.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LEARNERS */}
            {activeTab === "learners" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="All"
                    value={counts.total}
                    icon="◉"
                  />

                  <StatCard
                    label="Paid"
                    value={counts.paid}
                    icon="₦"
                  />

                  <StatCard
                    label="Free"
                    value={counts.free}
                    icon="○"
                  />

                  <StatCard
                    label="Suspended"
                    value={counts.suspended}
                    icon="!"
                  />
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#101114]">
                  <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative min-w-0 flex-1 lg:max-w-md">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
                        ⌕
                      </span>

                      <input
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search name or email…"
                        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/[0.15]"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value as typeof statusFilter
                        )
                      }
                      className="rounded-xl border border-white/[0.07] bg-[#15161a] px-3 py-2.5 text-xs text-zinc-400 outline-none"
                    >
                      <option value="all">All statuses</option>
                      <option value="paid">Paid</option>
                      <option value="free">Free</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  {filteredLearners.length ? (
                    <>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/[0.05] text-left">
                              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                                Learner
                              </th>

                              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                                Status
                              </th>

                              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                                Plan
                              </th>

                              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                                Joined
                              </th>

                              <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                                Action
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-white/[0.04]">
                            {filteredLearners.map((learner) => (
                              <tr
                                key={String(
                                  learner.id || learner.email
                                )}
                                className="transition hover:bg-white/[0.02]"
                              >
                                <td className="px-5 py-4">
                                  <p className="text-sm font-medium text-zinc-200">
                                    {displayName(learner)}
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-600">
                                    {learner.email}
                                  </p>
                                </td>

                                <td className="px-5 py-4">
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[10px] ${statusClass(
                                      learner
                                    )}`}
                                  >
                                    {statusLabel(learner)}
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-xs text-zinc-500">
                                  {learner.subscription_tier ||
                                    (learner.is_paid
                                      ? "Paid"
                                      : "Free")}
                                </td>

                                <td className="px-5 py-4 text-xs text-zinc-600">
                                  {formatDate(
                                    learner.created_at
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <button
                                    onClick={() =>
                                      openLearner(learner)
                                    }
                                    className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                                  >
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="divide-y divide-white/[0.05] md:hidden">
                        {filteredLearners.map((learner) => (
                          <button
                            key={String(
                              learner.id || learner.email
                            )}
                            onClick={() => openLearner(learner)}
                            className="w-full p-4 text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-zinc-200">
                                  {displayName(learner)}
                                </p>

                                <p className="mt-1 truncate text-xs text-zinc-600">
                                  {learner.email}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] ${statusClass(
                                  learner
                                )}`}
                              >
                                {statusLabel(learner)}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-700">
                              <span>
                                {learner.subscription_tier ||
                                  (learner.is_paid
                                    ? "Paid"
                                    : "Free")}
                              </span>

                              <span>
                                {formatDate(
                                  learner.created_at
                                )}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      title={
                        search || statusFilter !== "all"
                          ? "No matching learners"
                          : "No WitStart learners"
                      }
                      description={
                        search || statusFilter !== "all"
                          ? "Try changing the search term or status filter."
                          : "WitStart learner accounts will appear here when they are created."
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {activeTab === "activity" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        WitStart activity
                      </h2>

                      <p className="mt-1 text-xs text-zinc-600">
                        Recorded activity associated with WitStart
                        learners.
                      </p>
                    </div>

                    <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[10px] text-zinc-500">
                      {activity.length} events
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.05]">
                    {activity.length ? (
                      <div className="divide-y divide-white/[0.05]">
                        {activity.map((item, index) => (
                          <div
                            key={String(
                              item.id ||
                                `${item.email}-${item.created_at}-${index}`
                            )}
                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                <p className="text-sm font-medium text-zinc-300">
                                  {item.action ||
                                    item.event ||
                                    "Activity"}
                                </p>
                              </div>

                              <p className="mt-1 truncate pl-3.5 text-xs text-zinc-600">
                                {item.email ||
                                  "Unknown learner"}
                              </p>
                            </div>

                            <div className="shrink-0 text-left sm:text-right">
                              <p className="text-[10px] text-zinc-700">
                                {formatDateTime(
                                  item.created_at
                                )}
                              </p>

                              {item.ip && (
                                <p className="mt-1 text-[10px] text-zinc-800">
                                  {item.ip}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-xs text-zinc-600">
                        No WitStart activity has been recorded.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BILLING */}
            {activeTab === "billing" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Total learners"
                    value={counts.total}
                    icon="◉"
                  />

                  <StatCard
                    label="Paid"
                    value={counts.paid}
                    detail="Accounts currently marked paid"
                    icon="₦"
                  />

                  <StatCard
                    label="Free"
                    value={counts.free}
                    detail="Accounts not marked paid"
                    icon="○"
                  />

                  <StatCard
                    label="Paid share"
                    value={
                      counts.total
                        ? `${Math.round(
                            (counts.paid / counts.total) * 100
                          )}%`
                        : "0%"
                    }
                    detail="Of WitStart learners"
                    icon="%"
                  />
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-6">
                  <h2 className="text-sm font-semibold text-white">
                    Subscription records
                  </h2>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">
                    This section reflects the subscription information
                    stored for WitStart learner accounts. No estimated
                    revenue or fabricated billing figures are shown.
                  </p>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-white/[0.05] text-left">
                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                            Learner
                          </th>

                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                            Plan
                          </th>

                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                            Status
                          </th>

                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                            Expiry
                          </th>

                          <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                            Trial
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/[0.04]">
                        {learners.map((learner) => (
                          <tr
                            key={String(
                              learner.id || learner.email
                            )}
                          >
                            <td className="px-4 py-4">
                              <p className="text-xs font-medium text-zinc-300">
                                {displayName(learner)}
                              </p>

                              <p className="mt-1 text-[10px] text-zinc-700">
                                {learner.email}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-xs text-zinc-500">
                              {learner.subscription_tier ||
                                (learner.is_paid
                                  ? "Paid"
                                  : "Free")}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] ${statusClass(
                                  learner
                                )}`}
                              >
                                {statusLabel(learner)}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-xs text-zinc-600">
                              {formatDate(
                                learner.expires_at
                              )}
                            </td>

                            <td className="px-4 py-4 text-xs text-zinc-600">
                              {formatDate(
                                learner.trial_ends_at
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!learners.length && (
                    <p className="py-10 text-center text-xs text-zinc-600">
                      No WitStart subscription records available.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* LEARNER MODAL */}
      {selectedLearner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111216] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/[0.07] p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400">
                  WitStart learner
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  Manage learner
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  {selectedLearner.email}
                </p>
              </div>

              <button
                onClick={closeLearner}
                className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-white/[0.05] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Learner name
                </label>

                <input
                  value={editName}
                  onChange={(event) =>
                    setEditName(event.target.value)
                  }
                  placeholder="Learner name"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/[0.18]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Account status
                </label>

                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-[#17181c] px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-white/[0.18]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                    Plan
                  </p>

                  <p className="mt-2 text-xs text-zinc-300">
                    {selectedLearner.subscription_tier ||
                      (selectedLearner.is_paid
                        ? "Paid"
                        : "Free")}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                    Joined
                  </p>

                  <p className="mt-2 text-xs text-zinc-300">
                    {formatDate(
                      selectedLearner.created_at
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.035] p-3">
                <p className="text-xs leading-5 text-zinc-500">
                  WitStart administrators can manage WitStart
                  learner accounts only. Administrator accounts and
                  Learnora-wide settings remain outside this area.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={deleteLearner}
                disabled={deleting || saving}
                className="rounded-xl border border-red-400/15 px-4 py-2.5 text-xs font-medium text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete learner"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={closeLearner}
                  disabled={saving || deleting}
                  className="rounded-xl border border-white/[0.07] px-4 py-2.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={saveLearner}
                  disabled={saving || deleting}
                  className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}