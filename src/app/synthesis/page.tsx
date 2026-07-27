'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type SearchResult = { id: number; name: string; path: string; level: number; chapterId: number; fatherId: number };
type TreeNode = { i: number; f: number; n: string; l: number; c: number; p: string };
type RemedyByGrade = { abbrev: string; full: string };
type SelectedRubric = { id: number; name: string; path: string; weight: number; remedyCount: number; enabled: boolean };
type RepertResult = { abbrev: string; full: string; totalScore: number; coverage: string; coverageCount: number; coverageTotal: number; rubrics: { symptomId: number; grade: number; weight: number }[] };
type SavedCase = { name: string; notes: string; date: string; rubrics: SelectedRubric[]; results: RepertResult[] };
type Tab = 'home' | 'rubrics' | 'repertorization' | 'remedies' | 'more';
type Screen = 'dashboard' | 'search' | 'selected' | 'processing' | 'results' | 'remedyDetail' | 'remedyInfo' | 'crossRefs' | 'saveHistory';

const GRADE_BADGE: Record<number, string> = { 4: 'bg-[#173B2D] text-[#C8A24A]', 3: 'bg-[#2a5443] text-[#C8A24A]', 2: 'bg-[#E8DCC3] text-[#173B2D]', 1: 'bg-[#F5EFE0] text-[#7C8F6E]' };
const GRADE_DOT: Record<number, string> = { 4: 'bg-[#173B2D]', 3: 'bg-[#2a5443]', 2: 'bg-[#C8A24A]', 1: 'bg-[#E8DCC3]' };

