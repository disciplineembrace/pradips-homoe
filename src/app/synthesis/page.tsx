'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// Types
type SearchResult = { id: number; name: string; path: string; level: number; chapterId: number; fatherId: number };
type TreeNode = { i: number; f: number; n: string; l: number; c: number; p: string };
type RemedyByGrade = { abbrev: string; full: string };
type SelectedRubric = { id: number; name: string; path: string; weight: number; remedyCount: number; enabled: boolean };
type RepertResult = { abbrev: string; full: string; totalScore: number; coverage: string; coverageCount: number; coverageTotal: number; rubrics: { symptomId: number; grade: number; weight: number }[] };
type SavedCase = { name: string; notes: string; date: string; rubrics: SelectedRubric[]; results: RepertResult[] };
type Step = 'dashboard' | 'search' | 'selected' | 'processing' | 'results' | 'remedyDetail' | 'remedyInfo' | 'crossRefs' | 'saveHistory';

const GRADE_LABELS: Record<number, string> = { 4: 'Grade 4 (Very Strong)', 3: 'Grade 3 (Strong)', 2: 'Grade 2 (Moderate)', 1: 'Grade 1 (Mild)' };
const GRADE_BADGE: Record<number, string> = { 4: 'bg-[#173B2D] text-[#C8A24A]', 3: 'bg-[#2a5443] text-[#C8A24A]', 2: 'bg-[#E8DCC3] text-[#173B2D]', 1: 'bg-[#F5EFE0] text-[#7C8F6E]' };

