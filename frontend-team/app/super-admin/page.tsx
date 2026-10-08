'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Activity,
  Bot,
  Building2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Gauge,
  Layers3,
  LogOut,
  Menu,
  Network,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://learnora-backend.vercel.app').replace(/\/$/, '');

type Section =
  | 'overview'
  | 'organisations'
  | 'people'
  | 'teams'
  | 'content'
  | 'ai'
  | 'operations'
  | 'security'
  | 'settings';

type AnyRow = Record<string, unknown>;

const nav: { id: Section; label: string; icon: typeof Gauge; group: string }[] = [
  { id: 'overview', label: 'Overview', icon: Gauge, group: 'Workspace' },
  { id: 'organisations', label: 'Organisations', icon: Building2, group: 'Workspace' },
  { id: 'people', label: 'People & Staff', icon: Users, group: 'Workspace' },
  { id: 'teams', label: 'Teams & Departments', icon: Network, group: 'Workspace' },
  { id: 'content', label: 'Courses & Content', icon: Layers3, group: 'Platform' },
  { id: 'ai', label: 'AI Control Centre', icon: Sparkles, group: 'Platform' },
  { id: 'operations', label: 'Commercial & Operations', icon: CircleDollarSign, group: 'Platform' },
  { id: 'security', label: 'Security & Access', icon: ShieldCheck, group: 'Control' },
  { id: 'settings', label: 'Workspace Settings', icon: Settings, group: 'Control' },
];

function token() {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('learnora_team_token') || '';
}

