'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'https://learnora-backend.vercel.app';

export const dynamic = 'force-dynamic';

type Tab =
  | 'overview'
  | 'traffic'
  | 'activity'
  | 'users'
  | 'normal'
  | 'witstart'
  | 'admins'
  | 'billing'
  | 'security';

type AdminRole = 'super_admin' | 'staff_admin' | 'witstart_admin';
type LearnerRole = 'normal' | 'witstart';

interface UserRecord {
  id?: number | string;
  name?: string | null;
  email: string;
  role?: LearnerRole | string | null;
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

interface AdminRecord {
  id: number | string;
  name?: string | null;
  email: string;
  role: AdminRole | string;
  is_active?: boolean;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
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

interface SecurityLog {
  id?: number | string;
  action?: string | null;
  event?: string | null;
  email?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  timestamp?: string | null;
}

interface DailyActivity {
  date: string;
  count: number;
  label?: string;
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
  total_admins?: number;
  active_admins?: number;
  inactive_admins?: number;
  super_admins?: number;
  staff_admins?: number;
  witstart_admins?: number;
  [key: string]: unknown;
}

interface TrafficRecord {
  total_events?: number;
  login_events?: number;
  recent_active_users?: number;
  unique_users?: number;
  daily?: DailyActivity[];
  activity?: DailyActivity[];
  series?: DailyActivity[];
  [key: string]: unknown;
}

interface SecuritySummary {
  total?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  recent?: number;
  [key: string]: unknown;
}

interface LearnerForm {
  name: string;
  email: string;
  password: string;
  role: LearnerRole;
}

interface AdminForm {
  name: string;
  email: string;
  password: string;
  role: 'staff_admin' | 'witstart_admin';
  notes: string;
}

interface AdminEditForm {
  name: string;
  role: AdminRole;
  notes: string;
  is_active: boolean;
}

interface LearnerEditForm {
  name: string;
  role: LearnerRole;
  is_paid: boolean;
  sub_status: string;
}

const EMPTY_LEARNER_FORM: LearnerForm = {
  name: '',
  email: '',
  password: '',
  role: 'normal',
};

const EMPTY_ADMIN_FORM: AdminForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff_admin',
  notes: '',
};

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('phx_token') || '';
}

