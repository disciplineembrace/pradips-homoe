'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

function generateRandomPin(): string {
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => n % 10).join('');
}

export default function CreateUserPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', email: '', role: 'user', status: 'active', pin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);
    try {
      const body: any = { ...form };
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed'); return; }
      // Show success with the generated PIN (one-time display)
      setSuccess(d);
      // Reset form for next user
      setForm({ name: '', email: '', role: 'user', status: 'active', pin: '' });
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-stone-500">Loading...</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl text-emerald-900">Create User</h1>
          <Link href="/admin/users" className="text-sm bg-stone-200 hover:bg-stone-300 px-4 py-2 rounded">← Back</Link>
        </div>

        {/* Success card — shows generated PIN once */}
        {success && (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-6 mb-6">
            <h2 className="font-serif text-xl text-emerald-900 mb-2">✓ User Created</h2>
            <p className="text-sm text-stone-700 mb-4">Save this PIN — it will <b>not</b> be shown again.</p>
            <div className="bg-white rounded p-4 mb-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-stone-500">Name:</span> <b>{success.user.name}</b></div>
              <div><span className="text-stone-500">Role:</span> <b>{success.user.role}</b></div>
              {success.user.email && <div><span className="text-stone-500">Email:</span> {success.user.email}</div>}
              <div><span className="text-stone-500">Status:</span> <b>{success.user.status}</b></div>
            </div>
            <div className="bg-amber-100 border-2 border-amber-400 rounded p-4 text-center">
              <div className="text-xs text-stone-600 uppercase tracking-wider mb-1">6-digit PIN</div>
              <div className="font-mono text-4xl tracking-widest text-amber-800 font-bold">{success.generatedPin}</div>
              <button
                onClick={() => navigator.clipboard.writeText(success.generatedPin)}
                className="mt-3 text-xs bg-amber-700 hover:bg-amber-600 text-white px-4 py-1.5 rounded font-semibold"
              >📋 Copy PIN</button>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSuccess(null)} className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded font-semibold">+ Create Another</button>
              <Link href="/admin/users" className="bg-stone-300 hover:bg-stone-400 text-stone-800 text-sm px-4 py-2 rounded">View All Users</Link>
            </div>
          </div>
        )}

        {!success && (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                  placeholder="user@example.com (used for login)"
                />
                <p className="text-xs text-stone-500 mt-1">User logs in with Email + PIN.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700">
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700">
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* PIN generation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-600 uppercase">6-digit PIN *</label>
                  <button
                    type="button"
                    onClick={() => { const p = generateRandomPin(); setForm({ ...form, pin: p }); setShowPin(true); }}
                    className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded font-semibold"
                  >🎲 Generate PIN</button>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={form.pin}
                    onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    required
                    pattern="\d{6}"
                    inputMode="numeric"
                    maxLength={6}
                    className="flex-1 px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700 font-mono text-lg tracking-widest text-center"
                    placeholder="------"
                  />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded text-xs">{showPin ? '🙈' : '👁'}</button>
                  {form.pin && <button type="button" onClick={() => navigator.clipboard.writeText(form.pin)} className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded text-xs">📋</button>}
                </div>
                <p className="text-xs text-stone-500 mt-1">Must be unique. Click Generate for a random PIN. PIN is shown only once after creation.</p>
              </div>

              {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">{error}</div>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading || !form.name || form.pin.length !== 6}
                  className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white px-6 py-2 rounded font-semibold"
                >
                  {loading ? 'Creating...' : 'Save User'}
                </button>
                <Link href="/admin/users" className="bg-stone-300 hover:bg-stone-400 text-stone-800 px-6 py-2 rounded">Cancel</Link>
              </div>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
