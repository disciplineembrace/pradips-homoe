'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type User = {
  id: string; name: string; email: string | null;
  role: string; status: string;
  pinFailCount: number; pinLockedUntil: string | null;
  lastLoginAt: string | null; lastPinAt: string | null;
  createdAt: string; updatedAt: string;
  loginCount: number;
  lastLoginIp: string | null;
  lastLoginUserAgent: string | null;
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

export default function AdminUsersPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
    });
  }, [router]);

  useEffect(() => {
    if (session) loadUsers();
  }, [session, search, roleFilter, statusFilter]);

  async function loadUsers() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const r = await fetch(`/api/admin/users?${params}`);
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  }

  async function toggleStatus(u: User) {
    const newStatus = u.status === 'active' ? 'disabled' : 'active';
    if (!confirm(`${newStatus === 'disabled' ? 'Disable' : 'Activate'} user ${u.name}?`)) return;
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadUsers();
  }

  async function suspendUser(u: User) {
    if (!confirm(`Suspend user ${u.name}? They will not be able to login.`)) return;
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'suspended' }),
    });
    loadUsers();
  }

  async function deleteUser(u: User) {
    if (!confirm(`Delete user ${u.name}? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.error) alert(d.error);
    else loadUsers();
  }

  async function unlockPin(u: User) {
    if (!confirm(`Unlock PIN for ${u.name}?`)) return;
    await fetch(`/api/admin/users/${u.id}/unlock`, { method: 'POST' });
    loadUsers();
  }

  async function resetPin(u: User) {
    const newPin = prompt(`Enter new 6-digit PIN for ${u.name}:`);
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      if (newPin !== null) alert('PIN must be exactly 6 digits');
      return;
    }
    const r = await fetch(`/api/admin/users/${u.id}/pin-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin }),
    });
    const d = await r.json();
    if (d.error) alert(d.error);
    else alert(`PIN reset successfully for ${u.name}`);
  }

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-[#7C8F6E]">Loading...</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Header with filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="font-serif text-2xl text-[#173B2D]">User Monitoring ({users.length})</h2>
          <div className="flex-1" />
          <input
            type="text"
            placeholder="🔍 Search name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-xs px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D]"
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D]">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D]">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={loadUsers} className="bg-stone-200 hover:bg-stone-300 px-4 py-2 text-sm rounded">↻</button>
          <Link href="/admin/users/create" className="bg-[#173B2D] hover:bg-[#2a5443] text-white text-sm px-4 py-2 rounded font-semibold">+ Create</Link>
        </div>

        {loading ? <div className="text-center py-12">Loading...</div> : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#173B2D] text-stone-100 text-xs uppercase">
                  <th className="text-left p-3">User ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-center p-3">Logins</th>
                  <th className="text-left p-3">Last Login</th>
                  <th className="text-left p-3">Device</th>
                  <th className="text-left p-3">IP Address</th>
                  <th className="text-left p-3">Registered</th>
                  <th className="text-left p-3">PIN</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isLocked = u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date();
                  const isSuspended = u.status === 'suspended';
                  return (
                    <tr key={u.id} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0]">
                      <td className="p-3 text-xs text-stone-400 font-mono">{u.id.substring(0, 12)}...</td>
                      <td className="p-3">
                        <Link href={`/admin/users/${u.id}`} className="font-semibold text-[#173B2D] hover:underline">{u.name}</Link>
                      </td>
                      <td className="p-3 text-xs text-[#7C8F6E]">{u.email || '—'}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          u.role === 'admin' ? 'bg-amber-100 text-[#C8A24A]' :
                          u.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                          'bg-stone-200 text-stone-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-semibold ${
                          u.status === 'active' ? 'text-green-700' :
                          isSuspended ? 'text-orange-700' : 'text-red-700'
                        }`}>
                          {u.status === 'active' ? '● Active' : isSuspended ? '● Suspended' : '● Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-[#173B2D] font-bold">{u.loginCount}</td>
                      <td className="p-3 text-xs text-[#5a6b50]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                      </td>
                      <td className="p-3 text-xs">{parseUserAgent(u.lastLoginUserAgent)}</td>
                      <td className="p-3 text-xs text-stone-500 font-mono">{u.lastLoginIp || '—'}</td>
                      <td className="p-3 text-xs text-[#5a6b50]">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        {isLocked ? (
                          <span className="text-xs text-red-700 font-semibold">🔒 Locked</span>
                        ) : u.pinFailCount > 0 ? (
                          <span className="text-xs text-[#C8A24A]">{u.pinFailCount}/5</span>
                        ) : (
                          <span className="text-xs text-green-700">✓ OK</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <Link href={`/admin/users/${u.id}`} className="text-xs bg-stone-200 hover:bg-stone-300 px-2 py-1 rounded">View</Link>
                          {isLocked && (
                            <button onClick={() => unlockPin(u)} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded">Unlock</button>
                          )}
                          <button onClick={() => resetPin(u)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded">Reset PIN</button>
                          {u.status === 'active' ? (
                            <>
                              <button onClick={() => suspendUser(u)} className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded">Suspend</button>
                              <button onClick={() => toggleStatus(u)} className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded">Disable</button>
                            </>
                          ) : (
                            <button onClick={() => toggleStatus(u)} className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded">Activate</button>
                          )}
                          <button onClick={() => deleteUser(u)} className="text-xs bg-red-900 hover:bg-red-800 text-white px-2 py-1 rounded">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={12} className="p-8 text-center text-[#7C8F6E]">{search ? 'No users match your search.' : 'No users found.'}</td></tr>
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
