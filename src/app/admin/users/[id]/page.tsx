'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Form state
  const [form, setForm] = useState({
    fullName: '', email: '', role: 'user', status: 'active',
    accessExpiresAt: '', password: '',
  });
  const [newPin, setNewPin] = useState('');
  
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated || !d.pinVerified) { router.push('/login'); return; }
      if (d.user.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
      loadUser();
    });
  }, [router]);
  
  async function loadUser() {
    const r = await fetch(`/api/admin/users/${params.id}`);
    if (!r.ok) { setError('User not found'); setLoading(false); return; }
    const d = await r.json();
    setUser(d.user);
    setForm({
      fullName: d.user.fullName || '',
      email: d.user.email,
      role: d.user.role,
      status: d.user.status,
      accessExpiresAt: d.user.accessExpiresAt ? d.user.accessExpiresAt.split('T')[0] : '',
      password: '',
    });
    setLoading(false);
  }
  
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setMessage('');
    const body: any = {
      fullName: form.fullName,
      email: form.email,
      role: form.role,
      status: form.status,
      accessExpiresAt: form.accessExpiresAt || null,
    };
    if (form.password) body.password = form.password;
    const r = await fetch(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.error) setError(d.error); else { setMessage('Profile updated'); setForm({ ...form, password: '' }); loadUser(); }
    setSaving(false);
  }
  
  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) { setError('PIN must be 6 digits'); return; }
    if (!confirm(`Reset PIN for ${user.loginId} to ${newPin}?`)) return;
    setSaving(true); setError(''); setMessage('');
    const r = await fetch(`/api/admin/users/${params.id}/pin-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    });
    const d = await r.json();
    if (d.error) setError(d.error); else { setMessage('PIN reset (also clears fail count + lock)'); setNewPin(''); loadUser(); }
    setSaving(false);
  }
  
  async function handleUnlock() {
    if (!confirm(`Unlock PIN for ${user.loginId}?`)) return;
    const r = await fetch(`/api/admin/users/${params.id}/unlock`, { method: 'POST' });
    const d = await r.json();
    if (d.error) setError(d.error); else { setMessage('PIN unlocked'); loadUser(); }
  }
  
  async function handleDelete() {
    if (!confirm(`DELETE ${user.loginId}? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/users/${params.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.error) { setError(d.error); return; }
    router.push('/admin/users');
  }
  
  if (!session) return <div className="min-h-screen bg-stone-900 text-stone-300 flex items-center justify-center">Loading...</div>;
  if (loading) return <div className="min-h-screen bg-stone-100 flex items-center justify-center">Loading user...</div>;
  if (error && !user) return <div className="min-h-screen bg-stone-100 flex items-center justify-center text-red-700">{error}</div>;
  
  const isLocked = user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date();
  const isSelf = session.user?.loginId === user.loginId;
  
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-emerald-950 text-stone-100 shadow">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-serif italic text-xl text-amber-200">Edit User</h1>
          <Link href="/admin/users" className="text-xs bg-stone-700 hover:bg-stone-600 px-3 py-1.5 rounded">← Back</Link>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-3 text-sm">{message}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}
        
        {/* Profile section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-serif text-xl text-emerald-900 mb-4">Profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-stone-500">Login ID:</span> <b>{user.loginId}</b></div>
            <div><span className="text-stone-500">Created:</span> {new Date(user.createdAt).toLocaleString()}</div>
            <div><span className="text-stone-500">Last login:</span> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</div>
            <div><span className="text-stone-500">Last PIN:</span> {user.lastPinAt ? new Date(user.lastPinAt).toLocaleString() : 'Never'}</div>
            <div><span className="text-stone-500">PIN fails:</span> <b className={user.pinFailCount > 0 ? 'text-amber-700' : ''}>{user.pinFailCount}/3</b></div>
            <div><span className="text-stone-500">PIN status:</span> {isLocked ? <b className="text-red-700">LOCKED</b> : <span className="text-emerald-700">OK</span>}</div>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-3 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Full Name</label>
                <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isSelf} className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700 disabled:opacity-50">
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
                {isSelf && <p className="text-xs text-stone-500 mt-1">Can&apos;t change own status</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Access Expires</label>
                <input type="date" value={form.accessExpiresAt} onChange={e => setForm({ ...form, accessExpiresAt: e.target.value })} className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">New Password (optional)</label>
                <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} minLength={6} placeholder="Leave blank to keep current" className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white px-6 py-2 rounded font-semibold">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
        
        {/* PIN management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-serif text-xl text-emerald-900 mb-2">PIN Management</h2>
          <p className="text-sm text-stone-600 mb-4">User cannot change, view, or reset their PIN. Only admin can do this.</p>
          
          {isLocked && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-center justify-between">
              <div>
                <b className="text-red-700">PIN is locked</b>
                <div className="text-xs text-stone-600">Locked until {new Date(user.pinLockedUntil).toLocaleString()}</div>
              </div>
              <button onClick={handleUnlock} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-sm">Unlock Now</button>
            </div>
          )}
          
          <form onSubmit={handleResetPin} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Set New 6-digit PIN</label>
              <input
                type="text"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                pattern="\d{6}"
                inputMode="numeric"
                className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700 font-mono text-lg tracking-widest"
                placeholder="------"
              />
            </div>
            <button type="submit" disabled={saving} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold">
              {saving ? 'Resetting...' : 'Reset PIN'}
            </button>
          </form>
        </div>
        
        {/* Danger zone */}
        {!isSelf && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="font-serif text-xl text-red-900 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-700 mb-4">Delete this user. This action cannot be undone.</p>
            <button onClick={handleDelete} className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold">Delete User</button>
          </div>
        )}
      </main>
    </div>
  );
}
