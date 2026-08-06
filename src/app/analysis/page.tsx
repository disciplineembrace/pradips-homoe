'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// ============================================================
// TYPES
// ============================================================
interface Rubric {
  id: string;
  title: string;
  source: string;
  chapter: string;
  parentId: string | null;
  level: number;
  remedies: string[];
}

interface SearchResult {
  id: string;
  title: string;
  source: string;
  chapter: string;
  parentId: string | null;
  level: number;
  remedyCount: number;
  path: string;
}

interface SelectedRubric {
  id: string;
  title: string;
  source: string;
  chapter: string;
  path: string;
  remedies: { name: string; grade: number }[];
  weight: number;
}

interface RankedRemedy {
  name: string;
  totalScore: number;
  coveredRubrics: number;
  totalRubrics: number;
  coverage: number;
  avgGrade: number;
  maxGrade: number;
  grades: number[];
  rubricContributions: { rubricTitle: string; grade: number; weight: number; score: number }[];
}

const REPERTORIES = [
  { value: 'all', label: 'All Repertories' },
  { value: 'Kent', label: 'Kent' },
  { value: 'Murphy', label: 'Murphy' },
  { value: 'Phatak', label: 'Phatak' },
  { value: 'Boericke', label: 'Boericke' },
];

const SORT_MODES = [
  { value: 'score', label: 'Highest Score' },
  { value: 'grade', label: 'Highest Grade' },
  { value: 'coverage', label: 'Coverage' },
  { value: 'alpha', label: 'Alphabetical' },
];

const GRADE_COLORS: Record<number, string> = {
  4: 'text-red-600',
  3: 'text-green-700',
  2: 'text-blue-700',
  1: 'text-stone-500',
};

const GRADE_BG: Record<number, string> = {
  4: 'bg-red-100',
  3: 'bg-green-100',
  2: 'bg-blue-100',
  1: 'bg-stone-100',
};

function parseRemedy(rem: string): { name: string; grade: number } {
  if (rem.includes('|')) {
    const [name, gradeStr] = rem.split('|');
    return { name: name.trim(), grade: parseInt(gradeStr, 10) || 1 };
  }
  return { name: rem.trim(), grade: 1 };
}

function gradeStars(grade: number): string {
  return '★'.repeat(grade) + '☆'.repeat(4 - grade);
}

