'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type Rubric = {
  id: string;
  title: string;
  path?: string;
  author: string;
  remedies?: string[];
};

const AUTHORS = ['Kent', 'Phatak', 'Murphy', 'Boericke'];
const PAGE_SIZE = 20;

export default function RepertoryPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('Kent');
  const [loading, setLoading] = useState(false);
  const reader = useReaderFeatures();

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

  const loadRubrics = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (author) params.set('author', author);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    fetch(`/api/rubrics?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setRubrics(d.items || []);
        setTotal(d.total || 0);
      })
      .catch(() => { setRubrics([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, author, page]);

  useEffect(() => {
    if (session) loadRubrics();
  }, [session, loadRubrics]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [q, author]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleFav(e: React.MouseEvent, r: Rubric) {
    e.preventDefault();
    e.stopPropagation();
    reader.toggleFavorite({ id: r.id, type: 'rubric', title: r.title, author: r.author });
  }
  function toggleBm(e: React.MouseEvent, r: Rubric) {
    e.preventDefault();
    e.stopPropagation();
    reader.toggleBookmark({ id: r.id, type: 'rubric', title: r.title, author: r.author });
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Repertory...</p>
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
          <h1 className="font-serif text-3xl text-[#173B2D]">Repertory</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Browse 79,706 rubrics across Kent, Phatak, Murphy & Boericke</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Author tabs */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-lg shadow p-2">
          {AUTHORS.map(a => (
            <button
              key={a}
              onClick={() => setAuthor(a)}
              className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors ${
                author === a
                  ? 'bg-[#173B2D] text-[#F5EFE0]'
                  : 'text-[#7C8F6E] hover:bg-[#F5EFE0] hover:text-[#173B2D]'
              }`}
            >{a}</button>
          ))}
          <Link
            href="/synthesis"
            className="ml-auto px-4 py-1.5 text-xs font-semibold rounded bg-[#C8A24A]/20 text-[#C8A24A] hover:bg-[#C8A24A]/30 transition-colors"
          >Synthesis Repertory →</Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search rubrics by title, path, or remedy..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
        </div>

        {/* Count */}
        <div className="text-sm text-[#7C8F6E] mb-3">
          {loading ? 'Searching...' : `${total.toLocaleString()} rubric${total !== 1 ? 's' : ''}${q ? ` matching "${q}"` : ''} in ${author}`}
        </div>

        {/* Rubric cards */}
        {loading && rubrics.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">Loading rubrics...</div>
        ) : rubrics.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">No rubrics found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rubrics.map(r => {
              const fav = reader.isFavorite(r.id);
              const bm = reader.isBookmarked(r.id);
              return (
                <article
                  key={r.id}
                  className="bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow border-t-2 border-[#173B2D]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg text-[#173B2D] leading-tight">{r.title}</h3>
                      {r.path && <p className="text-xs text-[#7C8F6E] mt-1">{r.path}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => toggleFav(e, r)}
                        title={fav ? 'Remove favorite' : 'Add favorite'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${fav ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >★</button>
                      <button
                        onClick={(e) => toggleBm(e, r)}
                        title={bm ? 'Remove bookmark' : 'Add bookmark'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >🔖</button>
                    </div>
                  </div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#C8A24A] mb-2">{r.author}</div>
                  {r.remedies && r.remedies.length > 0 && (
                    <div className="max-h-32 overflow-y-auto pr-1 -mr-1">
                      <div className="flex flex-wrap gap-1.5">
                        {r.remedies.slice(0, 40).map((rm, i) => (
                          <span key={i} className="text-[0.7rem] bg-[#F5EFE0] text-[#173B2D] px-2 py-0.5 rounded border border-[#E8DCC3]">{rm}</span>
                        ))}
                        {r.remedies.length > 40 && (
                          <span className="text-[0.7rem] text-[#7C8F6E] py-0.5">+{r.remedies.length - 40} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >← Prev</button>
            <span className="text-sm text-[#7C8F6E]">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
