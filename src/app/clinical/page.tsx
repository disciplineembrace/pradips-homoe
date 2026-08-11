'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';
import { useBrowseState } from '@/hooks/use-browse-state';

type Remedy = {
  id: string;
  name: string;
  common?: string;
  author: string;
  chapter?: string;
  keynote?: string;
  letter?: string;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 30;

function ClinicalPageImpl() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const reader = useReaderFeatures();

  const { state: browseState, setState: setBrowseState, restoreScroll } = useBrowseState('clinical', {
    letter: '',
    q: '',
    page: 1,
  });
  const { letter, q, page } = browseState;

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadRemedies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('author', 'Allen');
    if (q) params.set('q', q);
    if (letter) params.set('letter', letter);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    fetch(`/api/remedies?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setRemedies(d.items || []);
        setTotal(d.total || 0);
      })
      .catch(() => { setRemedies([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, letter, page]);

  useEffect(() => {
    if (session) loadRemedies();
  }, [session, loadRemedies]);

  useEffect(() => {
    if (session && remedies.length > 0) {
      restoreScroll();
    }
  }, [session, remedies, restoreScroll]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleFav(e: React.MouseEvent, r: Remedy) {
    e.preventDefault();
    e.stopPropagation();
    reader.toggleFavorite({ id: r.id, type: 'remedy', title: r.name, href: `/remedy/${r.id}`, author: r.author });
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Clinical Section...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Clinical</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Allen's Skin Keynotes — Clinical Remedy Reference</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Subsection badge */}
        <div className="bg-[#173B2D] text-[#C8A24A] rounded-lg p-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="font-serif text-lg font-semibold">Allen's Skin Keynotes</h2>
            <p className="text-xs text-[#7C8F6E]">Skin-related remedies from Allen's Keynotes (Ellicura Edition)</p>
          </div>
        </div>

        {/* Search + A-Z */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search remedies by name, common name, or keynote..."
              value={q}
              onChange={e => setBrowseState({ q: e.target.value })}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setBrowseState({ letter: '' })}
              className={`px-3 h-7 text-xs font-mono rounded ${letter === '' ? 'bg-[#173B2D] text-[#F5EFE0]' : 'bg-[#F5EFE0] border border-[#E8DCC3] hover:bg-[#E8DCC3] text-[#173B2D]'}`}
            >All</button>
            {LETTERS.map(L => (
              <button
                key={L}
                onClick={() => setBrowseState({ letter: letter === L ? '' : L })}
                className={`w-7 h-7 text-xs font-mono rounded ${letter === L ? 'bg-[#173B2D] text-[#F5EFE0]' : 'bg-[#F5EFE0] border border-[#E8DCC3] hover:bg-[#E8DCC3] text-[#173B2D]'}`}
              >{L}</button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-[#7C8F6E]">
            {loading ? 'Searching...' : `${total} remedy${total !== 1 ? 'ies' : ''}${q ? ` matching "${q}"` : ''}${letter ? ` starting with "${letter}"` : ''}`}
          </div>
        </div>

        {/* Grid */}
        {loading && remedies.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">Loading remedies...</div>
        ) : remedies.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">No remedies found. Try a different search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {remedies.map(r => {
              const fav = reader.isFavorite(r.id);
              return (
                <Link
                  key={r.id}
                  href={`/remedy/${r.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-[#6E2A3A] group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-lg text-[#173B2D] leading-tight">{r.name}</h3>
                    <button
                      onClick={(e) => toggleFav(e, r)}
                      title={fav ? 'Remove favorite' : 'Add favorite'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${fav ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                    >★</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#6E2A3A]">Allen Skin</span>
                  </div>
                  {r.keynote && (
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">{r.keynote}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setBrowseState({ page: Math.max(1, page - 1) })}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >← Prev</button>
            <span className="text-sm text-[#7C8F6E]">Page {page} of {totalPages}</span>
            <button
              onClick={() => setBrowseState({ page: Math.min(totalPages, page + 1) })}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >Next →</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ClinicalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5EFE0]"><p className="text-[#7C8F6E]">Loading...</p></div>}>
      <ClinicalPageImpl />
    </Suspense>
  );
}
