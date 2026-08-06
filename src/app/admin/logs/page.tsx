'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [logs, setLogs] = useState<{ loginLogs: any[]; pinLogs: any[]; auditLogs: any[] }>({ loginLogs: [], pinLogs: [], auditLogs: [] });
  const [type, setType] = useState<'all' | 'login' | 'pin' | 'audit'>('all');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
      // loadLogs will be called by the [type, session] useEffect below
    });
  }, [router]);
  
  async function loadLogs() {
    setLoading(true);
    const r = await fetch(`/api/admin/logs?type=${type}&limit=50`);
    const d = await r.json();
    setLogs(d);
    setLoading(false);
  }
  
  useEffect(() => { if (session) loadLogs(); }, [type, session]);
  
  if (!session) return <div className="min-h-screen bg-[#173B2D] text-stone-300 flex items-center justify-center">Loading...</div>;
  
  return (
    <div className="min-h-screen bg-[#F5EFE0]">
      <header className="bg-[#173B2D] text-stone-100 shadow border-b-2 border-[#C8A24A]/40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-serif italic text-xl text-[#C8A24A] tracking-wide">Admin — Logs</h1>
          <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/login')); }} className="text-xs bg-[#6E2A3A] hover:bg-[#8a3548] px-3 py-1.5 rounded">Logout</button>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2">
          <Link href="/admin" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-[#173B2D]">Overview</Link>
          <Link href="/admin/users" className="px-3 py-1.5 text-xs rounded-t text-stone-300 hover:bg-[#173B2D]">Users</Link>
          <Link href="/admin/logs" className="px-3 py-1.5 text-xs rounded-t bg-[#F5EFE0] text-emerald-900 font-semibold">Logs</Link>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          {(['all', 'login', 'pin', 'audit'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 text-sm rounded ${type === t ? 'bg-[#173B2D] text-white font-semibold' : 'bg-white border hover:bg-stone-50'}`}
            >{t.charAt(0).toUpperCase() + t.slice(1)} Logs</button>
          ))}
          <button onClick={loadLogs} className="ml-auto bg-stone-200 hover:bg-stone-300 px-4 py-2 text-sm rounded">↻ Refresh</button>
        </div>
        
        {loading ? <div className="text-center py-12">Loading...</div> : (
          <div className="space-y-4">
            {(type === 'all' || type === 'login') && logs.loginLogs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-serif text-lg text-emerald-900 mb-3">Login Events ({logs.loginLogs.length})</h2>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {logs.loginLogs.map((l, i) => (
                    <div key={i} className={`text-xs font-mono p-2 rounded border-l-2 ${l.event.includes('fail') ? 'border-red-500 bg-red-50' : 'border-emerald-500 bg-emerald-50'}`}>
                      <span className="text-stone-500">{new Date(l.ts || l.createdAt).toLocaleString()}</span>{' '}
                      <span className={`font-semibold ${l.event.includes('fail') ? 'text-red-700' : 'text-emerald-700'}`}>{l.event}</span>{' '}
                      <span className="text-stone-700">{l.name}</span>{' '}
                      <span className="text-stone-400">{l.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(type === 'all' || type === 'pin') && logs.pinLogs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-serif text-lg text-emerald-900 mb-3">PIN Events ({logs.pinLogs.length})</h2>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {logs.pinLogs.map((l, i) => (
                    <div key={i} className={`text-xs font-mono p-2 rounded border-l-2 ${
                      l.event.includes('fail') ? 'border-red-500 bg-red-50' :
                      l.event.includes('locked') ? 'border-amber-500 bg-amber-50' :
                      l.event.includes('reset') || l.event.includes('unlock') ? 'border-blue-500 bg-blue-50' :
                      'border-emerald-500 bg-emerald-50'
                    }`}>
                      <span className="text-stone-500">{new Date(l.ts || l.createdAt).toLocaleString()}</span>{' '}
                      <span className={`font-semibold ${
                        l.event.includes('fail') ? 'text-red-700' :
                        l.event.includes('locked') ? 'text-amber-700' :
                        l.event.includes('reset') || l.event.includes('unlock') ? 'text-blue-700' :
                        'text-emerald-700'
                      }`}>{l.event}</span>{' '}
                      <span className="text-stone-700">{l.name}</span>
                      {l.failCount !== null && l.failCount !== undefined && <span className="text-stone-400"> ({l.failCount}/3 fails)</span>}{' '}
                      <span className="text-stone-400">{l.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(type === 'all' || type === 'audit') && logs.auditLogs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-serif text-lg text-emerald-900 mb-3">Admin Actions ({logs.auditLogs.length})</h2>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {logs.auditLogs.map((l, i) => (
                    <div key={i} className="text-xs font-mono p-2 rounded border-l-2 border-blue-500 bg-blue-50">
                      <span className="text-stone-500">{new Date(l.ts || l.createdAt).toLocaleString()}</span>{' '}
                      <span className="font-semibold text-blue-700">{l.action}</span>{' '}
                      <span className="text-stone-700">{l.user?.name || l.name || "system"}</span>
                      {l.targetId && <span className="text-stone-400"> → {l.targetId.substring(0, 8)}...</span>}
                      {l.detail && <div className="text-stone-500 mt-1">{l.detail}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!loading && type === 'all' && logs.loginLogs.length === 0 && logs.pinLogs.length === 0 && logs.auditLogs.length === 0 && (
              <div className="text-center py-12 text-stone-500">No logs yet. Try logging in / failing a PIN to generate events.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
