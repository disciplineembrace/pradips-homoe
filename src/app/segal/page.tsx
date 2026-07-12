'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const SEGAL_QUOTE = '"Disease is a process, not a thing. The remedy must speak the language of that process — not suppress its outward expression, but complete its arc." — Dr. Dinesh Chauhan, on the Segal Method';

export default function SegalPage() {
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
            <p className="text-sm text-[#7C8F6E]">Loading Segal...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Segal Method</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Dr. Dinesh Chauhan&apos;s case-witnessing approach</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Dark green quote card */}
        <section className="bg-[#173B2D] text-[#F5EFE0] rounded-lg shadow-lg p-6 mb-6 border-l-4 border-[#C8A24A]">
          <div className="text-4xl text-[#C8A24A] font-serif leading-none mb-2">&ldquo;</div>
          <p className="font-serif italic text-base md:text-lg leading-relaxed text-stone-200">
            {SEGAL_QUOTE}
          </p>
        </section>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Segal method concepts (placeholder)..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
        </div>

        {/* Coming Soon placeholder */}
        <section className="bg-white rounded-lg shadow border-2 border-dashed border-[#E8DCC3] p-12 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="font-serif text-2xl text-[#173B2D] mb-2">Coming Soon</h2>
          <p className="text-sm text-[#7C8F6E] max-w-md mx-auto leading-relaxed">
            The Segal method module is currently in preparation. Dr. Dinesh Chauhan&apos;s case-witnessing approach —
            with its emphasis on passive case-taking, the patient&apos;s inner experience, and the journey to the
            sensation — will be available here once the content has been compiled and curated.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#F5EFE0] rounded-full text-xs text-[#7C8F6E] uppercase tracking-widest">
            <span className="w-2 h-2 bg-[#C8A24A] rounded-full animate-pulse"></span>
            In Preparation
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