function authHeaders(): HeadersInit {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function unwrapArray<T>(
  data: unknown,
  keys: string[] = [],
): T[] {
  if (Array.isArray(data)) return data as T[];

  if (!data || typeof data !== 'object') return [];

  const obj = data as Record<string, unknown>;

  for (const key of keys) {
    if (Array.isArray(obj[key])) {
      return obj[key] as T[];
    }
  }

  if (obj.data && Array.isArray(obj.data)) {
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

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function relativeTime(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(value);
}

function activityTimestamp(item: ActivityRecord): string | null {
  return item.created_at || item.timestamp || null;
}

function securityTimestamp(item: SecurityLog): string | null {
  return item.created_at || item.timestamp || null;
}

function activityLabel(item: ActivityRecord): string {
  return (
    item.action ||
    item.event ||
    'Platform activity'
  );
}

function securityLabel(item: SecurityLog): string {
  return (
    item.action ||
    item.event ||
    'Security event'
  );
}

function displayName(
  name?: string | null,
  email?: string | null,
): string {
  return name?.trim() || email?.split('@')[0] || 'Unknown user';
}

function roleLabel(role?: string | null): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'staff_admin':
      return 'Staff Admin';
    case 'witstart_admin':
      return 'WitStart Admin';
    case 'witstart':
      return 'WitStart Learner';
    case 'normal':
      return 'Learnora Learner';
    default:
      return role || 'Unknown';
  }
}

function roleBadgeClass(role?: string | null): string {
  switch (role) {
    case 'super_admin':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
    case 'staff_admin':
      return 'border-blue-400/30 bg-blue-400/10 text-blue-300';
    case 'witstart_admin':
      return 'border-purple-400/30 bg-purple-400/10 text-purple-300';
    case 'witstart':
      return 'border-purple-400/20 bg-purple-400/10 text-purple-300';
    default:
      return 'border-slate-600 bg-slate-800/60 text-slate-300';
  }
}

function statusBadgeClass(status?: string | null): string {
  const normalized = String(status || '').toLowerCase();

  if (
    normalized.includes('active') ||
    normalized.includes('approved') ||
    normalized.includes('paid') ||
    normalized.includes('success')
  ) {
    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('trial')
  ) {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
  }

  if (
    normalized.includes('expired') ||
    normalized.includes('inactive') ||
    normalized.includes('failed') ||
    normalized.includes('suspended')
  ) {
    return 'border-red-400/20 bg-red-400/10 text-red-300';
  }

  return 'border-slate-600 bg-slate-800/60 text-slate-300';
}

function normaliseDailyActivity(
  input: unknown,
): DailyActivity[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      if (typeof item === 'number') {
        return {
          date: String(index),
          count: item,
        };
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;

      const rawDate =
        record.date ||
        record.day ||
        record.label ||
        record.created_at ||
        record.timestamp;

      const count =
        numberValue(
          record,
          ['count', 'total', 'events', 'value'],
          0,
        );

      if (!rawDate) return null;

      return {
        date: String(rawDate),
        count,
        label: record.label
          ? String(record.label)
          : undefined,
      };
    })
    .filter(Boolean) as DailyActivity[];
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('__AUTH_ERROR__');
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'detail' in payload
        ? String(
            (payload as Record<string, unknown>).detail,
          )
        : payload &&
            typeof payload === 'object' &&
            'error' in payload
          ? String(
              (payload as Record<string, unknown>).error,
            )
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<Tab>('overview');

  const [adminName, setAdminName] =
    useState('Super Admin');
  const [adminEmail, setAdminEmail] =
    useState('');

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [admins, setAdmins] =
    useState<AdminRecord[]>([]);
  const [activity, setActivity] =
    useState<ActivityRecord[]>([]);
  const [securityLogs, setSecurityLogs] =
    useState<SecurityLog[]>([]);

  const [stats, setStats] =
    useState<StatsRecord | null>(null);
  const [traffic, setTraffic] =
    useState<TrafficRecord | null>(null);
  const [securitySummary, setSecuritySummary] =
    useState<SecuritySummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] =
    useState(false);
  const [directoryLoading, setDirectoryLoading] =
    useState(false);

  const [error, setError] =
    useState('');
  const [success, setSuccess] =
    useState('');

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  const [userSearch, setUserSearch] =
    useState('');
  const [adminSearch, setAdminSearch] =
    useState('');

  const [userFilter, setUserFilter] =
    useState<'all' | 'normal' | 'witstart'>('all');

  const [showCreateLearner, setShowCreateLearner] =
    useState(false);
  const [showCreateAdmin, setShowCreateAdmin] =
    useState(false);
  const [showGrantMonth, setShowGrantMonth] =
    useState(false);
  const [showEditAdmin, setShowEditAdmin] =
    useState(false);
  const [showEditLearner, setShowEditLearner] =
    useState(false);

  const [selectedAdmin, setSelectedAdmin] =
    useState<AdminRecord | null>(null);
  const [selectedLearner, setSelectedLearner] =
    useState<UserRecord | null>(null);

  const [learnerForm, setLearnerForm] =
    useState<LearnerForm>(EMPTY_LEARNER_FORM);

  const [adminForm, setAdminForm] =
    useState<AdminForm>(EMPTY_ADMIN_FORM);

  const [adminEditForm, setAdminEditForm] =
    useState<AdminEditForm>({
      name: '',
      role: 'staff_admin',
      notes: '',
      is_active: true,
    });

  const [learnerEditForm, setLearnerEditForm] =
    useState<LearnerEditForm>({
      name: '',
      role: 'normal',
      is_paid: false,
      sub_status: 'pending',
    });

  const [grantEmail, setGrantEmail] =
    useState('');

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const handleAuthError = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phx_token');
      localStorage.removeItem('phx_email');
      localStorage.removeItem('phx_role');
      localStorage.removeItem('phx_plan');
    }

    router.replace('/login');
  }, [router]);

  const verifySuperAdmin = useCallback(
    async (): Promise<MeResponse | null> => {
      try {
        const response =
          await apiFetch<MeResponse>('/api/auth/me');

        if (
          response.account_type !== 'admin' ||
          response.role !== 'super_admin'
        ) {
          router.replace('/login');
          return null;
        }

        setAdminName(
          response.name ||
            response.email?.split('@')[0] ||
            'Super Admin',
        );
        setAdminEmail(response.email || '');

        return response;
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
          return null;
        }

        throw err;
      }
    },
    [handleAuthError, router],
  );

  const fetchLiveData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLiveLoading(true);
      }

      try {
        const [
          statsResponse,
          trafficResponse,
          activityResponse,
          securityResponse,
          securitySummaryResponse,
        ] = await Promise.all([
          apiFetch<unknown>('/api/admin/stats'),
          apiFetch<unknown>('/api/admin/traffic'),
          apiFetch<unknown>('/api/admin/activity'),
          apiFetch<unknown>('/api/admin/security-logs'),
          apiFetch<unknown>(
            '/api/admin/security-summary',
          ),
        ]);

        const statsObject =
          unwrapObject<StatsRecord>(
            statsResponse,
            ['stats'],
          );

        const trafficObject =
          unwrapObject<TrafficRecord>(
            trafficResponse,
            ['traffic'],
          );

        const activityArray =
          unwrapArray<ActivityRecord>(
            activityResponse,
            ['activity', 'logs', 'events'],
          );

        const securityArray =
          unwrapArray<SecurityLog>(
            securityResponse,
            ['logs', 'security_logs', 'events'],
          );

        const summaryObject =
          unwrapObject<SecuritySummary>(
            securitySummaryResponse,
            ['summary'],
          );

        setStats(statsObject);
        setTraffic(trafficObject);
        setActivity(activityArray);
        setSecurityLogs(securityArray);
        setSecuritySummary(summaryObject);
        setLastUpdated(new Date());
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
          return;
        }

        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load live dashboard data.',
          );
        }
      } finally {
        if (!silent) {
          setLiveLoading(false);
        }
      }
    },
    [handleAuthError],
  );

  const fetchDirectoryData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setDirectoryLoading(true);
      }

      try {
        const [usersResponse, adminsResponse] =
          await Promise.all([
            apiFetch<unknown>('/api/admin/users'),
            apiFetch<unknown>('/api/admin/admins'),
          ]);

        setUsers(
          unwrapArray<UserRecord>(
            usersResponse,
            ['users', 'learners'],
          ),
        );

        setAdmins(
          unwrapArray<AdminRecord>(
            adminsResponse,
            ['admins'],
          ),
        );
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
          return;
        }

        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load users and administrators.',
          );
        }
      } finally {
        if (!silent) {
          setDirectoryLoading(false);
        }
      }
    },
    [handleAuthError],
  );

  const fetchAll = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      clearMessages();

      try {
        const me = await verifySuperAdmin();

        if (!me) return;

        await Promise.all([
          fetchLiveData(true),
          fetchDirectoryData(true),
        ]);

        setLastUpdated(new Date());
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load the admin dashboard.',
          );
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [
      clearMessages,
      fetchDirectoryData,
      fetchLiveData,
      handleAuthError,
      verifySuperAdmin,
    ],
  );

  useEffect(() => {
    void fetchAll(true);
  }, [fetchAll]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchLiveData(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [fetchLiveData]);

  useEffect(() => {
    if (!error && !success) return;

    const timer = window.setTimeout(() => {
      setError('');
      setSuccess('');
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [error, success]);

  const totalUsers = numberValue(
    stats,
    ['total_users', 'users_count'],
    users.length,
  );

  const normalUsers = numberValue(
    stats,
    ['normal_users', 'normal_count'],
    users.filter((user) => user.role === 'normal').length,
  );

  const witstartUsers = numberValue(
    stats,
    ['witstart_users', 'witstart_count'],
    users.filter((user) => user.role === 'witstart').length,
  );

  const activeUsers = numberValue(
    stats,
    ['active_users', 'active_count'],
    users.filter(
      (user) =>
        user.is_active !== false &&
        user.sub_status !== 'suspended',
    ).length,
  );

  const pendingUsers = numberValue(
    stats,
    ['pending_users', 'pending_count'],
    users.filter(
      (user) => user.sub_status === 'pending',
    ).length,
  );

  const totalAdmins = numberValue(
    stats,
    ['total_admins', 'admins_count'],
    admins.length,
  );

  const activeAdmins = numberValue(
    stats,
    ['active_admins'],
    admins.filter((admin) => admin.is_active !== false)
      .length,
  );

  const inactiveAdmins = numberValue(
    stats,
    ['inactive_admins'],
    admins.filter((admin) => admin.is_active === false)
      .length,
  );

  const recentActivityUsers = useMemo(() => {
    const cutoff =
      Date.now() - 15 * 60 * 1000;

    const emails = new Set<string>();

    for (const item of activity) {
      const timestamp = activityTimestamp(item);

      if (!timestamp) continue;

      const time = new Date(timestamp).getTime();

      if (
        Number.isFinite(time) &&
        time >= cutoff &&
        item.email
      ) {
        emails.add(item.email.toLowerCase());
      }
    }

    return emails.size;
  }, [activity]);

  const trafficDaily = useMemo(() => {
    const fromTraffic =
      traffic?.daily ||
      traffic?.activity ||
      traffic?.series ||
      [];

    const normalised =
      normaliseDailyActivity(fromTraffic);

    if (normalised.length > 0) {
      return normalised.slice(-7);
    }

    const days: DailyActivity[] = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const key = date.toISOString().slice(0, 10);

      const count = activity.filter((item) => {
        const timestamp = activityTimestamp(item);

        if (!timestamp) return false;

        const itemDate = new Date(timestamp);

        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        return (
          itemDate.toISOString().slice(0, 10) === key
        );
      }).length;

      days.push({
        date: key,
        count,
      });
    }

    return days;
  }, [activity, traffic]);

  const totalTrafficEvents = numberValue(
    traffic,
    ['total_events', 'total', 'events'],
    activity.length,
  );

  const loginEvents = numberValue(
    traffic,
    ['login_events', 'logins'],
    activity.filter((item) =>
      String(activityLabel(item))
        .toLowerCase()
        .includes('login'),
    ).length,
  );

  const trafficUniqueUsers = numberValue(
    traffic,
    ['unique_users', 'recent_active_users'],
    recentActivityUsers,
  );

  const filteredUsers = useMemo(() => {
    const search =
      userSearch.trim().toLowerCase();

    return users.filter((user) => {
      if (
        userFilter !== 'all' &&
        user.role !== userFilter
      ) {
        return false;
      }

      if (!search) return true;

      return (
        String(user.name || '')
          .toLowerCase()
          .includes(search) ||
        user.email
          .toLowerCase()
          .includes(search) ||
        String(user.role || '')
          .toLowerCase()
          .includes(search)
      );
    });
  }, [users, userFilter, userSearch]);

  const filteredAdmins = useMemo(() => {
    const search =
      adminSearch.trim().toLowerCase();

    if (!search) return admins;

    return admins.filter((admin) => {
      return (
        String(admin.name || '')
          .toLowerCase()
          .includes(search) ||
        admin.email
          .toLowerCase()
          .includes(search) ||
        String(admin.role || '')
          .toLowerCase()
          .includes(search)
      );
    });
  }, [admins, adminSearch]);

  const recentActivity = useMemo(() => {
    return [...activity]
      .sort((a, b) => {
        const aTime = new Date(
          activityTimestamp(a) || 0,
        ).getTime();

        const bTime = new Date(
          activityTimestamp(b) || 0,
        ).getTime();

        return bTime - aTime;
      })
      .slice(0, 12);
  }, [activity]);

  const recentSecurityLogs = useMemo(() => {
    return [...securityLogs]
      .sort((a, b) => {
        const aTime = new Date(
          securityTimestamp(a) || 0,
        ).getTime();

        const bTime = new Date(
          securityTimestamp(b) || 0,
        ).getTime();

        return bTime - aTime;
      })
      .slice(0, 10);
  }, [securityLogs]);

  const createLearner = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    clearMessages();

    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(learnerForm),
      });

      setSuccess(
        'Learner account created successfully.',
      );

      setLearnerForm(EMPTY_LEARNER_FORM);
      setShowCreateLearner(false);

      await Promise.all([
        fetchDirectoryData(true),
        fetchLiveData(true),
      ]);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create learner account.',
      );
    }
  };

  const createAdmin = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    clearMessages();

    try {
      await apiFetch('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(adminForm),
      });

      setSuccess(
        `${roleLabel(adminForm.role)} account created successfully.`,
      );

      setAdminForm(EMPTY_ADMIN_FORM);
      setShowCreateAdmin(false);

      await Promise.all([
        fetchDirectoryData(true),
        fetchLiveData(true),
      ]);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create administrator account.',
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
            email: grantEmail.trim(),
          }),
        },
      );

      setSuccess(
        `One free month granted to ${grantEmail.trim()}.`,
      );

      setGrantEmail('');
      setShowGrantMonth(false);

      await Promise.all([
        fetchDirectoryData(true),
        fetchLiveData(true),
      ]);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to grant the free month.',
      );
    }
  };

  const deleteLearner = async (
    user: UserRecord,
  ) => {
    const confirmed = window.confirm(
      `Delete the learner account for ${user.email}? This cannot be undone.`,
    );

    if (!confirmed) return;

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
        `Learner account ${user.email} deleted.`,
      );

      await Promise.all([
        fetchDirectoryData(true),
        fetchLiveData(true),
      ]);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete learner.',
      );
    }
  };

  const deleteAdmin = async (
    admin: AdminRecord,
  ) => {
    if (admin.email.toLowerCase() === adminEmail.toLowerCase()) {
      setError(
        'You cannot delete the administrator account currently being used.',
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete administrator ${admin.email}? This cannot be undone.`,
    );

    if (!confirmed) return;

    clearMessages();

    try {
      await apiFetch(
        `/api/admin/admins/${encodeURIComponent(
          String(admin.id),
        )}`,
        {
          method: 'DELETE',
        },
      );

      setSuccess(
        `Administrator ${admin.email} deleted.`,
      );

      await Promise.all([
        fetchDirectoryData(true),
        fetchLiveData(true),
      ]);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete administrator.',
      );
    }
  };

  const openEditAdmin = (
    admin: AdminRecord,
  ) => {
    setSelectedAdmin(admin);

    setAdminEditForm({
      name: admin.name || '',
      role:
        admin.role === 'super_admin' ||
        admin.role === 'staff_admin' ||
        admin.role === 'witstart_admin'
          ? admin.role
          : 'staff_admin',
      notes: admin.notes || '',
      is_active: admin.is_active !== false,
    });

    setShowEditAdmin(true);
  };

  const updateAdmin = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!selectedAdmin) return;

    clearMessages();

    try {
      await apiFetch(
        `/api/admin/admins/${encodeURIComponent(
          String(selectedAdmin.id),
        )}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: adminEditForm.name.trim(),
            role: adminEditForm.role,
            notes: adminEditForm.notes.trim(),
            is_active: adminEditForm.is_active,
          }),
        },
      );

      setSuccess(
        `Administrator ${selectedAdmin.email} updated.`,
      );

      setShowEditAdmin(false);
      setSelectedAdmin(null);

      await Promise.all([
        fetchDirectoryData(true),
        fetchLiveData(true),
      ]);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update administrator.',
      );
    }
  };

  const openEditLearner = (
    user: UserRecord,
  ) => {
    setSelectedLearner(user);

    setLearnerEditForm({
      name: user.name || '',
      role:
        user.role === 'witstart'
          ? 'witstart'
          : 'normal',
      is_paid: Boolean(user.is_paid),
      sub_status: user.sub_status || 'pending',
    });

    setShowEditLearner(true);
  };

  const updateLearner = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!selectedLearner) return;

    clearMessages();

    try {
      await apiFetch(
        `/api/admin/users/${encodeURIComponent(
          selectedLearner.email,
        )}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: learnerEditForm.name.trim(),
            role: learnerEditForm.role,
            is_paid: learnerEditForm.is_paid,
            sub_status: learnerEditForm.sub_status,
          }),
        },
      );

      setSuccess(
        `Learner ${selectedLearner.email} updated.`,
      );

      setShowEditLearner(false);
      setSelectedLearner(null);

      await Promise.all([
        fetchDirectoryData(true),
        fetchLiveData(true),
      ]);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update learner.',
      );
    }
  };

  const logout = () => {
    localStorage.removeItem('phx_token');
    localStorage.removeItem('phx_email');
    localStorage.removeItem('phx_role');
    localStorage.removeItem('phx_plan');

    router.replace('/api/auth/login');
  };

  const navigate = (tab: Tab) => {
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
      id: 'traffic',
      label: 'Traffic',
      icon: '↗',
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: '◷',
    },
    {
      id: 'users',
      label: 'All Learners',
      icon: '◉',
    },
    {
      id: 'normal',
      label: 'Learnora Learners',
      icon: '○',
    },
    {
      id: 'witstart',
      label: 'WitStart Learners',
      icon: '◆',
    },
    {
      id: 'admins',
      label: 'Administrators',
      icon: '♙',
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: '₦',
    },
    {
      id: 'security',
      label: 'Security',
      icon: '◇',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 rounded-2xl border border-amber-400/30 bg-amber-400/10 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-amber-300" />
          </div>

          <h1 className="text-xl font-semibold">
            Learnora Me
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Loading secure administration console...
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-black text-slate-950">
                  L
                </div>

                <div>
                  <div className="text-base font-bold tracking-tight">
                    Learnora Me
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">
                    Admin Console
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 pt-5">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Platform
              </p>

              <nav className="space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      activeTab === item.id
                        ? 'bg-amber-400/10 text-amber-300'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                        activeTab === item.id
                          ? 'bg-amber-400/10'
                          : 'bg-white/[0.03]'
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-auto border-t border-white/5 p-4">
              <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-sm font-bold text-amber-300">
                    {adminName
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {adminName}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      Super Admin
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-400/10"
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
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        {/* MAIN */}
        <main className="min-w-0 flex-1">
          {/* HEADER */}
          <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07111f]/90 backdrop-blur-xl">
            <div className="flex h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setMobileNavOpen(true)
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300 lg:hidden"
                >
                  ☰
                </button>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold sm:text-xl">
                    {activeTab === 'overview'
                      ? 'Platform Overview'
                      : navigation.find(
                            (item) =>
                              item.id === activeTab,
                          )?.label || 'Admin'}
                  </h1>

                  <p className="hidden text-xs text-slate-500 sm:block">
                    Learnora Me administration and platform intelligence
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
                      Backend connected
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void fetchAll(true)
                  }
                  disabled={
                    liveLoading ||
                    directoryLoading
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {liveLoading ||
                  directoryLoading
                    ? 'Refreshing…'
                    : 'Refresh'}
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            {/* MESSAGES */}
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

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <Overview
                totalUsers={totalUsers}
                normalUsers={normalUsers}
                witstartUsers={witstartUsers}
                activeUsers={activeUsers}
                pendingUsers={pendingUsers}
                totalAdmins={totalAdmins}
                activeAdmins={activeAdmins}
                recentActivityUsers={
                  recentActivityUsers
                }
                trafficUniqueUsers={
                  trafficUniqueUsers
                }
                trafficDaily={trafficDaily}
                recentActivity={recentActivity}
                navigate={navigate}
                onCreateLearner={() =>
                  setShowCreateLearner(true)
                }
                onCreateAdmin={() =>
                  setShowCreateAdmin(true)
                }
                onGrantMonth={() =>
                  setShowGrantMonth(true)
                }
              />
            )}

            {/* TRAFFIC */}
            {activeTab === 'traffic' && (
              <TrafficPanel
                traffic={traffic}
                trafficDaily={trafficDaily}
                totalTrafficEvents={
                  totalTrafficEvents
                }
                loginEvents={loginEvents}
                recentActivityUsers={
                  recentActivityUsers
                }
                trafficUniqueUsers={
                  trafficUniqueUsers
                }
                activity={activity}
              />
            )}

            {/* ACTIVITY */}
            {activeTab === 'activity' && (
              <ActivityPanel
                activity={activity}
              />
            )}

            {/* ALL USERS */}
            {activeTab === 'users' && (
              <LearnerDirectory
                title="All Learners"
                description="Manage all learner accounts stored in Learnora Me."
                users={filteredUsers}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                userFilter={userFilter}
                setUserFilter={setUserFilter}
                onCreate={() =>
                  setShowCreateLearner(true)
                }
                onEdit={openEditLearner}
                onDelete={deleteLearner}
              />
            )}

            {/* NORMAL */}
            {activeTab === 'normal' && (
              <LearnerDirectory
                title="Learnora Learners"
                description="Normal Learnora learner accounts."
                users={users.filter(
                  (user) =>
                    user.role === 'normal',
                )}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                userFilter="normal"
                setUserFilter={() =>
                  setUserFilter('normal')
                }
                onCreate={() => {
                  setLearnerForm({
                    ...EMPTY_LEARNER_FORM,
                    role: 'normal',
                  });
                  setShowCreateLearner(true);
                }}
                onEdit={openEditLearner}
                onDelete={deleteLearner}
              />
            )}

            {/* WITSTART */}
            {activeTab === 'witstart' && (
              <LearnerDirectory
                title="WitStart Learners"
                description="Learners belonging to the separate WitStart academy environment."
                users={users.filter(
                  (user) =>
                    user.role === 'witstart',
                )}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                userFilter="witstart"
                setUserFilter={() =>
                  setUserFilter('witstart')
                }
                onCreate={() => {
                  setLearnerForm({
                    ...EMPTY_LEARNER_FORM,
                    role: 'witstart',
                  });
                  setShowCreateLearner(true);
                }}
                onEdit={openEditLearner}
                onDelete={deleteLearner}
              />
            )}

            {/* ADMINS */}
            {activeTab === 'admins' && (
              <AdminDirectory
                admins={filteredAdmins}
                adminSearch={adminSearch}
                setAdminSearch={setAdminSearch}
                currentEmail={adminEmail}
                onCreate={() =>
                  setShowCreateAdmin(true)
                }
                onEdit={openEditAdmin}
                onDelete={deleteAdmin}
              />
            )}

            {/* BILLING */}
            {activeTab === 'billing' && (
              <BillingPanel
                normalUsers={normalUsers}
                paidUsers={numberValue(
                  stats,
                  ['paid_users'],
                  users.filter(
                    (user) => user.is_paid,
                  ).length,
                )}
                freeUsers={numberValue(
                  stats,
                  ['free_users'],
                  users.filter(
                    (user) => !user.is_paid,
                  ).length,
                )}
                onGrantMonth={() =>
                  setShowGrantMonth(true)
                }
              />
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <SecurityPanel
                logs={recentSecurityLogs}
                summary={securitySummary}
              />
            )}
          </div>
        </main>
      </div>

      {/* CREATE LEARNER MODAL */}
      {showCreateLearner && (
        <Modal
          title="Create learner account"
          onClose={() =>
            setShowCreateLearner(false)
          }
        >
          <form
            onSubmit={createLearner}
            className="space-y-4"
          >
            <FormField
              label="Full name"
              value={learnerForm.name}
              onChange={(value) =>
                setLearnerForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="Learner's full name"
              required
            />

            <FormField
              label="Email"
              type="email"
              value={learnerForm.email}
              onChange={(value) =>
                setLearnerForm((current) => ({
                  ...current,
                  email: value,
                }))
              }
              placeholder="learner@example.com"
              required
            />

            <FormField
              label="Temporary password"
              type="password"
              value={learnerForm.password}
              onChange={(value) =>
                setLearnerForm((current) => ({
                  ...current,
                  password: value,
                }))
              }
              placeholder="Create a secure password"
              required
            />

            <SelectField
              label="Learner type"
              value={learnerForm.role}
              onChange={(value) =>
                setLearnerForm((current) => ({
                  ...current,
                  role: value as LearnerRole,
                }))
              }
              options={[
                {
                  value: 'normal',
                  label: 'Learnora Learner',
                },
                {
                  value: 'witstart',
                  label: 'WitStart Learner',
                },
              ]}
            />

            <ModalActions
              onCancel={() =>
                setShowCreateLearner(false)
              }
              submitLabel="Create learner"
            />
          </form>
        </Modal>
      )}

      {/* CREATE ADMIN MODAL */}
      {showCreateAdmin && (
        <Modal
          title="Create administrator"
          onClose={() =>
            setShowCreateAdmin(false)
          }
        >
          <form
            onSubmit={createAdmin}
            className="space-y-4"
          >
            <FormField
              label="Full name"
              value={adminForm.name}
              onChange={(value) =>
                setAdminForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="Administrator's name"
              required
            />

            <FormField
              label="Email"
              type="email"
              value={adminForm.email}
              onChange={(value) =>
                setAdminForm((current) => ({
                  ...current,
                  email: value,
                }))
              }
              placeholder="admin@example.com"
              required
            />

            <FormField
              label="Temporary password"
              type="password"
              value={adminForm.password}
              onChange={(value) =>
                setAdminForm((current) => ({
                  ...current,
                  password: value,
                }))
              }
              placeholder="Create a secure password"
              required
            />

            <SelectField
              label="Administrator type"
              value={adminForm.role}
              onChange={(value) =>
                setAdminForm((current) => ({
                  ...current,
                  role: value as
                    | 'staff_admin'
                    | 'witstart_admin',
                }))
              }
              options={[
                {
                  value: 'staff_admin',
                  label: 'Staff Admin',
                },
                {
                  value: 'witstart_admin',
                  label: 'WitStart Admin',
                },
              ]}
            />

            <TextAreaField
              label="Internal notes"
              value={adminForm.notes}
              onChange={(value) =>
                setAdminForm((current) => ({
                  ...current,
                  notes: value,
                }))
              }
              placeholder="Optional internal notes..."
            />

            <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-3 text-xs leading-5 text-slate-400">
              Super Admin accounts are not created from this form. This keeps the highest-level administrator role under explicit platform control.
            </div>

            <ModalActions
              onCancel={() =>
                setShowCreateAdmin(false)
              }
              submitLabel="Create administrator"
            />
          </form>
        </Modal>
      )}

      {/* EDIT ADMIN MODAL */}
      {showEditAdmin && selectedAdmin && (
        <Modal
          title="Edit administrator"
          onClose={() => {
            setShowEditAdmin(false);
            setSelectedAdmin(null);
          }}
        >
          <form
            onSubmit={updateAdmin}
            className="space-y-4"
          >
            <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
              <p className="text-xs text-slate-500">
                Account
              </p>
              <p className="mt-1 break-all text-sm text-slate-200">
                {selectedAdmin.email}
              </p>
            </div>

            <FormField
              label="Name"
              value={adminEditForm.name}
              onChange={(value) =>
                setAdminEditForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="Administrator name"
            />

            <SelectField
              label="Role"
              value={adminEditForm.role}
              onChange={(value) =>
                setAdminEditForm((current) => ({
                  ...current,
                  role: value as AdminRole,
                }))
              }
              options={[
                {
                  value: 'super_admin',
                  label: 'Super Admin',
                },
                {
                  value: 'staff_admin',
                  label: 'Staff Admin',
                },
                {
                  value: 'witstart_admin',
                  label: 'WitStart Admin',
                },
              ]}
            />

            <TextAreaField
              label="Internal notes"
              value={adminEditForm.notes}
              onChange={(value) =>
                setAdminEditForm((current) => ({
                  ...current,
                  notes: value,
                }))
              }
              placeholder="Internal notes..."
            />

            <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
              <input
                type="checkbox"
                checked={adminEditForm.is_active}
                onChange={(event) =>
                  setAdminEditForm((current) => ({
                    ...current,
                    is_active:
                      event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-400"
              />

              <span>
                <span className="block text-sm font-medium text-slate-200">
                  Account active
                </span>
                <span className="block text-xs text-slate-500">
                  Inactive administrators cannot authenticate.
                </span>
              </span>
            </label>

            <ModalActions
              onCancel={() => {
                setShowEditAdmin(false);
                setSelectedAdmin(null);
              }}
              submitLabel="Save changes"
            />
          </form>
        </Modal>
      )}

      {/* EDIT LEARNER MODAL */}
      {showEditLearner &&
        selectedLearner && (
          <Modal
            title="Edit learner"
            onClose={() => {
              setShowEditLearner(false);
              setSelectedLearner(null);
            }}
          >
            <form
              onSubmit={updateLearner}
              className="space-y-4"
            >
              <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                <p className="text-xs text-slate-500">
                  Account
                </p>
                <p className="mt-1 break-all text-sm text-slate-200">
                  {selectedLearner.email}
                </p>
              </div>

              <FormField
                label="Name"
                value={learnerEditForm.name}
                onChange={(value) =>
                  setLearnerEditForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
                placeholder="Learner name"
              />

              <SelectField
                label="Learner type"
                value={learnerEditForm.role}
                onChange={(value) =>
                  setLearnerEditForm((current) => ({
                    ...current,
                    role: value as LearnerRole,
                  }))
                }
                options={[
                  {
                    value: 'normal',
                    label: 'Learnora Learner',
                  },
                  {
                    value: 'witstart',
                    label: 'WitStart Learner',
                  },
                ]}
              />

              <SelectField
                label="Subscription status"
                value={learnerEditForm.sub_status}
                onChange={(value) =>
                  setLearnerEditForm((current) => ({
                    ...current,
                    sub_status: value,
                  }))
                }
                options={[
                  {
                    value: 'pending',
                    label: 'Pending',
                  },
                  {
                    value: 'active',
                    label: 'Active',
                  },
                  {
                    value: 'trial',
                    label: 'Trial',
                  },
                  {
                    value: 'expired',
                    label: 'Expired',
                  },
                  {
                    value: 'suspended',
                    label: 'Suspended',
                  },
                ]}
              />

              <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
                <input
                  type="checkbox"
                  checked={
                    learnerEditForm.is_paid
                  }
                  onChange={(event) =>
                    setLearnerEditForm(
                      (current) => ({
                        ...current,
                        is_paid:
                          event.target.checked,
                      }),
                    )
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-400"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-200">
                    Paid account
                  </span>
                  <span className="block text-xs text-slate-500">
                    Mark this learner as having paid access.
                  </span>
                </span>
              </label>

              <ModalActions
                onCancel={() => {
                  setShowEditLearner(false);
                  setSelectedLearner(null);
                }}
                submitLabel="Save changes"
              />
            </form>
          </Modal>
        )}

      {/* GRANT MONTH MODAL */}
      {showGrantMonth && (
        <Modal
          title="Grant one free month"
          onClose={() =>
            setShowGrantMonth(false)
          }
        >
          <form
            onSubmit={grantFreeMonth}
            className="space-y-4"
          >
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3 text-xs leading-5 text-slate-400">
              This action is for a normal Learnora learner. It grants one free month through the backend subscription logic.
            </div>

            <FormField
              label="Learner email"
              type="email"
              value={grantEmail}
              onChange={setGrantEmail}
              placeholder="learner@example.com"
              required
            />

            <ModalActions
              onCancel={() =>
                setShowGrantMonth(false)
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
  totalUsers,
  normalUsers,
  witstartUsers,
  activeUsers,
  pendingUsers,
  totalAdmins,
  activeAdmins,
  recentActivityUsers,
  trafficUniqueUsers,
  trafficDaily,
  recentActivity,
  navigate,
  onCreateLearner,
  onCreateAdmin,
  onGrantMonth,
}: {
  totalUsers: number;
  normalUsers: number;
  witstartUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalAdmins: number;
  activeAdmins: number;
  recentActivityUsers: number;
  trafficUniqueUsers: number;
  trafficDaily: DailyActivity[];
  recentActivity: ActivityRecord[];
  navigate: (tab: Tab) => void;
  onCreateLearner: () => void;
  onCreateAdmin: () => void;
  onGrantMonth: () => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300/80">
              Learnora Me
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Platform overview
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              A live operational view of learners, administrators, activity and platform security.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live backend monitoring
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total learners"
            value={totalUsers}
            detail={`${normalUsers} Learnora · ${witstartUsers} WitStart`}
            icon="◉"
          />

          <MetricCard
            label="Active learners"
            value={activeUsers}
            detail={`${pendingUsers} currently pending`}
            icon="✓"
          />

          <MetricCard
            label="Administrators"
            value={totalAdmins}
            detail={`${activeAdmins} active accounts`}
            icon="♙"
          />

          <MetricCard
            label="Recent activity users"
            value={
              recentActivityUsers ||
              trafficUniqueUsers
            }
            detail="Unique users active in the recent activity window"
            icon="↗"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Activity — last 7 days"
          description="Backend activity events grouped by day."
          action={
            <button
              type="button"
              onClick={() => navigate('traffic')}
              className="text-xs text-amber-300 hover:text-amber-200"
            >
              View traffic →
            </button>
          }
        >
          <ActivityChart data={trafficDaily} />
        </Panel>

        <Panel
          title="Quick actions"
          description="Common administrative operations."
        >
          <div className="grid gap-3">
            <QuickAction
              icon="+"
              title="Create learner"
              description="Add a new Learnora or WitStart learner."
              onClick={onCreateLearner}
            />

            <QuickAction
              icon="♙"
              title="Create administrator"
              description="Create staff or WitStart administrative access."
              onClick={onCreateAdmin}
            />

            <QuickAction
              icon="₦"
              title="Grant free month"
              description="Grant one month to a normal Learnora learner."
              onClick={onGrantMonth}
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Platform structure"
          description="Current account separation."
        >
          <div className="space-y-3">
            <StructureRow
              label="Learnora learners"
              value={normalUsers}
              detail="normal"
              color="slate"
            />

            <StructureRow
              label="WitStart learners"
              value={witstartUsers}
              detail="witstart"
              color="purple"
            />

            <StructureRow
              label="Administrators"
              value={totalAdmins}
              detail="super / staff / WitStart"
              color="amber"
            />

            <StructureRow
              label="Recent activity users"
              value={
                recentActivityUsers ||
                trafficUniqueUsers
              }
              detail="activity-based"
              color="emerald"
            />
          </div>
        </Panel>

        <RecentActivityPanel
          activity={recentActivity.slice(0, 7)}
          onViewAll={() => navigate('activity')}
        />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TRAFFIC                                                                     */
/* -------------------------------------------------------------------------- */

function TrafficPanel({
  traffic,
  trafficDaily,
  totalTrafficEvents,
  loginEvents,
  recentActivityUsers,
  trafficUniqueUsers,
  activity,
}: {
  traffic: TrafficRecord | null;
  trafficDaily: DailyActivity[];
  totalTrafficEvents: number;
  loginEvents: number;
  recentActivityUsers: number;
  trafficUniqueUsers: number;
  activity: ActivityRecord[];
}) {
  const recentEvents = activity.filter((item) => {
    const timestamp = activityTimestamp(item);

    if (!timestamp) return false;

    return (
      Date.now() -
        new Date(timestamp).getTime() <=
      15 * 60 * 1000
    );
  }).length;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Traffic"
        title="Traffic & activity"
        description="Backend-derived activity metrics. This view does not claim exact concurrent online sessions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Activity events"
          value={totalTrafficEvents}
          detail="Events returned by the traffic endpoint"
          icon="↗"
        />

        <MetricCard
          label="Login events"
          value={loginEvents}
          detail="Successful/login-related events"
          icon="→"
        />

        <MetricCard
          label="Recent activity users"
          value={recentActivityUsers}
          detail="Unique emails with activity in the last 15 minutes"
          icon="◉"
        />

        <MetricCard
          label="Recent events"
          value={recentEvents}
          detail="Events recorded in the last 15 minutes"
          icon="◷"
        />
      </div>

      <Panel
        title="Daily traffic"
        description="The traffic endpoint is preferred. Activity-derived values are used only as a fallback."
      >
        <ActivityChart data={trafficDaily} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="What this means"
          description="How to interpret the current traffic data."
        >
          <div className="space-y-3 text-sm leading-6 text-slate-400">
            <p>
              <span className="text-slate-200">
                Activity events
              </span>{' '}
              represent records captured by the backend.
            </p>

            <p>
              <span className="text-slate-200">
                Recent activity users
              </span>{' '}
              are inferred from unique email addresses appearing in recent activity records.
            </p>

            <p>
              This is intentionally not presented as an exact “users currently online” figure. Exact concurrent presence requires session or heartbeat tracking.
            </p>
          </div>
        </Panel>

        <Panel
          title="Backend traffic response"
          description="Additional values returned by the traffic service."
        >
          <div className="space-y-3">
            {Object.entries(traffic || {})
              .filter(
                ([key]) =>
                  ![
                    'daily',
                    'activity',
                    'series',
                  ].includes(key),
              )
              .slice(0, 8)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-slate-500">
                    {key.replaceAll('_', ' ')}
                  </span>

                  <span className="text-sm font-medium text-slate-200">
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              ))}

            {!traffic &&
              trafficUniqueUsers === 0 && (
                <EmptyState message="No additional traffic metrics returned yet." />
              )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ACTIVITY                                                                    */
/* -------------------------------------------------------------------------- */

function ActivityPanel({
  activity,
}: {
  activity: ActivityRecord[];
}) {
  const sorted = [...activity].sort((a, b) => {
    return (
      new Date(
        activityTimestamp(b) || 0,
      ).getTime() -
      new Date(
        activityTimestamp(a) || 0,
      ).getTime()
    );
  });

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Activity"
        title="Platform activity"
        description="Recent audit and platform activity returned by the backend."
      />

      <Panel
        title="Activity log"
        description={`${activity.length} activity records loaded`}
      >
        {sorted.length === 0 ? (
          <EmptyState message="No activity records available." />
        ) : (
          <div className="divide-y divide-white/5">
            {sorted.map((item, index) => (
              <ActivityRow
                key={
                  item.id ??
                  `${activityLabel(item)}-${index}`
                }
                item={item}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LEARNER DIRECTORY                                                           */
/* -------------------------------------------------------------------------- */

function LearnerDirectory({
  title,
  description,
  users,
  userSearch,
  setUserSearch,
  userFilter,
  setUserFilter,
  onCreate,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  users: UserRecord[];
  userSearch: string;
  setUserSearch: (value: string) => void;
  userFilter: 'all' | 'normal' | 'witstart';
  setUserFilter: (
    value: 'all' | 'normal' | 'witstart',
  ) => void;
  onCreate: () => void;
  onEdit: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Learners"
        title={title}
        description={description}
        action={
          <button
            type="button"
            onClick={onCreate}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            + Create learner
          </button>
        }
      />

      <Panel
        title={`${users.length} learner${
          users.length === 1 ? '' : 's'
        }`}
        description="Search, inspect, edit or remove learner accounts."
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <input
            value={userSearch}
            onChange={(event) =>
              setUserSearch(event.target.value)
            }
            placeholder="Search by name, email or role..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/30"
          />

          <select
            value={userFilter}
            onChange={(event) =>
              setUserFilter(
                event.target.value as
                  | 'all'
                  | 'normal'
                  | 'witstart',
              )
            }
            className="rounded-xl border border-white/10 bg-[#0b1827] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400/30"
          >
            <option value="all">All types</option>
            <option value="normal">
              Learnora
            </option>
            <option value="witstart">
              WitStart
            </option>
          </select>
        </div>

        {users.length === 0 ? (
          <EmptyState message="No learner accounts match this view." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3">
                    Learner
                  </th>
                  <th className="px-3 py-3">
                    Type
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
                {users.map((user) => (
                  <tr
                    key={
                      user.id ??
                      user.email
                    }
                    className="text-sm"
                  >
                    <td className="px-3 py-4">
                      <div>
                        <p className="font-medium text-slate-200">
                          {displayName(
                            user.name,
                            user.email,
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${roleBadgeClass(
                          user.role,
                        )}`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${statusBadgeClass(
                          user.sub_status,
                        )}`}
                      >
                        {user.sub_status ||
                          'Unknown'}
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
                            onEdit(user)
                          }
                          className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.05]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(user)
                          }
                          className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-400/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ADMIN DIRECTORY                                                             */
/* -------------------------------------------------------------------------- */

function AdminDirectory({
  admins,
  adminSearch,
  setAdminSearch,
  currentEmail,
  onCreate,
  onEdit,
  onDelete,
}: {
  admins: AdminRecord[];
  adminSearch: string;
  setAdminSearch: (value: string) => void;
  currentEmail: string;
  onCreate: () => void;
  onEdit: (admin: AdminRecord) => void;
  onDelete: (admin: AdminRecord) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Access control"
        title="Administrators"
        description="Manage Learnora Me administrator accounts and their access levels."
        action={
          <button
            type="button"
            onClick={onCreate}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            + Create administrator
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total admins"
          value={admins.length}
          detail="All administrator records"
          icon="♙"
        />

        <MetricCard
          label="Active"
          value={
            admins.filter(
              (admin) =>
                admin.is_active !== false,
            ).length
          }
          detail="Currently enabled"
          icon="✓"
        />

        <MetricCard
          label="WitStart admins"
          value={
            admins.filter(
              (admin) =>
                admin.role ===
                'witstart_admin',
            ).length
          }
          detail="Separate academy administration"
          icon="◆"
        />
      </div>

      <Panel
        title="Administrator directory"
        description="Super Admin has full platform control. Staff and WitStart administrators are kept as separate roles."
      >
        <div className="mb-5">
          <input
            value={adminSearch}
            onChange={(event) =>
              setAdminSearch(event.target.value)
            }
            placeholder="Search administrators..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/30"
          />
        </div>

        {admins.length === 0 ? (
          <EmptyState message="No administrator accounts found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3">
                    Administrator
                  </th>
                  <th className="px-3 py-3">
                    Role
                  </th>
                  <th className="px-3 py-3">
                    Status
                  </th>
                  <th className="px-3 py-3">
                    Last login
                  </th>
                  <th className="px-3 py-3">
                    Created
                  </th>
                  <th className="px-3 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {admins.map((admin) => {
                  const isSelf =
                    admin.email.toLowerCase() ===
                    currentEmail.toLowerCase();

                  return (
                    <tr
                      key={admin.id}
                      className="text-sm"
                    >
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-200">
                          {displayName(
                            admin.name,
                            admin.email,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {admin.email}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${roleBadgeClass(
                            admin.role,
                          )}`}
                        >
                          {roleLabel(
                            admin.role,
                          )}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${
                            admin.is_active ===
                            false
                              ? 'border-red-400/20 bg-red-400/10 text-red-300'
                              : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                          }`}
                        >
                          {admin.is_active ===
                          false
                            ? 'Inactive'
                            : 'Active'}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-500">
                        {relativeTime(
                          admin.last_login_at,
                        )}
                      </td>

                      <td className="px-3 py-4 text-slate-500">
                        {formatDate(
                          admin.created_at,
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(admin)
                            }
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.05]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            title={
                              isSelf
                                ? 'You cannot delete your current account.'
                                : undefined
                            }
                            onClick={() =>
                              onDelete(admin)
                            }
                            className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* BILLING                                                                     */
/* -------------------------------------------------------------------------- */

function BillingPanel({
  normalUsers,
  paidUsers,
  freeUsers,
  onGrantMonth,
}: {
  normalUsers: number;
  paidUsers: number;
  freeUsers: number;
  onGrantMonth: () => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Billing"
        title="Subscription operations"
        description="Subscription and access information currently available from the backend."
        action={
          <button
            type="button"
            onClick={onGrantMonth}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Grant free month
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Learnora learners"
          value={normalUsers}
          detail="Normal learner accounts"
          icon="◉"
        />

        <MetricCard
          label="Paid learners"
          value={paidUsers}
          detail="Marked as paid in the database"
          icon="₦"
        />

        <MetricCard
          label="Free learners"
          value={freeUsers}
          detail="Not currently marked as paid"
          icon="○"
        />
      </div>

      <Panel
        title="Billing data policy"
        description="Only values actually returned by the backend are shown."
      >
        <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
          <p className="text-sm font-medium text-amber-200">
            No fabricated revenue figures
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Revenue, MRR, payment volume and transaction totals are not calculated here unless the backend provides authoritative billing data for them.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SECURITY                                                                    */
/* -------------------------------------------------------------------------- */

function SecurityPanel({
  logs,
  summary,
}: {
  logs: SecurityLog[];
  summary: SecuritySummary | null;
}) {
  const total = numberValue(
    summary,
    ['total', 'total_events', 'count'],
    logs.length,
  );

  const high = numberValue(
    summary,
    ['high', 'high_risk'],
    logs.filter((log) =>
      securityLabel(log)
        .toLowerCase()
        .includes('high'),
    ).length,
  );

  const critical = numberValue(
    summary,
    ['critical', 'critical_events'],
    logs.filter((log) =>
      securityLabel(log)
        .toLowerCase()
        .includes('critical'),
    ).length,
  );

  const recent = numberValue(
    summary,
    ['recent', 'recent_events'],
    logs.filter((log) => {
      const timestamp = securityTimestamp(log);

      if (!timestamp) return false;

      return (
        Date.now() -
          new Date(timestamp).getTime() <=
        24 * 60 * 60 * 1000
      );
    }).length,
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Security"
        title="Security monitoring"
        description="Security events and summaries returned by the backend."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total events"
          value={total}
          detail="Security log records"
          icon="◇"
        />

        <MetricCard
          label="Critical"
          value={critical}
          detail="Critical events reported"
          icon="!"
        />

        <MetricCard
          label="High"
          value={high}
          detail="High-severity events reported"
          icon="△"
        />

        <MetricCard
          label="Last 24 hours"
          value={recent}
          detail="Recent security events"
          icon="◷"
        />
      </div>

      <Panel
        title="Recent security events"
        description="Newest records returned from the security log endpoint."
      >
        {logs.length === 0 ? (
          <EmptyState message="No security events available." />
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log, index) => (
              <div
                key={
                  log.id ??
                  `${securityLabel(log)}-${index}`
                }
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.05] text-red-300">
                    !
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {securityLabel(log)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {log.email || 'Unknown account'}
                      {log.ip
                        ? ` · ${log.ip}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xs text-slate-500">
                    {relativeTime(
                      securityTimestamp(log),
                    )}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-600">
                    {formatDateTime(
                      securityTimestamp(log),
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SHARED UI                                                                   */
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
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300/80">
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

      <div className="p-5">{children}</div>
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

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/10 bg-amber-400/[0.05] text-amber-300">
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
      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-amber-400/10 hover:bg-white/[0.04]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200 group-hover:text-amber-200">
          {title}
        </span>

        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <span className="ml-auto text-slate-600 group-hover:text-amber-300">
        →
      </span>
    </button>
  );
}

function StructureRow({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number;
  detail: string;
  color: 'slate' | 'purple' | 'amber' | 'emerald';
}) {
  const classes = {
    slate:
      'bg-slate-400',
    purple:
      'bg-purple-400',
    amber:
      'bg-amber-400',
    emerald:
      'bg-emerald-400',
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2 w-2 rounded-full ${classes[color]}`}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300">
          {label}
        </p>

        <p className="text-xs text-slate-600">
          {detail}
        </p>
      </div>

      <p className="text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function ActivityChart({
  data,
}: {
  data: DailyActivity[];
}) {
  const max =
    Math.max(
      ...data.map((item) => item.count),
      1,
    );

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center">
        <EmptyState message="No daily activity data available." />
      </div>
    );
  }

  return (
    <div className="flex h-56 items-end gap-2 sm:gap-4">
      {data.map((item, index) => {
        const height = Math.max(
          8,
          (item.count / max) * 100,
        );

        const parsedDate = new Date(item.date);

        const label =
          item.label ||
          (!Number.isNaN(parsedDate.getTime())
            ? new Intl.DateTimeFormat('en-GB', {
                weekday: 'short',
              }).format(parsedDate)
            : item.date.slice(0, 6));

        return (
          <div
            key={`${item.date}-${index}`}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-[10px] text-slate-600">
              {item.count}
            </span>

            <div className="flex h-40 w-full items-end justify-center">
              <div
                className="w-full max-w-10 rounded-t-lg bg-amber-400/70 transition-all"
                style={{
                  height: `${height}%`,
                }}
                title={`${item.date}: ${item.count}`}
              />
            </div>

            <span className="truncate text-[10px] text-slate-600">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RecentActivityPanel({
  activity,
  onViewAll,
}: {
  activity: ActivityRecord[];
  onViewAll: () => void;
}) {
  return (
    <Panel
      title="Recent activity"
      description="Latest backend activity records."
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-amber-300 hover:text-amber-200"
        >
          View all →
        </button>
      }
    >
      {activity.length === 0 ? (
        <EmptyState message="No recent activity." />
      ) : (
        <div className="space-y-1">
          {activity.map((item, index) => (
            <ActivityRow
              key={
                item.id ??
                `${activityLabel(item)}-${index}`
              }
              item={item}
              compact
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

function ActivityRow({
  item,
  compact = false,
}: {
  item: ActivityRecord;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 ${
        compact ? 'py-2.5' : 'py-4'
      }`}
    >
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
            ? ` · ${roleLabel(item.role)}`
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
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
          >
            ×
          </button>
        </div>

        <div className="p-5">{children}</div>
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
        onClick={onCancel}
        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04]"
      >
        Cancel
      </button>

      <button
        type="submit"
        className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300"
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
  onChange: (value: string) => void;
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
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/30"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/30"
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
  onChange: (value: string) => void;
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
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-white/10 bg-[#0b1827] px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/30"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}