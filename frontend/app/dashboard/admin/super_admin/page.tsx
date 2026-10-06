'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'https://learnora-backend.vercel.app';
export const dynamic = 'force-dynamic';

type Tab =
  | 'overview'
  | 'analytics'
  | 'activity'
  | 'courses'
  | 'content'
  | 'media'
  | 'users'
  | 'normal'
  | 'witstart'
  | 'admins'
  | 'billing'
  | 'security'
  | 'settings';

type AdminRole = 'super_admin' | 'staff_admin' | 'witstart_admin';
type LearnerRole = 'normal' | 'witstart';
type CourseStatus = 'published' | 'draft' | 'archived';

type Course = {
  id?: number | string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  track?: string | null;
  level?: string | null;
  status?: CourseStatus | string | null;
  is_published?: boolean | null;
  published?: boolean | null;
  instructor?: string | null;
  instructor_name?: string | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  lessons_count?: number | null;
  lesson_count?: number | null;
  videos_count?: number | null;
  video_count?: number | null;
  enrolments_count?: number | null;
  enrollments_count?: number | null;
  completion_rate?: number | null;
  duration_minutes?: number | null;
};

type Lesson = {
  id?: number | string;
  course_id?: number | string | null;
  title?: string | null;
  description?: string | null;
  order?: number | null;
  position?: number | null;
  duration_minutes?: number | null;
  video_url?: string | null;
  video?: string | null;
  video_id?: string | null;
  thumbnail_url?: string | null;
  notes?: string | null;
  resource_url?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Media = {
  id?: number | string;
  name?: string | null;
  title?: string | null;
  type?: string | null;
  mime_type?: string | null;
  url?: string | null;
  file_url?: string | null;
  size_bytes?: number | null;
  duration_seconds?: number | null;
  course_id?: number | string | null;
  lesson_id?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type UserRecord = {
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
};

type AdminRecord = {
  id?: number | string;
  name?: string | null;
  email: string;
  role?: AdminRole | string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
};

type ActivityRecord = Record<string, unknown> & {
  action?: string | null;
  event?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  ip?: string | null;
  timestamp?: string | null;
  created_at?: string | null;
  metadata?: unknown;
};

type SecurityLog = ActivityRecord;
type Stats = Record<string, unknown>;
type Traffic = Record<string, unknown>;
type SecuritySummary = Record<string, unknown>;

type CourseForm = {
  title: string;
  description: string;
  category: string;
  track: string;
  level: string;
  instructor: string;
  status: string;
};

type LessonForm = {
  title: string;
  description: string;
  order: string;
  duration_minutes: string;
  video_url: string;
  notes: string;
  resource_url: string;
  is_published: boolean;
};

type VideoForm = {
  video_url: string;
  title: string;
  duration_minutes: string;
};

const EMPTY_COURSE: CourseForm = {
  title: '', description: '', category: '', track: '', level: 'Beginner', instructor: '', status: 'draft',
};
const EMPTY_LESSON: LessonForm = {
  title: '', description: '', order: '1', duration_minutes: '', video_url: '', notes: '', resource_url: '', is_published: false,
};
const EMPTY_VIDEO: VideoForm = { video_url: '', title: '', duration_minutes: '' };
const EMPTY_LEARNER = { name: '', email: '', password: '', role: 'normal' };
const EMPTY_ADMIN = { name: '', email: '', password: '', role: 'staff_admin' };

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('phx_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
    cache: 'no-store',
  });
  let payload: unknown = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (response.status === 401 || response.status === 403) throw new Error('__AUTH_ERROR__');
  if (!response.ok) {
    const body = payload as Record<string, unknown> | null;
    const detail = body && typeof body.detail !== 'undefined' ? body.detail : body && body.error;
    throw new Error(detail ? String(detail) : `Request failed with status ${response.status}`);
  }
  return payload as T;
}

async function optionalFetch<T = unknown>(path: string): Promise<T | null> {
  try { return await apiFetch<T>(path); } catch (error) {
    if (error instanceof Error && error.message === '__AUTH_ERROR__') throw error;
    return null;
  }
}

function unwrapArray<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];
  const object = payload as Record<string, unknown>;
  for (const key of keys) if (Array.isArray(object[key])) return object[key] as T[];
  for (const value of Object.values(object)) if (Array.isArray(value)) return value as T[];
  return [];
}

function unwrapObject<T>(payload: unknown, keys: string[] = []): T | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const object = payload as Record<string, unknown>;
  for (const key of keys) {
    if (object[key] && typeof object[key] === 'object' && !Array.isArray(object[key])) return object[key] as T;
  }
  return payload as T;
}