export default function AnalysisPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  
  // Repertory selection
  const [repertory, setRepertory] = useState('all');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Selected rubrics
  const [selectedRubrics, setSelectedRubrics] = useState<SelectedRubric[]>([]);
  
  // Analysis results
  const [rankedRemedies, setRankedRemedies] = useState<RankedRemedy[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [sortMode, setSortMode] = useState('score');
  const [displayMode, setDisplayMode] = useState<'table' | 'bar' | 'pie'>('table');
  
  // Expanded rubrics for hierarchy
  const [expandedRubrics, setExpandedRubrics] = useState<Set<string>>(new Set());
  const [childRubrics, setChildRubrics] = useState<Record<string, Rubric[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());
  
  // Selected remedy detail
  const [selectedRemedy, setSelectedRemedy] = useState<RankedRemedy | null>(null);
  
  // Error
  const [error, setError] = useState('');

  // ============================================================
  // AUTH
  // ============================================================
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // ============================================================
  // SEARCH (debounced)
  // ============================================================
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), pageSize: '50' });
      if (repertory !== 'all') params.set('author', repertory);
      const res = await fetch(`/api/rubrics?${params}`);
      const d = await res.json();
      const results: SearchResult[] = (d.items || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        source: r.source || r.author || '',
        chapter: r.chapter || '',
        parentId: r.parentId || null,
        level: r.level || 0,
        remedyCount: (r.remedies || []).length,
        path: r.chapter ? `${r.chapter} > ${r.title}` : r.title,
      }));
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [repertory]);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(value), 300);
  };

  // ============================================================
  // LOAD CHILD RUBRICS
  // ============================================================
  const loadChildren = async (parentId: string) => {
    if (childRubrics[parentId]) return;
    setLoadingChildren(prev => new Set(prev).add(parentId));
    try {
      const res = await fetch(`/api/rubrics?pageSize=200&parentId=${parentId}`);
      const d = await res.json();
      setChildRubrics(prev => ({ ...prev, [parentId]: d.items || [] }));
    } catch {}
    setLoadingChildren(prev => { const n = new Set(prev); n.delete(parentId); return n; });
  };

  const toggleExpand = (id: string) => {
    setExpandedRubrics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); loadChildren(id); }
      return next;
    });
  };

  // ============================================================
  // SELECT RUBRIC
  // ============================================================
  const addRubric = async (rubric: SearchResult) => {
    if (selectedRubrics.some(r => r.id === rubric.id)) return;
    
    // Fetch full rubric data to get remedies
    try {
      const res = await fetch(`/api/rubrics?pageSize=1&q=${encodeURIComponent(rubric.title)}`);
      const d = await res.json();
      const fullRubric = (d.items || []).find((r: any) => r.id === rubric.id);
      const remedies = fullRubric ? (fullRubric.remedies || []).map(parseRemedy) : [];
      
      setSelectedRubrics(prev => [...prev, {
        id: rubric.id,
        title: rubric.title,
        source: rubric.source,
        chapter: rubric.chapter,
        path: rubric.path,
        remedies,
        weight: 1,
      }]);
    } catch {
      setError('Failed to load rubric data.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const removeRubric = (id: string) => {
    setSelectedRubrics(prev => prev.filter(r => r.id !== id));
    setRankedRemedies([]);
  };

  const updateWeight = (id: string, weight: number) => {
    setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, weight } : r));
    setRankedRemedies([]);
  };

  // ============================================================
  // REPERTORIZATION
  // ============================================================
  const repertorize = () => {
    if (selectedRubrics.length === 0) {
      setError('Please select at least one rubric.');
      return;
    }
    setAnalyzing(true);
    setError('');

    // Build remedy scores from actual rubric data
    const remedyMap = new Map<string, {
      name: string;
      totalScore: number;
      coveredRubrics: number;
      grades: number[];
      contributions: { rubricTitle: string; grade: number; weight: number; score: number }[];
    }>();

    const totalRubrics = selectedRubrics.length;

    for (const rubric of selectedRubrics) {
      for (const rem of rubric.remedies) {
        const key = rem.name.toLowerCase();
        const score = rem.grade * rubric.weight;
        
        if (!remedyMap.has(key)) {
          remedyMap.set(key, {
            name: rem.name,
            totalScore: 0,
            coveredRubrics: 0,
            grades: [],
            contributions: [],
          });
        }
        
        const entry = remedyMap.get(key)!;
        entry.totalScore += score;
        entry.coveredRubrics += 1;
        entry.grades.push(rem.grade);
        entry.contributions.push({
          rubricTitle: rubric.title,
          grade: rem.grade,
          weight: rubric.weight,
          score,
        });
      }
    }

    // Build ranked list
    const ranked: RankedRemedy[] = Array.from(remedyMap.values()).map(entry => ({
      name: entry.name,
      totalScore: entry.totalScore,
      coveredRubrics: entry.coveredRubrics,
      totalRubrics,
      coverage: Math.round((entry.coveredRubrics / totalRubrics) * 100),
      avgGrade: entry.grades.reduce((a, b) => a + b, 0) / entry.grades.length,
      maxGrade: Math.max(...entry.grades),
      grades: entry.grades,
      rubricContributions: entry.contributions,
    }));

    // Sort
    ranked.sort((a, b) => {
      if (sortMode === 'score') return b.totalScore - a.totalScore;
      if (sortMode === 'grade') return b.maxGrade - a.maxGrade || b.totalScore - a.totalScore;
      if (sortMode === 'coverage') return b.coverage - a.coverage || b.totalScore - a.totalScore;
      if (sortMode === 'alpha') return a.name.localeCompare(b.name);
      return b.totalScore - a.totalScore;
    });

    setRankedRemedies(ranked.slice(0, 10)); // Top 10 only
    setAnalyzing(false);
  };

  // Re-sort when sort mode changes
  useEffect(() => {
    if (rankedRemedies.length > 0) {
      const sorted = [...rankedRemedies];
      sorted.sort((a, b) => {
        if (sortMode === 'score') return b.totalScore - a.totalScore;
        if (sortMode === 'grade') return b.maxGrade - a.maxGrade || b.totalScore - a.totalScore;
        if (sortMode === 'coverage') return b.coverage - a.coverage || b.totalScore - a.totalScore;
        if (sortMode === 'alpha') return a.name.localeCompare(b.name);
        return b.totalScore - a.totalScore;
      });
      setRankedRemedies(sorted);
    }
  }, [sortMode]);

  // ============================================================
  // RENDER
  // ============================================================
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Analysis Tools...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const maxScore = rankedRemedies.length > 0 ? rankedRemedies[0].totalScore : 1;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-serif text-2xl md:text-3xl text-[#173B2D]">Analysis Tools — Repertorization</h1>
          <p className="text-xs text-[#7C8F6E] mt-1">Select rubrics from verified repertory data to generate ranked remedy analysis</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-2"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ===== LEFT: Search & Browse ===== */}
          <div className="lg:col-span-2 space-y-4">
            {/* Step 1: Repertory Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#173B2D] text-white flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Select Repertory</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {REPERTORIES.map(rep => (
                  <button
                    key={rep.value}
                    onClick={() => { setRepertory(rep.value); setSearchResults([]); }}
                    className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-colors ${
                      repertory === rep.value
                        ? 'bg-[#173B2D] text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {rep.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Search Rubric */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#173B2D] text-white flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Search Rubric</h2>
              </div>
              <input
                type="text"
                placeholder="Search rubric title or chapter (e.g. anger, fear, headache)..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
              {searching && <p className="text-xs text-[#7C8F6E] mt-2">Searching...</p>}
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-[400px] overflow-y-auto space-y-1">
                  {searchResults.map(r => {
                    const isSelected = selectedRubrics.some(sr => sr.id === r.id);
                    return (
                      <div key={r.id} className={`flex items-center gap-2 p-2.5 border rounded-lg transition-colors ${
                        isSelected ? 'border-green-400 bg-green-50' : 'border-stone-200 hover:bg-stone-50'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#173B2D] truncate">{r.title}</div>
                          <div className="text-xs text-stone-500 truncate">
                            {r.path} · {r.source} · {r.remedyCount} remedies
                          </div>
                        </div>
                        <button
                          onClick={() => addRubric(r)}
                          disabled={isSelected}
                          className={`px-3 py-1 text-xs rounded font-semibold flex-shrink-0 ${
                            isSelected
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-[#173B2D] text-white hover:bg-[#0f2a20]'
                          }`}
                        >
                          {isSelected ? '✓ Added' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {searchQuery && !searching && searchResults.length === 0 && (
                <p className="text-sm text-stone-500 text-center py-4">No rubrics found. Try a different search term.</p>
              )}
            </div>
          </div>

          {/* ===== RIGHT: Selected Rubrics ===== */}
          <div className="space-y-4">
            {/* Step 3: Selected Rubrics */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#173B2D] text-white flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Selected Rubrics ({selectedRubrics.length})</h2>
              </div>
              
              {selectedRubrics.length === 0 ? (
                <p className="text-sm text-stone-500 text-center py-4">No rubrics selected. Search and add rubrics to analyze.</p>
              ) : (
                <div className="space-y-2">
                  {selectedRubrics.map((r, idx) => (
                    <div key={r.id} className="p-2.5 border border-stone-200 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#173B2D] truncate">
                            {idx + 1}. {r.title}
                          </div>
                          <div className="text-xs text-stone-500 truncate">{r.path}</div>
                          <div className="text-xs text-stone-400">{r.remedies.length} remedies · {r.source}</div>
                        </div>
                        <button
                          onClick={() => removeRubric(r.id)}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded flex-shrink-0"
                        >✕</button>
                      </div>
                      {/* Weight */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-xs text-stone-500">Weight:</span>
                        {[1, 2, 3, 4].map(w => (
                          <button
                            key={w}
                            onClick={() => updateWeight(r.id, w)}
                            className={`w-6 h-6 text-xs rounded font-bold ${
                              r.weight === w ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >{w}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Repertorize button */}
                  <button
                    onClick={repertorize}
                    disabled={analyzing}
                    className="w-full mt-2 px-4 py-2.5 bg-[#173B2D] text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#0f2a20] disabled:opacity-50"
                  >
                    {analyzing ? 'Analyzing...' : `Repertorize (${selectedRubrics.length} rubrics)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Step 4: Analysis Results ===== */}
        {rankedRemedies.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#173B2D] text-white flex items-center justify-center text-xs font-bold">4</span>
                <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Analysis — Top 10 Remedies</h2>
              </div>
              <div className="flex items-center gap-2">
                <select value={sortMode} onChange={e => setSortMode(e.target.value)}
                  className="px-2 py-1 border border-stone-300 rounded text-xs">
                  {SORT_MODES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={displayMode} onChange={e => setDisplayMode(e.target.value as any)}
                  className="px-2 py-1 border border-stone-300 rounded text-xs">
                  <option value="table">Ranking Table</option>
                  <option value="bar">Bar Chart</option>
                </select>
                <button onClick={() => window.print()} className="px-3 py-1 text-xs bg-stone-200 text-stone-700 rounded font-semibold hover:bg-stone-300">🖨 Print</button>
              </div>
            </div>

            {/* Table View */}
            {displayMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold w-12">Rank</th>
                      <th className="border border-stone-200 px-3 py-2 text-left text-stone-600 font-semibold">Remedy</th>
                      <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Score</th>
                      <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Grade</th>
                      <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Covered</th>
                      <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Coverage</th>
                      <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedRemedies.map((r, idx) => (
                      <tr key={r.name} className={idx < 3 ? 'bg-stone-50' : 'hover:bg-stone-50'}>
                        <td className="border border-stone-200 px-3 py-2 text-center font-mono font-bold text-stone-700">{idx + 1}</td>
                        <td className="border border-stone-200 px-3 py-2">
                          <span className="font-mono font-bold text-[#173B2D]">{r.name}</span>
                        </td>
                        <td className="border border-stone-200 px-3 py-2 text-center font-bold text-[#173B2D]">{r.totalScore}</td>
                        <td className="border border-stone-200 px-3 py-2 text-center">
                          <span className={`text-sm ${GRADE_COLORS[r.maxGrade] || 'text-stone-500'}`}>{gradeStars(r.maxGrade)}</span>
                        </td>
                        <td className="border border-stone-200 px-3 py-2 text-center text-stone-600">{r.coveredRubrics}/{r.totalRubrics}</td>
                        <td className="border border-stone-200 px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            r.coverage === 100 ? 'bg-green-100 text-green-700' : r.coverage >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'
                          }`}>{r.coverage}%</span>
                        </td>
                        <td className="border border-stone-200 px-3 py-2 text-center">
                          <button onClick={() => setSelectedRemedy(r)} className="px-2 py-1 text-xs bg-[#173B2D] text-white rounded hover:bg-[#0f2a20]">Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bar Chart View */}
            {displayMode === 'bar' && (
              <div className="p-4 space-y-2">
                {rankedRemedies.map((r, idx) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-stone-500 w-6">{idx + 1}</span>
                    <span className="text-sm font-mono font-bold text-[#173B2D] w-20">{r.name}</span>
                    <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 ${GRADE_BG[r.maxGrade] || 'bg-stone-200'}`}
                        style={{ width: `${(r.totalScore / maxScore) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-stone-700">{r.totalScore}</span>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500 w-16">{r.coverage}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Grade Legend */}
            <div className="px-4 py-2 border-t border-stone-200 bg-stone-50 flex gap-3 flex-wrap text-xs">
              <span className={GRADE_COLORS[4]}>★★★★ Grade 4</span>
              <span className={GRADE_COLORS[3]}>★★★☆ Grade 3</span>
              <span className={GRADE_COLORS[2]}>★★☆☆ Grade 2</span>
              <span className={GRADE_COLORS[1]}>★☆☆☆ Grade 1</span>
            </div>
          </div>
        )}

        {/* ===== Remedy Detail Modal ===== */}
        {selectedRemedy && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRemedy(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-[#173B2D]">{selectedRemedy.name}</h3>
                  <p className="text-xs text-stone-500">Score: {selectedRemedy.totalScore} · Coverage: {selectedRemedy.coveredRubrics}/{selectedRemedy.totalRubrics} ({selectedRemedy.coverage}%)</p>
                </div>
                <button onClick={() => setSelectedRemedy(null)} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <h4 className="text-xs font-bold text-[#173B2D] uppercase tracking-wider mb-2">Rubric Contribution</h4>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="border border-stone-200 px-2 py-1.5 text-left text-stone-600">Rubric</th>
                      <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600">Grade</th>
                      <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600">Weight</th>
                      <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRemedy.rubricContributions.map((c, idx) => (
                      <tr key={idx}>
                        <td className="border border-stone-200 px-2 py-1.5 text-stone-700">{c.rubricTitle}</td>
                        <td className="border border-stone-200 px-2 py-1.5 text-center">
                          <span className={`font-bold ${GRADE_COLORS[c.grade] || 'text-stone-500'}`}>{c.grade}</span>
                        </td>
                        <td className="border border-stone-200 px-2 py-1.5 text-center font-mono text-blue-700">{c.weight}</td>
                        <td className="border border-stone-200 px-2 py-1.5 text-center font-bold text-[#173B2D]">{c.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <Link href="/materia-medica" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">→ View in Materia Medica</Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
