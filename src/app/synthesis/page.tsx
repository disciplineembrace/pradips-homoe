'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function SynthesisPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [q, setQ] = useState('');

  // Auth check
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Synthesis...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Synthesis Repertory</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Cross-referenced rubric data for advanced repertorisation</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Synthesis rubrics (placeholder)..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
        </div>

        {/* Placeholder for synthesis repertory */}
        <section className="bg-white rounded-lg shadow border-2 border-dashed border-[#E8DCC3] p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="font-serif text-2xl text-[#173B2D] mb-3">Synthesis Repertory Module</h2>
          <p className="text-sm text-stone-600 max-w-xl mx-auto leading-relaxed mb-6">
            The Synthesis Repertory is the modern standard reference for homoeopathic repertorisation, compiled by
            Frederik Schroyens and the ECH (European Committee for Homeopathy). It builds on Kent&apos;s framework
            with additions from contemporary provings and clinical verification.
          </p>
          <p className="text-sm text-[#7C8F6E] max-w-lg mx-auto leading-relaxed">
            Full cross-referenced browsing of Synthesis rubrics — with chapters, sub-rubrics, remedy grades,
            and synonyms — will be available here once the extraction process completes.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#F5EFE0] rounded-full text-xs text-[#7C8F6E] uppercase tracking-widest">
            <span className="w-2 h-2 bg-[#C8A24A] rounded-full animate-pulse"></span>
            Extraction in Progress
          </div>
        </section>

        {/* Helpful links */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/repertory" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border-l-4 border-[#173B2D]">
            <div className="text-2xl mb-1">📖</div>
            <h3 className="font-serif text-sm text-[#173B2D]">Kent Repertory</h3>
            <p className="text-xs text-[#7C8F6E] mt-1">Browse Kent&apos;s classic 62,696 rubrics</p>
          </Link>
          <Link href="/repertory" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border-l-4 border-[#173B2D]">
            <div className="text-2xl mb-1">📒</div>
            <h3 className="font-serif text-sm text-[#173B2D]">Phatak Repertory</h3>
            <p className="text-xs text-[#7C8F6E] mt-1">10,840 alphabetically-arranged rubrics</p>
          </Link>
          <Link href="/repertory" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border-l-4 border-[#173B2D]">
            <div className="text-2xl mb-1">📕</div>
            <h3 className="font-serif text-sm text-[#173B2D]">Murphy Repertory</h3>
            <p className="text-xs text-[#7C8F6E] mt-1">6,169 clinical rubrics</p>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
