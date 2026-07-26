'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type Result = {
  type: 'remedy' | 'rubric';
  id: string;
  name: string;
  author: string;
  source: string;
  subsection?: string;
  matchType: 'exact' | 'close' | 'related';
  matchText: string;
  snippet: string;
  href: string;
  sourcePages?: string;
};

const SUBJECTS = [
  { value: 'all', label: 'All Subjects' },
  { value: 'materia-medica', label: 'Materia Medica' },
  { value: 'repertory', label: 'Repertory' },
];

const SOURCES_BY_SUBJECT: Record<string, { value: string; label: string }[]> = {
  'all': [{ value: 'all', label: 'All Sources' }],
  'materia-medica': [
    { value: 'all', label: 'All Materia Medica Sources' },
    { value: 'Dubey', label: 'S. K. Dubey' },
    { value: 'Phatak', label: 'S. R. Phatak' },
    { value: 'Allen', label: "Allen's Keynotes" },
    { value: 'Boericke', label: 'Boericke' },
    { value: 'Kent', label: 'Kent' },
    { value: 'Murphy', label: 'Murphy' },
    { value: 'Sankaran', label: 'Sankaran' },
    { value: 'Farrington', label: 'Farrington' },
    { value: 'Boeger', label: 'Boeger' },
    { value: 'Mathur', label: 'Mathur' },
  ],
  'repertory': [
    { value: 'all', label: 'All Repertory Sources' },
    { value: 'Kent', label: 'Kent' },
    { value: 'Phatak', label: 'Phatak' },
    { value: 'Murphy', label: 'Murphy' },
    { value: 'Boericke', label: 'Boericke' },
  ],
};

const MATCH_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  exact: { label: 'EXACT MATCH', color: 'text-green-800', bg: 'bg-green-100' },
  close: { label: 'CLOSE MATCH', color: 'text-blue-800', bg: 'bg-blue-100' },
  related: { label: 'RELATED INDICATION', color: 'text-amber-800', bg: 'bg-amber-100' },
};

function QuickClinicalSearchImpl() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('all');
  const [source, setSource] = useState('all');
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Reset source when subject changes
  useEffect(() => {
    setSource('all');
  }, [subject]);

  const doSearch = useCallback(async (searchPage: number = 1) => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setPage(searchPage);
    
    const params = new URLSearchParams();
    params.set('q', q.trim());
    params.set('subject', subject);
    params.set('source', source);
    params.set('page', String(searchPage));
    params.set('pageSize', String(pageSize));
    
    try {
      const r = await fetch(`/api/clinical-search?${params.toString()}`);
      if (r.status === 401) { router.push('/login'); return; }
      const d = await r.json();
      setResults(d.results || []);
      setTotal(d.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, subject, source, router]);

  // Group results by type
  const groupedResults = {
    'Materia Medica': results.filter(r => r.type === 'remedy'),
    'Repertory': results.filter(r => r.type === 'rubric'),
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const availableSources = SOURCES_BY_SUBJECT[subject] || [{ value: 'all', label: 'All Sources' }];

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Quick Clinical Search</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Search across all verified library sources</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search disease, condition, symptom, indication, rubric or clinical term..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch(1); }}
              className="w-full px-4 py-3 pl-12 border-2 border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C8F6E] text-lg">🔍</span>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider mb-1 block">Search In</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm bg-white text-[#173B2D] focus:outline-none focus:border-[#173B2D]"
              >
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider mb-1 block">Source</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm bg-white text-[#173B2D] focus:outline-none focus:border-[#173B2D]"
              >
                {availableSources.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            
            <button
              onClick={() => doSearch(1)}
              disabled={q.trim().length < 2 || loading}
              className="bg-[#173B2D] text-[#C8A24A] px-8 py-2 rounded font-semibold text-sm hover:bg-[#2a5443] disabled:opacity-40 transition-colors"
            >
              {loading ? 'Searching...' : 'SEARCH'}
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div>
            {/* Count */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-[#7C8F6E]">
                {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''}${q ? ` for "${q}"` : ''}`}
              </div>
            </div>

            {/* No results */}
            {!loading && total === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-[#7C8F6E] mb-4">No verified result found in the selected website sources.</p>
                {subject !== 'all' && (
                  <button
                    onClick={() => { setSubject('all'); setSource('all'); }}
                    className="text-[#173B2D] underline text-sm"
                  >Search All Subjects</button>
                )}
              </div>
            )}

            {/* Grouped Results */}
            {!loading && total > 0 && (
              <div className="space-y-6">
                {Object.entries(groupedResults).map(([groupName, groupResults]) => {
                  if (groupResults.length === 0) return null;
                  return (
                    <div key={groupName}>
                      <h2 className="font-serif text-lg text-[#173B2D] mb-3 pb-1 border-b border-[#E8DCC3]">{groupName}</h2>
                      <div className="space-y-3">
                        {groupResults.map((r, idx) => {
                          const matchStyle = MATCH_STYLES[r.matchType] || MATCH_STYLES.related;
                          return (
                            <Link
                              key={`${r.id}-${idx}`}
                              href={r.href}
                              className="block bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-[#173B2D]"
                            >
                              {/* Match type badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${matchStyle.bg} ${matchStyle.color}`}>
                                  {matchStyle.label}
                                </span>
                                <span className="text-xs text-[#7C8F6E]">{r.matchText}</span>
                              </div>
                              
                              {/* Source + Remedy info */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs font-semibold bg-[#173B2D] text-[#C8A24A] px-2 py-0.5 rounded">{r.author}</span>
                                <span className="font-serif text-base text-[#173B2D] font-semibold">{r.name}</span>
                                {r.subsection && (
                                  <span className="text-xs bg-[#F5EFE0] text-[#173B2D] px-2 py-0.5 rounded">{r.subsection}</span>
                                )}
                                {r.sourcePages && (
                                  <span className="text-xs text-[#7C8F6E]">Page: {r.sourcePages}</span>
                                )}
                              </div>
                              
                              {/* Source text snippet */}
                              {r.snippet && (
                                <p className="text-sm text-stone-600 leading-relaxed bg-[#F5EFE0] p-2 rounded italic">
                                  {r.snippet}
                                </p>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => doSearch(page - 1)}
                  disabled={page === 1 || loading}
                  className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
                >← Prev</button>
                <span className="text-sm text-[#7C8F6E]">Page {page} of {totalPages}</span>
                <button
                  onClick={() => doSearch(page + 1)}
                  disabled={page === totalPages || loading}
                  className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
                >Next →</button>
              </div>
            )}
          </div>
        )}

        {/* Initial state */}
        {!searched && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-[#7C8F6E]">Enter a search term above to search across all verified library sources.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-xs text-[#7C8F6E]">Try:</span>
              {['fear of death', 'headache', 'constipation', 'aggravation morning', 'skin eruption'].map(term => (
                <button
                  key={term}
                  onClick={() => { setQ(term); }}
                  className="text-xs bg-[#F5EFE0] border border-[#E8DCC3] rounded px-2 py-1 hover:bg-[#E8DCC3] text-[#173B2D]"
                >{term}</button>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function QuickClinicalSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5EFE0]"><p className="text-[#7C8F6E]">Loading...</p></div>}>
      <QuickClinicalSearchImpl />
    </Suspense>
  );
}
