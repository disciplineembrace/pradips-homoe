'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const rf = useReaderFeatures();

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      setSession(d);
      // Load stats in background
      Promise.all([
        fetch('/api/remedies?pageSize=1').then(r => r.json()).catch(() => ({ total: 0 })),
        fetch('/api/rubrics?pageSize=1').then(r => r.json()).catch(() => ({ total: 0 })),
        fetch('/api/therapeutics').then(r => r.json()).catch(() => ({ total: 0 })),
      ]).then(([rems, rubs, ther]) => {
        setStats({
          remedies: rems.total || 0,
          rubrics: rubs.total || 0,
          therapeutics: ther.total || 0,
        });
      }).catch(() => {});
    }).catch(() => router.push('/login'));
  }, [router]);

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-[#7C8F6E]">Loading library...</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Stats cards
  const statCards = [
    { num: '9', label: 'Books', icon: '📚' },
    { num: (stats.remedies || 0).toLocaleString(), label: 'MM Entries', icon: '💊' },
    { num: (stats.rubrics || 0).toLocaleString(), label: 'Repertory', icon: '🗂️' },
    { num: rf.bookmarks.length, label: 'Bookmarks', icon: '🔖' },
    { num: rf.favorites.length, label: 'Favorites', icon: '⭐' },
    { num: rf.notes.length, label: 'Notes', icon: '📝' },
    { num: '0m', label: 'Read Time', icon: '⏱️' },
    { num: '0', label: 'Streak', icon: '🔥' },
  ];

  // The Cabinet — author cards
  const cabinet = [
    { name: 'Boericke', desc: 'Pocket manual · concise keynotes', count: '688', href: '/materia-medica' },
    { name: 'Phatak', desc: 'Comparative concordance style', count: '420', href: '/materia-medica' },
    { name: 'Murphy', desc: 'Modern clinical repertorial notes', count: '1,383', href: '/materia-medica' },
    { name: 'Kent', desc: 'Lectures on Homoeopathic MM', count: '70', href: '/materia-medica' },
    { name: 'Allen', desc: 'Key Notes', count: '186', href: '/materia-medica' },
    { name: 'Sankaran', desc: 'Soul of Remedies', count: '99', href: '/materia-medica' },
  ];

  // Library sections
  const sections = [
    { title: 'Materia Medica', desc: '3,471 remedies from 9 authors', href: '/materia-medica', icon: '📚', color: '#173B2D' },
    { title: 'Repertory', desc: '79,706 rubrics (Kent, Phatak, Murphy)', href: '/repertory', icon: '🗂️', color: '#6E2A3A' },
    { title: 'Therapeutics', desc: '408 disease formulas with potencies', href: '/therapeutics', icon: '💊', color: '#173B2D' },
    { title: 'Organon', desc: 'Hahnemann\'s foundational aphorisms', href: '/organon', icon: '📖', color: '#6E2A3A' },
    { title: 'Predictive', desc: 'Theory of Suppression & Acutes', href: '/predictive', icon: '🔮', color: '#173B2D' },
    { title: 'Analysis', desc: 'Case analysis with remedy ranking', href: '/analysis', icon: '⚗️', color: '#6E2A3A' },
    { title: 'Books', desc: 'Full e-books with reader', href: '/books', icon: '📙', color: '#173B2D' },
    { title: 'Synthesis', desc: 'Synthesis repertory interface', href: '/synthesis', icon: '📑', color: '#6E2A3A' },
    { title: 'Segal', desc: 'ROH Series by Dr. M.L. Sehgal', href: '/segal', icon: '🔬', color: '#173B2D' },
  ];

  const recentItems = rf.history.slice(0, 5);
  const favRemedies = rf.favorites.filter(f => f.type === 'remedy').slice(0, 5);
  const favRubrics = rf.favorites.filter(f => f.type === 'rubric').slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Welcome header */}
        <div className="mb-4">
          <h1 className="font-serif text-3xl text-[#173B2D]">Welcome back</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">{today}</p>
        </div>

        {/* Quote card — dark green */}
        <div className="bg-[#173B2D] rounded-lg p-6 mb-6">
          <p className="font-serif italic text-lg text-[#C8A24A] mb-2 text-center">
            &ldquo;The physician&apos;s highest calling is to make the sick healthy — the cure, as Hahnemann called it, the highest ideal.&rdquo;
          </p>
          <p className="text-xs uppercase tracking-widest text-stone-400 text-center">— Hahnemann, paraphrased</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-[#173B2D] font-serif">{s.num}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] mt-1 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <form onSubmit={(e) => { e.preventDefault(); const q = (e.target as any).q.value; if (q) router.push(`/search?q=${encodeURIComponent(q)}`); }} className="flex gap-2">
            <input name="q" type="text" placeholder="Quick search remedies, rubrics, diseases, books..." className="flex-1 px-4 py-2 border-2 border-[#E8DCC3] rounded focus:outline-none focus:border-[#173B2D] text-sm" />
            <button type="submit" className="bg-[#173B2D] hover:bg-[#2a5443] text-white px-6 py-2 rounded font-semibold text-sm">Search →</button>
          </form>
        </div>

        {/* The Cabinet */}
        <h2 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">The Cabinet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {cabinet.map(c => (
            <Link key={c.name} href={c.href} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border-l-4 border-[#173B2D]">
              <h3 className="font-serif text-lg text-[#173B2D] mb-1">{c.name}</h3>
              <p className="text-xs text-[#7C8F6E] mb-2">{c.desc}</p>
              <div className="text-xs text-[#C8A24A] font-semibold">{c.count} entries</div>
            </Link>
          ))}
        </div>

        {/* Library Sections */}
        <h2 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">Library Sections</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 mb-8">
          {sections.map(s => (
            <Link key={s.title} href={s.href} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: s.color }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">{s.icon}</div>
                <div>
                  <h3 className="font-serif text-base text-[#173B2D]">{s.title}</h3>
                  <p className="text-xs text-[#7C8F6E]">{s.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Three columns: Continue Reading, Favorite Remedies, Favorite Rubrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">Continue Reading</h3>
            {recentItems.length > 0 ? (
              <div className="space-y-2">
                {recentItems.map((h, i) => (
                  <div key={i} className="text-sm text-[#173B2D]">{h.name} <span className="text-xs text-[#7C8F6E]">· {new Date(h.ts).toLocaleDateString()}</span></div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7C8F6E] italic">Nothing opened yet — browse the library to begin</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">Favorite Remedies</h3>
            {favRemedies.length > 0 ? (
              <div className="space-y-2">
                {favRemedies.map((f, i) => (
                  <Link key={i} href={`/remedy/${f.id}`} className="block text-sm text-[#173B2D] hover:text-[#C8A24A]">{f.name}</Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7C8F6E] italic">No remedies favorited yet</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">Favorite Rubrics</h3>
            {favRubrics.length > 0 ? (
              <div className="space-y-2">
                {favRubrics.map((f, i) => (
                  <div key={i} className="text-sm text-[#173B2D]">{f.name}</div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7C8F6E] italic">No rubrics favorited yet</p>
            )}
          </div>
        </div>

        {/* Reading Statistics */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-4 font-semibold">Reading Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center"><div className="text-2xl font-bold text-[#173B2D] font-serif">0</div><div className="text-xs text-[#7C8F6E] uppercase">Reading Time (min)</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-[#173B2D] font-serif">0</div><div className="text-xs text-[#7C8F6E] uppercase">Day Streak</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-[#173B2D] font-serif">{rf.history.length}</div><div className="text-xs text-[#7C8F6E] uppercase">Items Viewed</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-[#173B2D] font-serif">{rf.bookmarks.length}</div><div className="text-xs text-[#7C8F6E] uppercase">Bookmarks</div></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
