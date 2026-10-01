'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'https://learnora-backend.vercel.app';

export const dynamic = 'force-dynamic';

type Tab =
  | 'overview'
  | 'learners'
  | 'activity'
  | 'billing';

interface UserRecord {
  id?: number | string;
  name?: string | null;
  email: string;
  role?: string | null;
  account_type?: string | null;
  sub_status?: string | null;
  subscription_tier?: string | null;
  is_paid?: boolean | null;
  is_active?: boolean | null;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
}

interface ActivityRecord {
  id?: number | string;
  action?: string | null;
  event?: string | null;
  email?: string | null;
  name?: string | null;
  account_type?: string | null;
  role?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  timestamp?: string | null;
}

interface MeResponse {
  id?: number | string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  account_type?: string | null;
  allowed?: string[];
}

interface StatsRecord {
  total_users?: number;
  normal_users?: number;
  witstart_users?: number;
  active_users?: number;
  inactive_users?: number;
  pending_users?: number;
  paid_users?: number;
  free_users?: number;
  [key: string]: unknown;
}

interface LearnerEditForm {
  name: string;
  is_paid: boolean;
  sub_status: string;
}

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('phx_token') || '';
}

function authHeaders(): HeadersInit {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

function unwrapArray<T>(
  data: unknown,
  keys: string[] = [],
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const obj = data as Record<string, unknown>;

  for (const key of keys) {
    if (Array.isArray(obj[key])) {
      return obj[key] as T[];
    }
  }

  if (Array.isArray(obj.data)) {
    return obj.data as T[];
  }

  return [];
}

function unwrapObject<T extends Record<string, unknown>>(
  data: unknown,
  keys: string[] = [],
): T {
  if (!data || typeof data !== 'object') {
    return {} as T;
  }

  const obj = data as Record<string, unknown>;

  for (const key of keys) {
    if (
      obj[key] &&
      typeof obj[key] === 'object' &&
      !Array.isArray(obj[key])
    ) {
      return obj[key] as T;
    }
  }

  if (
    obj.data &&
    typeof obj.data === 'object' &&
    !Array.isArray(obj.data)
  ) {
    return obj.data as T;
  }

  return obj as T;
}

function numberValue(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback = 0,
): number {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function relativeTime(
  value?: string | null,
): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const diff =
    Date.now() - date.getTime();

  const seconds = Math.floor(
    diff / 1000,
  );

  if (seconds < 0) return 'just now';

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 30) {
    return `${days}d ago`;
  }

  return formatDate(value);
}

function activityTimestamp(
  item: ActivityRecord,
): string | null {
  return (
    item.created_at ||
    item.timestamp ||
    null
  );
}

function activityLabel(
  item: ActivityRecord,
): string {
  return (
    item.action ||
    item.event ||
    'Platform activity'
  );
}

function displayName(
  name?: string | null,
  email?: string | null,
): string {
  return (
    name?.trim() ||
    email?.split('@')[0] ||
    'Unknown learner'
  );
}

function statusClass(
  status?: string | null,
): string {
  const value = String(
    status || '',
  ).toLowerCase();

  if (
    value.includes('active') ||
    value.includes('paid') ||
    value.includes('approved') ||
    value.includes('success')
  ) {
    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  }

  if (
    value.includes('pending') ||
    value.includes('trial')
  ) {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
  }

  if (
    value.includes('expired') ||
    value.includes('suspended') ||
    value.includes('inactive')
  ) {
    return 'border-red-400/20 bg-red-400/10 text-red-300';
  }

  return 'border-slate-600 bg-slate-800/60 text-slate-300';
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {}),
      },
      cache: 'no-store',
    },
  );

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    throw new Error('__AUTH_ERROR__');
  }

  if (!response.ok) {
    const detail =
      payload &&
      typeof payload === 'object' &&
      'detail' in payload
        ? String(
            (
              payload as Record<
                string,
                unknown
              >
            ).detail,
          )
        : payload &&
            typeof payload === 'object' &&
            'error' in payload
          ? String(
              (
                payload as Record<
                  string,
                  unknown
                >
              ).error,
            )
          : `Request failed with status ${response.status}`;

    throw new Error(detail);
  }

  return payload as T;
}

