'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type User = {
  id: string; name: string; email: string | null;
  role: string; status: string;
  pinFailCount: number; pinLockedUntil: string | null;
  lastLoginAt: string | null; lastPinAt: string | null;
  createdAt: string; updatedAt: string;
};

type ActivityLog = {
  id: string;
  type: 'login' | 'pin' | 'audit';
  event: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  detail?: string | null;
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return '—';
  if (ua.includes('Mobile')) return '📱 Mobile';
  if (ua.includes('Windows')) return '💻 Windows';
  if (ua.includes('Mac')) return '💻 Mac';
  if (ua.includes('Linux')) return '💻 Linux';
  if (ua.includes('Android')) return '📱 Android';
  if (ua.includes('iPhone')) return '📱 iPhone';
  return '💻 Desktop';
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [form, setForm] = useState({ name: '', email: '', role: 'user', status: 'active' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
    });
  }, [router]);

  useEffect(() => {
    if (session && params.id) loadUser();
  }, [session, params.id]);

  async function loadUser() {
    setLoading(true);
    setError('');
    const r = await fetch(`/api/admin/users/${params.id}`);
    if (!r.ok) { setError('User not found'); setLoading(false); return; }
    const d = await r.json();
    setUser(d.user);
    setForm({
      name: d.user.name || '',
      email: d.user.email || '',
      role: d.user.role,
      status: d.user.status,
    });

    // Load user activity
    try {
      const logRes = await fetch(`/api/admin/logs?userId=${params.id}&limit=50`);
      const logData = await logRes.json();
      const allActivity: ActivityLog[] = [
        ...(logData.loginLogs || []).map((l: any) => ({ id: l.id, type: 'login' as const, event: l.event, ip: l.ip, userAgent: l.userAgent, createdAt: l.createdAt })),
        ...(logData.pinLogs || []).map((l: any) => ({ id: l.id, type: 'pin' as const, event: l.event, ip: l.ip, userAgent: l.userAgent, createdAt: l.createdAt })),
        ...(logData.auditLogs || []).map((l: any) => ({ id: l.id, type: 'audit' as const, event: l.action, ip: l.ip, userAgent: null, createdAt: l.createdAt, detail: l.detail })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActivity(allActivity);
    } catch {}
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const r = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to update'); return; }
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      loadUser();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete user ${user?.name}? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/users/${params.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.error) { setError(d.error); return; }
    router.push('/admin/users');
  }

  async function handleResetPin() {
    const newPin = prompt(`Enter new 6-digit PIN for ${user?.name}:`);
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      if (newPin !== null) alert('PIN must be exactly 6 digits');
      return;
    }
    const r = await fetch(`/api/admin/users/${params.id}/pin-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    });
    const d = await r.json();
    if (d.error) setError(d.error);
    else setSuccess('PIN reset successfully');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleUnlock() {
    await fetch(`/api/admin/users/${params.id}/unlock`, { method: 'POST' });
    setSuccess('PIN unlocked successfully');
    setTimeout(() => setSuccess(''), 3000);
    loadUser();
  }

  const isSelf = session?.userId === user?.id;
  const isLocked = user?.pinLockedUntil && new Date(user.pinLockedUntil) > new Date();

  if (!session || loading) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-[#7C8F6E]">Loading...</div>
      <Footer />
    </div>
  );

  if (error && !user) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-red-700">{error}</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link href="/admin" className="text-[#7C8F6E] hover:text-[#173B2D]">Admin</Link>
          <span className="text-stone-300">/</span>
          <Link href="/admin/users" className="text-[#7C8F6E] hover:text-[#173B2D]">Users</Link>
          <span className="text-stone-300">/</span>
          <span className="text-[#173B2D] font-semibold">{user?.name}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-[#E8DCC3]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${activeTab === 'profile' ? 'border-[#173B2D] text-[#173B2D]' : 'border-transparent text-[#7C8F6E]'}`}
          >Profile & Edit</button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${activeTab === 'activity' ? 'border-[#173B2D] text-[#173B2D]' : 'border-transparent text-[#7C8F6E]'}`}
          >Activity Log ({activity.length})</button>
        </div>

        {/* Messages */}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{success}</div>}

        {/* Profile Tab */}
        {activeTab === 'profile' && user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-serif text-lg text-[#173B2D] mb-4">User Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#7C8F6E]">User ID:</span> <span className="font-mono text-xs">{user.id}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Name:</span> <span className="font-semibold">{user.name}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Email:</span> <span>{user.email || '—'}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Role:</span> <span className="font-semibold uppercase">{user.role}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Status:</span>
                  <span className={`font-semibold ${user.status === 'active' ? 'text-green-700' : user.status === 'suspended' ? 'text-orange-700' : 'text-red-700'}`}>{user.status}</span>
                </div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Registered:</span> <span>{new Date(user.createdAt).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Last Login:</span> <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : 'Never'}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Last PIN:</span> <span>{user.lastPinAt ? new Date(user.lastPinAt).toLocaleString('en-IN') : 'Never'}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">PIN Fails:</span> <span className={user.pinFailCount > 0 ? 'text-[#C8A24A] font-bold' : ''}>{user.pinFailCount}/5</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">PIN Locked:</span> <span>{isLocked ? '🔒 Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-[#7C8F6E]">Updated:</span> <span>{new Date(user.updatedAt).toLocaleString('en-IN')}</span></div>
              </div>

              {/* Quick actions */}
              <div className="mt-4 pt-4 border-t border-[#E8DCC3] flex flex-wrap gap-2">
                <button onClick={handleResetPin} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded font-semibold">Reset PIN</button>
                {isLocked && <button onClick={handleUnlock} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded font-semibold">Unlock PIN</button>}
                {!isSelf && <button onClick={handleDelete} className="text-xs bg-red-900 hover:bg-red-800 text-white px-3 py-2 rounded font-semibold">Delete User</button>}
                {isSelf && <span className="text-xs text-[#7C8F6E] italic">Can&apos;t delete own account</span>}
              </div>
            </div>

            {/* Edit Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-serif text-lg text-[#173B2D] mb-4">Edit User</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#7C8F6E] mb-1">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7C8F6E] mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7C8F6E] mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} disabled={isSelf}
                    className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D] disabled:opacity-50">
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  {isSelf && <p className="text-xs text-[#7C8F6E] mt-1">Can&apos;t change own role</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7C8F6E] mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isSelf}
                    className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D] disabled:opacity-50">
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  {isSelf && <p className="text-xs text-[#7C8F6E] mt-1">Can&apos;t change own status</p>}
                </div>
                <button type="submit" disabled={saving}
                  className="w-full bg-[#173B2D] hover:bg-[#2a5443] text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#173B2D] text-stone-100 text-xs uppercase">
                  <th className="text-left p-3">Date & Time</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">IP Address</th>
                  <th className="text-left p-3">Device</th>
                  <th className="text-left p-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[#7C8F6E]">No activity recorded for this user.</td></tr>
                ) : (
                  activity.map(log => (
                    <tr key={`${log.type}-${log.id}`} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0]">
                      <td className="p-3 text-xs">{new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          log.type === 'login' ? 'bg-blue-100 text-blue-800' :
                          log.type === 'pin' ? 'bg-amber-100 text-amber-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>{log.type}</span>
                      </td>
                      <td className="p-3 text-sm">{log.event}</td>
                      <td className="p-3 text-xs font-mono text-stone-500">{log.ip || '—'}</td>
                      <td className="p-3 text-xs">{parseUserAgent(log.userAgent)}</td>
                      <td className="p-3 text-xs text-stone-500">{log.detail || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
