'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({
    loginId: '', email: '', fullName: '', password: '', pin: '',
    role: 'user', accessExpiresAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
          <p className="text-sm text-stone-600 mb-6">The user will log in with Login ID + Password, then enter the 6-digit PIN you set.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div>
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
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Password *</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                  placeholder="Min 6 characters"
                />
                <p className="text-xs text-stone-500 mt-1">You can use a text input to see the password while setting it.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">6-digit PIN *</label>
                <input
                  type="text"
                  value={form.pin}
                  onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  required
                  pattern="\d{6}"
                  inputMode="numeric"
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700 font-mono text-lg tracking-widest"
                  placeholder="------"
                />
                <p className="text-xs text-stone-500 mt-1">Fixed PIN — not an OTP. User cannot change it.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Access Expires (optional)</label>
                <input
                  type="date"
                  value={form.accessExpiresAt}
                  onChange={e => setForm({ ...form, accessExpiresAt: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-stone-200 rounded focus:outline-none focus:border-emerald-700"
                />
              </div>
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
