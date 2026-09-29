'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const dynamic = 'force-dynamic';
type Tab = 'overview' | 'live' | 'users' | 'paying' | 'free' | 'witstart' | 'billing' | 'security';

interface UserRecord {
  id: number;
  email: string;
  name?: string;
  role: string;
  sub_status: string;
  billing_interval?: string;
  region?: string;
  created_at: number;
  trial_ends_at?: number;
  expires_at?: number;
  last_login?: number;
  paystack_customer_code?: string;
}

interface Activity {
  id: string;
  email: string;
  action: string;
  time: number;
  ip?: string;
}

interface SecurityLog {
  id: string;
  event: string;
  time: number;
  ip?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Forms
  const [witEmail, setWitEmail] = useState("");
  const [witName, setWitName] = useState("");
  const [witPass, setWitPass] = useState("");
  const [freeEmail, setFreeEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem('phx_token') || '';

  const fetchData = useCallback(async () => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch Users
      const usersRes = await fetch(`${API_URL}/api/admin/users`, { headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || data || []);
      }

      // Fetch Real Activity Stream
      const actRes = await fetch(`${API_URL}/api/admin/activity`, { headers });
      if (actRes.ok) {
        const data = await actRes.json();
        setActivity(data.activity || data || []);
      }

      // Fetch Real Security Logs
      const secRes = await fetch(`${API_URL}/api/admin/security-logs`, { headers });
      if (secRes.ok) {
        const data = await secRes.json();
        setSecurityLogs(data.logs || data || []);
      }
    } catch {
      // Handle network or parsing errors silently or show notification
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('phx_role');
    const email = localStorage.getItem('phx_email');
    const token = localStorage.getItem('phx_token');
    if (role !== 'admin' || !token) { 
      router.push('/'); 
      return; 
    }
    setAdminEmail(email || '');
    fetchData();
  }, [router, fetchData]);

  const filtered = (users || []).filter(u => {
    if (!u?.email) return false;
    const sub = String(u.sub_status || '').toLowerCase();
    const role = String(u.role || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const name = String(u.name || '').toLowerCase();
    const s = search.toLowerCase();

    if (search && !email.includes(s) && !name.includes(s)) return false;
    if (tab === 'paying') return sub === 'active' && role === 'normal';
    if (tab === 'free') return sub !== 'active';
    if (tab === 'witstart') return role === 'witstart';
    return true;
  });

  const paying = users.filter(u => u.sub_status === 'active' && u.role === 'normal');
  const free = users.filter(u => u.sub_status !== 'active');
  const witstart = users.filter(u => u.role === 'witstart');
  const now = Math.floor(Date.now() / 1000);

  const showMsg = (m: string, err = false) => { 
    err ? setErrorMsg(m) : setSuccessMsg(m); 
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 4000); 
  };

