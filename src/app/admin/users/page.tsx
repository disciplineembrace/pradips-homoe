'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: string; loginId: string; email: string; fullName: string | null;
  role: string; status: string; accessExpiresAt: string | null;
  pinFailCount: number; pinLockedUntil: string | null;
  lastLoginAt: string | null; lastPinAt: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated || !d.pinVerified) { router.push('/login'); return; }
      if (d.user.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
      loadUsers();
    });
  }, [router]);

  async function loadUsers() {
    setLoading(true);
    const r = await fetch('/api/admin/users');
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  }

  async function toggleStatus(u: User) {
    const newStatus = u.status === 'active' ? 'disabled' : 'active';
    if (!confirm(`${newStatus === 'disabled' ? 'Disable' : 'Activate'} user ${u.loginId}?`)) return;
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadUsers();
  }

  async function deleteUser(u: User) {
    if (!confirm(`Delete user ${u.loginId}? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.error) alert(d.error);
    else loadUsers();
  }

  async function unlockPin(u: User) {
    if (!confirm(`Unlock PIN for ${u.loginId}?`)) return;
    await fetch(`/api/admin/users/${u.id}/unlock`, { method: 'POST' });
    loadUsers();
  }

  // Client-side filter (since we load all users)
  const filtered = search
    ? users.filter(u => {
        const q = search.toLowerCase();
        return u.loginId.toLowerCase().includes(q) ||
               u.email.toLowerCase().includes(q) ||
               (u.fullName || '').toLowerCase().includes(q) ||
               u.role.toLowerCase().includes(q) ||
               u.status.toLowerCase().includes(q);
      })
    : users;

  if (!session) return <div className="min-h-screen bg-stone-900 text-stone-300 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-emerald-950 text-stone-100 shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif italic text-xl text-amber-200">Admin — Users</h1>
            <p className="text-xs text-stone-400">{session.user?.fullName}</p>
          </div>
          <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/login')); }} className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded">Logout</button>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-2">
          <Link href="/admin" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-emerald-900">Overview</Link>
          <Link href="/admin/users" className="px-3 py-1.5 text-xs rounded-t bg-stone-100 text-emerald-900 font-semibold">Users</Link>
          <Link href="/admin/logs" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-emerald-900">Logs</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="font-serif text-2xl text-emerald-900">Users ({filtered.length}{search ? ` of ${users.length}` : ''})</h2>
          <div className="flex-1" />
          <input
            type="text"
            placeholder="🔍 Search by name, email, login ID, role, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[250px] max-w-md px-3 py-2 border-2 border-stone-200 rounded text-sm focus:outline-none focus:border-emerald-700"
          />
          <button onClick={loadUsers} className="bg-stone-200 hover:bg-stone-300 px-4 py-2 text-sm rounded">↻ Refresh</button>
          <Link href="/admin/users/create" className="bg-emerald-900 hover:bg-emerald-800 text-white text-sm px-4 py-2 rounded font-semibold">+ Create User</Link>
        </div>

        {loading ? <div className="text-center py-12">Loading...</div> : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-900 text-stone-100 text-xs uppercase">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">PIN</th>
                  <th className="text-left p-3">Last Login</th>
                  <th className="text-left p-3">Expires</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const isLocked = u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date();
                  return (
                    <tr key={u.id} className="border-b border-stone-200 hover:bg-stone-50">
                      <td className="p-3">
                        <Link href={`/admin/users/${u.id}`} className="font-semibold text-emerald-900 hover:underline">{u.loginId}</Link>
                        {u.fullName && <div className="text-xs text-stone-500">{u.fullName}</div>}
                        <div className="text-xs text-stone-400">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                          u.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                          'bg-stone-200 text-stone-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-semibold ${u.status === 'active' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {u.status === 'active' ? '● Active' : '● Disabled'}
                        </span>
                      </td>
                      <td className="p-3">
                        {isLocked ? (
                          <span className="text-xs text-red-700 font-semibold">🔒 Locked ({u.pinFailCount}/3)</span>
                        ) : u.pinFailCount > 0 ? (
                          <span className="text-xs text-amber-700">{u.pinFailCount}/3 fails</span>
                        ) : (
                          <span className="text-xs text-stone-500">OK</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-stone-600">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-3 text-xs text-stone-600">
                        {u.accessExpiresAt ? new Date(u.accessExpiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <Link href={`/admin/users/${u.id}`} className="text-xs bg-stone-200 hover:bg-stone-300 px-2 py-1 rounded">Edit</Link>
                          {isLocked && (
                            <button onClick={() => unlockPin(u)} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded">Unlock</button>
                          )}
                          <button onClick={() => toggleStatus(u)} className={`text-xs px-2 py-1 rounded text-white ${u.status === 'active' ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-700 hover:bg-emerald-600'}`}>
                            {u.status === 'active' ? 'Disable' : 'Activate'}
                          </button>
                          <button onClick={() => deleteUser(u)} className="text-xs bg-red-900 hover:bg-red-800 text-white px-2 py-1 rounded">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-stone-500">{search ? 'No users match your search.' : 'No users found.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