async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(API_URL + path, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (response.status === 401 || response.status === 403) throw new Error('AUTH');
  if (!response.ok) {
    const detail = body && typeof body === 'object' && 'detail' in body ? String((body as AnyRow).detail) : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return body as T;
}

function rows(body: unknown, key: string): AnyRow[] {
  if (!body || typeof body !== 'object') return [];
  const value = (body as AnyRow)[key];
  return Array.isArray(value) ? value as AnyRow[] : [];
}

function str(row: AnyRow, key: string, fallback = '—') {
  const value = row[key];
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function fmtDate(value: unknown) {
  if (!value) return '—';
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/10 bg-[#151515] shadow-[0_12px_40px_rgba(0,0,0,.2)] ${className}`}>{children}</section>;
}

function Button({ children, onClick, type = 'button', disabled = false, variant = 'gold' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; variant?: 'gold' | 'ghost' | 'danger' }) {
  const styles = variant === 'gold'
    ? 'bg-[#d7ad35] text-black hover:bg-[#f2d477]'
    : variant === 'danger'
      ? 'border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20'
      : 'border border-white/10 bg-white/[.04] text-white hover:bg-white/[.08]';
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}>{children}</button>;
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <label className="block space-y-1.5">
    <span className="text-xs font-medium text-white/55">{label}</span>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d7ad35]/60" />
  </label>;
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return <label className="block space-y-1.5">
    <span className="text-xs font-medium text-white/55">{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#d7ad35]/60">{children}</select>
  </label>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#111]/95 px-6 py-5 backdrop-blur">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"><X size={18}/></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>;
}

function Metric({ label, value, icon: Icon, sub }: { label: string; value: ReactNode; icon: typeof Gauge; sub?: string }) {
  return <Card className="p-5">
    <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[.14em] text-white/40">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p>{sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}</div><div className="rounded-xl border border-[#d7ad35]/20 bg-[#d7ad35]/10 p-2.5 text-[#f2d477]"><Icon size={19}/></div></div>
  </Card>;
}

export default function SuperAdminDashboard() {
  const [section, setSection] = useState<Section>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [staff, setStaff] = useState<AnyRow[]>([]);
  const [organisations, setOrganisations] = useState<AnyRow[]>([]);
  const [departments, setDepartments] = useState<AnyRow[]>([]);
  const [teams, setTeams] = useState<AnyRow[]>([]);
  const [courses, setCourses] = useState<AnyRow[]>([]);
  const [ai, setAi] = useState<AnyRow | null>(null);
  const [ops, setOps] = useState<{ requests: AnyRow[]; applications: AnyRow[]; payouts: AnyRow[] }>({ requests: [], applications: [], payouts: [] });
  const [me, setMe] = useState<AnyRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [structure, setStructure] = useState<AnyRow | null>(null);
  const [modal, setModal] = useState<string | null>(null);

  const [orgForm, setOrgForm] = useState({ name: '', slug: '', description: '', type: 'academy', template: 'academy' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', job_title: '', role_slug: 'support' });
  const [deptForm, setDeptForm] = useState({ name: '', slug: '', description: '' });
  const [teamForm, setTeamForm] = useState({ name: '', slug: '', description: '', department_id: '' });
  const [courseForm, setCourseForm] = useState({ title: '', slug: '', description: '', level: 'beginner', status: 'draft', ownership: 'learnora', organisation_id: '' });
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', lesson_type: 'mixed', content: '', duration_minutes: '0', status: 'draft' });
  const [aiEdit, setAiEdit] = useState<Record<string, string | boolean>>({});

  const currentNav = nav.find(x => x.id === section)!;

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [m, o, s, d, t, c, a] = await Promise.allSettled([
        api('/api/internal/auth/me'),
        api('/api/internal/operations/organisations'),
        api('/api/internal/staff'),
        api('/api/internal/departments'),
        api('/api/internal/teams'),
        api('/api/internal/content/courses'),
        api('/api/internal/ai/health'),
      ]);
      if (m.status === 'fulfilled') setMe((m.value as AnyRow).staff as AnyRow || null);
      if (o.status === 'fulfilled') setOrganisations(rows(o.value, 'organisations'));
      if (s.status === 'fulfilled') setStaff(rows(s.value, 'staff'));
      if (d.status === 'fulfilled') setDepartments(rows(d.value, 'departments'));
      if (t.status === 'fulfilled') setTeams(rows(t.value, 'teams'));
      if (c.status === 'fulfilled') setCourses(rows(c.value, 'courses'));
      if (a.status === 'fulfilled') setAi(a.value as AnyRow);
      const failures = [m,o,s,d,t,c,a].filter(x => x.status === 'rejected');
      if (failures.length && !silent) setError('Some workspace data could not be loaded. Your permissions may limit one or more sections.');
    } catch (e) {
      if (e instanceof Error && e.message === 'AUTH') {
        setError('Your internal session is invalid or expired. Please sign in again.');
      } else {
        setError(e instanceof Error ? e.message : 'Unable to load workspace.');
      }
    } finally {
      setBooting(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // IMPORTANT: tab changes never trigger the workspace bootstrap loader.
  // Data is loaded once and only refreshed after a mutation.
  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return courses.filter(c => !q || [c.title, c.slug, c.status, c.ownership].some(v => String(v || '').toLowerCase().includes(q)));
  }, [courses, search]);

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim();
    return staff.filter(s => !q || [s.name, s.email, s.job_title].some(v => String(v || '').toLowerCase().includes(q)));
  }, [staff, search]);

  async function mutate(path: string, options: RequestInit, success: string, after?: () => void) {
    setError(''); setNotice('');
    try {
      await api(path, options);
      setNotice(success);
      setModal(null);
      if (after) after();
      else await refresh(true);
    } catch (e) {
      if (e instanceof Error && e.message === 'AUTH') setError('Your internal session has expired.');
      else setError(e instanceof Error ? e.message : 'Action failed.');
    }
  }

  async function createOrganisation(e: FormEvent) {
    e.preventDefault();
    await mutate('/api/internal/operations/organisations', { method: 'POST', body: JSON.stringify({ ...orgForm, organisation_type: orgForm.type, slug: slugify(orgForm.slug || orgForm.name) }) }, 'Organisation created.');
  }

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    await mutate('/api/internal/staff', { method: 'POST', body: JSON.stringify(staffForm) }, 'Staff account created.');
  }

  async function createDepartment(e: FormEvent) {
    e.preventDefault();
    await mutate('/api/internal/departments', { method: 'POST', body: JSON.stringify({ ...deptForm, slug: slugify(deptForm.slug || deptForm.name) }) }, 'Department created.');
  }

  async function createTeam(e: FormEvent) {
    e.preventDefault();
    await mutate('/api/internal/teams', { method: 'POST', body: JSON.stringify({ ...teamForm, slug: slugify(teamForm.slug || teamForm.name) }) }, 'Team created.');
  }

  async function createCourse(e: FormEvent) {
    e.preventDefault();
    await mutate('/api/internal/content/courses', { method: 'POST', body: JSON.stringify({ ...courseForm, slug: slugify(courseForm.slug || courseForm.title), estimated_hours: 0 }) }, 'Course created.');
  }

  async function openCourse(id: string) {
    setCourseId(id);
    try {
      setStructure(await api(`/api/internal/content/courses/${encodeURIComponent(id)}/structure`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load course structure.');
    }
  }

  async function createModule(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    await mutate(`/api/internal/content/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify({ ...moduleForm, order_index: Array.isArray((structure as AnyRow)?.modules) ? ((structure as AnyRow).modules as unknown[]).length : 0 }) }, 'Module created.', () => { void openCourse(courseId); });
  }

  async function createLesson(e: FormEvent, moduleId: string) {
    e.preventDefault();
    await mutate(`/api/internal/content/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify({ ...lessonForm, duration_minutes: Number(lessonForm.duration_minutes) || 0, order_index: 0 }) }, 'Lesson created.', () => { void openCourse(courseId); });
  }

  async function testAI(profile: string) {
    try {
      setNotice('Running AI health check…');
      const result = await api<AnyRow>(`/api/internal/ai/profiles/${encodeURIComponent(profile)}/test`, { method: 'POST' });
      setNotice(result.success ? `${profile}: AI responded successfully.` : `${profile}: configuration needs attention.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'AI test failed.'); }
  }

  async function updateAI(profile: AnyRow) {
    const key = String(profile.profile_key);
    const patch: AnyRow = {};
    for (const k of ['provider_key','model','fallback_provider_key','fallback_model']) {
      if (aiEdit[`${key}:${k}`] !== undefined) patch[k] = aiEdit[`${key}:${k}`];
    }
    if (aiEdit[`${key}:enabled`] !== undefined) patch.enabled = aiEdit[`${key}:enabled`];
    if (!Object.keys(patch).length) return;
    await mutate(`/api/internal/ai/profiles/${encodeURIComponent(key)}`, { method: 'PATCH', body: JSON.stringify(patch) }, 'AI profile updated.', async () => {
      const fresh = await api('/api/internal/ai/health');
      setAi(fresh as AnyRow);
    });
  }

  async function loadOperations() {
    try {
      const [r, a, p] = await Promise.all([
        api('/api/internal/operations/organisation-requests'),
        api('/api/internal/operations/creators/applications'),
        api('/api/internal/operations/creators/payouts'),
      ]);
      setOps({ requests: rows(r, 'requests'), applications: rows(a, 'applications'), payouts: rows(p, 'payouts') });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load operations.'); }
  }

  useEffect(() => {
    if (section === 'operations' && ops.requests.length === 0 && ops.applications.length === 0 && ops.payouts.length === 0) void loadOperations();
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  function logout() {
    localStorage.removeItem('learnora_internal_token');
    localStorage.removeItem('phx_token');
    localStorage.removeItem('phx_admin_user');
    window.location.href = '/';
  }

  const aiProfiles = rows(ai, 'profiles');
  const aiSummary = (ai?.summary || {}) as AnyRow;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="flex min-h-screen">
        {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/70 lg:hidden" />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#101010] transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d7ad35] font-black text-black">L</div>
            <div><p className="font-semibold">Learnora ME</p><p className="text-[11px] uppercase tracking-[.18em] text-[#d7ad35]">Secure Workspace</p></div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            {['Workspace','Platform','Control'].map(group => <div key={group} className="mb-6">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/30">{group}</p>
              {nav.filter(x => x.group === group).map(item => {
                const Icon = item.icon;
                const active = section === item.id;
                return <button key={item.id} onClick={() => { setSection(item.id); setMobileOpen(false); }} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active ? 'bg-[#d7ad35]/10 text-[#f2d477] ring-1 ring-[#d7ad35]/20' : 'text-white/55 hover:bg-white/[.04] hover:text-white'}`}>
                  <Icon size={17}/><span className="flex-1">{item.label}</span>{active && <ChevronRight size={14}/>}
                </button>;
              })}
            </div>)}
          </div>
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 rounded-xl bg-white/[.03] p-3">
              <p className="truncate text-sm font-medium">{str(me || {}, 'name', 'Super Admin')}</p>
              <p className="truncate text-xs text-white/35">{str(me || {}, 'email', '')}</p>
            </div>
            <Button variant="ghost" onClick={logout}><LogOut size={15}/> Sign out</Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-white/10 bg-[#0b0b0b]/90 px-4 backdrop-blur md:px-7">
            <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-white/10 p-2 lg:hidden"><Menu size={18}/></button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/35">Super Admin / {currentNav.group}</p>
              <h1 className="truncate text-xl font-semibold">{currentNav.label}</h1>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {notice && <span className="max-w-xs truncate text-xs text-emerald-300">{notice}</span>}
              <Button variant="ghost" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</Button>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] p-4 md:p-7">
            {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"><span>{error}</span><button onClick={() => setError('')}><X size={15}/></button></div>}
            {notice && <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

            {booting ? (
              <div className="grid min-h-[60vh] place-items-center"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-[#d7ad35]" size={30}/><p className="mt-4 text-sm text-white/50">Initialising workspace…</p><p className="mt-1 text-xs text-white/25">This runs once. Sidebar navigation will not reload the workspace.</p></div></div>
            ) : section === 'overview' ? (
              <Overview organisations={organisations} staff={staff} teams={teams} courses={courses} aiSummary={aiSummary} onNavigate={setSection} />
            ) : section === 'organisations' ? (
              <section>
                <SectionHead title="Organisations" description="Create and manage the organisations that run on Learnora ME." action={<Button onClick={() => setModal('org')}><Plus size={16}/> New organisation</Button>} />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{organisations.map(o => <Card key={String(o.id)} className="p-5"><div className="flex items-start justify-between"><div><h3 className="font-semibold">{str(o,'name')}</h3><p className="mt-1 text-xs text-white/35">{str(o,'slug')}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${o.is_active === false ? 'bg-red-500/10 text-red-200' : 'bg-emerald-500/10 text-emerald-200'}`}>{o.is_active === false ? 'Inactive' : 'Active'}</span></div><div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-white/[.03] p-3"><span className="text-white/35">Type</span><p className="mt-1">{str(o,'organisation_type')}</p></div><div className="rounded-xl bg-white/[.03] p-3"><span className="text-white/35">Template</span><p className="mt-1">{str(o,'template')}</p></div></div><p className="mt-4 text-xs text-white/35">Created {fmtDate(o.created_at)}</p></Card>)}</div>
                {organisations.length === 0 && <Empty title="No organisations yet" text="Create the first organisation instead of using hard-coded WitStart logic." />}
              </section>
            ) : section === 'people' ? (
              <section>
                <SectionHead title="People & Staff" description="Manage the internal Learnora workforce. Staff identities are separate from customer organisation users." action={<Button onClick={() => setModal('staff')}><Plus size={16}/> Add staff</Button>} />
                <Toolbar search={search} setSearch={setSearch} placeholder="Search staff by name, email or title" />
                <Card className="overflow-hidden"><Table headers={['Name','Email','Job title','Status','Roles','Joined']} rows={filteredStaff.map(s => [str(s,'name'),str(s,'email'),str(s,'job_title'),String((s.staff as AnyRow)?.status || s.status || '—'), Array.isArray(s.roles) ? (s.roles as AnyRow[]).map(r => String(r.name || r.slug)).join(', ') : '—', fmtDate((s.staff as AnyRow)?.joined_at)])} /></Card>
              </section>
            ) : section === 'teams' ? (
              <section>
                <SectionHead title="Teams & Departments" description="Build Learnora's own internal organisational structure and assign staff to teams." action={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModal('dept')}><Plus size={15}/> Department</Button><Button onClick={() => setModal('team')}><Plus size={15}/> Team</Button></div>} />
                <div className="grid gap-5 lg:grid-cols-2"><Card className="p-5"><h3 className="font-semibold">Departments</h3><div className="mt-4 space-y-2">{departments.map(d => <div key={String(d.id)} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="font-medium">{str(d,'name')}</p><p className="text-xs text-white/35">{str(d,'slug')} · {str(d,'status')}</p></div>)}{departments.length === 0 && <Empty title="No departments" text="Create one to organise the internal team." small/>}</div></Card><Card className="p-5"><h3 className="font-semibold">Teams</h3><div className="mt-4 space-y-2">{teams.map(t => <div key={String(t.id)} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="font-medium">{str(t,'name')}</p><p className="text-xs text-white/35">{str(t,'slug')} · {str(t,'status')}</p></div>)}{teams.length === 0 && <Empty title="No teams" text="Create teams and assign staff as the company grows." small/>}</div></Card></div>
              </section>
            ) : section === 'content' ? (
              <section>
                <SectionHead title="Courses & Content" description="The super admin can create courses, build modules and lessons, publish/archive content, and manage the learning hierarchy." action={<Button onClick={() => setModal('course')}><Plus size={16}/> New course</Button>} />
                <Toolbar search={search} setSearch={setSearch} placeholder="Search courses" />
                <div className="grid gap-4 xl:grid-cols-[1fr_1.25fr]">
                  <Card className="overflow-hidden"><Table headers={['Course','Ownership','Status','Created']} rows={filteredCourses.map(c => [<button key={String(c.id)} onClick={() => void openCourse(String(c.id))} className="text-left font-medium text-[#f2d477] hover:underline">{str(c,'title')}</button>,str(c,'ownership'),str(c,'status'),fmtDate(c.created_at)])} /></Card>
                  <Card className="min-h-[420px] p-5">
                    {!structure ? <Empty title="Select a course" text="Open a course to inspect its modules and lessons, then create and edit the learning structure." /> : <CourseBuilder structure={structure} onAddModule={() => setModal('module')} onAddLesson={(moduleId) => { setModal('lesson:'+moduleId); }} />}
                  </Card>
                </div>
              </section>
            ) : section === 'ai' ? (
              <section>
                <SectionHead title="AI Control Centre" description="This is the operational AI layer: providers, models, profiles, fallbacks, limits, health and live tests." action={<Button variant="ghost" onClick={() => void refresh(true)}><RefreshCw size={15}/> Refresh AI</Button>} />
                <div className="grid gap-4 md:grid-cols-4">
                  <Metric label="Profiles" value={String(aiSummary.profiles ?? 0)} icon={Sparkles}/>
                  <Metric label="Enabled" value={String(aiSummary.enabled_profiles ?? 0)} icon={Zap}/>
                  <Metric label="Requests" value={String(aiSummary.recent_requests ?? 0)} icon={Activity}/>
                  <Metric label="Avg latency" value={aiSummary.average_latency_ms ? `${aiSummary.average_latency_ms}ms` : '—'} icon={Bot}/>
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-[.85fr_1.5fr]">
                  <Card className="p-5"><h3 className="font-semibold">Providers</h3><div className="mt-4 space-y-2">{rows(ai,'providers').map(p => <div key={String(p.provider_key)} className="flex items-center justify-between rounded-xl bg-black/20 p-3"><div><p className="font-medium">{str(p,'display_name')}</p><p className="text-xs text-white/35">{str(p,'provider_key')} · {str(p,'default_model')}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${p.enabled ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/5 text-white/35'}`}>{p.enabled ? 'Enabled' : 'Disabled'}</span></div>)}</div></Card>
                  <Card className="overflow-hidden"><div className="border-b border-white/10 p-5"><h3 className="font-semibold">AI profiles</h3><p className="mt-1 text-xs text-white/35">Tutor, coach, practice, project, instructor, organisation, contract drafting, content generation and reasoning.</p></div><div className="divide-y divide-white/10">{aiProfiles.map(p => { const k=String(p.profile_key); return <div key={k} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{str(p,'display_name',k)}</p><p className="mt-1 text-xs text-white/35">{k} · {str(p,'provider_key')} · {str(p,'model')}</p></div><div className="flex gap-2"><Button variant="ghost" onClick={() => void testAI(k)}><Zap size={14}/> Test</Button><Button onClick={() => void updateAI(p)}>Save</Button></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><Input label="Model" value={String(aiEdit[`${k}:model`] ?? p.model ?? '')} onChange={v => setAiEdit(x=>({...x,[`${k}:model`]:v}))}/><Input label="Fallback model" value={String(aiEdit[`${k}:fallback_model`] ?? p.fallback_model ?? '')} onChange={v => setAiEdit(x=>({...x,[`${k}:fallback_model`]:v}))}/><Select label="Enabled" value={String(aiEdit[`${k}:enabled`] ?? p.enabled ?? true)} onChange={v => setAiEdit(x=>({...x,[`${k}:enabled`]:v === 'true'}))}><option value="true">Enabled</option><option value="false">Disabled</option></Select></div></div>; })}</div></Card>
                </div>
              </section>
            ) : section === 'operations' ? (
              <section>
                <SectionHead title="Commercial & Operations" description="Run organisation intake, creator workflows and commercial operations from one internal workspace." action={<Button variant="ghost" onClick={() => void loadOperations()}><RefreshCw size={15}/> Refresh</Button>} />
                <div className="grid gap-5 lg:grid-cols-3"><ListCard title="Organisation requests" items={ops.requests} primary={['name','email','status']}/><ListCard title="Creator applications" items={ops.applications} primary={['name','email','status']}/><ListCard title="Payouts" items={ops.payouts} primary={['amount','status','created_at']}/></div>
              </section>
            ) : section === 'security' ? (
              <section>
                <SectionHead title="Security & Access" description="Internal access is permission-based. This screen shows the identity and security contract used by the workspace." />
                <div className="grid gap-5 lg:grid-cols-2"><Card className="p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-[#d7ad35]"/><div><h3 className="font-semibold">Internal authentication</h3><p className="text-xs text-white/40">JWT context: internal / staff</p></div></div><div className="mt-5 space-y-3 text-sm"><Info label="Staff ID" value={str(me || {},'staff_id')}/><Info label="Status" value={str(me || {},'status')}/><Info label="Job title" value={str(me || {},'job_title')}/><Info label="Roles" value={Array.isArray(me?.roles) ? (me?.roles as unknown[]).join(', ') : '—'}/></div></Card><Card className="p-6"><h3 className="font-semibold">Permission model</h3><p className="mt-2 text-sm text-white/45">Every internal API action is checked against staff role assignments and permission keys. A missing permission should return a clear 403 instead of silently showing fake controls.</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{['staff.view','staff.update','staff.roles','staff.teams','organisations.view','organisations.create','content.manage','content.video','ai.manage'].map(p => <div key={p} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">{p}</div>)}</div></Card></div>
              </section>
            ) : (
              <section>
                <SectionHead title="Workspace Settings" description="Operational settings for this internal console." />
                <div className="grid gap-5 lg:grid-cols-2"><Card className="p-6"><h3 className="font-semibold">Connection</h3><div className="mt-4 space-y-3"><Info label="Backend" value={API_URL}/><Info label="Auth token" value={token() ? 'Present' : 'Missing'}/><Info label="Frontend" value={typeof window === 'undefined' ? '—' : window.location.origin}/></div></Card><Card className="p-6"><h3 className="font-semibold">Workspace behaviour</h3><p className="mt-2 text-sm text-white/45">Navigation is client-side. Switching tabs does not re-authenticate, rebuild the dashboard or show a full-screen loading state. Use Refresh only when you actually want fresh data.</p></Card></div>
              </section>
            )}
          </div>
        </main>
      </div>

      {modal === 'org' && <Modal title="Create organisation" onClose={() => setModal(null)}><form onSubmit={createOrganisation} className="space-y-4"><Input label="Organisation name" value={orgForm.name} onChange={v=>setOrgForm(x=>({...x,name:v}))} placeholder="WitStart Academy"/><Input label="Slug" value={orgForm.slug} onChange={v=>setOrgForm(x=>({...x,slug:v}))} placeholder="witstart"/><Input label="Description" value={orgForm.description} onChange={v=>setOrgForm(x=>({...x,description:v}))}/><div className="grid gap-4 md:grid-cols-2"><Select label="Organisation type" value={orgForm.type} onChange={v=>setOrgForm(x=>({...x,type:v}))}><option value="academy">Academy</option><option value="business">Business</option><option value="enterprise">Enterprise</option></Select><Select label="Template" value={orgForm.template} onChange={v=>setOrgForm(x=>({...x,template:v}))}><option value="academy">Academy</option><option value="corporate">Corporate</option><option value="community">Community</option></Select></div><Button type="submit"><Plus size={15}/> Create</Button></form></Modal>}

      {modal === 'staff' && <Modal title="Create internal staff account" onClose={() => setModal(null)}><form onSubmit={createStaff} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Input label="Name" value={staffForm.name} onChange={v=>setStaffForm(x=>({...x,name:v}))}/><Input label="Email" value={staffForm.email} onChange={v=>setStaffForm(x=>({...x,email:v}))} type="email"/><Input label="Password" value={staffForm.password} onChange={v=>setStaffForm(x=>({...x,password:v}))} type="password"/><Input label="Job title" value={staffForm.job_title} onChange={v=>setStaffForm(x=>({...x,job_title:v}))}/></div><Input label="Role slug" value={staffForm.role_slug} onChange={v=>setStaffForm(x=>({...x,role_slug:v}))} placeholder="support / product / engineering / super_admin"/><Button type="submit"><Plus size={15}/> Create staff</Button></form></Modal>}

      {modal === 'dept' && <Modal title="Create department" onClose={() => setModal(null)}><form onSubmit={createDepartment} className="space-y-4"><Input label="Name" value={deptForm.name} onChange={v=>setDeptForm(x=>({...x,name:v}))}/><Input label="Slug" value={deptForm.slug} onChange={v=>setDeptForm(x=>({...x,slug:v}))}/><Input label="Description" value={deptForm.description} onChange={v=>setDeptForm(x=>({...x,description:v}))}/><Button type="submit"><Plus size={15}/> Create department</Button></form></Modal>}

      {modal === 'team' && <Modal title="Create team" onClose={() => setModal(null)}><form onSubmit={createTeam} className="space-y-4"><Input label="Name" value={teamForm.name} onChange={v=>setTeamForm(x=>({...x,name:v}))}/><Input label="Slug" value={teamForm.slug} onChange={v=>setTeamForm(x=>({...x,slug:v}))}/><Input label="Description" value={teamForm.description} onChange={v=>setTeamForm(x=>({...x,description:v}))}/><Select label="Department" value={teamForm.department_id} onChange={v=>setTeamForm(x=>({...x,department_id:v}))}><option value="">No department</option>{departments.map(d=><option key={String(d.id)} value={String(d.id)}>{str(d,'name')}</option>)}</Select><Button type="submit"><Plus size={15}/> Create team</Button></form></Modal>}

      {modal === 'course' && <Modal title="Create course" onClose={() => setModal(null)}><form onSubmit={createCourse} className="space-y-4"><Input label="Title" value={courseForm.title} onChange={v=>setCourseForm(x=>({...x,title:v}))}/><Input label="Slug" value={courseForm.slug} onChange={v=>setCourseForm(x=>({...x,slug:v}))}/><Input label="Description" value={courseForm.description} onChange={v=>setCourseForm(x=>({...x,description:v}))}/><div className="grid gap-4 md:grid-cols-2"><Select label="Level" value={courseForm.level} onChange={v=>setCourseForm(x=>({...x,level:v}))}><option>beginner</option><option>intermediate</option><option>advanced</option></Select><Select label="Ownership" value={courseForm.ownership} onChange={v=>setCourseForm(x=>({...x,ownership:v}))}><option value="learnora">Learnora</option><option value="organisation">Organisation</option></Select></div>{courseForm.ownership === 'organisation' && <Select label="Organisation" value={courseForm.organisation_id} onChange={v=>setCourseForm(x=>({...x,organisation_id:v}))}><option value="">Select</option>{organisations.map(o=><option key={String(o.id)} value={String(o.id)}>{str(o,'name')}</option>)}</Select>}<Select label="Initial status" value={courseForm.status} onChange={v=>setCourseForm(x=>({...x,status:v}))}><option value="draft">Draft</option><option value="published">Published</option></Select><Button type="submit"><Plus size={15}/> Create course</Button></form></Modal>}

      {modal === 'module' && <Modal title="Add module" onClose={() => setModal(null)}><form onSubmit={createModule} className="space-y-4"><Input label="Module title" value={moduleForm.title} onChange={v=>setModuleForm(x=>({...x,title:v}))}/><Input label="Description" value={moduleForm.description} onChange={v=>setModuleForm(x=>({...x,description:v}))}/><Button type="submit"><Plus size={15}/> Add module</Button></form></Modal>}

      {modal?.startsWith('lesson:') && <Modal title="Add lesson" onClose={() => setModal(null)}><form onSubmit={e => createLesson(e, modal.slice(7))} className="space-y-4"><Input label="Lesson title" value={lessonForm.title} onChange={v=>setLessonForm(x=>({...x,title:v}))}/><Input label="Description" value={lessonForm.description} onChange={v=>setLessonForm(x=>({...x,description:v}))}/><Select label="Lesson type" value={lessonForm.lesson_type} onChange={v=>setLessonForm(x=>({...x,lesson_type:v}))}><option value="mixed">Mixed</option><option value="video">Video</option><option value="article">Article</option><option value="text">Text</option><option value="practice">Practice</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option><option value="project">Project</option></Select><Input label="Duration (minutes)" value={lessonForm.duration_minutes} onChange={v=>setLessonForm(x=>({...x,duration_minutes:v}))}/><label className="block space-y-1.5"><span className="text-xs text-white/55">Lesson content</span><textarea value={lessonForm.content} onChange={e=>setLessonForm(x=>({...x,content:e.target.value}))} rows={7} className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-[#d7ad35]/60"/></label><Button type="submit"><Plus size={15}/> Add lesson</Button></form></Modal>}
    </div>
  );
}

function SectionHead({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="mb-2 text-xs uppercase tracking-[.18em] text-[#d7ad35]">Learnora Control Plane</p><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 max-w-3xl text-sm text-white/40">{description}</p></div>{action}</div>;
}

function Toolbar({ search, setSearch, placeholder }: { search: string; setSearch: (v:string)=>void; placeholder: string }) {
  return <div className="mb-4 flex gap-3"><div className="relative max-w-md flex-1"><Search size={16} className="absolute left-3 top-3 text-white/30"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-[#151515] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#d7ad35]/50"/></div></div>;
}

function Table({ headers, rows: data }: { headers: string[]; rows: ReactNode[][] }) {
  if (!data.length) return <div className="p-8 text-center text-sm text-white/35">No records found.</div>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[.02]"><tr>{headers.map(h=><th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[.15em] text-white/35">{h}</th>)}</tr></thead><tbody className="divide-y divide-white/10">{data.map((r,i)=><tr key={i} className="hover:bg-white/[.025]">{r.map((cell,j)=><td key={j} className="px-4 py-4 text-white/70">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Empty({ title, text, small=false }: { title:string; text:string; small?:boolean }) {
  return <div className={`grid place-items-center text-center ${small ? 'py-6' : 'min-h-[300px]'}`}><FileText className="mb-3 text-white/20" size={small?24:32}/><p className="font-medium text-white/60">{title}</p><p className="mt-1 max-w-sm text-xs text-white/30">{text}</p></div>;
}

function Info({ label, value }: { label:string; value:string }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl bg-black/20 px-3 py-2.5 text-sm"><span className="text-white/35">{label}</span><span className="max-w-[65%] truncate text-right text-white/75">{value}</span></div>;
}

function Overview({ organisations, staff, teams, courses, aiSummary, onNavigate }: { organisations:AnyRow[]; staff:AnyRow[]; teams:AnyRow[]; courses:AnyRow[]; aiSummary:AnyRow; onNavigate:(s:Section)=>void }) {
  return <section>
    <SectionHead title="Command Centre" description="One place to see what exists, what needs attention, and what you can actually operate." action={<Button onClick={()=>onNavigate('ai')}><Sparkles size={15}/> Open AI Control Centre</Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Organisations" value={organisations.length} icon={Building2}/><Metric label="Internal staff" value={staff.length} icon={Users}/><Metric label="Teams" value={teams.length} icon={Network}/><Metric label="Courses" value={courses.length} icon={Layers3}/></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
      <Card className="p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Platform control</h3><p className="mt-1 text-xs text-white/35">The main operations you can perform without leaving the workspace.</p></div><Activity className="text-[#d7ad35]" size={20}/></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['organisations','Create organisations and configure their templates.'],['people','Create Learnora staff identities and manage roles.'],['teams','Create departments and internal teams.'],['content','Create courses, modules, lessons and structure.'],['ai','Configure models, fallbacks and run AI health tests.'],['operations','Review organisation and creator operations.']].map(([id,text])=><button key={id} onClick={()=>onNavigate(id as Section)} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:border-[#d7ad35]/30"><p className="font-medium">{nav.find(n=>n.id===id)?.label}</p><p className="mt-1 text-xs text-white/35">{text}</p></button>)}</div></Card>
      <Card className="p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#d7ad35]/10 p-2.5 text-[#f2d477]"><Bot size={20}/></div><div><h3 className="font-semibold">AI health</h3><p className="text-xs text-white/35">Live from internal AI infrastructure</p></div></div><div className="mt-5 space-y-3"><Info label="Enabled profiles" value={String(aiSummary.enabled_profiles ?? 0)}/><Info label="Enabled providers" value={String(aiSummary.enabled_providers ?? 0)}/><Info label="Recent successes" value={String(aiSummary.recent_successes ?? 0)}/><Info label="Recent failures" value={String(aiSummary.recent_failures ?? 0)}/></div><button onClick={()=>onNavigate('ai')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7ad35]/20 bg-[#d7ad35]/10 py-2.5 text-sm text-[#f2d477]">Manage AI <ChevronRight size={15}/></button></Card>
    </div>
  </section>;
}

function CourseBuilder({ structure, onAddModule, onAddLesson }: { structure:AnyRow; onAddModule:()=>void; onAddLesson:(id:string)=>void }) {
  const modules = Array.isArray(structure.modules) ? structure.modules as AnyRow[] : [];
  return <div><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{str(structure.course as AnyRow || {},'title')}</h3><p className="mt-1 text-xs text-white/35">{str(structure.course as AnyRow || {},'status')} · {modules.length} modules · {String(structure.lesson_count ?? 0)} lessons</p></div><Button onClick={onAddModule}><Plus size={14}/> Module</Button></div><div className="mt-5 space-y-3">{modules.map((m,i)=><div key={String(m.id)} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between"><div><p className="font-medium">Module {i+1}: {str(m,'title')}</p><p className="text-xs text-white/35">{str(m,'status')}</p></div><Button variant="ghost" onClick={()=>onAddLesson(String(m.id))}><Plus size={14}/> Lesson</Button></div><div className="mt-3 space-y-2">{Array.isArray(m.lessons) && (m.lessons as AnyRow[]).map(l=><div key={String(l.id)} className="rounded-xl bg-white/[.03] px-3 py-2 text-sm"><span className="text-white/70">{str(l,'title')}</span><span className="ml-2 text-xs text-white/30">{str(l,'lesson_type')}</span></div>)}{(!Array.isArray(m.lessons) || !(m.lessons as unknown[]).length) && <p className="text-xs text-white/25">No lessons yet.</p>}</div></div>)}{!modules.length && <Empty title="Course is empty" text="Add the first module, then build lessons underneath it."/>}</div></div>;
}

function ListCard({ title, items, primary }: { title:string; items:AnyRow[]; primary:string[] }) {
  return <Card className="p-5"><h3 className="font-semibold">{title}</h3><div className="mt-4 space-y-2">{items.slice(0,12).map((x,i)=><div key={i} className="rounded-xl bg-black/20 p-3">{primary.map(k=><p key={k} className={k===primary[0] ? 'font-medium' : 'text-xs text-white/35'}>{str(x,k)}</p>)}</div>)}{!items.length && <Empty title="Nothing here yet" text="No records were returned by the backend." small/>}</div></Card>;
}
