'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';
import { useBrowseState } from '@/hooks/use-browse-state';

type Remedy = { name: string; potency?: string };
type Subcategory = { name: string; remedies: Remedy[] };
type Disease = {
  id: string;
  name: string;
  note?: string;
  subCount?: number;
  subcategories?: Subcategory[];
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function TherapeuticsPageImpl()

export default function TherapeuticsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TherapeuticsPageImpl />
    </Suspense>
  );
}

function TherapeuticsPageImpl() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [total, setTotal] = useState(0);
  // Use browse state persistence hook
  const { state: browseState, setState: setBrowseState, restoreScroll } = useBrowseState('therapeutics', {
    q: '',
    letter: '',
  });
  const { q, letter } = browseState;
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const loadDiseases = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (letter) params.set('letter', letter);
    fetch(`/api/therapeutics?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setDiseases(d.items || []);
        setTotal(d.total || 0);
        // Auto-select first disease if none selected and list is non-empty
        setSelectedId(prev => prev && (d.items || []).some((x: Disease) => x.id === prev) ? prev : (d.items?.[0]?.id ?? null));
      })
      .catch(() => { setDiseases([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, letter]);

  useEffect(() => {
    if (session) loadDiseases();
  }, [session, loadDiseases]);

  const selected = diseases.find(d => d.id === selectedId) || null;
  const fav = selected ? reader.isFavorite(selected.id) : false;
  const bm = selected ? reader.isBookmarked(selected.id) : false;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Therapeutics...</p>
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
          <h1 className="font-serif text-3xl text-[#173B2D]">Therapeutics</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">408 disease categories with remedy formulas — from Dr. Saif-ud-Din Saif&apos;s Encyclopedia</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Search + A-Z */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search diseases & formulas..."
              value={q}
              onChange={e => setBrowseState({ q: e.target.value })}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setBrowseState({ letter: "" })}
              className={`px-3 h-7 text-xs font-mono rounded ${letter === '' ? 'bg-[#173B2D] text-[#F5EFE0]' : 'bg-[#F5EFE0] border border-[#E8DCC3] hover:bg-[#E8DCC3] text-[#173B2D]'}`}
            >All</button>
            {LETTERS.map(L => (
              <button
                key={L}
                onClick={() => setBrowseState({ letter: letter === L ? "" : L })}
                className={`w-7 h-7 text-xs font-mono rounded ${letter === L ? 'bg-[#173B2D] text-[#F5EFE0]' : 'bg-[#F5EFE0] border border-[#E8DCC3] hover:bg-[#E8DCC3] text-[#173B2D]'}`}
              >{L}</button>
            ))}
          </div>
        </div>

        <div className="text-sm text-[#7C8F6E] mb-3">
          {loading ? 'Searching...' : `${total} disease${total !== 1 ? 's' : ''}${q ? ` matching "${q}"` : ''}${letter ? ` starting with "${letter}"` : ''}`}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left sidebar — disease list */}
          <aside className="lg:col-span-4 bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-[#173B2D] text-[#F5EFE0] px-4 py-2.5">
              <h2 className="font-serif text-sm uppercase tracking-wider">Disease List</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading && diseases.length === 0 ? (
                <div className="p-4 text-sm text-[#7C8F6E] text-center">Loading...</div>
              ) : diseases.length === 0 ? (
                <div className="p-4 text-sm text-[#7C8F6E] text-center">No diseases found.</div>
              ) : (
                <ul className="divide-y divide-[#E8DCC3]">
                  {diseases.map(d => (
                    <li key={d.id}>
                      <button
                        onClick={() => setSelectedId(d.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-[#F5EFE0] transition-colors ${selectedId === d.id ? 'bg-[#F5EFE0] border-l-4 border-[#C8A24A] pl-3' : 'border-l-4 border-transparent'}`}
                      >
                        <div className="font-serif text-sm text-[#173B2D]">{d.name}</div>
                        <div className="text-[0.65rem] text-[#7C8F6E] uppercase tracking-wider mt-0.5">
                          {d.subCount ?? d.subcategories?.length ?? 0} formulas
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Right detail panel */}
          <section className="lg:col-span-8 bg-white rounded-lg shadow p-6">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-[#E8DCC3] pb-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-2xl text-[#173B2D]">{selected.name}</h2>
                    {selected.note && <p className="text-xs italic text-[#7C8F6E] mt-1">{selected.note}</p>}
                    <div className="text-[0.65rem] text-[#C8A24A] font-semibold uppercase tracking-wider mt-1">
                      {(selected.subcategories || []).length} formula categor{(selected.subcategories || []).length === 1 ? 'y' : 'ies'}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => reader.toggleFavorite({ id: selected.id, type: 'therapeutic', title: selected.name })}
                      title={fav ? 'Remove favorite' : 'Add favorite'}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${fav ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                    >★</button>
                    <button
                      onClick={() => reader.toggleBookmark({ id: selected.id, type: 'therapeutic', title: selected.name })}
                      title={bm ? 'Remove bookmark' : 'Add bookmark'}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                    >🔖</button>
                  </div>
                </div>

                {selected.subcategories && selected.subcategories.length > 0 ? (
                  <div className="space-y-4 max-h-[560px] overflow-y-auto pr-2">
                    {selected.subcategories.map((s, i) => (
                      <article key={i} className="border-l-2 border-[#C8A24A] pl-3 py-1">
                        <h3 className="font-serif text-sm text-[#173B2D] mb-1.5">{s.name}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {s.remedies.map((r, j) => (
                            <span key={j} className="text-xs bg-[#F5EFE0] text-[#173B2D] px-2 py-1 rounded border border-[#E8DCC3]">
                              {r.name}{r.potency ? <span className="text-[#C8A24A] ml-1">{r.potency}</span> : null}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#7C8F6E]">No formulas recorded for this category.</p>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🌿</div>
                <p className="text-sm text-[#7C8F6E]">Select a disease from the left to view its formulas.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
