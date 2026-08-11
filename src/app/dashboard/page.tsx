'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type Session = {
  authenticated: boolean;
  name?: string;
  role?: string;
  userId?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) {
        router.push('/login');
        return;
      }
      setSession(d);
    });
  }, [router]);

  useEffect(() => {
    if (session) {
      // Load library stats
      fetch('/api/remedies?pageSize=1').then(r => r.json()).then(d => {
        setStats((prev: any) => ({ ...prev, remedies: d.total }));
      }).catch(() => {});
      fetch('/api/rubrics?pageSize=1').then(r => r.json()).then(d => {
        setStats((prev: any) => ({ ...prev, rubrics: d.total }));
      }).catch(() => {});
      fetch('/api/therapeutics?pageSize=1').then(r => r.json()).then(d => {
        setStats((prev: any) => ({ ...prev, therapeutics: d.total }));
      }).catch(() => {});
    }
  }, [session]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-[#7C8F6E]">Loading dashboard...</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  // Cabinet-style navigation cards
  const cabinetSections = [
    { href: '/materia-medica', icon: '📚', title: 'Materia Medica', desc: '4,104 remedies from 10 authors', color: 'border-emerald-700', accent: 'text-emerald-900' },
    { href: '/repertory', icon: '🗂️', title: 'Repertory', desc: 'Kent, Phatak, Murphy, Boericke', color: 'border-amber-700', accent: 'text-amber-800' },
    { href: '/therapeutics', icon: '💊', title: 'Therapeutics', desc: 'Disease-wise formulas', color: 'border-blue-700', accent: 'text-blue-800' },
    { href: '/quick-clinical-search', icon: '🔍', title: 'Quick Clinical Search', desc: 'Search across all remedies', color: 'border-purple-700', accent: 'text-purple-800' },
    { href: '/organon', icon: '📜', title: 'Organon', desc: 'Hahnemann\'s principles', color: 'border-stone-700', accent: 'text-stone-800' },
    { href: '/segal', icon: '🧠', title: 'Segal Homeopathy', desc: 'Dr. Segal\'s approach', color: 'border-rose-700', accent: 'text-rose-800' },
    { href: '/predictive', icon: '🔬', title: 'Predictive Homeopathy', desc: 'Dr. Prafull Vijayakar', color: 'border-teal-700', accent: 'text-teal-800' },
    { href: '/synthesis', icon: '🧩', title: 'Synthesis Repertory', desc: 'Updated version by Dr. Pradip', color: 'border-indigo-700', accent: 'text-indigo-800' },
    { href: '/analysis', icon: '📊', title: 'Analysis Tools', desc: 'Repertorization & analysis', color: 'border-cyan-700', accent: 'text-cyan-800' },
    { href: '/question-bank', icon: '🎓', title: 'Exam Hub', desc: 'Question bank & practice', color: 'border-orange-700', accent: 'text-orange-800' },
    { href: '/books', icon: '📖', title: 'Books', desc: 'Reference library', color: 'border-lime-700', accent: 'text-lime-800' },
    { href: '/activity', icon: '⏱️', title: 'My Activity', desc: 'History & bookmarks', color: 'border-pink-700', accent: 'text-pink-800' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">

        {/* WELCOME BACK HEADER */}
        <div className="bg-gradient-to-br from-[#173B2D] to-[#0F2D22] rounded-2xl p-6 md:p-8 mb-6 shadow-lg border border-[#C8A24A]/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C8A24A] mb-1">Welcome Back</p>
              <h1 className="font-serif text-2xl md:text-3xl text-[#F5EFE0] mb-1">
                {session.name || 'User'} 👋
              </h1>
              <p className="text-sm text-stone-300">
                {session.role === 'admin' ? 'Administrator Access' :
                 session.role === 'staff' ? 'Staff Access' : 'Member Access'} · Pradip&apos;s Homoe Personal Digital Library
              </p>
            </div>
            <div className="flex items-center gap-2">
              {session.role === 'admin' && (
                <Link href="/admin" className="text-xs bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] px-4 py-2 rounded-lg font-semibold transition-colors">
                  Admin Panel
                </Link>
              )}
              <button onClick={logout} className="text-xs bg-red-900 hover:bg-red-800 text-red-100 px-4 py-2 rounded-lg font-semibold transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* LIBRARY STATS — cabinet drawer style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#173B2D]">{stats?.remedies?.toLocaleString() || '—'}</div>
            <div className="text-xs uppercase tracking-wider text-[#7C8F6E] mt-1">Remedies</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#173B2D]">{stats?.rubrics?.toLocaleString() || '—'}</div>
            <div className="text-xs uppercase tracking-wider text-[#7C8F6E] mt-1">Rubrics</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#173B2D]">{stats?.therapeutics?.toLocaleString() || '—'}</div>
            <div className="text-xs uppercase tracking-wider text-[#7C8F6E] mt-1">Therapeutics</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#173B2D]">10</div>
            <div className="text-xs uppercase tracking-wider text-[#7C8F6E] mt-1">Authors</div>
          </div>
        </div>

        {/* CABINET NAVIGATION */}
        <div className="mb-4">
          <h2 className="font-serif text-xl text-[#173B2D] mb-1">Library Cabinet</h2>
          <div className="w-16 h-0.5 bg-[#C8A24A] mb-3"></div>
          <p className="text-xs text-[#7C8F6E]">Select a section to explore</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {cabinetSections.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className={`bg-white rounded-xl shadow-sm border-l-4 ${s.color} p-4 hover:shadow-md transition-all group`}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{s.icon}</div>
              <h3 className={`font-serif text-base ${s.accent} leading-tight mb-1`}>{s.title}</h3>
              <p className="text-xs text-[#7C8F6E] leading-snug">{s.desc}</p>
            </Link>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-5 mb-6">
          <h2 className="font-serif text-lg text-[#173B2D] mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/materia-medica" className="text-sm bg-[#173B2D] hover:bg-[#0F2D22] text-[#F5EFE0] px-4 py-2 rounded-lg font-semibold transition-colors">
              📚 Browse Materia Medica
            </Link>
            <Link href="/quick-clinical-search" className="text-sm bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] px-4 py-2 rounded-lg font-semibold transition-colors">
              🔍 Quick Search
            </Link>
            <Link href="/synthesis" className="text-sm bg-white border-2 border-[#173B2D] hover:bg-[#F5EFE0] text-[#173B2D] px-4 py-2 rounded-lg font-semibold transition-colors">
              🧩 Synthesis Repertorize
            </Link>
            <Link href="/activity" className="text-sm bg-white border-2 border-[#7C8F6E] hover:bg-[#F5EFE0] text-[#7C8F6E] px-4 py-2 rounded-lg font-semibold transition-colors">
              ⏱️ My Activity
            </Link>
          </div>
        </div>

        {/* ABOUT FOOTER NOTE */}
        <div className="bg-[#173B2D] rounded-xl p-4 text-center">
          <p className="text-xs text-stone-300">
            🔒 All access is logged · Unauthorized access prohibited · Pradip&apos;s Homoe © 2026
          </p>
        </div>

      </main>
      <Footer />
    </div>
  );
}