const EMPTY_EDIT_FORM: LearnerEditForm = {
  name: '',
  is_paid: false,
  sub_status: 'pending',
};

export default function StaffAdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<Tab>('overview');

  const [adminName, setAdminName] =
    useState('Staff Admin');

  const [adminEmail, setAdminEmail] =
    useState('');

  const [users, setUsers] =
    useState<UserRecord[]>([]);

  const [activity, setActivity] =
    useState<ActivityRecord[]>([]);

  const [stats, setStats] =
    useState<StatsRecord | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<'all' | 'active' | 'pending' | 'expired'>(
      'all',
    );

  const [showEditLearner, setShowEditLearner] =
    useState(false);

  const [showGrantMonth, setShowGrantMonth] =
    useState(false);

  const [selectedLearner, setSelectedLearner] =
    useState<UserRecord | null>(null);

  const [editForm, setEditForm] =
    useState<LearnerEditForm>(
      EMPTY_EDIT_FORM,
    );

  const [grantEmail, setGrantEmail] =
    useState('');

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const redirectToLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phx_token');
      localStorage.removeItem('phx_email');
      localStorage.removeItem('phx_role');
      localStorage.removeItem('phx_plan');
    }

    router.replace('/');
  }, [router]);

  const verifyStaffAdmin =
    useCallback(async () => {
      try {
        const response =
          await apiFetch<MeResponse>(
            '/api/auth/me',
          );

        /*
         * Staff Admin must be authenticated as:
         *
         * account_type = admin
         * role = staff_admin
         *
         * Super Admins should use their own console.
         * WitStart Admins should use their own console.
         */
        if (
          response.account_type !== 'admin' ||
          response.role !== 'staff_admin'
        ) {
          router.replace(
            '/dashboard/admin/super_admin',
          );

          return null;
        }

        setAdminName(
          response.name ||
            response.email?.split('@')[0] ||
            'Staff Admin',
        );

        setAdminEmail(
          response.email || '',
        );

        return response;
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          redirectToLogin();
          return null;
        }

        throw err;
      }
    }, [
      redirectToLogin,
      router,
    ]);

  const fetchDashboardData =
    useCallback(
      async (silent = false) => {
        if (!silent) {
          setRefreshing(true);
        }

        try {
          const [
            meResponse,
            usersResponse,
            statsResponse,
            activityResponse,
          ] = await Promise.all([
            apiFetch<MeResponse>(
              '/api/auth/me',
            ),
            apiFetch<unknown>(
              '/api/admin/users',
            ),
            apiFetch<unknown>(
              '/api/admin/stats',
            ),
            apiFetch<unknown>(
              '/api/admin/activity',
            ),
          ]);

          if (
            meResponse.account_type !==
              'admin' ||
            meResponse.role !==
              'staff_admin'
          ) {
            router.replace(
              '/dashboard/admin/super_admin',
            );

            return;
          }

          setAdminName(
            meResponse.name ||
              meResponse.email?.split(
                '@',
              )[0] ||
              'Staff Admin',
          );

          setAdminEmail(
            meResponse.email || '',
          );

          const allUsers =
            unwrapArray<UserRecord>(
              usersResponse,
              ['users', 'learners'],
            );

          /*
           * The staff dashboard deliberately
           * keeps only normal Learnora learners.
           *
           * Even if the backend happens to return
           * other account types, they are never
           * displayed or operated on here.
           */
          const normalLearners =
            allUsers.filter(
              (user) =>
                user.role === 'normal',
            );

          setUsers(normalLearners);

          setStats(
            unwrapObject<StatsRecord>(
              statsResponse,
              ['stats'],
            ),
          );

          setActivity(
            unwrapArray<ActivityRecord>(
              activityResponse,
              [
                'activity',
                'logs',
                'events',
              ],
            ),
          );

          setLastUpdated(
            new Date(),
          );
        } catch (err) {
          if (
            err instanceof Error &&
            err.message ===
              '__AUTH_ERROR__'
          ) {
            redirectToLogin();
            return;
          }

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load the staff dashboard.',
          );
        } finally {
          if (!silent) {
            setRefreshing(false);
          }

          setLoading(false);
        }
      },
      [redirectToLogin, router],
    );

  useEffect(() => {
    void verifyStaffAdmin().then(
      (result) => {
        if (result) {
          void fetchDashboardData(
            true,
          );
        }
      },
    );
  }, [
    verifyStaffAdmin,
    fetchDashboardData,
  ]);

  /*
   * Refresh operational data periodically.
   * The staff page does not poll administrator
   * records because staff admins cannot manage them.
   */
  useEffect(() => {
    const interval =
      window.setInterval(() => {
        void fetchDashboardData(true);
      }, 15000);

    return () =>
      window.clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!error && !success) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setError('');
        setSuccess('');
      }, 7000);

    return () =>
      window.clearTimeout(timer);
  }, [error, success]);

  const totalUsers = numberValue(
    stats,
    ['normal_users'],
    users.length,
  );

  const activeUsers = numberValue(
    stats,
    ['active_users'],
    users.filter(
      (user) =>
        user.is_active !== false &&
        user.sub_status !==
          'suspended',
    ).length,
  );

  const pendingUsers = numberValue(
    stats,
    ['pending_users'],
    users.filter(
      (user) =>
        user.sub_status ===
        'pending',
    ).length,
  );

  const paidUsers = numberValue(
    stats,
    ['paid_users'],
    users.filter(
      (user) => user.is_paid,
    ).length,
  );

  const freeUsers = numberValue(
    stats,
    ['free_users'],
    users.filter(
      (user) => !user.is_paid,
    ).length,
  );

  const recentActivityUsers =
    useMemo(() => {
      const cutoff =
        Date.now() -
        15 * 60 * 1000;

      const emails =
        new Set<string>();

      for (const item of activity) {
        if (!item.email) {
          continue;
        }

        const timestamp =
          activityTimestamp(item);

        if (!timestamp) {
          continue;
        }

        const time =
          new Date(
            timestamp,
          ).getTime();

        if (
          Number.isFinite(time) &&
          time >= cutoff
        ) {
          emails.add(
            item.email.toLowerCase(),
          );
        }
      }

      return emails.size;
    }, [activity]);

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const status =
        String(
          user.sub_status || '',
        ).toLowerCase();

      if (
        statusFilter ===
          'active' &&
        !(
          status === 'active' ||
          user.is_paid === true
        )
      ) {
        return false;
      }

      if (
        statusFilter ===
          'pending' &&
        status !== 'pending'
      ) {
        return false;
      }

      if (
        statusFilter ===
          'expired' &&
        status !== 'expired'
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        String(
          user.name || '',
        )
          .toLowerCase()
          .includes(query) ||
        user.email
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    users,
    search,
    statusFilter,
  ]);

  const recentActivity =
    useMemo(() => {
      return [...activity]
        .sort(
          (a, b) =>
            new Date(
              activityTimestamp(b) ||
                0,
            ).getTime() -
            new Date(
              activityTimestamp(a) ||
                0,
            ).getTime(),
        )
        .slice(0, 12);
    }, [activity]);

  const openEditLearner = (
    user: UserRecord,
  ) => {
    setSelectedLearner(user);

    setEditForm({
      name: user.name || '',
      is_paid: Boolean(
        user.is_paid,
      ),
      sub_status:
        user.sub_status ||
        'pending',
    });

    setShowEditLearner(true);
  };

  const updateLearner = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!selectedLearner) {
      return;
    }

    clearMessages();

    try {
      /*
       * The backend remains the authority over
       * which fields this role is allowed to
       * change.
       */
      await apiFetch(
        `/api/admin/users/${encodeURIComponent(
          selectedLearner.email,
        )}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editForm.name.trim(),
            role: 'normal',
            is_paid: editForm.is_paid,
            sub_status:
              editForm.sub_status,
          }),
        },
      );

      setSuccess(
        `Learner ${selectedLearner.email} updated successfully.`,
      );

      setShowEditLearner(false);
      setSelectedLearner(null);

      await fetchDashboardData(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          '__AUTH_ERROR__'
      ) {
        redirectToLogin();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update learner.',
      );
    }
  };

  const deleteLearner = async (
    user: UserRecord,
  ) => {
    const confirmed =
      window.confirm(
        `Delete the Learnora learner account for ${user.email}? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      await apiFetch(
        `/api/admin/users/${encodeURIComponent(
          user.email,
        )}`,
        {
          method: 'DELETE',
        },
      );

      setSuccess(
        `Learner ${user.email} deleted successfully.`,
      );

      await fetchDashboardData(
        true,
      );
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          '__AUTH_ERROR__'
      ) {
        redirectToLogin();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete learner.',
      );
    }
  };

  const grantFreeMonth = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    clearMessages();

    try {
      await apiFetch(
        '/api/admin/grant-free-month',
        {
          method: 'POST',
          body: JSON.stringify({
            email:
              grantEmail.trim(),
          }),
        },
      );

      setSuccess(
        `One free month granted to ${grantEmail.trim()}.`,
      );

      setGrantEmail('');
      setShowGrantMonth(false);

      await fetchDashboardData(
        true,
      );
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          '__AUTH_ERROR__'
      ) {
        redirectToLogin();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to grant the free month.',
      );
    }
  };

  const logout = () => {
    localStorage.removeItem(
      'phx_token',
    );
    localStorage.removeItem(
      'phx_email',
    );
    localStorage.removeItem(
      'phx_role',
    );
    localStorage.removeItem(
      'phx_plan',
    );

    router.replace('/');
  };

  const navigate = (
    tab: Tab,
  ) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  const navigation: {
    id: Tab;
    label: string;
    icon: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '⌂',
    },
    {
      id: 'learners',
      label: 'Learners',
      icon: '◉',
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: '◷',
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: '₦',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-300" />
          </div>

          <h1 className="text-xl font-semibold">
            Learnora Me
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Loading staff administration console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[270px] transform border-r border-white/5 bg-[#091522] transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileNavOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/5 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-300 to-blue-500 text-lg font-black text-slate-950">
                  L
                </div>

                <div>
                  <div className="text-base font-bold tracking-tight">
                    Learnora Me
                  </div>

                  <div className="text-[11px] uppercase tracking-[0.18em] text-blue-300/80">
                    Staff Console
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 pt-5">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Workspace
              </p>

              <nav className="space-y-1">
                {navigation.map(
                  (item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          item.id,
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        activeTab ===
                        item.id
                          ? 'bg-blue-400/10 text-blue-300'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          activeTab ===
                          item.id
                            ? 'bg-blue-400/10'
                            : 'bg-white/[0.03]'
                        }`}
                      >
                        {
                          item.icon
                        }
                      </span>

                      <span>
                        {
                          item.label
                        }
                      </span>
                    </button>
                  ),
                )}
              </nav>
            </div>

            <div className="mt-auto border-t border-white/5 p-4">
              <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-400/10 text-sm font-bold text-blue-300">
                    {adminName
                      .slice(
                        0,
                        1,
                      )
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {
                        adminName
                      }
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      Staff Admin
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-3 py-2.5 text-sm text-red-300 hover:bg-red-400/10"
              >
                <span>↪</span>
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setMobileNavOpen(false)
            }
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        {/* MAIN */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07111f]/90 backdrop-blur-xl">
            <div className="flex h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setMobileNavOpen(
                      true,
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300 lg:hidden"
                >
                  ☰
                </button>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold sm:text-xl">
                    {activeTab ===
                    'overview'
                      ? 'Staff Overview'
                      : navigation.find(
                            (
                              item,
                            ) =>
                              item.id ===
                              activeTab,
                          )?.label ||
                        'Staff Console'}
                  </h1>

                  <p className="hidden text-xs text-slate-500 sm:block">
                    Learnora learner operations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-slate-500">
                    {lastUpdated
                      ? `Updated ${relativeTime(
                          lastUpdated.toISOString(),
                        )}`
                      : 'Live monitoring'}
                  </p>

                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-emerald-300">
                      Staff access active
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() =>
                    void fetchDashboardData()
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {refreshing
                    ? 'Refreshing…'
                    : 'Refresh'}
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
            {(error || success) && (
              <div className="mb-5">
                {error && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-300">
                    {success}
                  </div>
                )}
              </div>
            )}

            {activeTab ===
              'overview' && (
              <Overview
                adminName={
                  adminName
                }
                totalUsers={
                  totalUsers
                }
                activeUsers={
                  activeUsers
                }
                pendingUsers={
                  pendingUsers
                }
                paidUsers={
                  paidUsers
                }
                freeUsers={
                  freeUsers
                }
                recentActivityUsers={
                  recentActivityUsers
                }
                recentActivity={
                  recentActivity
                }
                navigate={
                  navigate
                }
                onGrantMonth={() =>
                  setShowGrantMonth(
                    true,
                  )
                }
              />
            )}

            {activeTab ===
              'learners' && (
              <LearnersPage
                users={
                  filteredUsers
                }
                totalUsers={
                  totalUsers
                }
                search={search}
                setSearch={
                  setSearch
                }
                statusFilter={
                  statusFilter
                }
                setStatusFilter={
                  setStatusFilter
                }
                onEdit={
                  openEditLearner
                }
                onDelete={
                  deleteLearner
                }
              />
            )}

            {activeTab ===
              'activity' && (
              <ActivityPage
                activity={
                  activity
                }
              />
            )}

            {activeTab ===
              'billing' && (
              <BillingPage
                totalUsers={
                  totalUsers
                }
                paidUsers={
                  paidUsers
                }
                freeUsers={
                  freeUsers
                }
                onGrantMonth={() =>
                  setShowGrantMonth(
                    true,
                  )
                }
              />
            )}
          </div>
        </main>
      </div>

      {/* EDIT LEARNER */}
      {showEditLearner &&
        selectedLearner && (
          <Modal
            title="Edit Learnora learner"
            onClose={() => {
              setShowEditLearner(
                false,
              );
              setSelectedLearner(
                null,
              );
            }}
          >
            <form
              onSubmit={
                updateLearner
              }
              className="space-y-4"
            >
              <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                <p className="text-xs text-slate-500">
                  Learner account
                </p>

                <p className="mt-1 break-all text-sm text-slate-200">
                  {
                    selectedLearner.email
                  }
                </p>
              </div>

              <FormField
                label="Name"
                value={
                  editForm.name
                }
                onChange={(
                  value,
                ) =>
                  setEditForm(
                    (
                      current,
                    ) => ({
                      ...current,
                      name: value,
                    }),
                  )
                }
                placeholder="Learner name"
              />

              <SelectField
                label="Subscription status"
                value={
                  editForm.sub_status
                }
                onChange={(
                  value,
                ) =>
                  setEditForm(
                    (
                      current,
                    ) => ({
                      ...current,
                      sub_status:
                        value,
                    }),
                  )
                }
                options={[
                  {
                    value:
                      'pending',
                    label:
                      'Pending',
                  },
                  {
                    value:
                      'active',
                    label:
                      'Active',
                  },
                  {
                    value:
                      'trial',
                    label:
                      'Trial',
                  },
                  {
                    value:
                      'expired',
                    label:
                      'Expired',
                  },
                  {
                    value:
                      'suspended',
                    label:
                      'Suspended',
                  },
                ]}
              />

              <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
                <input
                  type="checkbox"
                  checked={
                    editForm.is_paid
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        is_paid:
                          event
                            .target
                            .checked,
                      }),
                    )
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-400"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-200">
                    Paid account
                  </span>

                  <span className="block text-xs text-slate-500">
                    Mark the learner as having paid access.
                  </span>
                </span>
              </label>

              <div className="rounded-xl border border-blue-400/10 bg-blue-400/[0.04] p-3 text-xs leading-5 text-slate-400">
                Staff Admin can only manage normal Learnora learners. The account role remains <span className="text-blue-300">normal</span> and cannot be changed from this console.
              </div>

              <ModalActions
                onCancel={() => {
                  setShowEditLearner(
                    false,
                  );
                  setSelectedLearner(
                    null,
                  );
                }}
                submitLabel="Save changes"
              />
            </form>
          </Modal>
        )}

      {/* GRANT MONTH */}
      {showGrantMonth && (
        <Modal
          title="Grant one free month"
          onClose={() =>
            setShowGrantMonth(
              false,
            )
          }
        >
          <form
            onSubmit={
              grantFreeMonth
            }
            className="space-y-4"
          >
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3 text-xs leading-5 text-slate-400">
              This action applies to a normal Learnora learner. The backend remains responsible for validating the account and applying the subscription change.
            </div>

            <FormField
              label="Learner email"
              type="email"
              value={
                grantEmail
              }
              onChange={
                setGrantEmail
              }
              placeholder="learner@example.com"
              required
            />

            <ModalActions
              onCancel={() =>
                setShowGrantMonth(
                  false,
                )
              }
              submitLabel="Grant free month"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* OVERVIEW                                                                    */
/* -------------------------------------------------------------------------- */

function Overview({
  adminName,
  totalUsers,
  activeUsers,
  pendingUsers,
  paidUsers,
  freeUsers,
  recentActivityUsers,
  recentActivity,
  navigate,
  onGrantMonth,
}: {
  adminName: string;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  paidUsers: number;
  freeUsers: number;
  recentActivityUsers: number;
  recentActivity: ActivityRecord[];
  navigate: (tab: Tab) => void;
  onGrantMonth: () => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300/80">
            Learnora Me
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            Welcome back,{' '}
            {adminName}
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Manage normal Learnora learners and monitor the learner experience from this staff workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Learnora learners"
            value={
              totalUsers
            }
            detail="Normal learner accounts"
            icon="◉"
          />

          <MetricCard
            label="Active learners"
            value={
              activeUsers
            }
            detail={`${pendingUsers} pending accounts`}
            icon="✓"
          />

          <MetricCard
            label="Paid learners"
            value={
              paidUsers
            }
            detail={`${freeUsers} not marked as paid`}
            icon="₦"
          />

          <MetricCard
            label="Recent activity"
            value={
              recentActivityUsers
            }
            detail="Unique activity users in the last 15 minutes"
            icon="↗"
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Staff workspace"
          description="The operations available to your role."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction
              icon="◉"
              title="Manage learners"
              description="Search, edit and remove normal Learnora learners."
              onClick={() =>
                navigate(
                  'learners',
                )
              }
            />

            <QuickAction
              icon="◷"
              title="View activity"
              description="Review recent platform activity."
              onClick={() =>
                navigate(
                  'activity',
                )
              }
            />

            <QuickAction
              icon="₦"
              title="Grant free month"
              description="Grant one month to an eligible Learnora learner."
              onClick={
                onGrantMonth
              }
            />

            <QuickAction
              icon="↗"
              title="Review billing"
              description="View available learner subscription metrics."
              onClick={() =>
                navigate(
                  'billing',
                )
              }
            />
          </div>
        </Panel>

        <Panel
          title="Access scope"
          description="What this account can access."
        >
          <div className="space-y-3">
            <AccessRow
              label="Learnora learners"
              allowed
            />

            <AccessRow
              label="Learner activity"
              allowed
            />

            <AccessRow
              label="Learner subscription operations"
              allowed
            />

            <AccessRow
              label="Administrator accounts"
              allowed={false}
            />

            <AccessRow
              label="WitStart accounts"
              allowed={false}
            />

            <AccessRow
              label="Platform security administration"
              allowed={false}
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Recent activity"
          description="Latest platform events."
          action={
            <button
              type="button"
              onClick={() =>
                navigate(
                  'activity',
                )
              }
              className="text-xs text-blue-300 hover:text-blue-200"
            >
              View all →
            </button>
          }
        >
          {recentActivity.length ===
          0 ? (
            <EmptyState message="No recent activity available." />
          ) : (
            <div>
              {recentActivity
                .slice(0, 7)
                .map(
                  (
                    item,
                    index,
                  ) => (
                    <ActivityRow
                      key={
                        item.id ??
                        `${activityLabel(
                          item,
                        )}-${index}`
                      }
                      item={
                        item
                      }
                    />
                  ),
                )}
            </div>
          )}
        </Panel>

        <Panel
          title="Staff notes"
          description="Important operating boundaries."
        >
          <div className="space-y-4 text-sm leading-6 text-slate-400">
            <p>
              Your account is a{' '}
              <span className="text-blue-300">
                Staff Admin
              </span>
              . You are working with the normal Learnora learner population.
            </p>

            <p>
              WitStart is a separate academy environment and is intentionally outside this workspace.
            </p>

            <p>
              Administrator accounts and high-level platform controls remain under Super Admin management.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LEARNERS                                                                    */
/* -------------------------------------------------------------------------- */

function LearnersPage({
  users,
  totalUsers,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onEdit,
  onDelete,
}: {
  users: UserRecord[];
  totalUsers: number;
  search: string;
  setSearch: (value: string) => void;
  statusFilter:
    | 'all'
    | 'active'
    | 'pending'
    | 'expired';
  setStatusFilter: (
    value:
      | 'all'
      | 'active'
      | 'pending'
      | 'expired',
  ) => void;
  onEdit: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Learners"
        title="Learnora learners"
        description="Manage normal Learnora learner accounts. WitStart and administrator accounts are excluded from this workspace."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total"
          value={
            totalUsers
          }
          detail="Normal Learnora learners"
          icon="◉"
        />

        <MetricCard
          label="Showing"
          value={
            users.length
          }
          detail="Matching current filters"
          icon="⌕"
        />

        <MetricCard
          label="Access"
          value="Normal"
          detail="Staff-managed learner population"
          icon="✓"
        />
      </div>

      <Panel
        title="Learner directory"
        description="Search by name or email and manage learner access."
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <input
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Search learner name or email..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/30"
          />

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value as
                  | 'all'
                  | 'active'
                  | 'pending'
                  | 'expired',
              )
            }
            className="rounded-xl border border-white/10 bg-[#0b1827] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-400/30"
          >
            <option value="all">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="expired">
              Expired
            </option>
          </select>
        </div>

        {users.length ===
        0 ? (
          <EmptyState message="No Learnora learners match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3">
                    Learner
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Payment
                  </th>

                  <th className="px-3 py-3">
                    Created
                  </th>

                  <th className="px-3 py-3">
                    Last login
                  </th>

                  <th className="px-3 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {users.map(
                  (user) => (
                    <tr
                      key={
                        user.id ??
                        user.email
                      }
                      className="text-sm"
                    >
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-200">
                          {displayName(
                            user.name,
                            user.email,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            user.email
                          }
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${statusClass(
                            user.sub_status,
                          )}`}
                        >
                          {
                            user.sub_status ||
                            'Unknown'
                          }
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={
                            user.is_paid
                              ? 'text-emerald-300'
                              : 'text-slate-500'
                          }
                        >
                          {user.is_paid
                            ? 'Paid'
                            : 'Free'}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-500">
                        {formatDate(
                          user.created_at,
                        )}
                      </td>

                      <td className="px-3 py-4 text-slate-500">
                        {relativeTime(
                          user.last_login_at,
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                user,
                              )
                            }
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.05]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onDelete(
                                user,
                              )
                            }
                            className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-400/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ACTIVITY                                                                    */
/* -------------------------------------------------------------------------- */

function ActivityPage({
  activity,
}: {
  activity: ActivityRecord[];
}) {
  const sorted = [
    ...activity,
  ].sort(
    (a, b) =>
      new Date(
        activityTimestamp(b) ||
          0,
      ).getTime() -
      new Date(
        activityTimestamp(a) ||
          0,
      ).getTime(),
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Activity"
        title="Learner activity"
        description="Recent platform activity available to the staff administration role."
      />

      <Panel
        title="Activity log"
        description={`${activity.length} records loaded`}
      >
        {sorted.length ===
        0 ? (
          <EmptyState message="No activity records available." />
        ) : (
          <div className="divide-y divide-white/5">
            {sorted.map(
              (
                item,
                index,
              ) => (
                <ActivityRow
                  key={
                    item.id ??
                    `${activityLabel(
                      item,
                    )}-${index}`
                  }
                  item={
                    item
                  }
                />
              ),
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* BILLING                                                                     */
/* -------------------------------------------------------------------------- */

function BillingPage({
  totalUsers,
  paidUsers,
  freeUsers,
  onGrantMonth,
}: {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  onGrantMonth: () => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Billing"
        title="Learner subscriptions"
        description="Subscription information available to staff for normal Learnora learners."
        action={
          <button
            type="button"
            onClick={
              onGrantMonth
            }
            className="rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-blue-300"
          >
            Grant free month
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Learnora learners"
          value={
            totalUsers
          }
          detail="Normal learner accounts"
          icon="◉"
        />

        <MetricCard
          label="Paid"
          value={
            paidUsers
          }
          detail="Accounts marked as paid"
          icon="₦"
        />

        <MetricCard
          label="Free"
          value={
            freeUsers
          }
          detail="Accounts not marked as paid"
          icon="○"
        />
      </div>

      <Panel
        title="Subscription operations"
        description="Staff-level subscription actions."
      >
        <div className="rounded-xl border border-blue-400/10 bg-blue-400/[0.04] p-4">
          <p className="text-sm font-medium text-blue-200">
            Grant one free month
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            You can grant a free month to an eligible normal Learnora learner. The backend validates the account and applies the subscription change.
          </p>

          <button
            type="button"
            onClick={
              onGrantMonth
            }
            className="mt-4 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2.5 text-sm font-medium text-blue-300 hover:bg-blue-400/15"
          >
            Grant free month
          </button>
        </div>
      </Panel>

      <Panel
        title="Revenue information"
        description="Billing figures shown only when backed by authoritative data."
      >
        <p className="text-sm leading-6 text-slate-500">
          This staff console does not invent revenue, MRR, transaction totals or payment-provider figures. Those require authoritative billing data from the platform backend.
        </p>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SHARED COMPONENTS                                                           */
/* -------------------------------------------------------------------------- */

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300/80">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          {title}
        </h2>

        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a1725]/80">
      <div className="flex flex-col justify-between gap-3 border-b border-white/5 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a1725]/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-400/[0.05] text-blue-300">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-blue-400/10 hover:bg-white/[0.04]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200 group-hover:text-blue-200">
          {title}
        </span>

        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <span className="ml-auto text-slate-600 group-hover:text-blue-300">
        →
      </span>
    </button>
  );
}

function AccessRow({
  label,
  allowed,
}: {
  label: string;
  allowed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          allowed
            ? 'bg-emerald-400/10 text-emerald-300'
            : 'bg-red-400/10 text-red-300'
        }`}
      >
        {allowed ? '✓' : '×'}
      </span>

      <span
        className={
          allowed
            ? 'text-sm text-slate-300'
            : 'text-sm text-slate-600'
        }
      >
        {label}
      </span>
    </div>
  );
}

function ActivityRow({
  item,
}: {
  item: ActivityRecord;
}) {
  return (
    <div className="flex gap-3 py-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/10 bg-blue-400/[0.05] text-xs text-blue-300">
        ↗
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300">
          {activityLabel(item)}
        </p>

        <p className="mt-1 truncate text-xs text-slate-600">
          {item.email ||
            item.name ||
            'System event'}
          {item.role
            ? ` · ${item.role}`
            : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-slate-600">
          {relativeTime(
            activityTimestamp(item),
          )}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-8 text-center">
      <p className="text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b1827] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-100">
            {title}
          </h2>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
      <button
        type="button"
        onClick={
          onCancel
        }
        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04]"
      >
        Cancel
      </button>

      <button
        type="submit"
        className="rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-blue-300"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400/30"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-white/10 bg-[#0b1827] px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-400/30"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          ),
        )}
      </select>
    </label>
  );
}