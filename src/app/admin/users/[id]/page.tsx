'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

function generateRandomPin(): string {
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => n % 10).join('');
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newPinResult, setNewPinResult] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', role: 'user', status: 'active',
  });

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
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
      name: d.user.name || '',
      email: d.user.email || '',
      role: d.user.role,
      status: d.user.status,
    });
    setLoading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setMessage('');
    const body: any = { ...form };
    const r = await fetch(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.error) setError(d.error); else { setMessage('Profile updated'); loadUser(); }
    setSaving(false);
  }

  async function handleGenerateNewPin() {
    if (!confirm(`Generate a new random PIN for ${user.name}? The old PIN will stop working immediately.`)) return;
    setSaving(true); setError(''); setMessage(''); setNewPinResult(null);
    const r = await fetch(`/api/admin/users/${params.id}/pin-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),  // empty = server generates random
    });
    const d = await r.json();
    if (d.error) setError(d.error);
    else {
      setNewPinResult(d.generatedPin);
      setMessage('PIN reset (also clears fail count + lock)');
      loadUser();
    }
    setSaving(false);
  }

  async function handleUnlock() {
    if (!confirm(`Unlock PIN for ${user.name}?`)) return;
    const r = await fetch(`/api/admin/users/${params.id}/unlock`, { method: 'POST' });
    const d = await r.json();
    if (d.error) setError(d.error); else { setMessage('PIN unlocked'); loadUser(); }
  }

  async function handleDelete() {
    if (!confirm(`DELETE ${user.name}? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/users/${params.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.error) { setError(d.error); return; }
    router.push('/admin/users');
  }

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-[#7C8F6E]">Loading...</div>
      <Footer />
    </div>
  );
  if (loading) return <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center">Loading user...</div>;
  if (error && !user) return <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center text-red-700">{error}</div>;

  const isLocked = user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date();
  const isSelf = session.userId === user.id;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-[#173B2D]">Edit User</h1>
          <Link href="/admin/users" className="text-sm bg-stone-200 hover:bg-stone-300 px-4 py-2 rounded">← Back</Link>
        </div>

        {message && <div className="bg-emerald-50 border border-emerald-200 text-[#173B2D] rounded p-3 text-sm">{message}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}

        {/* New PIN result — shown once after reset */}
        {newPinResult && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-6">
            <h3 className="font-serif text-lg text-amber-900 mb-2">🔑 New PIN Generated</h3>
            <p className="text-sm text-stone-700 mb-3">Save this PIN — it will <b>not</b> be shown again.</p>
            <div className="bg-white rounded p-4 text-center">
              <div className="text-xs text-[#5a6b50] uppercase tracking-wider mb-1">6-digit PIN for {user.name}</div>
              <div className="font-mono text-4xl tracking-widest text-[#C8A24A] font-bold">{newPinResult}</div>
              <button
                onClick={() => navigator.clipboard.writeText(newPinResult)}
                className="mt-3 text-xs bg-[#C8A24A] hover:bg-[#d4b560] text-white px-4 py-1.5 rounded font-semibold"
              >📋 Copy PIN</button>
            </div>
            <button onClick={() => setNewPinResult(null)} className="mt-3 text-xs text-[#7C8F6E] underline">Dismiss</button>
          </div>
        )}

        {/* Profile info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-serif text-xl text-[#173B2D] mb-4">Profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-[#7C8F6E]">Created:</span> {new Date(user.createdAt).toLocaleString()}</div>
            <div><span className="text-[#7C8F6E]">Last login:</span> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</div>
            <div><span className="text-[#7C8F6E]">Last PIN:</span> {user.lastPinAt ? new Date(user.lastPinAt).toLocaleString() : 'Never'}</div>
            <div><span className="text-[#7C8F6E]">PIN fails:</span> <b className={user.pinFailCount > 0 ? 'text-[#C8A24A]' : ''}>{user.pinFailCount}/5</b></div>
            <div><span className="text-[#7C8F6E]">PIN status:</span> {isLocked ? <b className="text-red-700">LOCKED</b> : <span className="text-[#173B2D]">OK</span>}</div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5a6b50] uppercase mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded focus:outline-none focus:border-[#173B2D]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5a6b50] uppercase mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded focus:outline-none focus:border-[#173B2D]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5a6b50] uppercase mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded focus:outline-none focus:border-[#173B2D]">
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5a6b50] uppercase mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isSelf} className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded focus:outline-none focus:border-[#173B2D] disabled:opacity-50">
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
                {isSelf && <p className="text-xs text-[#7C8F6E] mt-1">Can&apos;t change own status</p>}
              </div>
            </div>
            <button type="submit" disabled={saving} className="bg-[#173B2D] hover:bg-[#2a5443] disabled:opacity-50 text-white px-6 py-2 rounded font-semibold">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* PIN management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-serif text-xl text-[#173B2D] mb-2">PIN Management</h2>
          <p className="text-sm text-[#5a6b50] mb-4">User cannot change, view, or reset their PIN. Only admin can do this. New PIN is shown only once after reset.</p>

          {isLocked && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex items-center justify-between">
              <div>
                <b className="text-red-700">PIN is locked</b>
                <div className="text-xs text-[#5a6b50]">Locked until {new Date(user.pinLockedUntil).toLocaleString()}</div>
              </div>
              <button onClick={handleUnlock} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-sm">Unlock Now</button>
            </div>
          )}

          <button onClick={handleGenerateNewPin} disabled={saving} className="bg-[#C8A24A] hover:bg-[#d4b560] disabled:opacity-50 text-white px-4 py-2 rounded font-semibold">
            {saving ? 'Generating...' : '🔑 Generate New PIN'}
          </button>
          <p className="text-xs text-[#7C8F6E] mt-2">Generates a random unique 6-digit PIN. Old PIN stops working immediately.</p>
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
      <Footer />
    </div>
  );
}