function SynthesisImpl() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [step, setStep] = useState<Step>('dashboard');
  
  // Search state
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Tree state
  const [chapters, setChapters] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Record<number, TreeNode[]>>({});
  const [showTree, setShowTree] = useState(false);
  
  // Selected rubrics
  const [selectedRubrics, setSelectedRubrics] = useState<SelectedRubric[]>([]);
  
  // Current rubric remedies
  const [currentRemedies, setCurrentRemedies] = useState<{ symptomId: number; byGrade: Record<string, RemedyByGrade[]>; total: number } | null>(null);
  
  // Repertorization
  const [repertResults, setRepertResults] = useState<RepertResult[]>([]);
  const [repertorizing, setRepertorizing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [showCompare, setShowCompare] = useState(false);
  
  // Remedy detail
  const [selectedRemedy, setSelectedRemedy] = useState<RepertResult | null>(null);
  
  // Favourites
  const [favourites, setFavourites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('synth_favs') || '[]'); } catch { return []; }
  });
  
  // History
  const [savedCases, setSavedCases] = useState<SavedCase[]>(() => {
    try { return JSON.parse(localStorage.getItem('synth_history') || '[]'); } catch { return []; }
  });
  const [caseName, setCaseName] = useState('');
  const [caseNotes, setCaseNotes] = useState('');

  // Auth
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      setSession(d);
    }).catch(() => router.push('/login'));
  }, [router]);

  // Load chapters
  useEffect(() => {
    if (session && chapters.length === 0) {
      fetch('/api/synthesis?action=chapters').then(r => r.json()).then(d => {
        if (d.chapters) setChapters(d.chapters.map((c: any) => ({ i: c.id, f: 0, n: c.name, l: 1, c: c.id, p: c.path })));
      });
    }
  }, [session, chapters.length]);

  // Debounced search
  useEffect(() => {
    if (searchQ.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/synthesis?action=search&q=${encodeURIComponent(searchQ)}`).then(r => r.json()).then(d => {
        setSearchResults(d.results || []); setSearching(false);
      }).catch(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ]);

  // Save favourites to localStorage
  useEffect(() => { localStorage.setItem('synth_favs', JSON.stringify(favourites)); }, [favourites]);
  useEffect(() => { localStorage.setItem('synth_history', JSON.stringify(savedCases)); }, [savedCases]);

  const loadChildren = useCallback(async (parentId: number) => {
    if (childrenMap[parentId]) return;
    const r = await fetch(`/api/synthesis?action=tree&parentId=${parentId}`);
    const d = await r.json();
    setChildrenMap(prev => ({ ...prev, [parentId]: d.children || [] }));
  }, [childrenMap]);

  const toggleNode = useCallback((id: number) => {
    setExpandedNodes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    loadChildren(id);
  }, [loadChildren]);

  const fetchRemedies = useCallback(async (symptomId: number) => {
    const r = await fetch(`/api/synthesis?action=remedies&symptomId=${symptomId}`);
    const d = await r.json();
    setCurrentRemedies({ symptomId, byGrade: d.byGrade || {}, total: d.total || 0 });
  }, []);

  const addRubric = useCallback(async (rubric: SearchResult | TreeNode) => {
    const id = (rubric as any).id || (rubric as any).i;
    if (selectedRubrics.some(r => r.id === id)) return;
    const r = await fetch(`/api/synthesis?action=remedies&symptomId=${id}`);
    const d = await r.json();
    setSelectedRubrics(prev => [...prev, {
      id, name: (rubric as any).name || (rubric as any).n, path: (rubric as any).path || (rubric as any).p,
      weight: 1, remedyCount: d.total || 0, enabled: true,
    }]);
  }, [selectedRubrics]);

  const removeRubric = useCallback((id: number) => setSelectedRubrics(prev => prev.filter(r => r.id !== id)), []);
  const toggleEnabled = useCallback((id: number) => setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)), []);
  const updateWeight = useCallback((id: number, w: number) => setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, weight: w } : r)), []);
  const toggleFav = useCallback((id: number) => setFavourites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]), []);

  const repertorize = useCallback(async () => {
    setStep('processing'); setRepertorizing(true); setProcessStep(0);
    const steps = ['Reading selected rubrics', 'Fetching remedy data', 'Reading remedy grades', 'Applying rubric weights', 'Calculating scores', 'Calculating coverage', 'Sorting remedies', 'Finalizing results'];
    for (let i = 0; i < steps.length; i++) { setProcessStep(i); await new Promise(r => setTimeout(r, 200)); }
    const enabled = selectedRubrics.filter(r => r.enabled);
    const ids = enabled.map(r => r.id).join(',');
    const weights = enabled.map(r => r.weight).join(',');
    const r = await fetch(`/api/synthesis?action=repertorize&symptomIds=${ids}&weights=${weights}`);
    const d = await r.json();
    setRepertResults(d.results || []); setRepertorizing(false); setStep('results');
  }, [selectedRubrics]);

  const saveCase = useCallback(() => {
    if (!caseName.trim()) return;
    setSavedCases(prev => [...prev, { name: caseName, notes: caseNotes, date: new Date().toISOString(), rubrics: selectedRubrics, results: repertResults }]);
    setCaseName(''); setCaseNotes('');
  }, [caseName, caseNotes, selectedRubrics, repertResults]);

  const loadCase = useCallback((c: SavedCase) => {
    setSelectedRubrics(c.rubrics); setRepertResults(c.results); setStep('results');
  }, []);

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.i);
    const children = childrenMap[node.i] || [];
    const isSel = selectedRubrics.some(r => r.id === node.i);
    const isFav = favourites.includes(node.i);
    return (
      <div key={node.i}>
        <div className="flex items-center gap-1 py-1 px-2 hover:bg-[#F5EFE0] rounded group" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
          <button onClick={() => toggleNode(node.i)} className="w-5 h-5 text-xs text-[#7C8F6E]">{isExpanded ? '▼' : '▸'}</button>
          <span onClick={() => fetchRemedies(node.i)} className={`text-sm cursor-pointer flex-1 ${isSel ? 'text-green-700 font-semibold' : 'text-[#173B2D]'}`}>{node.n}</span>
          <button onClick={() => toggleFav(node.i)} className="text-xs opacity-50 hover:opacity-100">{isFav ? '♥' : '♡'}</button>
          <button onClick={() => addRubric(node)} className={`text-xs px-2 py-0.5 rounded ${isSel ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A]'} opacity-0 group-hover:opacity-100`}>{isSel ? '✓' : '+'}</button>
        </div>
        {isExpanded && children.map(c => renderTreeNode(c, depth + 1))}
      </div>
    );
  };

  if (!session) return (<div className="min-h-screen flex flex-col bg-[#F5EFE0]"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div></div><Footer /></div>);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <header className="mb-4">
          <h1 className="font-serif text-2xl text-[#173B2D]">Synthesis Repertory</h1>
          <p className="text-xs text-[#7C8F6E] mt-0.5">Professional Repertorization Engine · Updated by Dr Pradip</p>
          <div className="w-12 h-0.5 bg-[#C8A24A] mt-2"></div>
        </header>

        {/* Step navigation breadcrumb */}
        {step !== 'dashboard' && (
          <div className="flex items-center gap-2 mb-4 text-xs text-[#7C8F6E]">
            <button onClick={() => setStep('dashboard')} className="hover:text-[#173B2D]">Dashboard</button>
            {step !== 'dashboard' && <span>›</span>}
            {(step === 'search' || step === 'selected' || step === 'processing' || step === 'results' || step === 'remedyDetail' || step === 'remedyInfo' || step === 'crossRefs' || step === 'saveHistory') && (<><button onClick={() => setStep('search')} className="hover:text-[#173B2D]">Search</button><span>›</span></>)}
            {(step === 'selected' || step === 'processing' || step === 'results' || step === 'remedyDetail' || step === 'remedyInfo' || step === 'crossRefs' || step === 'saveHistory') && (<><button onClick={() => setStep('selected')} className="hover:text-[#173B2D]">Rubrics ({selectedRubrics.length})</button><span>›</span></>)}
            {(step === 'results' || step === 'remedyDetail' || step === 'remedyInfo' || step === 'crossRefs' || step === 'saveHistory') && <button onClick={() => setStep('results')} className="hover:text-[#173B2D]">Results</button>}
          </div>
        )}

        {/* STEP 1: DASHBOARD */}
        {step === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg shadow p-4 text-center"><div className="text-2xl font-bold text-[#173B2D]">180,386</div><div className="text-xs text-[#7C8F6E]">Rubrics</div></div>
              <div className="bg-white rounded-lg shadow p-4 text-center"><div className="text-2xl font-bold text-[#173B2D]">2,384</div><div className="text-xs text-[#7C8F6E]">Remedies</div></div>
              <div className="bg-white rounded-lg shadow p-4 text-center"><div className="text-2xl font-bold text-[#173B2D]">1.15M</div><div className="text-xs text-[#7C8F6E]">Relationships</div></div>
              <div className="bg-white rounded-lg shadow p-4 text-center"><div className="text-2xl font-bold text-[#173B2D]">41</div><div className="text-xs text-[#7C8F6E]">Chapters</div></div>
              <div className="bg-white rounded-lg shadow p-4 text-center"><div className="text-2xl font-bold text-[#173B2D]">41,208</div><div className="text-xs text-[#7C8F6E]">Cross Refs</div></div>
              <div className="bg-white rounded-lg shadow p-4 text-center"><div className="text-2xl font-bold text-[#173B2D]">933</div><div className="text-xs text-[#7C8F6E]">Authors</div></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => { setStep('search'); setSelectedRubrics([]); setRepertResults([]); }} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm hover:bg-[#2a5443]">+ Start New Repertorization</button>
              <button onClick={() => setStep('saveHistory')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-3 rounded-lg font-semibold text-sm hover:bg-[#F5EFE0]">View History ({savedCases.length})</button>
            </div>
            {favourites.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-semibold text-[#173B2D] mb-2">Favourite Rubrics ({favourites.length})</h3>
                <p className="text-xs text-[#7C8F6E]">Your saved favourite rubrics will appear here for quick access.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SEARCH */}
        {step === 'search' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="relative mb-3">
                <input type="text" placeholder="Search rubric / symptom..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
                {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7C8F6E]">...</span>}
              </div>
              <button onClick={() => setShowTree(!showTree)} className="text-xs text-[#173B2D] underline">{showTree ? 'Hide' : 'Browse'} Hierarchy</button>
            </div>
            
            {showTree && (
              <div className="bg-white rounded-lg shadow p-3 max-h-80 overflow-y-auto">
                {chapters.map(ch => renderTreeNode(ch))}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-xs font-semibold text-[#7C8F6E] uppercase mb-2">Search Results ({searchResults.length})</h3>
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {searchResults.map(r => {
                    const isSel = selectedRubrics.some(sr => sr.id === r.id);
                    const isFav = favourites.includes(r.id);
                    return (
                      <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5EFE0] rounded border-b border-[#E8DCC3] last:border-0">
                        <div className="flex-1 cursor-pointer" onClick={() => fetchRemedies(r.id)}>
                          <div className="text-sm text-[#173B2D] font-medium">{r.name}</div>
                          <div className="text-xs text-[#7C8F6E]">{r.path}</div>
                        </div>
                        <button onClick={() => toggleFav(r.id)} className="text-xs">{isFav ? '♥' : '♡'}</button>
                        <button onClick={() => addRubric(r)} className={`text-xs px-2 py-1 rounded ${isSel ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A]'}`}>{isSel ? '✓' : '+'}</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentRemedies && (
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-xs font-semibold text-[#7C8F6E] uppercase mb-2">Remedies ({currentRemedies.total})</h3>
                <div className="space-y-2">
                  {[4,3,2,1].map(g => {
                    const rem = currentRemedies.byGrade[String(g)] || [];
                    if (!rem.length) return null;
                    return (
                      <div key={g}>
                        <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${GRADE_BADGE[g]}`}>{GRADE_LABELS[g]} ({rem.length})</div>
                        <div className="flex flex-wrap gap-1 mt-1">{rem.map((r, i) => <span key={i} className="text-xs bg-[#F5EFE0] border border-[#E8DCC3] rounded px-1.5 py-0.5 text-[#173B2D]" title={r.full}>{r.abbrev}</span>)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedRubrics.length > 0 && (
              <button onClick={() => setStep('selected')} className="w-full bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm hover:bg-[#2a5443]">Continue to Selected Rubrics ({selectedRubrics.length}) →</button>
            )}
          </div>
        )}

        {/* STEP 3: SELECTED RUBRICS */}
        {step === 'selected' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg text-[#173B2D]">Selected Rubrics</h3>
                <span className="text-xs text-[#7C8F6E]">{selectedRubrics.filter(r => r.enabled).length} active</span>
              </div>
              {selectedRubrics.length === 0 ? (
                <p className="text-sm text-[#7C8F6E] italic py-4 text-center">No rubrics selected. Go back to search.</p>
              ) : (
                <div className="space-y-1">
                  {selectedRubrics.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2 py-2 border-b border-[#E8DCC3] last:border-0">
                      <input type="checkbox" checked={r.enabled} onChange={() => toggleEnabled(r.id)} className="w-4 h-4 accent-[#173B2D]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#173B2D] font-medium truncate">{r.name}</div>
                        <div className="text-xs text-[#7C8F6E] truncate">{r.path} · {r.remedyCount} remedies</div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4].map(w => (
                          <button key={w} onClick={() => updateWeight(r.id, w)} className={`w-6 h-6 text-xs rounded ${r.weight === w ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-[#F5EFE0] border border-[#E8DCC3] text-[#173B2D]'}`}>{w}</button>
                        ))}
                      </div>
                      <button onClick={() => removeRubric(r.id)} className="text-xs text-red-600 px-1">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('search')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-3 rounded-lg font-semibold text-sm hover:bg-[#F5EFE0]">← Back to Search</button>
              <button onClick={() => { setSelectedRubrics([]); }} className="bg-white border border-red-300 text-red-600 px-4 py-3 rounded-lg text-sm hover:bg-red-50">Clear All</button>
              <button onClick={repertorize} disabled={selectedRubrics.filter(r => r.enabled).length === 0} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm hover:bg-[#2a5443] disabled:opacity-40">Repertorize →</button>
            </div>
          </div>
        )}

        {/* STEP 4: PROCESSING */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-6"></div>
            <div className="text-sm text-[#173B2D] font-semibold mb-2">{['Reading selected rubrics','Fetching remedy data','Reading remedy grades','Applying rubric weights','Calculating scores','Calculating coverage','Sorting remedies','Finalizing results'][processStep]}</div>
            <div className="text-xs text-[#7C8F6E]">{Math.round((processStep / 8) * 100)}% · Please wait...</div>
          </div>
        )}

        {/* STEP 5: RESULTS */}
        {step === 'results' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg text-[#173B2D]">Results ({repertResults.length})</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowCompare(!showCompare)} className="text-xs bg-[#173B2D] text-[#C8A24A] px-3 py-1 rounded">{showCompare ? 'Ranking' : 'Compare'}</button>
                  <button onClick={() => setStep('saveHistory')} className="text-xs bg-white border border-[#E8DCC3] text-[#173B2D] px-3 py-1 rounded">Save</button>
                </div>
              </div>
              {!showCompare ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-[#7C8F6E] border-b border-[#E8DCC3]"><th className="text-left py-2 px-1">#</th><th className="text-left py-2 px-1">Remedy</th><th className="text-left py-2 px-1">Score</th><th className="text-left py-2 px-1">Coverage</th></tr></thead>
                    <tbody>
                      {repertResults.slice(0, 100).map((r, i) => (
                        <tr key={r.abbrev} onClick={() => { setSelectedRemedy(r); setStep('remedyDetail'); }} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0] cursor-pointer">
                          <td className="py-2 px-1 text-[#7C8F6E]">{i + 1}</td>
                          <td className="py-2 px-1 font-medium text-[#173B2D]" title={r.full}>{r.abbrev}</td>
                          <td className="py-2 px-1 text-[#173B2D]">{r.totalScore}</td>
                          <td className="py-2 px-1"><span className={`text-xs px-2 py-0.5 rounded ${r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-[#F5EFE0] text-[#7C8F6E]'}`}>{r.coverage}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-[#7C8F6E] border-b border-[#E8DCC3]"><th className="text-left py-1 px-1">Remedy</th>{selectedRubrics.filter(r => r.enabled).map(r => <th key={r.id} className="text-center py-1 px-1 max-w-20 truncate" title={r.path}>{r.name}</th>)}<th className="text-center py-1 px-1">Total</th></tr></thead>
                    <tbody>
                      {repertResults.slice(0, 20).map(r => {
                        const gm: Record<number, number> = {}; r.rubrics.forEach(rb => gm[rb.symptomId] = rb.grade);
                        return (
                          <tr key={r.abbrev} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0]">
                            <td className="py-1 px-1 font-medium text-[#173B2D]">{r.abbrev}</td>
                            {selectedRubrics.filter(rr => rr.enabled).map(sr => <td key={sr.id} className="text-center py-1 px-1">{gm[sr.id] ? <span className={`inline-block w-5 h-5 leading-5 rounded text-center ${GRADE_BADGE[gm[sr.id]]}`}>{gm[sr.id]}</span> : <span className="text-[#E8DCC3]">—</span>}</td>)}
                            <td className="text-center py-1 px-1 font-bold text-[#173B2D]">{r.totalScore}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('selected')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-3 rounded-lg font-semibold text-sm hover:bg-[#F5EFE0]">← Back to Rubrics</button>
              <button onClick={repertorize} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm hover:bg-[#2a5443]">Re-run</button>
            </div>
          </div>
        )}

        {/* STEP 6: REMEDY DETAIL */}
        {step === 'remedyDetail' && selectedRemedy && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-serif text-xl text-[#173B2D]">{selectedRemedy.full}</h3>
              <p className="text-xs text-[#7C8F6E]">{selectedRemedy.abbrev}</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#F5EFE0] rounded p-2 text-center"><div className="text-lg font-bold text-[#173B2D]">{selectedRemedy.totalScore}</div><div className="text-xs text-[#7C8F6E]">Total Score</div></div>
                <div className="bg-[#F5EFE0] rounded p-2 text-center"><div className="text-lg font-bold text-[#173B2D]">{selectedRemedy.coverage}</div><div className="text-xs text-[#7C8F6E]">Coverage</div></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-semibold text-[#173B2D] mb-2">Rubric Scores</h4>
              <div className="space-y-1">
                {selectedRemedy.rubrics.map(rb => {
                  const rubric = selectedRubrics.find(r => r.id === rb.symptomId);
                  return (
                    <div key={rb.symptomId} className="flex items-center justify-between py-1.5 border-b border-[#E8DCC3] last:border-0">
                      <div className="flex-1 min-w-0"><div className="text-sm text-[#173B2D]">{rubric?.name || `Symptom ${rb.symptomId}`}</div><div className="text-xs text-[#7C8F6E]">{rubric?.path}</div></div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${GRADE_BADGE[rb.grade]}`}>G{rb.grade}</span>
                        <span className="text-xs text-[#7C8F6E]">W{rb.weight}</span>
                        <span className="text-sm font-bold text-[#173B2D]">{rb.grade * rb.weight}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('results')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-3 rounded-lg text-sm hover:bg-[#F5EFE0]">← Back to Results</button>
              <button onClick={() => setStep('remedyInfo')} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg text-sm hover:bg-[#2a5443]">Remedy Info →</button>
            </div>
          </div>
        )}

        {/* STEP 7: REMEDY INFO */}
        {step === 'remedyInfo' && selectedRemedy && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-serif text-xl text-[#173B2D]">{selectedRemedy.full}</h3>
              <p className="text-xs text-[#7C8F6E]">Abbreviation: {selectedRemedy.abbrev}</p>
              <div className="mt-3 space-y-2">
                <div className="bg-[#F5EFE0] rounded p-2"><div className="text-xs font-semibold text-[#173B2D]">Repertorization</div><div className="text-sm text-[#7C8F6E]">Score: {selectedRemedy.totalScore} · Coverage: {selectedRemedy.coverage}</div></div>
                <Link href={`/materia-medica?q=${encodeURIComponent(selectedRemedy.full)}`} className="block bg-[#173B2D] text-[#C8A24A] rounded p-2 text-sm text-center hover:bg-[#2a5443]">Search in Materia Medica →</Link>
              </div>
            </div>
            <button onClick={() => setStep('remedyDetail')} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-3 rounded-lg text-sm hover:bg-[#F5EFE0]">← Back to Details</button>
          </div>
        )}

        {/* STEP 9: SAVE & HISTORY */}
        {step === 'saveHistory' && (
          <div className="space-y-4">
            {repertResults.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-serif text-lg text-[#173B2D] mb-3">Save Current Case</h3>
                <input type="text" placeholder="Case name..." value={caseName} onChange={e => setCaseName(e.target.value)} className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm mb-2 text-[#173B2D]" />
                <textarea placeholder="Notes..." value={caseNotes} onChange={e => setCaseNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm mb-2 text-[#173B2D]" />
                <button onClick={saveCase} disabled={!caseName.trim()} className="w-full bg-[#173B2D] text-[#C8A24A] py-2 rounded text-sm font-semibold disabled:opacity-40 hover:bg-[#2a5443]">Save Case</button>
              </div>
            )}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-serif text-lg text-[#173B2D] mb-3">History ({savedCases.length})</h3>
              {savedCases.length === 0 ? (
                <p className="text-sm text-[#7C8F6E] italic py-4 text-center">No saved cases yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedCases.map((c, i) => (
                    <div key={i} className="border border-[#E8DCC3] rounded p-3 hover:bg-[#F5EFE0]">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => loadCase(c)}>
                          <div className="text-sm font-medium text-[#173B2D]">{c.name}</div>
                          <div className="text-xs text-[#7C8F6E]">{c.rubrics.length} rubrics · {new Date(c.date).toLocaleDateString()}</div>
                        </div>
                        <button onClick={() => setSavedCases(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-600 px-2">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setStep(repertResults.length > 0 ? 'results' : 'dashboard')} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-3 rounded-lg text-sm hover:bg-[#F5EFE0]">← Back</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function SynthesisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5EFE0]"><p className="text-[#7C8F6E]">Loading Synthesis...</p></div>}>
      <SynthesisImpl />
    </Suspense>
  );
}
