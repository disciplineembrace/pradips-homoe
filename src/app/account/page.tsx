'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loadError, setLoadError] = useState('');

  // Auth check — set session immediately, do NOT block on data
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Background-load profile
  useEffect(() => {
    if (!session) return;
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        if (d.error) setLoadError(d.error);
        else setMe(d);
      })
      .catch(() => setLoadError('Failed to load profile'));
  }, [session]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Account...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">My Account</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Your profile and quick links</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Profile card */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          {loadError ? (
            <div className="text-sm text-[#6E2A3A] bg-[#6E2A3A]/10 border border-[#6E2A3A]/30 rounded p-3">
              {loadError}
            </div>
          ) : !me ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-[#7C8F6E]">Loading profile...</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-[#173B2D] text-[#C8A24A] flex items-center justify-center font-serif text-3xl">
                {me.name?.[0]?.toUpperCase() || '?'}
              </div>
              {/* Profile fields */}
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-2xl text-[#173B2D]">{me.name}</h2>
                <p className="text-sm text-[#7C8F6E] mb-3">{me.email}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[0.65rem] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    me.role === 'admin' ? 'bg-[#C8A24A] text-[#173B2D]' :
                    me.role === 'staff' ? 'bg-[#173B2D] text-[#C8A24A]' :
                    'bg-[#E8DCC3] text-[#173B2D]'
                  }`}>
                    {me.role}
                  </span>
                  <span className={`text-[0.65rem] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    me.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                  }`}>
                    {me.status || 'active'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detail grid */}
          {me && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E8DCC3]">
              <div>
                <div className="text-[0.65rem] uppercase tracking-widest text-[#7C8F6E] mb-0.5">Last Login</div>
                <div className="text-sm text-[#173B2D]">{formatDate(me.lastLoginAt)}</div>
              </div>
              <div>
                <div className="text-[0.65rem] uppercase tracking-widest text-[#7C8F6E] mb-0.5">Account Created</div>
                <div className="text-sm text-[#173B2D]">{formatDate(me.createdAt)}</div>
              </div>
              <div>
                <div className="text-[0.65rem] uppercase tracking-widest text-[#7C8F6E] mb-0.5">User ID</div>
                <div className="text-xs font-mono text-[#173B2D] truncate">{me.id}</div>
              </div>
              <div>
                <div className="text-[0.65rem] uppercase tracking-widest text-[#7C8F6E] mb-0.5">Last PIN Verification</div>
                <div className="text-sm text-[#173B2D]">{formatDate(me.lastPinAt)}</div>
              </div>
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link href="/dashboard" className="bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-[#173B2D] group">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏠</div>
              <div>
                <h3 className="font-serif text-base text-[#173B2D] group-hover:text-[#C8A24A] transition-colors">Dashboard</h3>
                <p className="text-xs text-[#7C8F6E]">Browse remedies, therapeutics, and predictive books</p>
              </div>
            </div>
          </Link>
          <Link href="/settings" className="bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-[#C8A24A] group">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚙️</div>
              <div>
                <h3 className="font-serif text-base text-[#173B2D] group-hover:text-[#C8A24A] transition-colors">Settings</h3>
                <p className="text-xs text-[#7C8F6E]">Appearance, reading preferences, and data management</p>
              </div>
            </div>
          </Link>
        </section>

        {/* Logout */}
        <section className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-xs text-[#7C8F6E] mb-3">All sessions end immediately on logout.</p>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-[#6E2A3A] hover:bg-[#8a3548] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
