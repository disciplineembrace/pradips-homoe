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
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);  // Show page IMMEDIATELY
      // Load stats in background (non-blocking)
      Promise.all([
        fetch('/api/admin/users').then(r => r.json()).catch(() => ({ users: [] })),
        fetch('/api/admin/logs?limit=100').then(r => r.json()).catch(() => ({ loginLogs: [], pinLogs: [], auditLogs: [] })),
      ]).then(([u, l]) => {
        const users = u.users || [];
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
      }).catch(() => {});
    }).catch(() => router.push('/login'));
  }, [router]);
  
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  
  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-[#7C8F6E]">Loading admin...</p>
        </div>
      </div>
    </div>
  );
  
  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.admins} admins`, color: 'text-[#173B2D]' },
    { label: 'Active', value: stats.activeUsers, sub: `${stats.disabledUsers} disabled`, color: 'text-[#173B2D]' },
    { label: 'PIN Locked', value: stats.lockedUsers, sub: 'need unlock', color: 'text-[#C8A24A]' },
    { label: 'Failed Logins', value: stats.failedLogins, sub: 'recent', color: 'text-[#6E2A3A]' },
    { label: 'Failed PINs', value: stats.failedPins, sub: 'recent', color: 'text-[#6E2A3A]' },
    { label: 'Audit Events', value: stats.auditEvents, sub: 'recent', color: 'text-[#173B2D]' },
  ] : [];
  
  return (
    <div className="min-h-screen bg-[#F5EFE0]">
      <header className="bg-[#173B2D] text-stone-100 shadow border-b-2 border-[#C8A24A]/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif italic text-xl text-[#C8A24A] tracking-wide">Pradip&apos;s Homeo — Admin</h1>
            <p className="text-xs text-stone-400">{session?.name} · {session.user?.role}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="text-xs bg-[#2a5443] hover:bg-emerald-700 px-3 py-1.5 rounded">View Site</Link>
            <button onClick={logout} className="text-xs bg-[#6E2A3A] hover:bg-[#8a3548] px-3 py-1.5 rounded">Logout</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-2">
          <Link href="/admin" className="px-3 py-1.5 text-xs rounded-t bg-[#F5EFE0] text-emerald-900 font-semibold">Overview</Link>
          <Link href="/admin/users" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-emerald-900">Users</Link>
          <Link href="/admin/logs" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-emerald-900">Logs</Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="font-serif text-2xl text-emerald-900 mb-2">Overview</h2>
        <div className="w-16 h-0.5 bg-[#C8A24A] mb-4" />
        
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
            <div className="text-xs text-[#C8A24A] mt-2">→ Go to Users</div>
          </Link>
          <Link href="/admin/logs" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-serif text-lg text-emerald-900">Audit Logs</h3>
            <p className="text-sm text-stone-600 mt-1">Login attempts, PIN attempts, admin actions.</p>
            <div className="text-xs text-[#C8A24A] mt-2">→ View Logs</div>
          </Link>
        </div>
      </main>
    </div>
  );
}