  const createWitstart = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email: witEmail, name: witName, password: witPass, role: 'witstart' })
      });
      const d = await res.json(); 
      if (!res.ok) throw new Error(d.detail || 'Failed');
      showMsg(`Witstart created for ${witEmail} - auto-deletes in 13 weeks`); 
      setWitEmail(''); setWitName(''); setWitPass(''); 
      fetchData();
    } catch (e: any) { 
      showMsg(e.message, true); 
    } finally { 
      setLoading(false); 
    }
  };

  const grantFree = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/grant-free-month`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email: freeEmail, months: 1 })
      });
      const d = await res.json(); 
      if (!res.ok) throw new Error(d.detail || 'Failed');
      showMsg(`1 month free granted to ${freeEmail}`); 
      setFreeEmail(''); 
      fetchData();
    } catch (e: any) { 
      showMsg(e.message, true); 
    } finally { 
      setLoading(false); 
    }
  };

  const delUser = async (email: string) => {
    if (!confirm(`Delete ${email} from database?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');
      showMsg(`Successfully deleted ${email}`);
      fetchData();
    } catch (e: any) {
      showMsg(e.message, true);
    }
  };

  const NavItem = ({ id, label, icon, count }: { id: Tab, label: string, icon: string, count?: number }) => (
    <button 
      onClick={() => setTab(id)} 
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition ${tab === id ? 'bg-white text-[#111827] shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
    >
      <span className="flex items-center gap-2.5"><span className="text-[14px]">{icon}</span>{label}</span>
      {count !== undefined && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tab === id ? 'bg-[#111827] text-white' : 'bg-white/15 text-white'}`}>{count}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f6f5f3] text-[#111827] flex">
      {/* SIDEBAR */}
      <aside className="w-[300px] bg-[#111827] text-white hidden lg:flex flex-col sticky top-0 h-screen border-r border-white/10">
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D7AD35] to-[#F2D477] flex items-center justify-center text-[#111827] font-black">P</div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-[#F2D477]">THE PHOENIX</p>
            <p className="text-[13px] font-extrabold -mt-0.5">ANALYTICS • ADMIN</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Monitoring</p>
            <NavItem id="overview" label="Overview" icon="◉" />
            <NavItem id="live" label="Live Activity" icon="●" count={activity.length} />
            <NavItem id="security" label="Security Logs" icon="◍" count={securityLogs.length} />
          </div>
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Users</p>
            <NavItem id="users" label="All Users" icon="◎" count={users.length} />
            <NavItem id="paying" label="Paying Users" icon="◆" count={paying.length} />
            <NavItem id="free" label="Free / Pending" icon="◇" count={free.length} />
            <NavItem id="witstart" label="Witstart Cohort" icon="✦" count={witstart.length} />
          </div>
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Finance</p>
            <NavItem id="billing" label="Billing & Revenue" icon="₦" />
          </div>

          <div className="mx-3 mt-4 bg-white/[0.06] border border-white/10 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-[#F2D477] uppercase tracking-wider">Witstart Rule</p>
            <p className="text-[11px] text-white/60 mt-1 leading-relaxed">Witstart accounts auto-delete exactly <b className="text-white">13 weeks (91 days)</b> after creation. No manual cleanup needed.</p>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#D7AD35] text-[#111827] flex items-center justify-center font-bold text-xs">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{adminEmail}</p>
              <p className="text-[10px] text-white/50">Admin • Full access</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); router.push('/'); }} className="mt-3 w-full py-2.5 rounded-xl bg-white text-[#111827] text-xs font-bold hover:bg-[#F2D477] transition">Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[64px] bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center font-bold">P</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B08A1E]">{tab}</p>
              <h1 className="text-[15px] font-extrabold -mt-0.5">
                {tab === 'overview' && 'Site Monitoring Overview'}
                {tab === 'live' && 'Live User Activity'}
                {tab === 'users' && 'All Registered Users'}
                {tab === 'paying' && 'Paying Subscribers'}
                {tab === 'free' && 'Free & Pending Users'}
                {tab === 'witstart' && 'Witstart Cohort - 13 Week Expiry'}
                {tab === 'billing' && 'Billing & Revenue'}
                {tab === 'security' && 'Security & Access Logs'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-2">
              <span className="text-slate-400 text-xs">⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email, name, IP..." className="bg-transparent outline-none text-xs w-[200px]" />
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500 animate-pulse border-2 border-white shadow-sm" title="Live database polling active" />
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-[1400px] w-full mx-auto">
          {successMsg && <div className="bg-[#111827] text-[#F2D477] border border-[#D7AD35]/30 px-4 py-3 rounded-xl text-xs font-bold">✓ {successMsg}</div>}
          {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold">⚠ {errorMsg}</div>}

          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Users</p><p className="text-2xl font-extrabold mt-1">{users.length}</p><p className="text-[11px] text-emerald-600 mt-1">↑ From Database</p></div>
                <div className="bg-[#111827] text-white rounded-2xl p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-[#F2D477]">Paying</p><p className="text-2xl font-extrabold mt-1">{paying.length}</p><p className="text-[11px] text-white/50 mt-1">{paying.length > 0 ? `${Math.round(paying.length / users.length * 100) || 0}% conversion` : 'No revenue yet'}</p></div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Free / Pending</p><p className="text-2xl font-extrabold mt-1">{free.length}</p><p className="text-[11px] text-slate-400 mt-1">Need activation</p></div>
                <div className="bg-white border border-amber-200 rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-white"><p className="text-[10px] font-bold uppercase tracking-wider text-[#B08A1E]">Witstart (13w)</p><p className="text-2xl font-extrabold mt-1">{witstart.length}</p><p className="text-[11px] text-amber-700 mt-1">Auto-delete 91d</p></div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold">Recent Activity Stream</h3>
                  <div className="mt-4 space-y-3">
                    {activity.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4">No recent activity found in database.</p>
                    ) : (
                      activity.slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{a.email?.[0]?.toUpperCase() || 'U'}</div>
                            <div><p className="text-xs font-bold">{a.email}</p><p className="text-[11px] text-slate-500">{a.action}</p></div>
                          </div>
                          <div className="text-right"><p className="text-[11px] text-slate-400">{Math.floor((Date.now() / 1000 - a.time) / 60)}m ago</p><p className="text-[10px] text-slate-400">{a.ip}</p></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#B08A1E]">Quick Actions</h3>
                    <form onSubmit={createWitstart} className="mt-4 space-y-2">
                      <p className="text-xs font-bold">Create Witstart</p>
                      <input value={witName} onChange={e => setWitName(e.target.value)} placeholder="Name" className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50" />
                      <input value={witEmail} onChange={e => setWitEmail(e.target.value)} required placeholder="witstart email" type="email" className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50" />
                      <input value={witPass} onChange={e => setWitPass(e.target.value)} required placeholder="Temp password" type="password" className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50" />
                      <button disabled={loading} className="w-full py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold">Create (91d expiry)</button>
                    </form>
                    <form onSubmit={grantFree} className="mt-5 space-y-2">
                      <p className="text-xs font-bold">Grant 1 Month Free</p>
                      <input value={freeEmail} onChange={e => setFreeEmail(e.target.value)} required placeholder="user email" type="email" className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50" />
                      <button disabled={loading} className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold">Grant Free 30d</button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {(tab === 'users' || tab === 'paying' || tab === 'free' || tab === 'witstart') && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-extrabold">{filtered.length} users • {tab}</p>
                <button onClick={() => fetchData()} className="text-[11px] font-bold border border-slate-200 rounded-full px-3 py-1.5 hover:bg-slate-50">Refresh Database</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr><th className="px-6 py-3">User</th><th className="py-3">Role</th><th className="py-3">Status / Plan</th><th className="py-3">Joined</th><th className="py-3">Expiry</th><th className="py-3 text-right pr-6">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(u => {
                      const expires = u.role === 'witstart' ? (u.expires_at || (u.created_at + 91 * 86400)) : u.trial_ends_at;
                      const days = expires ? Math.ceil((expires - now) / 86400) : null;
                      return (
                        <tr key={u.email} className="hover:bg-slate-50/60">
                          <td className="px-6 py-4"><p className="font-bold text-[#111827]">{u.email}</p><p className="text-[11px] text-slate-400">{u.name || '-'} • {u.region || 'NG'} • {u.billing_interval || 'monthly'}</p></td>
                          <td className="py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${u.role === 'witstart' ? 'bg-[#111827] text-[#F2D477] border-[#111827]' : u.role === 'admin' ? 'bg-amber-50 text-[#B08A1E] border-amber-200' : 'bg-slate-100 border-slate-200'}`}>{u.role}</span></td>
                          <td className="py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${u.sub_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{u.sub_status}{u.paystack_customer_code ? ' • Paying' : ''}</span></td>
                          <td className="py-4 text-slate-500">{new Date(u.created_at * 1000).toLocaleDateString()}</td>
                          <td className="py-4">{expires ? <span className={`text-[11px] px-2 py-1 rounded-full border font-bold ${days !== null && days <= 7 ? 'bg-red-50 text-red-600 border-red-200' : days !== null && days <= 30 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{days !== null ? (days <= 0 ? 'Expired' : `${days}d left`) : ''} • {new Date(expires * 1000).toLocaleDateString()}</span> : <span className="text-slate-400">-</span>}</td>
                          <td className="py-4 text-right pr-6"><button onClick={() => delUser(u.email)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg font-bold">Delete</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'live' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-extrabold flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Activity Monitor</h3>
              <p className="text-xs text-slate-500 mt-1">Real-time actions fetched directly from the database event stream.</p>
              <div className="mt-6 space-y-2">
                {activity.length === 0 ? (
                  <p className="text-xs text-slate-400">No activity logs found.</p>
                ) : (
                  activity.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div><p className="text-xs font-bold">{a.email} — {a.action}</p><p className="text-[11px] text-slate-500">{new Date(a.time * 1000).toLocaleString()} • IP {a.ip}</p></div>
                      <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-1 rounded-full">LIVE</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-sm font-extrabold">Revenue Overview</h3>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-[#111827] text-white rounded-xl p-4"><p className="text-[10px] text-[#F2D477]">MRR Est.</p><p className="text-xl font-bold mt-1">₦{(paying.length * 12000).toLocaleString()}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><p className="text-[10px] text-slate-500">Paying Users</p><p className="text-xl font-bold mt-1">{paying.length}</p></div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-[10px] text-amber-700">Free Users</p><p className="text-xl font-bold mt-1">{free.length}</p></div>
                </div>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase text-slate-400 border-b"><tr><th className="py-2">Email</th><th>Plan</th><th>Customer Code</th><th>Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {paying.map(u => <tr key={u.email}><td className="py-2 font-bold">{u.email}</td><td>{u.billing_interval}</td><td className="text-[11px] text-slate-500">{u.paystack_customer_code || '-'}</td><td className="text-emerald-600 font-bold">{u.sub_status}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-[#111827] text-white rounded-2xl p-6">
                <h3 className="text-sm font-bold text-[#F2D477]">Paystack Webhook</h3>
                <p className="text-xs text-white/60 mt-2">Ensure webhook URL is set in Paystack dashboard:</p>
                <code className="mt-3 block bg-white/10 border border-white/10 rounded-xl p-3 text-[11px]">https://your-api.com/api/billing/webhook</code>
                <p className="text-[11px] text-white/50 mt-3">Events: charge.success, subscription.create, subscription.not_renew</p>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-extrabold">Security Logs & Access Control</h3>
              <p className="text-xs text-slate-500 mt-1">Real-time security and audit events pulled from backend logs.</p>
              <div className="mt-6 space-y-2 text-xs font-mono">
                {securityLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-sans">No security logs recorded.</p>
                ) : (
                  securityLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800">
                      [{new Date(log.time * 1000).toISOString()}] {log.event} {log.ip ? `(IP: ${log.ip})` : ''}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-sans">
                <b>Security recommendations:</b> Use httpOnly cookies instead of localStorage for tokens, enable ProxyHeadersMiddleware for IP rate limiting, set APP_ENV=production, rotate JWT_SECRET every 90d.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}