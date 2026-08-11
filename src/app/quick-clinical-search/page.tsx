'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  categories?: {
    location?: string;
    sensation?: string;
    modality?: string;
    concomitant?: string;
    causation?: string;
    time?: string;
    side?: string;
    peculiar?: string;
    extension?: string;
  };
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

const VIEW_MODES = [
  { value: 'indications', label: 'Indications — Point-wise' },
  { value: 'remedy-wise', label: 'Remedy-wise' },
  { value: 'source-wise', label: 'Source-wise' },
  { value: 'differentiate', label: 'Differentiate Remedies' },
];

const SORT_MODES = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'characteristic', label: 'Most Characteristic' },
  { value: 'source', label: 'Source Order' },
  { value: 'remedy-az', label: 'Remedy A-Z' },
];

const TYPE_FILTERS = [
  { value: 'peculiar', label: '⭐ Peculiar' },
  { value: 'modality', label: '🔄 Modality' },
  { value: 'concomitant', label: '➕ Concomitant' },
  { value: 'causation', label: '💥 Causation' },
  { value: 'sensation', label: '⚡ Sensation' },
  { value: 'location', label: '📍 Location' },
  { value: 'time', label: '🕐 Time' },
  { value: 'side', label: '↔️ Side' },
];

const MATCH_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  exact: { label: 'EXACT MATCH', color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-400' },
  close: { label: 'CLOSE MATCH', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-400' },
  related: { label: 'RELATED', color: 'text-green-800', bg: 'bg-green-50', border: 'border-green-400' },
};

const CATEGORY_LABELS: Record<string, string> = {
  location: '📍 Location',
  sensation: '⚡ Sensation',
  modality: '🔄 Modality',
  concomitant: '➕ Concomitant',
  causation: '💥 Causation',
  time: '🕐 Time',
  side: '↔️ Side',
  peculiar: '⭐ Peculiar / Characteristic',
  extension: '↗️ Extension / Direction',
};

// Highlight matched words
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return text;
  const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (words.some(w => part.toLowerCase() === w)) {
      return (
        <mark key={idx} className="bg-[#C8A24A]/30 text-[#173B2D] font-semibold rounded px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

function QuickClinicalSearchImpl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('all');
  const [source, setSource] = useState('all');
  // View By / Sort By / Type Filter removed per spec — replaced with
  // "Search Within Results" client-side filter below Source selection.
  const [viewMode] = useState('indications'); // kept for view-mode conditional rendering (default indications only)
  const [withinResults, setWithinResults] = useState(''); // NEW: search-within-results query
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [differentiateRemedies, setDifferentiateRemedies] = useState<string[]>([]);
  const pageSize = 20;

  // Restore state from URL on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));

    // Restore from URL params
    const urlQ = searchParams.get('q');
    const urlSubject = searchParams.get('subject');
    const urlSource = searchParams.get('source');
    const urlView = searchParams.get('view');
    if (urlQ) {
      setQ(urlQ);
      if (urlSubject) setSubject(urlSubject);
      if (urlSource) setSource(urlSource);
      // viewMode is now fixed to 'indications' (View By selector removed per spec)
      // urlView is read but no longer applied — kept for URL backward-compat.
      void urlView;
      // Auto-search
      setTimeout(() => doSearch(urlQ, urlSubject || 'all', urlSource || 'all', 1), 100);
    }
  }, [router]);

  const doSearch = useCallback(async (searchQ: string, searchSubject: string, searchSource: string, searchPage: number) => {
    if (!searchQ.trim() || searchQ.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setError('');
    try {
      const params = new URLSearchParams({
        q: searchQ.trim(),
        subject: searchSubject,
        source: searchSource,
        page: String(searchPage),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/clinical-search?${params}`);
      const d = await res.json();
      setResults(d.results || []);
      setTotal(d.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const [error, setError] = useState('');

  function handleSearch() {
    if (q.trim().length < 2) return;
    setPage(1);
    doSearch(q, subject, source, 1);
    // Update URL for state persistence
    const params = new URLSearchParams({ q: q.trim(), subject, source, view: viewMode });
    router.replace(`/quick-clinical-search?${params}`);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    doSearch(q, subject, source, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Apply client-side "Search Within Results" filtering.
  // This searches ONLY inside the already-loaded results — it does NOT
  // trigger a new database/API search. It matches against:
  //   - Remedy/rubric name
  //   - Snippet (clinical indications, characteristic symptoms, peculiar
  //     symptoms, modalities, concomitants, original source text)
  //   - Author/source
  //   - Subsection (chapter/heading)
  //   - Match text
  const sortedFilteredResults = (() => {
    if (!withinResults.trim()) return results;
    const words = withinResults.toLowerCase().split(/\s+/).filter(w => w.length >= 1);
    if (words.length === 0) return results;
    return results.filter(r => {
      const haystack = [
        r.name,
        r.snippet,
        r.author,
        r.source,
        r.subsection || '',
        r.matchText,
        r.categories ? Object.values(r.categories).join(' ') : '',
      ].join(' ').toLowerCase();
      return words.every(w => haystack.includes(w));
    });
  })();

  // Group results for different views
  const groupedByRemedy = sortedFilteredResults.filter(r => r.type === 'remedy').reduce((acc, r) => {
    if (!acc[r.name]) acc[r.name] = [];
    acc[r.name].push(r);
    return acc;
  }, {} as Record<string, Result[]>);

  const groupedBySource = sortedFilteredResults.reduce((acc, r) => {
    const key = r.author || r.source || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, Result[]>);

  // Differentiate remedies data
  const topRemedies = Object.keys(groupedByRemedy).slice(0, 5);
  const allCategories = new Set<string>();
  results.forEach(r => {
    if (r.categories) {
      Object.keys(r.categories).forEach(c => allCategories.add(c));
    }
  });

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-[#7C8F6E]">Loading...</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-serif text-2xl md:text-3xl text-[#173B2D]">Quick Clinical Search</h1>
          <p className="text-xs text-[#7C8F6E] mt-1">Search verified source data — disease, symptom, indication, rubric or clinical term</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-2"></div>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search disease, condition, symptom, indication, rubric or clinical term..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D] focus:ring-1 focus:ring-[#173B2D]"
            />
            <button
              onClick={handleSearch}
              disabled={loading || q.trim().length < 2}
              className="px-6 py-2.5 bg-[#173B2D] text-white rounded-lg text-sm font-semibold hover:bg-[#0f2a20] disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* Filters — Search In + Source only (View By / Sort By / Type Filter removed per spec) */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs font-semibold text-[#7C8F6E] mb-1">Search In</label>
              <select value={subject} onChange={e => { setSubject(e.target.value); setSource('all'); }}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-xs focus:outline-none focus:border-[#173B2D]">
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7C8F6E] mb-1">Source</label>
              <select value={source} onChange={e => setSource(e.target.value)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-xs focus:outline-none focus:border-[#173B2D]">
                {(SOURCES_BY_SUBJECT[subject] || SOURCES_BY_SUBJECT['all']).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Search Within Results — client-side filter on loaded results only.
              Does NOT trigger a new API/database search. */}
          {searched && results.length > 0 && (
            <div className="mt-1">
              <label className="block text-xs font-semibold text-[#7C8F6E] mb-1">Search Within Results</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search within selected source..."
                  value={withinResults}
                  onChange={e => setWithinResults(e.target.value)}
                  className="w-full px-3 py-1.5 pl-8 border border-stone-300 rounded text-xs focus:outline-none focus:border-[#173B2D]"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#7C8F6E] text-xs">🔍</span>
                {withinResults && (
                  <button
                    onClick={() => setWithinResults('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C8F6E] hover:text-[#173B2D] text-xs"
                    aria-label="Clear within-results search"
                  >
                    ✕
                  </button>
                )}
              </div>
              {withinResults && (
                <p className="text-[0.65rem] text-[#7C8F6E] mt-1">
                  Showing {sortedFilteredResults.length} of {results.length} loaded results
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 text-center">
            <p className="text-sm text-[#7C8F6E]">No verified indication found in the selected sources.</p>
            <p className="text-xs text-stone-400 mt-2">Try different keywords or broaden your search filters.</p>
          </div>
        )}

        {/* ===== INDICATIONS — POINT-WISE VIEW ===== */}
        {sortedFilteredResults.length > 0 && viewMode === 'indications' && (
          <div className="space-y-4">
            <div className="text-sm text-[#7C8F6E]">{total} results found</div>
            {sortedFilteredResults.map((r, idx) => {
              const matchStyle = MATCH_STYLES[r.matchType] || MATCH_STYLES.related;
              const isExpanded = expandedResult === `${r.id}-${idx}`;
              return (
                <div key={`${r.id}-${idx}`} className={`bg-white rounded-lg shadow-sm border-l-4 ${matchStyle.border} ${matchStyle.bg} p-4`}>
                  {/* Match badge + source */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${matchStyle.color} bg-white border ${matchStyle.border}`}>
                      {matchStyle.label}
                    </span>
                    <span className="text-xs text-[#7C8F6E]">{r.matchText}</span>
                    {r.type === 'remedy' && <span className="text-xs text-stone-400">· Materia Medica</span>}
                    {r.type === 'rubric' && <span className="text-xs text-stone-400">· Repertory</span>}
                  </div>
                  {/* Source + remedy info */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-[#173B2D] text-[#C8A24A] px-2 py-0.5 rounded">{r.author}</span>
                    <Link href={r.href} className="font-serif text-base text-[#173B2D] font-semibold hover:underline">{r.name}</Link>
                    {r.subsection && <span className="text-xs bg-[#F5EFE0] text-[#173B2D] px-2 py-0.5 rounded">{r.subsection}</span>}
                    {r.sourcePages && <span className="text-xs text-[#7C8F6E]">Page: {r.sourcePages}</span>}
                  </div>
                  {/* Snippet with highlighted matches */}
                  {r.snippet && (
                    <p className="text-sm text-stone-700 leading-relaxed bg-white p-3 rounded border border-stone-200">
                      {highlightMatch(r.snippet, q)}
                    </p>
                  )}
                  {/* View source link */}
                  <div className="mt-2">
                    <Link href={r.href} className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                      → View Original Source
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== REMEDY-WISE VIEW ===== */}
        {results.length > 0 && viewMode === 'remedy-wise' && (
          <div className="space-y-4">
            <div className="text-sm text-[#7C8F6E]">{total} results across {Object.keys(groupedByRemedy).length} remedies</div>
            {Object.entries(groupedByRemedy).map(([remedyName, remedyResults]) => (
              <div key={remedyName} className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-[#173B2D] text-[#C8A24A]">
                  <span className="font-serif text-lg font-semibold">{remedyName}</span>
                  <span className="text-xs ml-2 text-stone-300">({remedyResults.length} indications)</span>
                </div>
                <div className="p-3 space-y-2">
                  {remedyResults.map((r, idx) => (
                    <div key={idx} className="text-sm border-b border-stone-100 pb-2 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{r.author}</span>
                        {r.subsection && <span className="text-xs text-[#7C8F6E]">{r.subsection}</span>}
                      </div>
                      <p className="text-stone-700 text-xs">{highlightMatch(r.snippet, q)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== SOURCE-WISE VIEW ===== */}
        {results.length > 0 && viewMode === 'source-wise' && (
          <div className="space-y-4">
            <div className="text-sm text-[#7C8F6E]">{total} results across {Object.keys(groupedBySource).length} sources</div>
            {Object.entries(groupedBySource).map(([sourceName, sourceResults]) => (
              <div key={sourceName} className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200">
                  <span className="font-serif text-lg font-semibold text-[#173B2D]">{sourceName}</span>
                  <span className="text-xs ml-2 text-[#7C8F6E]">({sourceResults.length} results)</span>
                </div>
                <div className="p-3 space-y-2">
                  {sourceResults.map((r, idx) => (
                    <div key={idx} className="text-sm border-b border-stone-100 pb-2 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={r.href} className="font-semibold text-[#173B2D] hover:underline">{r.name}</Link>
                        <span className="text-xs text-stone-400">{r.matchText}</span>
                      </div>
                      <p className="text-stone-700 text-xs">{highlightMatch(r.snippet, q)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== DIFFERENTIATE REMEDIES VIEW ===== */}
        {results.length > 0 && viewMode === 'differentiate' && (
          <div className="space-y-4">
            <div className="text-sm text-[#7C8F6E]">
              Top {topRemedies.length} remedies for comparison. Select up to 5 to differentiate.
            </div>
            {/* Remedy selection */}
            <div className="flex flex-wrap gap-2">
              {topRemedies.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    setDifferentiateRemedies(prev =>
                      prev.includes(name) ? prev.filter(n => n !== name) : prev.length < 5 ? [...prev, name] : prev
                    );
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-colors ${
                    differentiateRemedies.includes(name)
                      ? 'bg-[#173B2D] text-white'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            {/* Comparison table */}
            {differentiateRemedies.length >= 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="border border-stone-200 px-3 py-2 text-left text-stone-600 font-semibold sticky left-0 bg-stone-100">Feature</th>
                      {differentiateRemedies.map(name => (
                        <th key={name} className="border border-stone-200 px-3 py-2 text-center text-[#173B2D] font-semibold min-w-[150px]">{name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['location', 'sensation', 'modality', 'concomitant', 'causation', 'time', 'side', 'peculiar', 'extension'].map(cat => {
                      const hasAny = differentiateRemedies.some(name =>
                        groupedByRemedy[name]?.some(r => r.categories?.[cat as keyof typeof r.categories])
                      );
                      if (!hasAny) return null;
                      return (
                        <tr key={cat}>
                          <td className="border border-stone-200 px-3 py-2 font-semibold text-stone-600 sticky left-0 bg-white">
                            {CATEGORY_LABELS[cat] || cat}
                          </td>
                          {differentiateRemedies.map(name => {
                            const remedyResult = groupedByRemedy[name]?.find(r => r.categories?.[cat as keyof typeof r.categories]);
                            const val = remedyResult?.categories?.[cat as keyof typeof remedyResult.categories];
                            return (
                              <td key={name} className="border border-stone-200 px-2 py-2 text-stone-700">
                                {val ? highlightMatch(val, q) : <span className="text-stone-400 italic">Not clearly established in selected source data.</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {differentiateRemedies.length < 2 && (
              <p className="text-sm text-[#7C8F6E] text-center py-4">Select at least 2 remedies to compare.</p>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 text-sm bg-white border border-stone-200 rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >← Prev</button>
            <span className="text-sm text-[#7C8F6E]">Page {page} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="px-3 py-1.5 text-sm bg-white border border-stone-200 rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >Next →</button>
          </div>
        )}

        {/* Disclaimer */}
        {results.length > 0 && (
          <div className="mt-6 p-3 bg-stone-50 border border-stone-200 rounded text-xs text-stone-500 text-center">
            This feature is a source-retrieval and educational aid. Clinical judgment remains separate.
            Ranking does not constitute a confirmed diagnosis or treatment recommendation.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function QuickClinicalSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5EFE0]"><div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div></div>}>
      <QuickClinicalSearchImpl />
    </Suspense>
  );
}
