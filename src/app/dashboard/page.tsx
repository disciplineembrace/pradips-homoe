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

type Session = {
  authenticated: boolean;
  pinVerified: boolean;
  user?: { name: string; role: string; status: string };
};

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('');
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'materia' | 'therapeutics' | 'predictive'>('materia');
  
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
    if (session && view === 'materia') loadRemedies();
  }, [session, view, page, q, author, letter]);
  
  async function loadRemedies() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (author) params.set('author', author);
    if (letter) params.set('letter', letter);
    params.set('page', String(page));
    params.set('pageSize', '50');
    const r = await fetch(`/api/remedies?${params}`);
    if (r.status === 401) { router.push('/login'); return; }
    const d = await r.json();
    setRemedies(d.items || []);
    setTotal(d.total || 0);
    setLoading(false);
  }
  
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  
  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-[#7C8F6E]">Loading...</div>
      <Footer />
    </div>
  );

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);
  const authors = ['Boericke', 'Phatak', 'Murphy', 'Kent', 'Allen', 'Sankaran', 'Farrington', 'Boeger', 'Mathur'];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* View tabs */}
        <div className="flex gap-1 mb-4 border-b border-[#E8DCC3]">
          {(['materia', 'therapeutics', 'predictive'] as const).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setPage(1); setQ(''); setLetter(''); setAuthor(''); }}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${view === v ? 'border-[#173B2D] text-[#173B2D]' : 'border-transparent text-[#7C8F6E] hover:text-stone-800'}`}
            >
              {v === 'materia' ? 'Materia Medica' : v === 'therapeutics' ? 'Therapeutics' : 'Predictive'}
            </button>
          ))}
        </div>

        {view === 'materia' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Search remedies..."
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                className="flex-1 min-w-[200px] px-3 py-2 border rounded text-sm"
              />
              <select value={author} onChange={e => { setAuthor(e.target.value); setPage(1); }} className="px-3 py-2 border rounded text-sm">
                <option value="">All authors</option>
                {authors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {/* A-Z */}
            <div className="flex flex-wrap gap-1 mb-4">
              {letters.map(L => (
                <button
                  key={L}
                  onClick={() => { setLetter(letter === L ? '' : L); setPage(1); }}
                  className={`w-8 h-8 text-xs font-mono rounded ${letter === L ? 'bg-[#173B2D] text-white' : 'bg-white border hover:bg-[#F5EFE0]'}`}
                >{L}</button>
              ))}
            </div>
            {/* Count */}
            <div className="text-sm text-stone-600 mb-3">{total} remedies {q && `matching "${q}"`}</div>
            {/* Grid */}
            {loading ? (
              <div className="text-center py-12 text-[#7C8F6E]">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {remedies.map(r => (
                  <Link
                    key={r.id}
                    href={`/remedy/${r.id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-[#173B2D]"
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-serif text-lg text-[#173B2D]">{r.name}</h3>
                      <span className="text-xs text-[#7C8F6E]">{r.author}</span>
                    </div>
                    {r.common && <div className="text-xs text-[#7C8F6E] italic mb-2">{r.common}</div>}
                    {r.chapter && <div className="text-xs text-[#C8A24A] mb-2">{r.chapter}</div>}
                    {r.keynote && <p className="text-sm text-stone-600 line-clamp-2">{r.keynote}</p>}
                  </Link>
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
          </>
        )}
        {view === 'therapeutics' && <TherapeuticsPanel />}
        {view === 'predictive' && <PredictivePanel />}
      </main>
      <Footer />
    </div>
  );
}

function TherapeuticsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (letter) params.set('letter', letter);
    fetch(`/api/therapeutics?${params}`).then(r => r.json()).then(d => {
      setItems(d.items || []);
      setTotal(d.total || 0);
      setLoading(false);
    });
  }, [q, letter]);
  
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search diseases & formulas..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {letters.map(L => (
          <button
            key={L}
            onClick={() => setLetter(letter === L ? '' : L)}
            className={`w-8 h-8 text-xs font-mono rounded ${letter === L ? 'bg-[#173B2D] text-white' : 'bg-white border hover:bg-[#F5EFE0]'}`}
          >{L}</button>
        ))}
      </div>
      <div className="text-sm text-stone-600 mb-3">{total} diseases</div>
      {loading ? <div className="text-center py-12">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((d: any) => (
            <div key={d.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-serif text-lg text-[#173B2D]">{d.name}</h3>
              {d.note && <div className="text-xs italic text-[#7C8F6E] mb-2">({d.note})</div>}
              <div className="text-xs text-[#C8A24A] mb-2">{d.subCount} formulas</div>
              {d.subcategories?.map((s: any, i: number) => (
                <div key={i} className="text-sm mb-1">
                  <span className="font-semibold text-stone-700">{s.name}:</span>{' '}
                  {s.remedies?.slice(0, 8).map((r: any, j: number) => (
                    <span key={j} className="text-[#173B2D]">{r.name}{r.potency ? `(${r.potency})` : ''}{j < s.remedies.length - 1 && j < 7 ? ', ' : ''}</span>
                  ))}
                  {s.remedies?.length > 8 && <span className="text-stone-400 text-xs"> +{s.remedies.length - 8}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PredictivePanel() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch('/api/predictive').then(r => r.json()).then(setData);
  }, []);
  if (!data) return <div className="text-center py-12">Loading...</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {(data.books || []).map((b: any) => (
        <div key={b.id} className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl mb-2">📖</div>
          <h3 className="font-serif text-lg text-[#173B2D]">{b.title}</h3>
          <div className="text-xs text-[#7C8F6E] mb-2">by {b.author}</div>
          <div className="text-xs text-[#C8A24A]">{b.chapters?.length || 0} chapters</div>
        </div>
      ))}
    </div>
  );
}
