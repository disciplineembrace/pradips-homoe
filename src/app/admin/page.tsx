'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminHomePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      if (d.user.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
      // Load stats
      Promise.all([
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/logs?limit=100').then(r => r.json()),
      ]).then(([u, l]) => {
        const users = u.users || [];
        const allLogs = [...(l.loginLogs || []), ...(l.pinLogs || []), ...(l.auditLogs || [])];
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((x: any) => x.status === 'active').length,
          disabledUsers: users.filter((x: any) => x.status === 'disabled').length,
          admins: users.filter((x: any) => x.role === 'admin').length,
          lockedUsers: users.filter((x: any) => x.pinLockedUntil && new Date(x.pinLockedUntil) > new Date()).length,
          loginEvents: (l.loginLogs || []).length,
          pinEvents: (l.pinLogs || []).length,
          auditEvents: (l.auditLogs || []).length,
          failedLogins: (l.loginLogs || []).filter((x: any) => x.event === 'login_fail').length,
          failedPins: (l.pinLogs || []).filter((x: any) => x.event === 'pin_fail').length,
        });
      });
    });
  }, [router]);
  
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  
  if (!session) return <div className="min-h-screen bg-stone-900 text-stone-300 flex items-center justify-center">Loading...</div>;
  
  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.admins} admins`, color: 'text-emerald-700' },
    { label: 'Active', value: stats.activeUsers, sub: `${stats.disabledUsers} disabled`, color: 'text-emerald-700' },
    { label: 'PIN Locked', value: stats.lockedUsers, sub: 'need unlock', color: 'text-amber-700' },
    { label: 'Failed Logins', value: stats.failedLogins, sub: 'recent', color: 'text-red-700' },
    { label: 'Failed PINs', value: stats.failedPins, sub: 'recent', color: 'text-red-700' },
    { label: 'Audit Events', value: stats.auditEvents, sub: 'recent', color: 'text-emerald-700' },
  ] : [];
  
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-emerald-950 text-stone-100 shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif italic text-xl text-amber-200">Pradip&apos;s Homoe — Admin</h1>
            <p className="text-xs text-stone-400">{session?.name} · {session.user?.role}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="text-xs bg-stone-700 hover:bg-stone-600 px-3 py-1.5 rounded">View Site</Link>
            <button onClick={logout} className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded">Logout</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-2">
          <Link href="/admin" className="px-3 py-1.5 text-xs rounded-t bg-stone-100 text-emerald-900 font-semibold">Overview</Link>
          <Link href="/admin/users" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-emerald-900">Users</Link>
          <Link href="/admin/logs" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-emerald-900">Logs</Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="font-serif text-2xl text-emerald-900 mb-4">Overview</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-stone-500 uppercase tracking-wider">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-stone-400">{s.sub}</div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/users" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-serif text-lg text-emerald-900">User Management</h3>
            <p className="text-sm text-stone-600 mt-1">Create, edit, block, delete users. Reset PINs. Unlock accounts.</p>
            <div className="text-xs text-amber-700 mt-2">→ Go to Users</div>
          </Link>
          <Link href="/admin/logs" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-serif text-lg text-emerald-900">Audit Logs</h3>
            <p className="text-sm text-stone-600 mt-1">Login attempts, PIN attempts, admin actions.</p>
            <div className="text-xs text-amber-700 mt-2">→ View Logs</div>
          </Link>
        </div>
      </main>
    </div>
  );
}