function valueOf(object: unknown, keys: string[], fallback = 0): number {
  if (!object || typeof object !== 'object') return fallback;
  const record = object as Record<string, unknown>;
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function textOf(object: unknown, keys: string[], fallback = ''): string {
  if (!object || typeof object !== 'object') return fallback;
  const record = object as Record<string, unknown>;
  for (const key of keys) if (record[key] !== null && typeof record[key] !== 'undefined') return String(record[key]);
  return fallback;
}

function boolOf(object: unknown, keys: string[], fallback = false): boolean {
  if (!object || typeof object !== 'object') return fallback;
  const record = object as Record<string, unknown>;
  for (const key of keys) if (typeof record[key] === 'boolean') return record[key] as boolean;
  return fallback;
}

function courseName(course: Course) { return course.title || course.name || 'Untitled course'; }
function lessonVideo(lesson: Lesson) { return lesson.video_url || lesson.video || ''; }
function lessonPosition(lesson: Lesson) { return Number(lesson.order ?? lesson.position ?? 0); }
function timestamp(item: ActivityRecord | SecurityLog) { return item.timestamp || item.created_at || ''; }
function fmtDate(value?: string | null) { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleString(); }
function fmtBytes(value?: number | null) { if (!value) return '—'; const units = ['B', 'KB', 'MB', 'GB']; let n = value; let i = 0; while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; } return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`; }
function roleLabel(role?: string | null) { return String(role || '').replaceAll('_', ' ').replace(/\b\w/g, x => x.toUpperCase()) || 'Unknown'; }
function statusLabel(status?: string | null) { return String(status || 'draft').replaceAll('_', ' ').replace(/\b\w/g, x => x.toUpperCase()); }

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [adminName, setAdminName] = useState('Super Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [adminSearch, setAdminSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'normal' | 'witstart'>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<UserRecord | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminRecord | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [showCourse, setShowCourse] = useState(false);
  const [showLesson, setShowLesson] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showCreateLearner, setShowCreateLearner] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showEditLearner, setShowEditLearner] = useState(false);
  const [showEditAdmin, setShowEditAdmin] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseForm>(EMPTY_COURSE);
  const [lessonForm, setLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [videoForm, setVideoForm] = useState<VideoForm>(EMPTY_VIDEO);
  const [learnerForm, setLearnerForm] = useState(EMPTY_LEARNER);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN);

  const clearMessages = useCallback(() => { setError(''); setSuccess(''); }, []);
  const handleAuthError = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem('phx_token');
    router.push('/login');
  }, [router]);

  const fetchLiveData = useCallback(async (silent = false) => {
    if (!silent) setLiveLoading(true);
    try {
      const [s, t, a, sec, summary] = await Promise.all([
        apiFetch<unknown>('/api/admin/stats'),
        apiFetch<unknown>('/api/admin/traffic'),
        apiFetch<unknown>('/api/admin/activity'),
        apiFetch<unknown>('/api/admin/security-logs'),
        apiFetch<unknown>('/api/admin/security-summary'),
      ]);
      setStats(unwrapObject<Stats>(s, ['stats']));
      setTraffic(unwrapObject<Traffic>(t, ['traffic']));
      setActivity(unwrapArray<ActivityRecord>(a, ['activity', 'logs', 'events']));
      setSecurityLogs(unwrapArray<SecurityLog>(sec, ['logs', 'security_logs', 'events']));
      setSecuritySummary(unwrapObject<SecuritySummary>(summary, ['summary']));
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError();
      if (!silent) setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
    } finally { if (!silent) setLiveLoading(false); }
  }, [handleAuthError]);

  const fetchDirectoryData = useCallback(async (silent = false) => {
    try {
      const [u, a] = await Promise.all([apiFetch<unknown>('/api/admin/users'), apiFetch<unknown>('/api/admin/admins')]);
      setUsers(unwrapArray<UserRecord>(u, ['users', 'learners']));
      setAdmins(unwrapArray<AdminRecord>(a, ['admins']));
    } catch (err) {
      if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError();
      if (!silent) setError(err instanceof Error ? err.message : 'Unable to load users and administrators.');
    }
  }, [handleAuthError]);

  const fetchMedia = useCallback(async () => {
    try {
      const response = await optionalFetch<unknown>('/api/admin/media');
      setMedia(unwrapArray<Media>(response, ['media', 'items', 'data']));
    } catch (err) {
      if (err instanceof Error && err.message === '__AUTH_ERROR__') handleAuthError();
    }
  }, [handleAuthError]);

  const fetchCourses = useCallback(async (silent = false) => {
    if (!silent) setCourseLoading(true);
    try {
      const response = await optionalFetch<unknown>('/api/admin/courses');
      setCourses(unwrapArray<Course>(response, ['courses', 'items', 'data']));
    } catch (err) {
      if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError();
    } finally { if (!silent) setCourseLoading(false); }
  }, [handleAuthError]);

  const fetchAll = useCallback(async () => {
    setLoading(true); clearMessages();
    try {
      await Promise.all([fetchLiveData(true), fetchDirectoryData(true), fetchCourses(true), fetchMedia()]);
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('phx_admin_user');
        if (raw) { try { const me = JSON.parse(raw); setAdminName(me.name || 'Super Admin'); setAdminEmail(me.email || ''); } catch {} }
      }
    } finally { setLoading(false); }
  }, [clearMessages, fetchCourses, fetchDirectoryData, fetchLiveData, fetchMedia]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);
  useEffect(() => { const id = window.setInterval(() => void fetchLiveData(true), 60000); return () => window.clearInterval(id); }, [fetchLiveData]);

  const openCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course); setLessons([]); setMedia([]); setCourseDetailLoading(true);
    try {
      const id = encodeURIComponent(String(course.id));
      const [l, m] = await Promise.all([
        optionalFetch<unknown>(`/api/admin/courses/${id}/lessons`),
        optionalFetch<unknown>(`/api/admin/courses/${id}/media`),
      ]);
      setLessons(unwrapArray<Lesson>(l, ['lessons', 'items', 'data']).sort((a, b) => lessonPosition(a) - lessonPosition(b)));
      setMedia(unwrapArray<Media>(m, ['media', 'items', 'data']));
    } catch (err) {
      if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError();
    } finally { setCourseDetailLoading(false); }
  }, [handleAuthError]);

  const saveCourse = async (event: FormEvent) => {
    event.preventDefault(); clearMessages();
    try {
      const isEdit = Boolean(selectedCourse?.id);
      const path = isEdit ? `/api/admin/courses/${encodeURIComponent(String(selectedCourse!.id))}` : '/api/admin/courses';
      await apiFetch(path, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(courseForm) });
      setSuccess(isEdit ? 'Course updated successfully.' : 'Course created successfully.');
      setShowCourse(false); setSelectedCourse(null); setCourseForm(EMPTY_COURSE); await fetchCourses(true); await fetchLiveData(true);
    } catch (err) {
      if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError();
      setError(err instanceof Error ? err.message : 'Unable to save course.');
    }
  };

  const deleteCourse = async (course: Course) => {
    if (!course.id || !window.confirm(`Delete “${courseName(course)}”? This should only be used for truly unwanted content.`)) return;
    clearMessages();
    try { await apiFetch(`/api/admin/courses/${encodeURIComponent(String(course.id))}`, { method: 'DELETE' }); setSuccess('Course deleted.'); setSelectedCourse(null); await fetchCourses(true); }
    catch (err) { if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError(); setError(err instanceof Error ? err.message : 'Unable to delete course.'); }
  };

  const saveLesson = async (event: FormEvent) => {
    event.preventDefault(); if (!selectedCourse?.id) return; clearMessages();
    try {
      const path = lessonForm && (lessonForm as unknown as { id?: string }).id ? `/api/admin/lessons/${(lessonForm as unknown as { id: string }).id}` : `/api/admin/courses/${selectedCourse.id}/lessons`;
      const body = { ...lessonForm, order: Number(lessonForm.order), duration_minutes: lessonForm.duration_minutes ? Number(lessonForm.duration_minutes) : null };
      await apiFetch(path, { method: path.includes('/lessons/') && !path.endsWith('/lessons') ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      setSuccess('Lesson saved.'); setShowLesson(false); setLessonForm(EMPTY_LESSON); await openCourse(selectedCourse); await fetchCourses(true);
    } catch (err) { if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError(); setError(err instanceof Error ? err.message : 'Unable to save lesson.'); }
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!lesson.id || !window.confirm(`Delete “${lesson.title || 'this lesson'}”?`)) return;
    clearMessages();
    try { await apiFetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' }); setSuccess('Lesson deleted.'); if (selectedCourse) await openCourse(selectedCourse); await fetchCourses(true); }
    catch (err) { if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError(); setError(err instanceof Error ? err.message : 'Unable to delete lesson.'); }
  };

  const saveVideo = async (event: FormEvent) => {
    event.preventDefault(); clearMessages();
    try {
      const lesson = lessons.find(x => String(x.id) === String((videoForm as VideoForm & { lessonId?: string }).lessonId));
      const lessonId = (videoForm as VideoForm & { lessonId?: string }).lessonId || lesson?.id;
      if (!lessonId) throw new Error('Select a lesson first.');
      await apiFetch(`/api/admin/lessons/${lessonId}/video`, { method: 'POST', body: JSON.stringify({ video_url: videoForm.video_url, title: videoForm.title, duration_minutes: videoForm.duration_minutes ? Number(videoForm.duration_minutes) : null }) });
      setSuccess('Video attached to lesson.'); setShowVideo(false); setVideoForm(EMPTY_VIDEO); if (selectedCourse) await openCourse(selectedCourse); await fetchCourses(true);
    } catch (err) { if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError(); setError(err instanceof Error ? err.message : 'Unable to attach video.'); }
  };

  const createLearner = async (event: FormEvent) => {
    event.preventDefault(); clearMessages();
    try { await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(learnerForm) }); setSuccess('Learner created successfully.'); setShowCreateLearner(false); setLearnerForm(EMPTY_LEARNER); await fetchDirectoryData(true); await fetchLiveData(true); }
    catch (err) { if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError(); setError(err instanceof Error ? err.message : 'Unable to create learner.'); }
  };

  const createAdmin = async (event: FormEvent) => {
    event.preventDefault(); clearMessages();
    try { await apiFetch('/api/admin/admins', { method: 'POST', body: JSON.stringify(adminForm) }); setSuccess(`${roleLabel(adminForm.role)} created successfully.`); setShowCreateAdmin(false); setAdminForm(EMPTY_ADMIN); await fetchDirectoryData(true); await fetchLiveData(true); }
    catch (err) { if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError(); setError(err instanceof Error ? err.message : 'Unable to create administrator.'); }
  };

  const deleteAdmin = async (admin: AdminRecord) => {
    if (!admin.id || !window.confirm(`Delete administrator ${admin.email}?`)) return;
    clearMessages();
    try { await apiFetch(`/api/admin/admins/${admin.id}`, { method: 'DELETE' }); setSuccess('Administrator deleted.'); await fetchDirectoryData(true); }
    catch (err) { if (err instanceof Error && err.message === '__AUTH_ERROR__') return handleAuthError(); setError(err instanceof Error ? err.message : 'Unable to delete administrator.'); }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter(u => (userFilter === 'all' || u.role === userFilter) && (!q || `${u.name || ''} ${u.email} ${u.role || ''}`.toLowerCase().includes(q)));
  }, [users, userFilter, userSearch]);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return courses.filter(course => {
      const lessonsCount = course.lessons_count ?? course.lesson_count ?? 0;
      const videosCount = course.videos_count ?? course.video_count ?? 0;
      const status = String(course.status || (course.is_published || course.published ? 'published' : 'draft')).toLowerCase();
      const health = lessonsCount === 0 ? 'empty' : videosCount < lessonsCount ? 'missing-video' : 'healthy';
      const filterOk = courseFilter === 'all' || status === courseFilter || health === courseFilter;
      return filterOk && (!q || `${courseName(course)} ${course.category || ''} ${course.track || ''} ${course.instructor || course.instructor_name || ''}`.toLowerCase().includes(q));
    });
  }, [courses, courseFilter, courseSearch]);

  const recentActivity = useMemo(() => [...activity].sort((a, b) => new Date(timestamp(b) || 0).getTime() - new Date(timestamp(a) || 0).getTime()).slice(0, 12), [activity]);
  const recentSecurity = useMemo(() => [...securityLogs].sort((a, b) => new Date(timestamp(b) || 0).getTime() - new Date(timestamp(a) || 0).getTime()).slice(0, 10), [securityLogs]);

  const totalCourses = courses.length;
  const emptyCourses = courses.filter(c => (c.lessons_count ?? c.lesson_count ?? 0) === 0).length;
  const incompleteCourses = courses.filter(c => {
    const l = c.lessons_count ?? c.lesson_count ?? 0; const v = c.videos_count ?? c.video_count ?? 0; return l > 0 && v < l;
  }).length;
  const publishedCourses = courses.filter(c => c.status === 'published' || c.is_published || c.published).length;
  const totalLessons = courses.reduce((n, c) => n + Number(c.lessons_count ?? c.lesson_count ?? 0), 0);
  const totalVideos = courses.reduce((n, c) => n + Number(c.videos_count ?? c.video_count ?? 0), 0);

  const navigate = (tab: Tab) => { setActiveTab(tab); setMobileNavOpen(false); };

  return (
    <div className="min-h-screen bg-[#06111d] text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar activeTab={activeTab} navigate={navigate} open={mobileNavOpen} close={() => setMobileNavOpen(false)} />
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#06111d]/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileNavOpen(true)} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 lg:hidden" aria-label="Open menu">☰</button>
                <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">Super Admin</p><h1 className="text-lg font-semibold">Learnora Me Control Centre</h1></div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => void fetchAll()} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06]">{liveLoading ? 'Refreshing…' : 'Refresh'}</button>
                <div className="hidden text-right sm:block"><p className="text-xs font-semibold">{adminName}</p><p className="text-[11px] text-slate-500">{adminEmail || 'Super Administrator'}</p></div>
                <div className="grid h-9 w-9 place-items-center rounded-full border border-amber-400/20 bg-amber-400/10 text-sm font-bold text-amber-300">SA</div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
            {error && <Notice type="error" message={error} onClose={() => setError('')} />}
            {success && <Notice type="success" message={success} onClose={() => setSuccess('')} />}
            {loading ? <Loading /> : (
              <>
                {activeTab === 'overview' && <Overview stats={stats} users={users} courses={courses} totalCourses={totalCourses} emptyCourses={emptyCourses} incompleteCourses={incompleteCourses} publishedCourses={publishedCourses} totalLessons={totalLessons} totalVideos={totalVideos} activity={recentActivity} security={recentSecurity} onNavigate={navigate} />}
                {activeTab === 'analytics' && <Analytics stats={stats} traffic={traffic} users={users} courses={courses} />}
                {activeTab === 'activity' && <ActivityPanel activity={activity} security={securityLogs} />}
                {activeTab === 'courses' && <CoursesPanel courses={filteredCourses} allCourses={courses} search={courseSearch} setSearch={setCourseSearch} filter={courseFilter} setFilter={setCourseFilter} loading={courseLoading} onCreate={() => { setSelectedCourse(null); setCourseForm(EMPTY_COURSE); setShowCourse(true); }} onOpen={openCourse} onEdit={(c) => { setSelectedCourse(c); setCourseForm({ title: courseName(c), description: c.description || '', category: c.category || '', track: c.track || '', level: c.level || 'Beginner', instructor: c.instructor || c.instructor_name || '', status: String(c.status || 'draft') }); setShowCourse(true); }} onDelete={deleteCourse} />}
                {activeTab === 'content' && <ContentAudit courses={courses} onCourses={() => navigate('courses')} onOpen={openCourse} />}
                {activeTab === 'media' && <MediaPanel media={media} courses={courses} />}
                {activeTab === 'users' && <UsersPanel users={filteredUsers} search={userSearch} setSearch={setUserSearch} filter={userFilter} setFilter={setUserFilter} onCreate={() => { setLearnerForm(EMPTY_LEARNER); setShowCreateLearner(true); }} onEdit={(u) => { setSelectedLearner(u); setShowEditLearner(true); }} />}
                {activeTab === 'normal' && <UsersPanel users={users.filter(u => u.role === 'normal')} search={userSearch} setSearch={setUserSearch} filter="normal" setFilter={setUserFilter} onCreate={() => { setLearnerForm({ ...EMPTY_LEARNER, role: 'normal' }); setShowCreateLearner(true); }} onEdit={(u) => { setSelectedLearner(u); setShowEditLearner(true); }} />}
                {activeTab === 'witstart' && <UsersPanel users={users.filter(u => u.role === 'witstart')} search={userSearch} setSearch={setUserSearch} filter="witstart" setFilter={setUserFilter} onCreate={() => { setLearnerForm({ ...EMPTY_LEARNER, role: 'witstart' }); setShowCreateLearner(true); }} onEdit={(u) => { setSelectedLearner(u); setShowEditLearner(true); }} />}
                {activeTab === 'admins' && <AdminsPanel admins={admins} search={adminSearch} setSearch={setAdminSearch} currentEmail={adminEmail} onCreate={() => setShowCreateAdmin(true)} onEdit={(a) => { setSelectedAdmin(a); setAdminForm({ name: a.name || '', email: a.email, password: '', role: String(a.role || 'staff_admin') }); setShowEditAdmin(true); }} onDelete={deleteAdmin} />}
                {activeTab === 'billing' && <BillingPanel users={users} stats={stats} />}
                {activeTab === 'security' && <SecurityPanel summary={securitySummary} logs={securityLogs} activity={activity} />}
                {activeTab === 'settings' && <SettingsPanel />}
              </>
            )}
            <footer className="border-t border-white/[0.06] pt-4 text-[11px] text-slate-600">{lastUpdated ? `Last refreshed ${lastUpdated.toLocaleTimeString()}` : 'Live platform administration'} · Learnora Me</footer>
          </div>
        </main>
      </div>

      {showCourse && <Modal title={selectedCourse ? 'Edit course' : 'Create course'} onClose={() => setShowCourse(false)}><form onSubmit={saveCourse} className="space-y-4"><Field label="Course title" value={courseForm.title} onChange={v => setCourseForm(x => ({ ...x, title: v }))} required /><Textarea label="Description" value={courseForm.description} onChange={v => setCourseForm(x => ({ ...x, description: v }))} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Category" value={courseForm.category} onChange={v => setCourseForm(x => ({ ...x, category: v }))} /><Field label="Track" value={courseForm.track} onChange={v => setCourseForm(x => ({ ...x, track: v }))} /><Select label="Level" value={courseForm.level} onChange={v => setCourseForm(x => ({ ...x, level: v }))} options={['Beginner', 'Intermediate', 'Advanced']} /><Field label="Instructor" value={courseForm.instructor} onChange={v => setCourseForm(x => ({ ...x, instructor: v }))} /><Select label="Status" value={courseForm.status} onChange={v => setCourseForm(x => ({ ...x, status: v }))} options={['draft', 'published', 'archived']} /></div><ModalButtons submit={selectedCourse ? 'Save changes' : 'Create course'} onCancel={() => setShowCourse(false)} /></form></Modal>}
      {showLesson && <Modal title="Add lesson" onClose={() => setShowLesson(false)}><form onSubmit={saveLesson} className="space-y-4"><Field label="Lesson title" value={lessonForm.title} onChange={v => setLessonForm(x => ({ ...x, title: v }))} required /><Textarea label="Description" value={lessonForm.description} onChange={v => setLessonForm(x => ({ ...x, description: v }))} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Order" type="number" value={lessonForm.order} onChange={v => setLessonForm(x => ({ ...x, order: v }))} /><Field label="Duration (minutes)" type="number" value={lessonForm.duration_minutes} onChange={v => setLessonForm(x => ({ ...x, duration_minutes: v }))} /></div><Field label="Video URL (optional)" value={lessonForm.video_url} onChange={v => setLessonForm(x => ({ ...x, video_url: v }))} placeholder="https://..." /><Textarea label="Lesson notes" value={lessonForm.notes} onChange={v => setLessonForm(x => ({ ...x, notes: v }))} /><Field label="Resource/PDF URL" value={lessonForm.resource_url} onChange={v => setLessonForm(x => ({ ...x, resource_url: v }))} /><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={lessonForm.is_published} onChange={e => setLessonForm(x => ({ ...x, is_published: e.target.checked }))} /> Publish lesson</label><ModalButtons submit="Add lesson" onCancel={() => setShowLesson(false)} /></form></Modal>}
      {showVideo && <Modal title="Attach video" onClose={() => setShowVideo(false)}><form onSubmit={saveVideo} className="space-y-4"><Select label="Lesson" value={(videoForm as VideoForm & { lessonId?: string }).lessonId || ''} onChange={v => setVideoForm(x => ({ ...x, lessonId: v } as VideoForm))} options={lessons.map(l => `${l.id}|${l.title || 'Untitled lesson'}`)} /><Field label="Video URL" value={videoForm.video_url} onChange={v => setVideoForm(x => ({ ...x, video_url: v }))} placeholder="YouTube, Vimeo, storage/CDN URL" required /><Field label="Video title" value={videoForm.title} onChange={v => setVideoForm(x => ({ ...x, title: v }))} /><Field label="Duration (minutes)" type="number" value={videoForm.duration_minutes} onChange={v => setVideoForm(x => ({ ...x, duration_minutes: v }))} /><p className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-3 text-xs leading-5 text-slate-400">This version sends a video URL to the backend. Actual file upload requires a storage/upload endpoint; it should not be faked in the browser.</p><ModalButtons submit="Attach video" onCancel={() => setShowVideo(false)} /></form></Modal>}
      {showCreateLearner && <Modal title="Create learner" onClose={() => setShowCreateLearner(false)}><form onSubmit={createLearner} className="space-y-4"><Field label="Name" value={learnerForm.name} onChange={v => setLearnerForm(x => ({ ...x, name: v }))} required /><Field label="Email" type="email" value={learnerForm.email} onChange={v => setLearnerForm(x => ({ ...x, email: v }))} required /><Field label="Temporary password" type="password" value={learnerForm.password} onChange={v => setLearnerForm(x => ({ ...x, password: v }))} required /><Select label="Account" value={learnerForm.role} onChange={v => setLearnerForm(x => ({ ...x, role: v }))} options={['normal', 'witstart']} /><ModalButtons submit="Create learner" onCancel={() => setShowCreateLearner(false)} /></form></Modal>}
      {showCreateAdmin && <Modal title="Create administrator" onClose={() => setShowCreateAdmin(false)}><form onSubmit={createAdmin} className="space-y-4"><Field label="Name" value={adminForm.name} onChange={v => setAdminForm(x => ({ ...x, name: v }))} required /><Field label="Email" type="email" value={adminForm.email} onChange={v => setAdminForm(x => ({ ...x, email: v }))} required /><Field label="Temporary password" type="password" value={adminForm.password} onChange={v => setAdminForm(x => ({ ...x, password: v }))} required /><Select label="Role" value={adminForm.role} onChange={v => setAdminForm(x => ({ ...x, role: v }))} options={['staff_admin', 'witstart_admin', 'super_admin']} /><ModalButtons submit="Create administrator" onCancel={() => setShowCreateAdmin(false)} /></form></Modal>}
      {showEditLearner && selectedLearner && <Modal title="Learner account" onClose={() => setShowEditLearner(false)}><LearnerDetail user={selectedLearner} onClose={() => setShowEditLearner(false)} /></Modal>}
      {showEditAdmin && selectedAdmin && <Modal title="Administrator account" onClose={() => setShowEditAdmin(false)}><div className="space-y-4"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="font-semibold">{selectedAdmin.name || selectedAdmin.email}</p><p className="text-sm text-slate-500">{selectedAdmin.email}</p><p className="mt-2 text-xs text-amber-300">{roleLabel(selectedAdmin.role)}</p></div><p className="text-xs leading-5 text-slate-500">Use the existing administrator-management endpoint for role changes. The frontend deliberately does not claim that an edit succeeded until the backend exposes and authorises that operation.</p><button onClick={() => setShowEditAdmin(false)} className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm">Close</button></div></Modal>}
      {selectedCourse && !showCourse && <CourseDrawer course={selectedCourse} lessons={lessons} media={media} loading={courseDetailLoading} onClose={() => setSelectedCourse(null)} onAddLesson={() => { setLessonForm({ ...EMPTY_LESSON, order: String(lessons.length + 1) }); setShowLesson(true); }} onAddVideo={() => { setVideoForm(EMPTY_VIDEO); setShowVideo(true); }} onDeleteLesson={deleteLesson} />}
    </div>
  );
}

function Sidebar({ activeTab, navigate, open, close }: { activeTab: Tab; navigate: (t: Tab) => void; open: boolean; close: () => void }) {
  const groups: { label: string; items: { id: Tab; label: string; icon: string }[] }[] = [
    { label: 'Command Centre', items: [{ id: 'overview', label: 'Overview', icon: '⌂' }, { id: 'analytics', label: 'Analytics', icon: '◫' }, { id: 'activity', label: 'Activity & Audit', icon: '↯' }] },
    { label: 'Learning', items: [{ id: 'courses', label: 'Courses', icon: '▣' }, { id: 'content', label: 'Content Audit', icon: '✓' }, { id: 'media', label: 'Media Library', icon: '▶' }] },
    { label: 'Users', items: [{ id: 'users', label: 'All Learners', icon: '♙' }, { id: 'normal', label: 'Learnora Learners', icon: 'L' }, { id: 'witstart', label: 'WitStart Learners', icon: 'W' }, { id: 'admins', label: 'Administrators', icon: '◆' }] },
    { label: 'Commerce', items: [{ id: 'billing', label: 'Subscriptions & Billing', icon: '₦' }] },
    { label: 'Security', items: [{ id: 'security', label: 'Security Centre', icon: '⌁' }] },
    { label: 'Platform', items: [{ id: 'settings', label: 'Settings', icon: '⚙' }] },
  ];
  return <><div className={`fixed inset-0 z-40 bg-black/60 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={close} /><aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/[0.07] bg-[#071421] px-4 py-5 transition-transform lg:sticky lg:top-0 lg:z-20 lg:block lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="mb-7 flex items-center justify-between px-2"><div><p className="text-xl font-black tracking-tight">Learnora<span className="text-amber-400">.</span></p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">Super Admin</p></div><button className="lg:hidden" onClick={close}>✕</button></div><nav className="space-y-6 overflow-y-auto pb-8">{groups.map(group => <div key={group.label}><p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">{group.label}</p><div className="space-y-1">{group.items.map(item => <button key={item.id} onClick={() => navigate(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeTab === item.id ? 'bg-amber-400/10 font-semibold text-amber-300 ring-1 ring-amber-400/10' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'}`}><span className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.03] text-xs">{item.icon}</span>{item.label}</button>)}</div></div>)}</nav></aside></>;
}

function Overview({ stats, users, courses, totalCourses, emptyCourses, incompleteCourses, publishedCourses, totalLessons, totalVideos, activity, security, onNavigate }: { stats: Stats | null; users: UserRecord[]; courses: Course[]; totalCourses: number; emptyCourses: number; incompleteCourses: number; publishedCourses: number; totalLessons: number; totalVideos: number; activity: ActivityRecord[]; security: SecurityLog[]; onNavigate: (t: Tab) => void }) {
  const activeUsers = users.filter(u => u.is_active !== false).length;
  const paid = users.filter(u => u.is_paid).length;
  const critical = security.filter(x => /critical/i.test(String(x.action || x.event || ''))).length;
  const topCourses = [...courses].sort((a, b) => Number(b.enrolments_count ?? b.enrollments_count ?? 0) - Number(a.enrolments_count ?? a.enrollments_count ?? 0)).slice(0, 5);
  return <div className="space-y-6"><PageHeading eyebrow="Command Centre" title="Platform overview" description="The high-level state of users, learning content, commerce and security." action={<button onClick={() => onNavigate('courses')} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">Manage courses</button>} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total learners" value={users.length} detail={`${activeUsers} active accounts`} icon="♙" /><MetricCard label="Courses" value={totalCourses} detail={`${publishedCourses} published`} icon="▣" /><MetricCard label="Lessons / videos" value={`${totalLessons} / ${totalVideos}`} detail={incompleteCourses ? `${incompleteCourses} courses need videos` : 'Content coverage looks healthy'} icon="▶" /><MetricCard label="Paid learners" value={paid} detail="Current paid-state records" icon="₦" /></div><div className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]"><Panel title="Content health" description="What needs attention before you publish or promote courses."><div className="grid gap-3 sm:grid-cols-3"><HealthCard label="Empty courses" value={emptyCourses} tone="red" action={() => onNavigate('content')} /><HealthCard label="Missing videos" value={incompleteCourses} tone="amber" action={() => onNavigate('content')} /><HealthCard label="Published" value={publishedCourses} tone="emerald" action={() => onNavigate('courses')} /></div><div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-sm leading-6 text-slate-400">A course is treated as <span className="text-red-300">empty</span> when it has no lessons. A course is treated as <span className="text-amber-300">incomplete</span> when it has lessons but fewer videos than lessons. These are frontend health checks and should eventually be mirrored by a backend content-audit endpoint.</div></Panel><Panel title="Action required" description="Direct routes to the areas that normally require Super Admin attention."><div className="space-y-2"><ActionRow label="Review empty courses" value={emptyCourses} onClick={() => onNavigate('content')} /><ActionRow label="Review incomplete courses" value={incompleteCourses} onClick={() => onNavigate('content')} /><ActionRow label="Review security events" value={critical} onClick={() => onNavigate('security')} /><ActionRow label="Manage administrators" value={0} onClick={() => onNavigate('admins')} /></div></Panel></div><div className="grid gap-5 xl:grid-cols-2"><Panel title="Most enrolled courses" description="Based on enrolment counts returned by the course API.">{topCourses.length ? <div className="space-y-3">{topCourses.map((c, i) => <div key={String(c.id ?? i)} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{courseName(c)}</p><p className="text-xs text-slate-600">{c.category || c.track || 'Uncategorised'}</p></div><span className="text-sm font-bold text-amber-300">{c.enrolments_count ?? c.enrollments_count ?? 0}</span></div>)}</div> : <EmptyState message="No course enrolment data is available yet." />}</Panel><Panel title="Recent platform activity" description="Latest activity returned by the existing audit/activity endpoint.">{activity.length ? <div className="space-y-3">{activity.slice(0, 6).map((x, i) => <ActivityRow key={i} item={x} />)}</div> : <EmptyState message="No recent activity." />}</Panel></div></div>;
}

function Analytics({ stats, traffic, users, courses }: { stats: Stats | null; traffic: Traffic | null; users: UserRecord[]; courses: Course[] }) {
  const loginEvents = valueOf(traffic, ['login_events', 'logins']);
  const trafficEvents = valueOf(traffic, ['total_events', 'events', 'total_traffic_events']);
  const unique = valueOf(traffic, ['unique_users', 'traffic_unique_users']);
  const completion = courses.length ? courses.reduce((n, c) => n + Number(c.completion_rate || 0), 0) / courses.filter(c => c.completion_rate != null).length : 0;
  return <div className="space-y-6"><PageHeading eyebrow="Analytics" title="Platform analytics" description="Operational metrics available from your current backend, with course metrics ready for richer endpoints." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Traffic events" value={trafficEvents} detail="Returned by /traffic" icon="↗" /><MetricCard label="Login events" value={loginEvents} detail="Returned by traffic data" icon="→" /><MetricCard label="Unique users" value={unique} detail="Traffic-based where available" icon="♙" /><MetricCard label="Avg completion" value={completion ? `${completion.toFixed(1)}%` : '—'} detail="Course completion data" icon="✓" /></div><div className="grid gap-5 xl:grid-cols-2"><Panel title="User mix"><div className="space-y-4"><Bar label="Learnora learners" value={users.filter(u => u.role === 'normal').length} max={Math.max(users.length, 1)} /><Bar label="WitStart learners" value={users.filter(u => u.role === 'witstart').length} max={Math.max(users.length, 1)} /><Bar label="Paid learners" value={users.filter(u => u.is_paid).length} max={Math.max(users.length, 1)} /></div></Panel><Panel title="Course publishing pipeline"><div className="space-y-4"><Bar label="Published" value={courses.filter(c => c.status === 'published' || c.is_published || c.published).length} max={Math.max(courses.length, 1)} /><Bar label="Draft" value={courses.filter(c => String(c.status || 'draft') === 'draft').length} max={Math.max(courses.length, 1)} /><Bar label="Empty" value={courses.filter(c => (c.lessons_count ?? c.lesson_count ?? 0) === 0).length} max={Math.max(courses.length, 1)} /></div></Panel></div><Panel title="Raw backend metrics" description="Useful while the analytics API is still evolving."><pre className="max-h-96 overflow-auto rounded-xl bg-black/20 p-4 text-xs leading-5 text-slate-400">{JSON.stringify({ stats, traffic }, null, 2)}</pre></Panel></div>;
}

function CoursesPanel({ courses, allCourses, search, setSearch, filter, setFilter, loading, onCreate, onOpen, onEdit, onDelete }: { courses: Course[]; allCourses: Course[]; search: string; setSearch: (v: string) => void; filter: string; setFilter: (v: string) => void; loading: boolean; onCreate: () => void; onOpen: (c: Course) => void; onEdit: (c: Course) => void; onDelete: (c: Course) => void }) {
  return <div className="space-y-6"><PageHeading eyebrow="Learning" title="Courses" description="See every course, including empty and incomplete courses. Open any course to manage its curriculum and videos." action={<button onClick={onCreate} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">+ Add course</button>} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="All courses" value={allCourses.length} detail="Every course returned" icon="▣" /><MetricCard label="Published" value={allCourses.filter(c => c.status === 'published' || c.is_published || c.published).length} detail="Visible/publish state" icon="✓" /><MetricCard label="Empty" value={allCourses.filter(c => (c.lessons_count ?? c.lesson_count ?? 0) === 0).length} detail="No lessons" icon="!" /><MetricCard label="Needs video" value={allCourses.filter(c => Number(c.lessons_count ?? c.lesson_count ?? 0) > Number(c.videos_count ?? c.video_count ?? 0)).length} detail="Lesson/video mismatch" icon="▶" /></div><Panel title="Course catalogue"><div className="mb-5 flex flex-col gap-3 md:flex-row"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search course, track, instructor..." className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none" /><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#0b1827] px-4 py-2.5 text-sm"><option value="all">All courses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option><option value="empty">Empty</option><option value="missing-video">Missing videos</option><option value="healthy">Healthy</option></select></div>{loading ? <Loading small /> : courses.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1000px]"><thead><tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-600"><th className="px-3 py-3">Course</th><th className="px-3 py-3">Track</th><th className="px-3 py-3">Lessons</th><th className="px-3 py-3">Videos</th><th className="px-3 py-3">Enrolments</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Health</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{courses.map((c, i) => { const l = Number(c.lessons_count ?? c.lesson_count ?? 0); const v = Number(c.videos_count ?? c.video_count ?? 0); const health = l === 0 ? 'Empty' : v < l ? 'Needs videos' : 'Healthy'; return <tr key={String(c.id ?? i)} className="border-b border-white/[0.04] hover:bg-white/[0.02]"><td className="px-3 py-4"><button onClick={() => onOpen(c)} className="text-left font-semibold hover:text-amber-300">{courseName(c)}</button><p className="mt-1 max-w-[280px] truncate text-xs text-slate-600">{c.description || 'No description'}</p></td><td className="px-3 py-4 text-sm text-slate-400">{c.track || c.category || '—'}</td><td className="px-3 py-4 text-sm">{l}</td><td className="px-3 py-4 text-sm">{v}</td><td className="px-3 py-4 text-sm">{c.enrolments_count ?? c.enrollments_count ?? 0}</td><td className="px-3 py-4"><Badge>{statusLabel(c.status || (c.is_published ? 'published' : 'draft'))}</Badge></td><td className="px-3 py-4"><HealthBadge value={health} /></td><td className="px-3 py-4"><div className="flex gap-2"><button onClick={() => onOpen(c)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs">Open</button><button onClick={() => onEdit(c)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs">Edit</button><button onClick={() => onDelete(c)} className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300">Delete</button></div></td></tr>})}</tbody></table></div> : <EmptyState message="No courses were returned by /api/admin/courses. If the endpoint does not exist yet, the catalogue cannot show real courses." />}</Panel></div>;
}

function ContentAudit({ courses, onCourses, onOpen }: { courses: Course[]; onCourses: () => void; onOpen: (c: Course) => void }) {
  const empty = courses.filter(c => Number(c.lessons_count ?? c.lesson_count ?? 0) === 0); const missing = courses.filter(c => { const l = Number(c.lessons_count ?? c.lesson_count ?? 0); const v = Number(c.videos_count ?? c.video_count ?? 0); return l > 0 && v < l; }); const noDescription = courses.filter(c => !c.description?.trim());
  return <div className="space-y-6"><PageHeading eyebrow="Learning" title="Content audit" description="A Super Admin should be able to see what is incomplete before learners encounter it." action={<button onClick={onCourses} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm">Open catalogue</button>} /><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Empty courses" value={empty.length} detail="No lessons" icon="!" /><MetricCard label="Lessons without videos" value={missing.reduce((n, c) => n + Math.max(0, Number(c.lessons_count ?? c.lesson_count ?? 0) - Number(c.videos_count ?? c.video_count ?? 0)), 0)} detail="Estimated from counts" icon="▶" /><MetricCard label="Missing descriptions" value={noDescription.length} detail="Course metadata" icon="i" /></div><div className="grid gap-5 xl:grid-cols-3"><AuditList title="Empty courses" items={empty} empty="No empty courses found." onOpen={onOpen} /><AuditList title="Missing videos" items={missing} empty="No course-level video gaps found." onOpen={onOpen} /><AuditList title="Missing descriptions" items={noDescription} empty="All courses have descriptions." onOpen={onOpen} /></div></div>;
}

function AuditList({ title, items, empty, onOpen }: { title: string; items: Course[]; empty: string; onOpen: (c: Course) => void }) { return <Panel title={title}><div className="space-y-2">{items.length ? items.slice(0, 12).map(c => <button key={String(c.id)} onClick={() => onOpen(c)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] p-3 text-left hover:bg-white/[0.03]"><span className="min-w-0 truncate text-sm">{courseName(c)}</span><span className="ml-3 text-xs text-amber-300">Fix →</span></button>) : <EmptyState message={empty} />}</div></Panel> }

function CourseDrawer({ course, lessons, media, loading, onClose, onAddLesson, onAddVideo, onDeleteLesson }: { course: Course; lessons: Lesson[]; media: Media[]; loading: boolean; onClose: () => void; onAddLesson: () => void; onAddVideo: () => void; onDeleteLesson: (l: Lesson) => void }) {
  return <div className="fixed inset-0 z-[60] flex justify-end bg-black/60" onClick={onClose}><aside onClick={e => e.stopPropagation()} className="h-full w-full max-w-3xl overflow-y-auto border-l border-white/10 bg-[#071421] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">Course control</p><h2 className="mt-1 text-2xl font-bold">{courseName(course)}</h2><p className="mt-2 text-sm text-slate-500">{course.description || 'No description'}</p></div><button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2">✕</button></div><div className="mt-6 grid grid-cols-3 gap-3"><MiniStat label="Lessons" value={lessons.length || course.lessons_count || course.lesson_count || 0} /><MiniStat label="Videos" value={lessons.filter(l => lessonVideo(l)).length || course.videos_count || course.video_count || 0} /><MiniStat label="Enrolments" value={course.enrolments_count ?? course.enrollments_count ?? 0} /></div><div className="mt-7 flex flex-wrap gap-2"><button onClick={onAddLesson} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">+ Add lesson</button><button onClick={onAddVideo} disabled={!lessons.length} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-40">+ Add video</button></div><div className="mt-7"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Curriculum</h3><span className="text-xs text-slate-600">{loading ? 'Loading…' : `${lessons.length} lessons`}</span></div>{loading ? <Loading small /> : lessons.length ? <div className="space-y-2">{lessons.map((l, i) => <div key={String(l.id ?? i)} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-xs text-slate-500">{lessonPosition(l) || i + 1}</span><div className="min-w-0 flex-1"><p className="font-semibold">{l.title || 'Untitled lesson'}</p><p className="mt-1 text-xs text-slate-600">{l.duration_minutes ? `${l.duration_minutes} min · ` : ''}{l.is_published ? 'Published' : 'Draft'}</p>{lessonVideo(l) ? <a href={lessonVideo(l)} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-amber-300 hover:underline">Video attached: {lessonVideo(l)}</a> : <p className="mt-2 text-xs text-red-300">No video attached</p>}</div><button onClick={() => onDeleteLesson(l)} className="rounded-lg border border-red-400/10 px-2 py-1 text-xs text-red-300">Delete</button></div></div>)}</div> : <EmptyState message="No lessons found. This course is empty or the lesson endpoint is not implemented." />}</div><div className="mt-7"><h3 className="mb-3 font-semibold">Course media</h3>{media.length ? <div className="space-y-2">{media.map((m, i) => <div key={String(m.id ?? i)} className="rounded-xl border border-white/[0.06] p-3"><p className="text-sm font-medium">{m.title || m.name || 'Media file'}</p><p className="text-xs text-slate-600">{m.mime_type || m.type || 'unknown'} · {fmtBytes(m.size_bytes)}</p></div>)}</div> : <EmptyState message="No media records returned for this course." />}</div></aside></div>;
}

function MediaPanel({ media, courses }: { media: Media[]; courses: Course[] }) { return <div className="space-y-6"><PageHeading eyebrow="Learning" title="Media Library" description="A central place for videos, PDFs and other course assets once your backend exposes media records." /><Panel title="Media inventory" description="This panel reads /api/admin/media. It will remain empty rather than invent files when that endpoint is not available.">{media.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{media.map((m, i) => <div key={String(m.id ?? i)} className="rounded-2xl border border-white/[0.07] p-4"><div className="mb-3 grid h-28 place-items-center rounded-xl bg-black/20 text-3xl">{String(m.mime_type || m.type || '').includes('video') ? '▶' : '▧'}</div><p className="truncate text-sm font-semibold">{m.title || m.name || 'Untitled media'}</p><p className="mt-1 text-xs text-slate-600">{m.mime_type || m.type || 'Unknown type'} · {fmtBytes(m.size_bytes)}</p>{m.url || m.file_url ? <a href={m.url || m.file_url || '#'} target="_blank" rel="noreferrer" className="mt-3 block text-xs text-amber-300">Open asset →</a> : null}</div>)}</div> : <EmptyState message={`No media records available. ${courses.length ? 'Your courses exist, but the media endpoint needs to expose their files.' : 'Create courses first.'}`} />}</Panel></div> }

function UsersPanel({ users, search, setSearch, filter, setFilter, onCreate, onEdit }: { users: UserRecord[]; search: string; setSearch: (v: string) => void; filter: 'all' | 'normal' | 'witstart'; setFilter: (v: 'all' | 'normal' | 'witstart') => void; onCreate: () => void; onEdit: (u: UserRecord) => void }) { return <div className="space-y-6"><PageHeading eyebrow="Users" title="Learners" description="Manage learner accounts. Course progress and enrolments should be added to the learner detail endpoint." action={<button onClick={onCreate} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">+ Create learner</button>} /><Panel title="Learner directory"><div className="mb-5 flex flex-col gap-3 sm:flex-row"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email or role..." className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none" /><select value={filter} onChange={e => setFilter(e.target.value as 'all' | 'normal' | 'witstart')} className="rounded-xl border border-white/10 bg-[#0b1827] px-4 py-2.5 text-sm"><option value="all">All learners</option><option value="normal">Learnora</option><option value="witstart">WitStart</option></select></div>{users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px]"><thead><tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-600"><th className="px-3 py-3">Learner</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Subscription</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Last login</th><th className="px-3 py-3">Created</th><th /></tr></thead><tbody>{users.map((u, i) => <tr key={String(u.id ?? u.email ?? i)} className="border-b border-white/[0.04]"><td className="px-3 py-4"><p className="font-semibold">{u.name || 'Unnamed learner'}</p><p className="text-xs text-slate-600">{u.email}</p></td><td className="px-3 py-4"><Badge>{roleLabel(u.role)}</Badge></td><td className="px-3 py-4 text-sm">{u.is_paid ? 'Paid' : u.trial_ends_at ? 'Trial' : 'Free'}</td><td className="px-3 py-4"><HealthBadge value={u.is_active === false ? 'Inactive' : 'Active'} /></td><td className="px-3 py-4 text-xs text-slate-500">{fmtDate(u.last_login_at)}</td><td className="px-3 py-4 text-xs text-slate-500">{fmtDate(u.created_at)}</td><td className="px-3 py-4"><button onClick={() => onEdit(u)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs">View</button></td></tr>)}</tbody></table></div> : <EmptyState message="No learners found." />}</Panel></div> }

function LearnerDetail({ user, onClose }: { user: UserRecord; onClose: () => void }) { return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><MiniStat label="Role" value={roleLabel(user.role)} /><MiniStat label="Subscription" value={user.is_paid ? 'Paid' : 'Free/Trial'} /><MiniStat label="Status" value={user.is_active === false ? 'Inactive' : 'Active'} /><MiniStat label="Last login" value={fmtDate(user.last_login_at)} /></div><Panel title="Account details"><div className="space-y-3 text-sm"><InfoRow label="Name" value={user.name || '—'} /><InfoRow label="Email" value={user.email} /><InfoRow label="Created" value={fmtDate(user.created_at)} /><InfoRow label="Subscription tier" value={user.subscription_tier || '—'} /><InfoRow label="Trial ends" value={fmtDate(user.trial_ends_at)} /><InfoRow label="Subscription expires" value={fmtDate(user.expires_at)} /></div></Panel><div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4 text-xs leading-5 text-slate-500">For the full Super Admin learner view, the backend should expose enrolments, course progress, lessons completed, video watch progress, time spent, certificates, access grants and learner activity. This screen intentionally does not fabricate those values.</div><button onClick={onClose} className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm">Close</button></div> }

function AdminsPanel({ admins, search, setSearch, currentEmail, onCreate, onEdit, onDelete }: { admins: AdminRecord[]; search: string; setSearch: (v: string) => void; currentEmail: string; onCreate: () => void; onEdit: (a: AdminRecord) => void; onDelete: (a: AdminRecord) => void }) { const filtered = admins.filter(a => !search || `${a.name || ''} ${a.email} ${a.role || ''}`.toLowerCase().includes(search.toLowerCase())); return <div className="space-y-6"><PageHeading eyebrow="Access control" title="Administrators" description="Manage Super Admin, Staff Admin and WitStart Admin accounts." action={<button onClick={onCreate} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">+ Create administrator</button>} /><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Admins" value={admins.length} detail="All administrator records" icon="◆" /><MetricCard label="Active" value={admins.filter(a => a.is_active !== false).length} detail="Enabled accounts" icon="✓" /><MetricCard label="WitStart admins" value={admins.filter(a => a.role === 'witstart_admin').length} detail="Academy administration" icon="W" /></div><Panel title="Administrator directory"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search administrators..." className="mb-5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none" /><div className="overflow-x-auto"><table className="w-full min-w-[850px]"><thead><tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-600"><th className="px-3 py-3">Administrator</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Last login</th><th className="px-3 py-3">Created</th><th /></tr></thead><tbody>{filtered.map((a, i) => <tr key={String(a.id ?? a.email ?? i)} className="border-b border-white/[0.04]"><td className="px-3 py-4"><p className="font-semibold">{a.name || 'Unnamed admin'}</p><p className="text-xs text-slate-600">{a.email}</p></td><td className="px-3 py-4"><Badge>{roleLabel(a.role)}</Badge></td><td className="px-3 py-4"><HealthBadge value={a.is_active === false ? 'Inactive' : 'Active'} /></td><td className="px-3 py-4 text-xs text-slate-500">{fmtDate(a.last_login_at)}</td><td className="px-3 py-4 text-xs text-slate-500">{fmtDate(a.created_at)}</td><td className="px-3 py-4"><div className="flex gap-2"><button onClick={() => onEdit(a)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs">View</button>{a.email !== currentEmail && <button onClick={() => onDelete(a)} className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300">Delete</button>}</div></td></tr>)}</tbody></table></div></Panel></div> }

function ActivityPanel({ activity, security }: { activity: ActivityRecord[]; security: SecurityLog[] }) { const all = [...activity.map(x => ({ ...x, kind: 'activity' })), ...security.map(x => ({ ...x, kind: 'security' }))].sort((a, b) => new Date(timestamp(b)).getTime() - new Date(timestamp(a)).getTime()); return <div className="space-y-6"><PageHeading eyebrow="Audit" title="Activity & Audit" description="A single operational view of user, admin and security events." /><Panel title="Event stream"><div className="space-y-2">{all.length ? all.map((item, i) => <div key={i} className="rounded-xl border border-white/[0.06] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">{String(item.action || item.event || 'Unknown event')}</p><p className="mt-1 text-xs text-slate-600">{item.email || item.name || 'System'} · {roleLabel(item.role)}</p></div><p className="text-[11px] text-slate-600">{fmtDate(timestamp(item))}</p></div>{item.metadata ? <pre className="mt-3 overflow-auto rounded-lg bg-black/20 p-3 text-[10px] text-slate-600">{JSON.stringify(item.metadata, null, 2)}</pre> : null}</div>) : <EmptyState message="No activity events available." />}</div></Panel></div> }

function BillingPanel({ users, stats }: { users: UserRecord[]; stats: Stats | null }) { const paid = users.filter(u => u.is_paid); const trial = users.filter(u => !u.is_paid && u.trial_ends_at); return <div className="space-y-6"><PageHeading eyebrow="Commerce" title="Subscriptions & billing" description="Account-level subscription state from your current user records." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Paid" value={paid.length} detail="is_paid records" icon="₦" /><MetricCard label="Trial" value={trial.length} detail="Trial end present" icon="◇" /><MetricCard label="Free" value={users.length - paid.length - trial.length} detail="Neither paid nor trial" icon="○" /><MetricCard label="Revenue" value="—" detail="Needs authoritative payment endpoint" icon="₦" /></div><Panel title="Billing data boundary"><p className="text-sm leading-6 text-slate-400">The existing admin API exposes learner subscription state, but that is not enough to safely calculate revenue, MRR, refunds, transaction history or payment-provider reconciliation. Those figures should come from a dedicated payments endpoint rather than being inferred from user records.</p><pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-black/20 p-4 text-xs text-slate-500">{JSON.stringify(stats || {}, null, 2)}</pre></Panel></div> }

function SecurityPanel({ summary, logs, activity }: { summary: SecuritySummary | null; logs: SecurityLog[]; activity: ActivityRecord[] }) { return <div className="space-y-6"><PageHeading eyebrow="Security" title="Security Centre" description="Security events, administrator activity and backend security summaries." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Security events" value={logs.length} detail="Returned by security logs" icon="⌁" /><MetricCard label="Critical" value={logs.filter(x => /critical/i.test(String(x.action || x.event || ''))).length} detail="Detected by event label" icon="!" /><MetricCard label="Admin events" value={activity.filter(x => /admin|role|permission|password/i.test(String(x.action || x.event || ''))).length} detail="Activity-based estimate" icon="◆" /><MetricCard label="Summary" value={summary ? 'Available' : '—'} detail="Security summary endpoint" icon="✓" /></div><Panel title="Recent security events"><div className="space-y-2">{logs.length ? logs.slice(0, 25).map((x, i) => <div key={i} className="rounded-xl border border-white/[0.06] p-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold">{String(x.action || x.event || 'Security event')}</p><p className="text-[11px] text-slate-600">{fmtDate(timestamp(x))}</p></div><p className="mt-1 text-xs text-slate-600">{x.email || 'System'} · {x.ip || 'IP unavailable'}</p></div>) : <EmptyState message="No security events returned." />}</div></Panel><Panel title="Backend security summary"><pre className="max-h-96 overflow-auto rounded-xl bg-black/20 p-4 text-xs leading-5 text-slate-500">{JSON.stringify(summary || {}, null, 2)}</pre></Panel></div> }

function SettingsPanel() { return <div className="space-y-6"><PageHeading eyebrow="Platform" title="Settings" description="Platform-level configuration should be controlled by backend-authorised Super Admin settings." /><div className="grid gap-5 md:grid-cols-2"><SettingsCard title="Learning" items={['Course publishing rules', 'Lesson completion rules', 'Video progress tracking', 'Certificate settings']} /><SettingsCard title="Accounts" items={['Registration', 'Email verification', 'Password policy', 'Account suspension']} /><SettingsCard title="Commerce" items={['Plans', 'Trial period', 'Access grants', 'Refund rules']} /><SettingsCard title="Security" items={['Admin sessions', 'Rate limits', 'Login protection', 'Audit retention']} /></div><div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-5 text-sm leading-6 text-slate-400">These controls are intentionally informational until the backend exposes explicit settings endpoints. A Super Admin interface must not make a local UI toggle look like it changed the platform when it did not.</div></div> }

function SettingsCard({ title, items }: { title: string; items: string[] }) { return <Panel title={title}><div className="space-y-2">{items.map(x => <div key={x} className="flex items-center justify-between rounded-xl border border-white/[0.05] p-3"><span className="text-sm text-slate-300">{x}</span><span className="text-xs text-slate-600">Backend setting</span></div>)}</div></Panel> }

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p></div>{action}</div> }
function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) { return <section className="rounded-2xl border border-white/[0.07] bg-[#0a1725] p-4 shadow-2xl shadow-black/10 sm:p-5"><div className="mb-4"><h3 className="font-semibold">{title}</h3>{description && <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>}</div>{children}</section> }
function MetricCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail: string; icon: string }) { return <div className="rounded-2xl border border-white/[0.07] bg-[#0a1725] p-4"><div className="flex items-center justify-between"><p className="text-[11px] uppercase tracking-wider text-slate-600">{label}</p><span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 text-amber-300">{icon}</span></div><p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-600">{detail}</p></div> }
function MiniStat({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 truncate text-sm font-bold">{value}</p></div> }
function HealthCard({ label, value, tone, action }: { label: string; value: number; tone: 'red' | 'amber' | 'emerald'; action: () => void }) { return <button onClick={action} className="rounded-xl border border-white/[0.06] p-4 text-left hover:bg-white/[0.03]"><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${tone === 'red' ? 'text-red-300' : tone === 'amber' ? 'text-amber-300' : 'text-emerald-300'}`}>{value}</p><p className="mt-1 text-[11px] text-slate-600">View details →</p></button> }
function ActionRow({ label, value, onClick }: { label: string; value: number; onClick: () => void }) { return <button onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-white/[0.05] px-3 py-3 text-left hover:bg-white/[0.03]"><span className="text-sm text-slate-300">{label}</span><span className="text-xs font-semibold text-amber-300">{value || 'Open'} →</span></button> }
function ActivityRow({ item }: { item: ActivityRecord }) { return <div className="rounded-xl border border-white/[0.05] p-3"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium">{String(item.action || item.event || 'Activity')}</p><p className="shrink-0 text-[10px] text-slate-600">{fmtDate(timestamp(item))}</p></div><p className="mt-1 text-xs text-slate-600">{item.email || item.name || 'System'} · {roleLabel(item.role)}</p></div> }
function Bar({ label, value, max }: { label: string; value: number; max: number }) { const width = Math.min(100, Math.max(0, max ? (value / max) * 100 : 0)); return <div><div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="text-slate-500">{value}</span></div><div className="h-2 rounded-full bg-white/[0.05]"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${width}%` }} /></div></div> }
function Badge({ children }: { children: ReactNode }) { return <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-slate-400">{children}</span> }
function HealthBadge({ value }: { value: string }) { const red = /empty|missing|inactive/i.test(value); const green = /healthy|active|published/i.test(value); return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${red ? 'border-red-400/10 bg-red-400/[0.05] text-red-300' : green ? 'border-emerald-400/10 bg-emerald-400/[0.05] text-emerald-300' : 'border-amber-400/10 bg-amber-400/[0.05] text-amber-300'}`}>{value}</span> }
function InfoRow({ label, value }: { label: string; value: ReactNode }) { return <div className="flex justify-between gap-4 border-b border-white/[0.04] pb-2"><span className="text-slate-600">{label}</span><span className="text-right text-slate-300">{value}</span></div> }
function EmptyState({ message }: { message: string }) { return <div className="rounded-xl border border-dashed border-white/[0.08] px-5 py-10 text-center text-sm text-slate-600">{message}</div> }
function Loading({ small = false }: { small?: boolean }) { return <div className={`grid place-items-center rounded-2xl border border-white/[0.06] bg-[#0a1725] ${small ? 'min-h-24' : 'min-h-[50vh]'}`}><div className="text-sm text-slate-600">Loading Super Admin data…</div></div> }
function Notice({ type, message, onClose }: { type: 'error' | 'success'; message: string; onClose: () => void }) { return <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${type === 'error' ? 'border-red-400/10 bg-red-400/[0.04] text-red-200' : 'border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-200'}`}><span>{message}</span><button onClick={onClose}>✕</button></div> }
function Field({ label, value, onChange, type = 'text', placeholder, required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span><input required={required} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-700 focus:border-amber-400/30" /></label> }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span><textarea value={value} onChange={e => onChange(e.target.value)} rows={4} className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/30" /></label> }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span><select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b1827] px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/30"><option value="">Select…</option>{options.map(option => { const [v, ...rest] = option.split('|'); return <option key={option} value={v}>{rest.length ? rest.join('|') : roleLabel(v)}</option>; })}</select></label> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1725] p-5 shadow-2xl sm:p-7"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2">✕</button></div>{children}</div></div> }
function ModalButtons({ submit, onCancel }: { submit: string; onCancel: () => void }) { return <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm">Cancel</button><button type="submit" className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">{submit}</button></div> }
