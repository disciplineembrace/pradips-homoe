'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type Remedy = {
  id: string; name: string; common?: string; author: string;
  chapter?: string; keynote?: string; letter?: string;
};

export default function DataPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'remedies' | 'rubrics' | 'therapeutics'>('remedies');
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated || !d.pinVerified) {
        router.push('/login');
        return;
      }
      setSession(d);
    });
  }, [router]);

  useEffect(() => {
    if (session) loadData();
  }, [session, view, page, q, author]);

  async function loadData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (author) params.set('author', author);
    params.set('page', String(page));
    params.set('pageSize', '50');
    try {
      const r = await fetch(`/api/${view}?${params}`);
      if (r.status === 401) { router.push('/login'); return; }
      const d = await r.json();
      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch {
      setItems([]);
      setTotal(0);
    }
    setLoading(false);
  }

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-stone-500">Loading...</div>
      <Footer />
    </div>
  );

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);
  const authors = ['Boericke', 'Phatak', 'Murphy', 'Kent', 'Allen', 'Sankaran', 'Farrington', 'Boeger', 'Mathur'];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <h1 className="font-serif text-3xl text-emerald-900 mb-2">Data Library</h1>
        <p className="text-stone-600 mb-4">Browse the full collection. All access is logged.</p>

        {/* View tabs */}
        <div className="flex gap-1 mb-4 border-b border-stone-300">
          {(['remedies', 'rubrics', 'therapeutics'] as const).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setPage(1); setQ(''); setAuthor(''); }}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${view === v ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              {v === 'remedies' ? 'Materia Medica' : v === 'rubrics' ? 'Repertory' : 'Therapeutics'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder={`Search ${view}...`}
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] px-3 py-2 border rounded text-sm"
          />
          {view !== 'therapeutics' && (
            <select value={author} onChange={e => { setAuthor(e.target.value); setPage(1); }} className="px-3 py-2 border rounded text-sm">
              <option value="">All authors</option>
              {authors.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
        </div>

        {/* Count */}
        <div className="text-sm text-stone-600 mb-3">{total} {view} {q && `matching "${q}"`}</div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading...</div>
        ) : view === 'remedies' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((r: Remedy) => (
              <Link
                key={r.id}
                href={`/remedy/${r.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-emerald-700"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-serif text-lg text-emerald-900">{r.name}</h3>
                  <span className="text-xs text-stone-500">{r.author}</span>
                </div>
                {r.common && <div className="text-xs text-stone-500 italic mb-2">{r.common}</div>}
                {r.chapter && <div className="text-xs text-amber-700 mb-2">{r.chapter}</div>}
                {r.keynote && <p className="text-sm text-stone-600 line-clamp-2">{r.keynote}</p>}
              </Link>
            ))}
          </div>
        ) : view === 'rubrics' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((r: any) => (
              <div key={r.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-serif text-base text-emerald-900 mb-1">{r.title}</h3>
                <div className="text-xs text-stone-500 mb-2">{r.path} · {r.author}</div>
                {r.remedies && r.remedies.length > 0 && (
                  <div className="text-xs text-stone-700">
                    <b>Remedies:</b> {r.remedies.slice(0, 12).join(', ')}
                    {r.remedies.length > 12 && <span className="text-stone-400"> +{r.remedies.length - 12} more</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((d: any) => (
              <div key={d.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-serif text-lg text-emerald-900">{d.name}</h3>
                {d.note && <div className="text-xs italic text-stone-500 mb-2">({d.note})</div>}
                <div className="text-xs text-amber-700 mb-2">{d.subCount} formulas</div>
                {d.subcategories?.map((s: any, i: number) => (
                  <div key={i} className="text-sm mb-1">
                    <span className="font-semibold text-stone-700">{s.name}:</span>{' '}
                    {s.remedies?.slice(0, 6).map((r: any, j: number) => (
                      <span key={j} className="text-emerald-700">{r.name}{r.potency ? `(${r.potency})` : ''}{j < s.remedies.length - 1 && j < 5 ? ', ' : ''}</span>
                    ))}
                    {s.remedies?.length > 6 && <span className="text-stone-400 text-xs"> +{s.remedies.length - 6}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-white border rounded disabled:opacity-50">← Prev</button>
            <span className="text-sm text-stone-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm bg-white border rounded disabled:opacity-50">Next →</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
