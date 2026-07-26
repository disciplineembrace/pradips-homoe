'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useBrowseState } from '@/hooks/use-browse-state';

type Result = { type: 'remedy' | 'rubric'; id: string; name: string; author: string };
type Filter = 'All' | 'Remedies' | 'Rubrics';

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get('q') || '';
  const [session, setSession] = useState<any>(null);
  const [q, setQ] = useState(initialQ);
  const [filter, setFilter] = useState<Filter>('All');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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

  const runSearch = useCallback((query: string) => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    fetch(`/api/search?q=${encodeURIComponent(term)}`)
      .then(r => r.json())
      .then(d => setResults(d.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  // Auto-run when URL query changes
  useEffect(() => {
    if (initialQ) runSearch(initialQ);
  }, [initialQ, runSearch]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) {
      // Update URL (so user can share/bookmark) and run search
      const url = new URL(window.location.href);
      url.searchParams.set('q', term);
      window.history.replaceState(null, '', url.toString());
      runSearch(term);
    }
  }

  const filtered = results.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Remedies') return r.type === 'remedy';
    if (filter === 'Rubrics') return r.type === 'rubric';
    return true;
  });

  const counts = {
    All: results.length,
    Remedies: results.filter(r => r.type === 'remedy').length,
    Rubrics: results.filter(r => r.type === 'rubric').length,
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Search...</p>
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
          <h1 className="font-serif text-3xl text-[#173B2D]">Global Search</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Search across all remedies and rubrics in the library</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Search box */}
        <form onSubmit={submit} className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Enter at least 2 characters..."
                className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-[#173B2D] hover:bg-[#2a5443] text-[#F5EFE0] rounded-lg text-sm font-semibold"
            >Search</button>
          </div>
        </form>

        {/* Filter tabs */}
        {searched && (
          <div className="flex gap-1 mb-4 bg-white rounded-lg shadow p-1">
            {(['All', 'Remedies', 'Rubrics'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors ${
                  filter === f ? 'bg-[#173B2D] text-[#F5EFE0]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'
                }`}
              >
                {f} <span className="opacity-70">({counts[f]})</span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {!searched ? (
          <div className="bg-white rounded-lg shadow border-2 border-dashed border-[#E8DCC3] p-12 text-center">
            <div className="text-5xl mb-3">🔎</div>
            <p className="text-sm text-[#7C8F6E]">Type a search term above to begin.</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-[#7C8F6E]">Searching...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-sm text-[#7C8F6E]">No results found. Try a different query.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.type === 'remedy' ? `/remedy/${r.id}` : `/repertory`}
                className="block bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-[#173B2D] group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded ${r.type === 'remedy' ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'bg-[#173B2D]/10 text-[#173B2D]'}`}>
                        {r.type}
                      </span>
                      <span className="text-[0.65rem] text-[#7C8F6E]">{r.author || '—'}</span>
                    </div>
                    <h3 className="font-serif text-base text-[#173B2D] group-hover:text-[#C8A24A] transition-colors leading-tight">
                      {r.name}
                    </h3>
                  </div>
                  <span className="text-[#7C8F6E] text-sm flex-shrink-0">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div>
          </div>
          <Footer />
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