function SynthesisImpl() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('dashboard');
  
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [chapters, setChapters] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Record<number, TreeNode[]>>({});
  const [showTree, setShowTree] = useState(false);
  const [selectedRubrics, setSelectedRubrics] = useState<SelectedRubric[]>([]);
  const [currentRemedies, setCurrentRemedies] = useState<{ symptomId: number; byGrade: Record<string, RemedyByGrade[]>; total: number } | null>(null);
  const [repertResults, setRepertResults] = useState<RepertResult[]>([]);
  const [processStep, setProcessStep] = useState(0);
  const [processSteps] = useState(['Reading selected rubrics', 'Fetching remedy data', 'Reading remedy grades', 'Applying rubric weights', 'Calculating scores', 'Calculating coverage', 'Sorting remedies', 'Finalizing results']);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedRemedy, setSelectedRemedy] = useState<RepertResult | null>(null);
  const [remedyTab, setRemedyTab] = useState<'scores' | 'symptoms' | 'authors' | 'more'>('scores');
  const [favourites, setFavourites] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('synth_favs') || '[]'); } catch { return []; } });
  const [savedCases, setSavedCases] = useState<SavedCase[]>(() => { try { return JSON.parse(localStorage.getItem('synth_history') || '[]'); } catch { return []; } });
  const [caseName, setCaseName] = useState('');
  const [caseNotes, setCaseNotes] = useState('');

  useEffect(() => { fetch('/api/auth/session').then(r => r.json()).then(d => { if (!d.authenticated) { router.push('/login'); return; } setSession(d); }).catch(() => router.push('/login')); }, [router]);
  useEffect(() => { if (session && chapters.length === 0) fetch('/api/synthesis?action=chapters').then(r => r.json()).then(d => { if (d.chapters) setChapters(d.chapters.map((c: any) => ({ i: c.id, f: 0, n: c.name, l: 1, c: c.id, p: c.path }))); }); }, [session, chapters.length]);
  useEffect(() => { if (searchQ.trim().length < 2) { setSearchResults([]); return; } setSearching(true); const t = setTimeout(() => { fetch(`/api/synthesis?action=search&q=${encodeURIComponent(searchQ)}`).then(r => r.json()).then(d => { setSearchResults(d.results || []); setSearching(false); }).catch(() => setSearching(false)); }, 300); return () => clearTimeout(t); }, [searchQ]);
  useEffect(() => { localStorage.setItem('synth_favs', JSON.stringify(favourites)); }, [favourites]);
  useEffect(() => { localStorage.setItem('synth_history', JSON.stringify(savedCases)); }, [savedCases]);

  const goScreen = (s: Screen, t?: Tab) => { setScreen(s); if (t) setTab(t); };
  
  const loadChildren = useCallback(async (pid: number) => { if (childrenMap[pid]) return; const r = await fetch(`/api/synthesis?action=tree&parentId=${pid}`); const d = await r.json(); setChildrenMap(prev => ({ ...prev, [pid]: d.children || [] })); }, [childrenMap]);
  const toggleNode = useCallback((id: number) => { setExpandedNodes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); loadChildren(id); }, [loadChildren]);
  const fetchRemedies = useCallback(async (sid: number) => { const r = await fetch(`/api/synthesis?action=remedies&symptomId=${sid}`); const d = await r.json(); setCurrentRemedies({ symptomId: sid, byGrade: d.byGrade || {}, total: d.total || 0 }); }, []);
  const addRubric = useCallback(async (rub: any) => { const id = rub.id || rub.i; if (selectedRubrics.some(r => r.id === id)) return; const r = await fetch(`/api/synthesis?action=remedies&symptomId=${id}`); const d = await r.json(); setSelectedRubrics(prev => [...prev, { id, name: rub.name || rub.n, path: rub.path || rub.p, weight: 1, remedyCount: d.total || 0, enabled: true }]); }, [selectedRubrics]);
  const removeRubric = useCallback((id: number) => setSelectedRubrics(prev => prev.filter(r => r.id !== id)), []);
  const toggleEnabled = useCallback((id: number) => setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)), []);
  const updateWeight = useCallback((id: number, w: number) => setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, weight: w } : r)), []);
  const toggleFav = useCallback((id: number) => setFavourites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]), []);

  const repertorize = useCallback(async () => {
    goScreen('processing', 'repertorization'); setProcessStep(0);
    for (let i = 0; i < processSteps.length; i++) { setProcessStep(i); await new Promise(r => setTimeout(r, 250)); }
    const enabled = selectedRubrics.filter(r => r.enabled);
    const r = await fetch(`/api/synthesis?action=repertorize&symptomIds=${enabled.map(r => r.id).join(',')}&weights=${enabled.map(r => r.weight).join(',')}`);
    const d = await r.json();
    setRepertResults(d.results || []); goScreen('results', 'repertorization');
  }, [selectedRubrics, processSteps]);

  const saveCase = useCallback(() => { if (!caseName.trim()) return; setSavedCases(prev => [...prev, { name: caseName, notes: caseNotes, date: new Date().toISOString(), rubrics: selectedRubrics, results: repertResults }]); setCaseName(''); setCaseNotes(''); }, [caseName, caseNotes, selectedRubrics, repertResults]);
  const loadCase = useCallback((c: SavedCase) => { setSelectedRubrics(c.rubrics); setRepertResults(c.results); goScreen('results', 'repertorization'); }, []);

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const isExp = expandedNodes.has(node.i); const kids = childrenMap[node.i] || [];
    const isSel = selectedRubrics.some(r => r.id === node.i); const isFav = favourites.includes(node.i);
    return (<div key={node.i}><div className="flex items-center gap-1 py-1.5 px-2 hover:bg-[#F5EFE0] rounded group" style={{ paddingLeft: `${depth * 16 + 8}px` }}><button onClick={() => toggleNode(node.i)} className="w-5 h-5 text-xs text-[#7C8F6E]">{isExp ? '▼' : '▸'}</button><span onClick={() => fetchRemedies(node.i)} className={`text-sm cursor-pointer flex-1 ${isSel ? 'text-green-700 font-semibold' : 'text-[#173B2D]'}`}>{node.n}</span><span className="text-xs text-[#7C8F6E]">{isFav ? '♥' : ''}</span><button onClick={() => addRubric(node)} className={`text-xs px-2 py-0.5 rounded ${isSel ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A]'} opacity-0 group-hover:opacity-100`}>{isSel ? '✓' : '+'}</button></div>{isExp && kids.map(c => renderTree(c, depth + 1))}</div>);
  };

  // Group search results by chapter
  const groupedResults = searchResults.reduce((acc, r) => { const ch = r.path.split(' - ')[0] || 'OTHER'; if (!acc[ch]) acc[ch] = []; acc[ch].push(r); return acc; }, {} as Record<string, SearchResult[]>);

  if (!session) return (<div className="min-h-screen flex flex-col bg-[#F5EFE0]"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div></div><Footer /></div>);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full pb-20">
        {/* SCREEN: DASHBOARD */}
        {screen === 'dashboard' && (
          <div className="space-y-4">
            <div className="bg-[#173B2D] rounded-xl p-5 text-center">
              <h1 className="font-serif text-2xl text-[#C8A24A]">Synthesis Repertory</h1>
              <p className="text-xs text-stone-300 mt-1">Professional Repertorization Engine</p>
              <p className="text-xs text-stone-400 mt-0.5">Updated by Dr Pradip</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">180,386</div><div className="text-[0.65rem] text-[#7C8F6E]">Rubrics</div></div>
              <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">2,384</div><div className="text-[0.65rem] text-[#7C8F6E]">Remedies</div></div>
              <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">1.15M</div><div className="text-[0.65rem] text-[#7C8F6E]">Relationships</div></div>
              <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">41</div><div className="text-[0.65rem] text-[#7C8F6E]">Chapters</div></div>
              <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">41,208</div><div className="text-[0.65rem] text-[#7C8F6E]">Cross Refs</div></div>
              <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">933</div><div className="text-[0.65rem] text-[#7C8F6E]">Authors</div></div>
            </div>
            <button onClick={() => { goScreen('search', 'rubrics'); setSelectedRubrics([]); setRepertResults([]); }} className="w-full bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm">+ Start New Repertorization</button>
            <button onClick={() => goScreen('saveHistory', 'more')} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-3 rounded-lg font-semibold text-sm">View History ({savedCases.length})</button>
          </div>
        )}

        {/* SCREEN: SEARCH */}
        {screen === 'search' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><button onClick={() => goScreen('dashboard', 'home')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Search Rubric</h2></div>
            <div className="bg-white rounded-lg shadow p-3">
              <div className="relative mb-2"><input type="text" placeholder="Search rubric / symptom..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full px-3 py-2 pl-9 border border-[#E8DCC3] rounded-lg text-sm text-[#173B2D]" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E] text-sm">🔍</span></div>
              <button onClick={() => setShowTree(!showTree)} className="text-xs text-[#173B2D] underline">{showTree ? 'Hide' : 'Browse'} Hierarchy</button>
            </div>
            {showTree && <div className="bg-white rounded-lg shadow p-2 max-h-72 overflow-y-auto">{chapters.map(ch => renderTree(ch))}</div>}
            {Object.keys(groupedResults).length > 0 && (
              <div className="bg-white rounded-lg shadow p-2 max-h-96 overflow-y-auto">
                {Object.entries(groupedResults).map(([chapter, items]) => (
                  <div key={chapter} className="mb-2">
                    <div className="text-xs font-bold text-[#7C8F6E] uppercase px-2 py-1">{chapter} ({items.length})</div>
                    {items.map(r => { const isSel = selectedRubrics.some(sr => sr.id === r.id); const isFav = favourites.includes(r.id); return (
                      <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5EFE0] rounded">
                        <div className="flex-1 cursor-pointer" onClick={() => fetchRemedies(r.id)}>
                          <div className={`text-sm ${isSel ? 'text-green-700 font-semibold' : 'text-[#173B2D]'}`}>{r.name}</div>
                          <div className="text-xs text-[#7C8F6E]">{r.path}</div>
                        </div>
                        <button onClick={() => toggleFav(r.id)} className="text-xs">{isFav ? '♥' : '♡'}</button>
                        <button onClick={() => addRubric(r)} className={`text-xs px-2 py-1 rounded ${isSel ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A]'}`}>{isSel ? '✓' : '+'}</button>
                      </div>
                    );})}
                  </div>
                ))}
              </div>
            )}
            {currentRemedies && (
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-xs font-bold text-[#7C8F6E] uppercase mb-2">Remedies ({currentRemedies.total})</h3>
                {[4,3,2,1].map(g => { const rem = currentRemedies.byGrade[String(g)] || []; if (!rem.length) return null; return (
                  <div key={g} className="mb-2"><div className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${GRADE_BADGE[g]}`}>Grade {g} ({rem.length})</div><div className="flex flex-wrap gap-1 mt-1">{rem.map((r, i) => <span key={i} className="text-xs bg-[#F5EFE0] border border-[#E8DCC3] rounded px-1.5 py-0.5 text-[#173B2D]" title={r.full}>{r.abbrev}</span>)}</div></div>
                );})}
              </div>
            )}
            {selectedRubrics.length > 0 && <button onClick={() => goScreen('selected', 'repertorization')} className="w-full bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm">Selected Rubrics ({selectedRubrics.length}) →</button>}
          </div>
        )}

        {/* SCREEN: SELECTED RUBRICS */}
        {screen === 'selected' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><button onClick={() => goScreen('search', 'rubrics')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Selected Rubrics</h2><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{selectedRubrics.length}</span></div>
            <div className="bg-white rounded-lg shadow p-3">
              {selectedRubrics.length === 0 ? <p className="text-sm text-[#7C8F6E] italic py-4 text-center">No rubrics selected.</p> :
                <div className="space-y-1">{selectedRubrics.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2 py-2 border-b border-[#E8DCC3] last:border-0">
                    <input type="checkbox" checked={r.enabled} onChange={() => toggleEnabled(r.id)} className="w-4 h-4 accent-[#173B2D]" />
                    <div className="flex-1 min-w-0"><div className="text-sm text-[#173B2D] font-medium truncate">{r.name}</div><div className="text-xs text-[#7C8F6E] truncate">{r.path} · {r.remedyCount} remedies</div></div>
                    <div className="flex gap-0.5">{[1,2,3,4].map(w => <button key={w} onClick={() => updateWeight(r.id, w)} className={`w-6 h-6 text-xs rounded ${r.weight === w ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-[#F5EFE0] border border-[#E8DCC3] text-[#173B2D]'}`}>{w}</button>)}</div>
                    <button onClick={() => removeRubric(r.id)} className="text-xs text-red-600 px-1">✕</button>
                  </div>
                ))}</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => goScreen('search', 'rubrics')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">← Search</button>
              <button onClick={() => setSelectedRubrics([])} className="bg-white border border-red-300 text-red-600 px-3 py-2.5 rounded-lg text-sm">Clear</button>
              <button onClick={repertorize} disabled={selectedRubrics.filter(r => r.enabled).length === 0} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">Repertorize →</button>
            </div>
          </div>
        )}

        {/* SCREEN: PROCESSING */}
        {screen === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-6"></div>
            <div className="text-lg font-bold text-[#173B2D] mb-1">{Math.round((processStep / processSteps.length) * 100)}%</div>
            <div className="text-sm text-[#173B2D] mb-1">Please wait...</div>
            <div className="text-xs text-[#7C8F6E] mb-6">{processSteps[processStep]}</div>
            <div className="space-y-1 w-full max-w-xs">
              {processSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${i < processStep ? 'bg-green-500 text-white' : i === processStep ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-[#E8DCC3] text-[#7C8F6E]'}`}>{i < processStep ? '✓' : i === processStep ? '○' : ''}</span>
                  <span className={i <= processStep ? 'text-[#173B2D]' : 'text-[#7C8F6E]'}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN: RESULTS */}
        {screen === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><button onClick={() => goScreen('selected', 'repertorization')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Results ({repertResults.length})</h2><button onClick={() => setShowCompare(!showCompare)} className="text-xs bg-[#173B2D] text-[#C8A24A] px-3 py-1 rounded">{showCompare ? 'Ranking' : 'Compare'}</button></div>
            <div className="bg-white rounded-lg shadow p-2">
              {!showCompare ? (
                <table className="w-full text-sm"><thead><tr className="text-xs text-[#7C8F6E] border-b border-[#E8DCC3]"><th className="text-left py-2 px-1">#</th><th className="text-left py-2 px-1">Remedy</th><th className="text-left py-2 px-1">Score</th><th className="text-left py-2 px-1">Cov.</th></tr></thead>
                  <tbody>{repertResults.slice(0, 100).map((r, i) => (<tr key={r.abbrev} onClick={() => { setSelectedRemedy(r); goScreen('remedyDetail', 'remedies'); }} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0] cursor-pointer"><td className="py-2 px-1 text-[#7C8F6E]">{i + 1}</td><td className="py-2 px-1 font-medium text-[#173B2D]" title={r.full}>{r.abbrev}</td><td className="py-2 px-1 text-[#173B2D]">{r.totalScore}</td><td className="py-2 px-1"><span className={`text-xs px-2 py-0.5 rounded ${r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-[#F5EFE0] text-[#7C8F6E]'}`}>{r.coverage}</span></td></tr>))}</tbody>
                </table>
              ) : (
                <table className="w-full text-xs"><thead><tr className="text-[#7C8F6E] border-b border-[#E8DCC3]"><th className="text-left py-1 px-1">Remedy</th>{selectedRubrics.filter(r => r.enabled).map(r => <th key={r.id} className="text-center py-1 px-1 max-w-16 truncate" title={r.path}>{r.name}</th>)}<th className="text-center py-1 px-1">Total</th></tr></thead>
                  <tbody>{repertResults.slice(0, 20).map(r => { const gm: Record<number, number> = {}; r.rubrics.forEach(rb => gm[rb.symptomId] = rb.grade); return (<tr key={r.abbrev} className="border-b border-[#E8DCC3]"><td className="py-1 px-1 font-medium text-[#173B2D]">{r.abbrev}</td>{selectedRubrics.filter(rr => rr.enabled).map(sr => <td key={sr.id} className="text-center py-1 px-1">{gm[sr.id] ? <span className={`inline-block w-5 h-5 leading-5 rounded text-center ${GRADE_BADGE[gm[sr.id]]}`}>{gm[sr.id]}</span> : <span className="text-[#E8DCC3]">—</span>}</td>)}<td className="text-center py-1 px-1 font-bold text-[#173B2D]">{r.totalScore}</td></tr>);})}</tbody>
                </table>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => goScreen('selected', 'repertorization')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">← Rubrics</button>
              <button onClick={() => goScreen('saveHistory', 'more')} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-2.5 rounded-lg text-sm">Save</button>
              <button onClick={repertorize} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Re-run</button>
            </div>
          </div>
        )}

        {/* SCREEN: REMEDY DETAIL */}
        {screen === 'remedyDetail' && selectedRemedy && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><button onClick={() => goScreen('results', 'repertorization')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">{selectedRemedy.abbrev}</h2><button onClick={() => toggleFav(selectedRemedy.abbrev as any)} className="text-sm">{favourites.includes(selectedRemedy.abbrev as any) ? '♥' : '♡'}</button></div>
            <div className="flex gap-2">
              <div className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full flex-1 text-center">Score: {selectedRemedy.totalScore}</div>
              <div className="bg-[#173B2D] text-[#C8A24A] text-sm font-bold px-3 py-1.5 rounded-full flex-1 text-center">Coverage: {selectedRemedy.coverage}</div>
            </div>
            <div className="flex gap-1 bg-white rounded-lg p-1">
              {(['scores', 'symptoms', 'authors', 'more'] as const).map(t => <button key={t} onClick={() => setRemedyTab(t)} className={`flex-1 text-xs py-1.5 rounded capitalize ${remedyTab === t ? 'bg-[#173B2D] text-[#C8A24A]' : 'text-[#7C8F6E]'}`}>{t}</button>)}
            </div>
            {remedyTab === 'scores' && (
              <div className="bg-white rounded-lg shadow p-3">
                <div className="space-y-1">{selectedRemedy.rubrics.map(rb => { const rub = selectedRubrics.find(r => r.id === rb.symptomId); return (
                  <div key={rb.symptomId} className="flex items-center justify-between py-1.5 border-b border-[#E8DCC3] last:border-0">
                    <div className="flex-1 min-w-0"><div className="text-sm text-[#173B2D]">{rub?.name || `Symptom ${rb.symptomId}`}</div><div className="text-xs text-[#7C8F6E]">{rub?.path}</div></div>
                    <div className="flex items-center gap-2"><span className={`text-xs px-2 py-0.5 rounded ${GRADE_BADGE[rb.grade]}`}>G{rb.grade}</span><span className="text-xs text-[#7C8F6E]">W{rb.weight}</span><span className="text-sm font-bold text-[#173B2D]">{rb.grade * rb.weight}</span></div>
                  </div>);})}</div>
              </div>
            )}
            {remedyTab === 'more' && <div className="bg-white rounded-lg shadow p-3"><Link href={`/materia-medica?q=${encodeURIComponent(selectedRemedy.full)}`} className="block bg-[#173B2D] text-[#C8A24A] rounded p-2 text-sm text-center">Search in Materia Medica →</Link></div>}
            {remedyTab === 'symptoms' && <div className="bg-white rounded-lg shadow p-3"><p className="text-sm text-[#7C8F6E]">Symptom details from selected rubrics.</p></div>}
            {remedyTab === 'authors' && <div className="bg-white rounded-lg shadow p-3"><p className="text-sm text-[#7C8F6E]">Author information from Synthesis database.</p></div>}
            <button onClick={() => goScreen('remedyInfo', 'remedies')} className="w-full bg-[#173B2D] text-[#C8A24A] py-2.5 rounded-lg text-sm">Remedy Info →</button>
          </div>
        )}

        {/* SCREEN: REMEDY INFO */}
        {screen === 'remedyInfo' && selectedRemedy && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><button onClick={() => goScreen('remedyDetail', 'remedies')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Remedy Info</h2></div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-serif text-xl text-[#173B2D]">{selectedRemedy.full}</h3>
              <p className="text-xs text-[#7C8F6E]">Abbreviation: {selectedRemedy.abbrev}</p>
              <div className="mt-3 space-y-2">
                <div className="bg-[#F5EFE0] rounded p-2"><div className="text-xs font-semibold text-[#173B2D]">Repertorization</div><div className="text-sm text-[#7C8F6E]">Rank: #{repertResults.findIndex(r => r.abbrev === selectedRemedy.abbrev) + 1} · Score: {selectedRemedy.totalScore} · Coverage: {selectedRemedy.coverage}</div></div>
                <Link href={`/materia-medica?q=${encodeURIComponent(selectedRemedy.full)}`} className="block bg-[#173B2D] text-[#C8A24A] rounded p-2 text-sm text-center">Search in Materia Medica →</Link>
              </div>
            </div>
            <button onClick={() => goScreen('crossRefs', 'remedies')} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Cross References →</button>
          </div>
        )}

        {/* SCREEN: CROSS REFERENCES */}
        {screen === 'crossRefs' && selectedRemedy && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><button onClick={() => goScreen('remedyInfo', 'remedies')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Cross References</h2></div>
            <div className="bg-white rounded-lg shadow p-3">
              <p className="text-sm text-[#7C8F6E]">Cross references for <span className="font-semibold text-[#173B2D]">{selectedRemedy.abbrev}</span></p>
              <p className="text-xs text-[#7C8F6E] italic mt-2">Cross references from the Synthesis database will appear here when available.</p>
            </div>
            <button onClick={() => goScreen('results', 'repertorization')} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">← Back to Results</button>
          </div>
        )}

        {/* SCREEN: SAVE & HISTORY */}
        {screen === 'saveHistory' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><button onClick={() => goScreen(repertResults.length > 0 ? 'results' : 'dashboard', repertResults.length > 0 ? 'repertorization' : 'home')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Save & History</h2></div>
            {repertResults.length > 0 && (
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-sm font-semibold text-[#173B2D] mb-2">Save Repertorization</h3>
                <input type="text" placeholder="Case name..." value={caseName} onChange={e => setCaseName(e.target.value)} className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm mb-2 text-[#173B2D]" />
                <textarea placeholder="Notes..." value={caseNotes} onChange={e => setCaseNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm mb-2 text-[#173B2D]" />
                <button onClick={saveCase} disabled={!caseName.trim()} className="w-full bg-[#173B2D] text-[#C8A24A] py-2 rounded text-sm font-semibold disabled:opacity-40">Save Case</button>
              </div>
            )}
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="text-sm font-semibold text-[#173B2D] mb-2">History ({savedCases.length})</h3>
              {savedCases.length === 0 ? <p className="text-sm text-[#7C8F6E] italic py-3 text-center">No saved cases yet.</p> :
                <div className="space-y-1">{savedCases.map((c, i) => (<div key={i} className="flex items-center justify-between border border-[#E8DCC3] rounded p-2 hover:bg-[#F5EFE0]"><div className="flex-1 cursor-pointer" onClick={() => loadCase(c)}><div className="text-sm font-medium text-[#173B2D]">{c.name}</div><div className="text-xs text-[#7C8F6E]">{c.rubrics.length} rubrics · {new Date(c.date).toLocaleDateString()}</div></div><button onClick={() => setSavedCases(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-600 px-2">✕</button></div>))}</div>}
            </div>
          </div>
        )}
      </main>

      {/* Internal Synthesis Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#173B2D] border-t border-[#C8A24A]/30 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
          {([['home', 'Home'], ['rubrics', 'Rubrics'], ['repertorization', 'Repert.'], ['remedies', 'Remedies'], ['more', 'More']] as const).map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); if (t === 'home') goScreen('dashboard', 'home'); if (t === 'rubrics') goScreen('search', 'rubrics'); if (t === 'repertorization') goScreen(selectedRubrics.length > 0 ? 'selected' : 'dashboard', 'repertorization'); if (t === 'remedies') goScreen(repertResults.length > 0 ? 'results' : 'dashboard', 'remedies'); if (t === 'more') goScreen('saveHistory', 'more'); }} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${tab === t ? 'text-[#C8A24A]' : 'text-stone-400'}`}>
              <span className="text-sm">{t === 'home' ? '🏠' : t === 'rubrics' ? '🔍' : t === 'repertorization' ? '⚙️' : t === 'remedies' ? '💊' : '⋯'}</span>
              <span className="text-[0.6rem]">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SynthesisPage() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5EFE0]"><p className="text-[#7C8F6E]">Loading Synthesis...</p></div>}><SynthesisImpl /></Suspense>);
}
