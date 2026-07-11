'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function generateRandomPassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pwd = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) pwd += chars[arr[i] % chars.length];
  return pwd;
}

function generateRandomPin(): string {
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => n % 10).join('');
}

export default function CreateUserPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({
    loginId: '', email: '', fullName: '', password: '', pin: '',
    role: 'user', status: 'active', accessExpiresAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated || !d.pinVerified) { router.push('/login'); return; }
      if (d.user.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body: any = { ...form };
      if (!body.accessExpiresAt) delete body.accessExpiresAt;
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed'); return; }
      router.push('/admin/users');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  if (!session) return <div className="min-h-screen bg-stone-900 text-stone-300 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-emerald-950 text-stone-100 shadow">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-serif italic text-xl text-amber-200">Admin — Create User</h1>
          <Link href="/admin/users" className="text-xs bg-stone-700 hover:bg-stone-600 px-3 py-1.5 rounded">← Back</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-serif text-2xl text-emerald-900 mb-4">Create New User</h2>
          <p className="text-sm text-stone-600 mb-6">The user will log in with Email/Login ID + Password (then PIN) OR directly with PIN. Only Active accounts can login.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Login ID *</label>
                <input
                  type="text"
                  value={form.loginId}
                  onChange={e => setForm({ ...form, loginId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                  placeholder="e.g. pradip or user@email.com"
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
                  placeholder="user@email.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Account Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Password with generate button */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-600 uppercase">Password *</label>
                <button
                  type="button"
                  onClick={() => { const p = generateRandomPassword(); setForm({ ...form, password: p }); setShowPassword(true); }}
                  className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded font-semibold"
                >
                  🎲 Generate Random
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="flex-1 px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700 font-mono"
                  placeholder="Min 6 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded text-xs">
                  {showPassword ? '🙈 Hide' : '👁 Show'}
                </button>
                <button type="button" onClick={() => navigator.clipboard.writeText(form.password)} className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded text-xs" disabled={!form.password}>
                  📋 Copy
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-1">Generated password is 14 chars with mixed case, digits, and symbols.</p>
            </div>

            {/* PIN with generate button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-600 uppercase">6-digit PIN *</label>
                <button
                  type="button"
                  onClick={() => { const p = generateRandomPin(); setForm({ ...form, pin: p }); setShowPin(true); }}
                  className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded font-semibold"
                >
                  🎲 Generate Random
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={form.pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  pattern="\d{6}"
                  inputMode="numeric"
                  maxLength={6}
                  className="flex-1 px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700 font-mono text-lg tracking-widest text-center"
                  placeholder="------"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded text-xs">
                  {showPin ? '🙈 Hide' : '👁 Show'}
                </button>
                <button type="button" onClick={() => navigator.clipboard.writeText(form.pin)} className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded text-xs" disabled={!form.pin}>
                  📋 Copy
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-1">Fixed PIN — not an OTP. User cannot change it. Stored as bcrypt hash.</p>
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Access Expires (optional)</label>
              <input
                type="date"
                value={form.accessExpiresAt}
                onChange={e => setForm({ ...form, accessExpiresAt: e.target.value })}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
              />
            </div>

            {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">{error}</div>}

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white px-6 py-2 rounded font-semibold"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
              <Link href="/admin/users" className="bg-stone-300 hover:bg-stone-400 text-stone-800 px-6 py-2 rounded">Cancel</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
