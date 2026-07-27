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
type Bookmark = { id: number; name: string; path: string };
type Tab = 'home' | 'chapters' | 'search' | 'case' | 'more';
type Screen = 'dashboard' | 'chapters' | 'search' | 'selected' | 'processing' | 'results' | 'remedyDetail' | 'remedyInfo' | 'crossRefs' | 'saveHistory' | 'bookmarks' | 'remedyList' | 'rubricDetail' | 'readingMode';

// Grade colors: 4=RED, 3=DARK GREEN, 2=DARK BLUE, 1=NORMAL TEXT
const GRADE_COLOR: Record<number, string> = { 4: 'text-red-600 font-bold', 3: 'text-green-700 font-semibold', 2: 'text-blue-700 font-medium', 1: 'text-stone-700' };
const GRADE_BADGE: Record<number, string> = { 4: 'bg-red-100 text-red-700', 3: 'bg-green-100 text-green-700', 2: 'bg-blue-100 text-blue-700', 1: 'bg-stone-100 text-stone-600' };

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (<>{text.substring(0, idx)}<mark className="bg-[#C8A24A]/30 text-[#173B2D] rounded px-0.5">{text.substring(idx, idx + q.length)}</mark>{text.substring(idx + q.length)}</>);
}

function SynthesisImpl() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('dashboard');
  
  // Search
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searching, setSearching] = useState(false);
  
  // Tree/hierarchy
  const [chapters, setChapters] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Record<number, TreeNode[]>>({});
  const [hierarchyPath, setHierarchyPath] = useState<TreeNode[]>([]);
  const [currentChapter, setCurrentChapter] = useState<TreeNode | null>(null);
  
  // Rubric detail
  const [rubricDetail, setRubricDetail] = useState<any>(null);
  
  // Selected rubrics / case
  const [selectedRubrics, setSelectedRubrics] = useState<SelectedRubric[]>([]);
  const [currentRemedies, setCurrentRemedies] = useState<{ symptomId: number; byGrade: Record<string, RemedyByGrade[]>; total: number } | null>(null);
  
  // Repertorization
  const [repertResults, setRepertResults] = useState<RepertResult[]>([]);
  const [processStep, setProcessStep] = useState(0);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedRemedy, setSelectedRemedy] = useState<RepertResult | null>(null);
  const [remedyTab, setRemedyTab] = useState<'scores' | 'symptoms' | 'authors' | 'more'>('scores');
  
  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => { try { return JSON.parse(localStorage.getItem('synth_bookmarks') || '[]'); } catch { return []; } });
  
  // Remedy list
  const [remedyList, setRemedyList] = useState<{ abbrev: string; full: string }[]>([]);
  const [remedyListTotal, setRemedyListTotal] = useState(0);
  const [remedyListQ, setRemedyListQ] = useState('');
  
  // History
  const [savedCases, setSavedCases] = useState<SavedCase[]>(() => { try { return JSON.parse(localStorage.getItem('synth_history') || '[]'); } catch { return []; } });
  const [caseName, setCaseName] = useState('');
  const [caseNotes, setCaseNotes] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ rubrics: 180386, remedies: 2384, chapters: 41, crossRefs: 41208 });

  useEffect(() => { fetch('/api/auth/session').then(r => r.json()).then(d => { if (!d.authenticated) { router.push('/login'); return; } setSession(d); }).catch(() => router.push('/login')); }, [router]);
  useEffect(() => { if (session && chapters.length === 0) { fetch('/api/synthesis?action=chapters').then(r => r.json()).then(d => { if (d.chapters) setChapters(d.chapters.map((c: any) => ({ i: c.id, f: 0, n: c.name, l: 1, c: c.id, p: c.path }))); }); fetch('/api/synthesis?action=stats').then(r => r.json()).then(d => { if (d.rubrics) setStats(d); }).catch(() => {}); } }, [session, chapters.length]);
  useEffect(() => { localStorage.setItem('synth_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem('synth_history', JSON.stringify(savedCases)); }, [savedCases]);

  // Debounced search with pagination
  useEffect(() => { if (searchQ.trim().length < 2) { setSearchResults([]); setSearchTotal(0); return; } setSearching(true); setSearchPage(1); const t = setTimeout(() => { fetch(`/api/synthesis?action=search&q=${encodeURIComponent(searchQ)}&page=1&pageSize=30`).then(r => r.json()).then(d => { setSearchResults(d.results || []); setSearchTotal(d.total || 0); setSearching(false); }).catch(() => setSearching(false)); }, 300); return () => clearTimeout(t); }, [searchQ]);

  const goScreen = (s: Screen, t?: Tab) => { setScreen(s); if (t) setTab(t); };
  
  const loadChildren = useCallback(async (pid: number) => { if (childrenMap[pid]) return; const r = await fetch(`/api/synthesis?action=tree&parentId=${pid}`); const d = await r.json(); setChildrenMap(prev => ({ ...prev, [pid]: d.children || [] })); }, [childrenMap]);
  const toggleNode = useCallback((id: number) => { setExpandedNodes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); loadChildren(id); }, [loadChildren]);
  const fetchRemedies = useCallback(async (sid: number) => { const r = await fetch(`/api/synthesis?action=remedies&symptomId=${sid}`); const d = await r.json(); setCurrentRemedies({ symptomId: sid, byGrade: d.byGrade || {}, total: d.total || 0 }); }, []);
  const fetchRubricDetail = useCallback(async (rid: number) => { const r = await fetch(`/api/synthesis?action=rubricDetail&rubricId=${rid}`); const d = await r.json(); setRubricDetail(d); goScreen('rubricDetail'); }, []);
  const addRubric = useCallback(async (rub: any) => { const id = rub.id || rub.i; if (selectedRubrics.some(r => r.id === id)) return; const r = await fetch(`/api/synthesis?action=remedies&symptomId=${id}`); const d = await r.json(); setSelectedRubrics(prev => [...prev, { id, name: rub.name || rub.n, path: rub.path || rub.p, weight: 1, remedyCount: d.total || 0, enabled: true }]); }, [selectedRubrics]);
  const removeRubric = useCallback((id: number) => setSelectedRubrics(prev => prev.filter(r => r.id !== id)), []);
  const toggleEnabled = useCallback((id: number) => setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)), []);
  const updateWeight = useCallback((id: number, w: number) => setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, weight: w } : r)), []);
  const toggleBookmark = useCallback((rub: any) => { const id = rub.id || rub.i; const bm = { id, name: rub.name || rub.n, path: rub.path || rub.p }; setBookmarks(prev => prev.some(b => b.id === id) ? prev.filter(b => b.id !== id) : [...prev, bm]); }, []);
  const isBookmarked = useCallback((id: number) => bookmarks.some(b => b.id === id), [bookmarks]);

  const repertorize = useCallback(async () => {
    goScreen('processing', 'case'); setProcessStep(0);
    const steps = ['Reading selected rubrics', 'Fetching remedy data', 'Reading remedy grades', 'Applying rubric weights', 'Calculating scores', 'Calculating coverage', 'Sorting remedies', 'Finalizing results'];
    for (let i = 0; i < steps.length; i++) { setProcessStep(i); await new Promise(r => setTimeout(r, 250)); }
    const enabled = selectedRubrics.filter(r => r.enabled);
    const r = await fetch(`/api/synthesis?action=repertorize&symptomIds=${enabled.map(r => r.id).join(',')}&weights=${enabled.map(r => r.weight).join(',')}`);
    const d = await r.json();
    setRepertResults(d.results || []); goScreen('results', 'case');
  }, [selectedRubrics]);

  const saveCase = useCallback(() => { if (!caseName.trim()) return; setSavedCases(prev => [...prev, { name: caseName, notes: caseNotes, date: new Date().toISOString(), rubrics: selectedRubrics, results: repertResults }]); setCaseName(''); setCaseNotes(''); }, [caseName, caseNotes, selectedRubrics, repertResults]);
  const loadCase = useCallback((c: SavedCase) => { setSelectedRubrics(c.rubrics); setRepertResults(c.results); goScreen('results', 'case'); }, []);

  // Load remedy list
  useEffect(() => { if (screen === 'remedyList' && remedyList.length === 0) { fetch('/api/synthesis?action=remedyList&page=1').then(r => r.json()).then(d => { setRemedyList(d.remedies || []); setRemedyListTotal(d.total || 0); }); } }, [screen, remedyList.length]);
  useEffect(() => { if (screen === 'remedyList' && remedyListQ) { const t = setTimeout(() => { fetch(`/api/synthesis?action=remedyList&q=${encodeURIComponent(remedyListQ)}&page=1`).then(r => r.json()).then(d => { setRemedyList(d.remedies || []); setRemedyListTotal(d.total || 0); }); }, 300); return () => clearTimeout(t); } }, [remedyListQ, screen]);

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const isExp = expandedNodes.has(node.i); const kids = childrenMap[node.i] || [];
    const isSel = selectedRubrics.some(r => r.id === node.i); const isBm = isBookmarked(node.i);
    return (<div key={node.i}><div className="flex items-center gap-1 py-1.5 px-2 hover:bg-[#F5EFE0] rounded group" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
      <button onClick={() => toggleNode(node.i)} className="w-5 h-5 text-xs text-[#7C8F6E]">{isExp ? '▼' : '▸'}</button>
      <span onClick={() => { fetchRemedies(node.i); fetchRubricDetail(node.i); }} className={`text-sm cursor-pointer flex-1 ${isSel ? 'text-green-700 font-semibold' : 'text-[#173B2D]'}`}>{node.n}</span>
      <button onClick={() => toggleBookmark(node)} className="text-xs">{isBm ? '★' : '☆'}</button>
      <button onClick={() => addRubric(node)} className={`text-xs px-2 py-0.5 rounded ${isSel ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A]'} opacity-0 group-hover:opacity-100`}>{isSel ? '✓' : '+'}</button>
    </div>{isExp && kids.map(c => renderTree(c, depth + 1))}</div>);
  };

  if (!session) return (<div className="min-h-screen flex flex-col bg-[#F5EFE0]"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div></div><Footer /></div>);

  const groupedResults = searchResults.reduce((acc, r) => { const ch = r.path.split(' - ')[0] || 'OTHER'; if (!acc[ch]) acc[ch] = []; acc[ch].push(r); return acc; }, {} as Record<string, SearchResult[]>);
  const groupedSelected = selectedRubrics.reduce((acc, r) => { const ch = r.path.split(' - ')[0] || 'OTHER'; if (!acc[ch]) acc[ch] = []; acc[ch].push(r); return acc; }, {} as Record<string, SelectedRubric[]>);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full pb-20">
        {/* SCREEN: DASHBOARD */}
        {screen === 'dashboard' && (<div className="space-y-4">
          <div className="bg-[#173B2D] rounded-xl p-5 text-center"><h1 className="font-serif text-2xl text-[#C8A24A]">Synthesis Repertory</h1><p className="text-xs text-stone-300 mt-1">Professional Repertorization Engine</p><p className="text-xs text-stone-400 mt-0.5">Updated by Dr Pradip</p></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">{stats.rubrics.toLocaleString()}</div><div className="text-[0.65rem] text-[#7C8F6E]">Rubrics</div></div>
            <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">{stats.remedies.toLocaleString()}</div><div className="text-[0.65rem] text-[#7C8F6E]">Remedies</div></div>
            <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">{stats.chapters}</div><div className="text-[0.65rem] text-[#7C8F6E]">Chapters</div></div>
            <div className="bg-white rounded-lg shadow p-3 text-center"><div className="text-xl font-bold text-[#173B2D]">{stats.crossRefs.toLocaleString()}</div><div className="text-[0.65rem] text-[#7C8F6E]">Cross Refs</div></div>
          </div>
          <button onClick={() => { goScreen('search', 'search'); setSelectedRubrics([]); setRepertResults([]); }} className="w-full bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm">+ Start New Repertorization</button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => goScreen('chapters', 'chapters')} className="bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Chapters</button>
            <button onClick={() => goScreen('search', 'search')} className="bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Search Rubrics</button>
            <button onClick={() => goScreen('remedyList', 'more')} className="bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Remedy List</button>
            <button onClick={() => goScreen('bookmarks', 'more')} className="bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Bookmarks ({bookmarks.length})</button>
            <button onClick={() => goScreen(selectedRubrics.length > 0 ? 'selected' : 'dashboard', 'case')} className="bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Case ({selectedRubrics.length})</button>
            <button onClick={() => goScreen('saveHistory', 'more')} className="bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">History ({savedCases.length})</button>
          </div>
        </div>)}

        {/* SCREEN: CHAPTERS */}
        {screen === 'chapters' && (<div className="space-y-3">
          <div className="flex items-center gap-2"><button onClick={() => goScreen('dashboard', 'home')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Chapters</h2></div>
          <input type="text" placeholder="Search chapter..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full px-3 py-2 border border-[#E8DCC3] rounded-lg text-sm text-[#173B2D]" />
          <div className="bg-white rounded-lg shadow p-2">
            {chapters.filter(c => !searchQ || c.n.toLowerCase().includes(searchQ.toLowerCase())).map(ch => (
              <div key={ch.i} className="flex items-center justify-between py-2 px-2 border-b border-[#E8DCC3] last:border-0 hover:bg-[#F5EFE0] rounded cursor-pointer" onClick={() => { setCurrentChapter(ch); setHierarchyPath([ch]); toggleNode(ch.i); goScreen('rubricDetail'); fetchRubricDetail(ch.i); }}>
                <span className="text-sm font-medium text-[#173B2D]">{ch.n}</span><span className="text-[#7C8F6E]">›</span>
              </div>
            ))}
          </div>
        </div>)}

        {/* SCREEN: SEARCH */}
        {screen === 'search' && (<div className="space-y-3">
          <div className="flex items-center gap-2"><button onClick={() => goScreen('dashboard', 'home')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Search Rubric</h2></div>
          <div className="bg-white rounded-lg shadow p-3"><div className="relative"><input type="text" placeholder="Search rubric / symptom..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full px-3 py-2 pl-9 border border-[#E8DCC3] rounded-lg text-sm text-[#173B2D]" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E] text-sm">🔍</span></div></div>
          {searchTotal > 0 && <div className="text-xs text-[#7C8F6E]">{searchTotal.toLocaleString()} results</div>}
          {Object.keys(groupedResults).length > 0 && (<div className="bg-white rounded-lg shadow p-2 max-h-96 overflow-y-auto">
            {Object.entries(groupedResults).map(([chapter, items]) => (<div key={chapter} className="mb-2">
              <div className="text-xs font-bold text-[#7C8F6E] uppercase px-2 py-1">{chapter} ({items.length})</div>
              {items.map(r => { const isSel = selectedRubrics.some(sr => sr.id === r.id); const isBm = isBookmarked(r.id); return (
                <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5EFE0] rounded">
                  <div className="flex-1 cursor-pointer" onClick={() => { fetchRemedies(r.id); fetchRubricDetail(r.id); }}>
                    <div className={`text-sm ${isSel ? 'text-green-700 font-semibold' : 'text-[#173B2D]'}`}>{highlight(r.name, searchQ)}</div>
                    <div className="text-xs text-[#7C8F6E]">{highlight(r.path, searchQ)}</div>
                  </div>
                  <button onClick={() => toggleBookmark(r)} className="text-xs">{isBm ? '★' : '☆'}</button>
                  <button onClick={() => addRubric(r)} className={`text-xs px-2 py-1 rounded ${isSel ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A]'}`}>{isSel ? '✓' : '+'}</button>
                </div>);})}
            </div>))}
          </div>)}
          {currentRemedies && (<div className="bg-white rounded-lg shadow p-3"><h3 className="text-xs font-bold text-[#7C8F6E] uppercase mb-2">Remedies ({currentRemedies.total})</h3>
            {[4,3,2,1].map(g => { const rem = currentRemedies.byGrade[String(g)] || []; if (!rem.length) return null; return (
              <div key={g} className="mb-2"><div className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${GRADE_BADGE[g]}`}>Grade {g} ({rem.length})</div><div className="flex flex-wrap gap-1 mt-1">{rem.map((r, i) => <span key={i} className={`text-xs border rounded px-1.5 py-0.5 ${GRADE_COLOR[g]} ${g === 1 ? 'bg-[#F5EFE0] border-[#E8DCC3]' : GRADE_BADGE[g] + ' border-transparent'}`} title={r.full}>{r.abbrev}</span>)}</div></div>
            );})}
          </div>)}
          {selectedRubrics.length > 0 && <button onClick={() => goScreen('selected', 'case')} className="w-full bg-[#173B2D] text-[#C8A24A] py-3 rounded-lg font-semibold text-sm">Selected ({selectedRubrics.length}) →</button>}
        </div>)}

        {/* SCREEN: RUBRIC DETAIL */}
        {screen === 'rubricDetail' && rubricDetail && (<div className="space-y-3">
          <div className="flex items-center gap-2"><button onClick={() => goScreen('search', 'search')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">{rubricDetail.rubric?.name}</h2></div>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="text-sm text-[#173B2D] font-medium">{rubricDetail.rubric?.path}</div>
            <div className="grid grid-cols-2 gap-2 mt-2"><div className="text-xs text-[#7C8F6E]">Level: {rubricDetail.rubric?.level}</div><div className="text-xs text-[#7C8F6E]">Remedies: {rubricDetail.remedyCount}</div></div>
          </div>
          {rubricDetail.children?.length > 0 && (<div className="bg-white rounded-lg shadow p-2"><h3 className="text-xs font-bold text-[#7C8F6E] uppercase mb-1">Child Rubrics ({rubricDetail.children.length})</h3>{rubricDetail.children.map((c: any) => (<div key={c.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#F5EFE0] rounded cursor-pointer" onClick={() => fetchRubricDetail(c.id)}><span className="text-sm text-[#173B2D] flex-1">{c.name}</span><span className="text-[#7C8F6E]">›</span></div>))}</div>)}
          {rubricDetail.remedyCount > 0 && (<div className="bg-white rounded-lg shadow p-3"><h3 className="text-xs font-bold text-[#7C8F6E] uppercase mb-2">Remedies ({rubricDetail.remedyCount})</h3>{[4,3,2,1].map(g => { const rem = rubricDetail.byGrade?.[String(g)] || []; if (!rem.length) return null; return (<div key={g} className="mb-2"><div className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${GRADE_BADGE[g]}`}>Grade {g} ({rem.length})</div><div className="flex flex-wrap gap-1 mt-1">{rem.map((r: any, i: number) => <span key={i} className={`text-xs border rounded px-1.5 py-0.5 ${GRADE_COLOR[g]} ${g === 1 ? 'bg-[#F5EFE0] border-[#E8DCC3]' : GRADE_BADGE[g] + ' border-transparent'}`} title={r.full}>{r.abbrev}</span>)}</div></div>);})}</div>)}
          {rubricDetail.crossRefs?.length > 0 && (<div className="bg-white rounded-lg shadow p-3"><h3 className="text-xs font-bold text-[#7C8F6E] uppercase mb-1">Cross References</h3>{rubricDetail.crossRefs.map((cr: any, i: number) => <div key={i} className="text-sm text-[#173B2D] py-1">{cr.text}</div>)}</div>)}
          <div className="flex gap-2"><button onClick={() => addRubric(rubricDetail.rubric)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${selectedRubrics.some(r => r.id === rubricDetail.rubric.id) ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A]'}`}>{selectedRubrics.some(r => r.id === rubricDetail.rubric.id) ? '✓ Added' : '+ Add to Case'}</button><button onClick={() => toggleBookmark(rubricDetail.rubric)} className="bg-white border border-[#E8DCC3] text-[#173B2D] px-4 py-2.5 rounded-lg text-sm">{isBookmarked(rubricDetail.rubric.id) ? '★' : '☆'}</button></div>
        </div>)}

        {/* SCREEN: SELECTED RUBRICS */}
        {screen === 'selected' && (<div className="space-y-3">
          <div className="flex items-center gap-2"><button onClick={() => goScreen('search', 'search')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Selected Rubrics</h2><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{selectedRubrics.length}</span></div>
          <div className="bg-white rounded-lg shadow p-3">{selectedRubrics.length === 0 ? <p className="text-sm text-[#7C8F6E] italic py-4 text-center">No rubrics selected.</p> :
            Object.entries(groupedSelected).map(([chapter, rubrics]) => (<div key={chapter} className="mb-2"><div className="text-xs font-bold text-[#7C8F6E] uppercase px-1 py-1">{chapter}</div>{rubrics.map(r => (<div key={r.id} className="flex items-center gap-2 py-1.5 border-b border-[#E8DCC3] last:border-0"><input type="checkbox" checked={r.enabled} onChange={() => toggleEnabled(r.id)} className="w-4 h-4 accent-[#173B2D]" /><div className="flex-1 min-w-0"><div className="text-sm text-[#173B2D] font-medium truncate">{r.name}</div><div className="text-xs text-[#7C8F6E] truncate">{r.remedyCount} remedies</div></div><div className="flex gap-0.5">{[1,2,3,4].map(w => <button key={w} onClick={() => updateWeight(r.id, w)} className={`w-6 h-6 text-xs rounded ${r.weight === w ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-[#F5EFE0] border border-[#E8DCC3] text-[#173B2D]'}`}>{w}</button>)}</div><button onClick={() => removeRubric(r.id)} className="text-xs text-red-600 px-1">✕</button></div>))}</div>))}
          </div>
          <div className="flex gap-2"><button onClick={() => goScreen('search', 'search')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">← Search</button><button onClick={() => setSelectedRubrics([])} className="bg-white border border-red-300 text-red-600 px-3 py-2.5 rounded-lg text-sm">Clear</button><button onClick={repertorize} disabled={selectedRubrics.filter(r => r.enabled).length === 0} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">Repertorize →</button></div>
        </div>)}

        {/* SCREEN: PROCESSING */}
        {screen === 'processing' && (<div className="flex flex-col items-center justify-center py-16"><div className="w-20 h-20 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-6"></div><div className="text-lg font-bold text-[#173B2D] mb-1">{Math.round((processStep / 8) * 100)}%</div><div className="text-sm text-[#173B2D]">Please wait...</div><div className="text-xs text-[#7C8F6E] mb-6">{['Reading selected rubrics','Fetching remedy data','Reading remedy grades','Applying rubric weights','Calculating scores','Calculating coverage','Sorting remedies','Finalizing results'][processStep]}</div></div>)}

        {/* SCREEN: RESULTS */}
        {screen === 'results' && (<div className="space-y-3">
          <div className="flex items-center gap-2"><button onClick={() => goScreen('selected', 'case')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Results ({repertResults.length})</h2><button onClick={() => setShowCompare(!showCompare)} className="text-xs bg-[#173B2D] text-[#C8A24A] px-3 py-1 rounded">{showCompare ? 'Ranking' : 'Compare'}</button></div>
          <div className="bg-white rounded-lg shadow p-2">{!showCompare ? (<table className="w-full text-sm"><thead><tr className="text-xs text-[#7C8F6E] border-b border-[#E8DCC3]"><th className="text-left py-2 px-1">#</th><th className="text-left py-2 px-1">Remedy</th><th className="text-left py-2 px-1">Score</th><th className="text-left py-2 px-1">Cov.</th></tr></thead><tbody>{repertResults.slice(0, 100).map((r, i) => (<tr key={r.abbrev} onClick={() => { setSelectedRemedy(r); goScreen('remedyDetail', 'case'); }} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0] cursor-pointer"><td className="py-2 px-1 text-[#7C8F6E]">{i + 1}</td><td className="py-2 px-1 font-medium text-[#173B2D]" title={r.full}>{r.abbrev}</td><td className="py-2 px-1 text-[#173B2D]">{r.totalScore}</td><td className="py-2 px-1"><span className={`text-xs px-2 py-0.5 rounded ${r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-[#F5EFE0] text-[#7C8F6E]'}`}>{r.coverage}</span></td></tr>))}</tbody></table>) : (<table className="w-full text-xs"><thead><tr className="text-[#7C8F6E] border-b border-[#E8DCC3]"><th className="text-left py-1 px-1">Remedy</th>{selectedRubrics.filter(r => r.enabled).map(r => <th key={r.id} className="text-center py-1 px-1 max-w-16 truncate" title={r.path}>{r.name}</th>)}<th className="text-center py-1 px-1">Σ</th></tr></thead><tbody>{repertResults.slice(0, 20).map(r => { const gm: Record<number, number> = {}; r.rubrics.forEach(rb => gm[rb.symptomId] = rb.grade); return (<tr key={r.abbrev} className="border-b border-[#E8DCC3]"><td className="py-1 px-1 font-medium text-[#173B2D]">{r.abbrev}</td>{selectedRubrics.filter(rr => rr.enabled).map(sr => <td key={sr.id} className="text-center py-1 px-1">{gm[sr.id] ? <span className={`text-xs font-semibold ${GRADE_COLOR[gm[sr.id]]}`}>{gm[sr.id]}</span> : <span className="text-[#E8DCC3]">—</span>}</td>)}<td className="text-center py-1 px-1 font-bold text-[#173B2D]">{r.totalScore}</td></tr>);})}</tbody></table>)}</div>
          <div className="flex gap-2"><button onClick={() => goScreen('selected', 'case')} className="flex-1 bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">← Rubrics</button><button onClick={() => goScreen('saveHistory', 'more')} className="flex-1 bg-[#173B2D] text-[#C8A24A] py-2.5 rounded-lg text-sm">Save</button></div>
        </div>)}

        {/* SCREEN: REMEDY DETAIL */}
        {screen === 'remedyDetail' && selectedRemedy && (<div className="space-y-3">
          <div className="flex items-center gap-2"><button onClick={() => goScreen('results', 'case')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">{selectedRemedy.abbrev}</h2></div>
          <div className="flex gap-2"><div className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full flex-1 text-center">Score: {selectedRemedy.totalScore}</div><div className="bg-[#173B2D] text-[#C8A24A] text-sm font-bold px-3 py-1.5 rounded-full flex-1 text-center">Coverage: {selectedRemedy.coverage}</div></div>
          <div className="flex gap-1 bg-white rounded-lg p-1">{(['scores', 'symptoms', 'authors', 'more'] as const).map(t => <button key={t} onClick={() => setRemedyTab(t)} className={`flex-1 text-xs py-1.5 rounded capitalize ${remedyTab === t ? 'bg-[#173B2D] text-[#C8A24A]' : 'text-[#7C8F6E]'}`}>{t}</button>)}</div>
          {remedyTab === 'scores' && (<div className="bg-white rounded-lg shadow p-3"><div className="space-y-1">{selectedRemedy.rubrics.map(rb => { const rub = selectedRubrics.find(r => r.id === rb.symptomId); return (<div key={rb.symptomId} className="flex items-center justify-between py-1.5 border-b border-[#E8DCC3] last:border-0"><div className="flex-1 min-w-0"><div className="text-sm text-[#173B2D]">{rub?.name}</div><div className="text-xs text-[#7C8F6E]">{rub?.path}</div></div><div className="flex items-center gap-2"><span className={`text-xs px-2 py-0.5 rounded ${GRADE_BADGE[rb.grade]}`}>G{rb.grade}</span><span className="text-xs text-[#7C8F6E]">W{rb.weight}</span><span className="text-sm font-bold text-[#173B2D]">{rb.grade * rb.weight}</span></div></div>);})}</div></div>)}
          {remedyTab === 'more' && <div className="bg-white rounded-lg shadow p-3"><Link href={`/materia-medica?q=${encodeURIComponent(selectedRemedy.full)}`} className="block bg-[#173B2D] text-[#C8A24A] rounded p-2 text-sm text-center">Search in Materia Medica →</Link></div>}
          {remedyTab === 'symptoms' && <div className="bg-white rounded-lg shadow p-3"><p className="text-sm text-[#7C8F6E]">Symptom details from selected rubrics.</p></div>}
          {remedyTab === 'authors' && <div className="bg-white rounded-lg shadow p-3"><p className="text-sm text-[#7C8F6E]">Author information from Synthesis database.</p></div>}
          <button onClick={() => goScreen('remedyInfo', 'more')} className="w-full bg-[#173B2D] text-[#C8A24A] py-2.5 rounded-lg text-sm">Remedy Info →</button>
        </div>)}

        {/* SCREEN: REMEDY INFO */}
        {screen === 'remedyInfo' && selectedRemedy && (<div className="space-y-3"><div className="flex items-center gap-2"><button onClick={() => goScreen('remedyDetail', 'case')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Remedy Info</h2></div><div className="bg-white rounded-lg shadow p-4"><h3 className="font-serif text-xl text-[#173B2D]">{selectedRemedy.full}</h3><p className="text-xs text-[#7C8F6E]">Abbreviation: {selectedRemedy.abbrev}</p><div className="mt-3"><Link href={`/materia-medica?q=${encodeURIComponent(selectedRemedy.full)}`} className="block bg-[#173B2D] text-[#C8A24A] rounded p-2 text-sm text-center">Search in Materia Medica →</Link></div></div><button onClick={() => goScreen('crossRefs', 'more')} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">Cross References →</button></div>)}

        {/* SCREEN: CROSS REFERENCES */}
        {screen === 'crossRefs' && selectedRemedy && (<div className="space-y-3"><div className="flex items-center gap-2"><button onClick={() => goScreen('remedyInfo', 'more')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Cross References</h2></div><div className="bg-white rounded-lg shadow p-3"><p className="text-sm text-[#7C8F6E]">Cross references for <span className="font-semibold text-[#173B2D]">{selectedRemedy.abbrev}</span></p></div><button onClick={() => goScreen('results', 'case')} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-2.5 rounded-lg text-sm">← Back to Results</button></div>)}

        {/* SCREEN: BOOKMARKS */}
        {screen === 'bookmarks' && (<div className="space-y-3"><div className="flex items-center gap-2"><button onClick={() => goScreen('dashboard', 'home')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Bookmarks ({bookmarks.length})</h2></div>{bookmarks.length === 0 ? <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-[#7C8F6E] italic text-center">No bookmarks yet.</p></div> : <div className="bg-white rounded-lg shadow p-2">{bookmarks.map(bm => <div key={bm.id} className="flex items-center gap-2 py-1.5 px-2 border-b border-[#E8DCC3] last:border-0 hover:bg-[#F5EFE0] rounded"><div className="flex-1 cursor-pointer" onClick={() => { fetchRemedies(bm.id); fetchRubricDetail(bm.id); }}><div className="text-sm text-[#173B2D] font-medium">{bm.name}</div><div className="text-xs text-[#7C8F6E]">{bm.path}</div></div><button onClick={() => addRubric({ id: bm.id, name: bm.name, path: bm.path })} className="text-xs bg-[#173B2D] text-[#C8A24A] px-2 py-1 rounded">+</button><button onClick={() => setBookmarks(prev => prev.filter(b => b.id !== bm.id))} className="text-xs text-red-600 px-1">✕</button></div>)}</div>}</div>)}

        {/* SCREEN: REMEDY LIST */}
        {screen === 'remedyList' && (<div className="space-y-3"><div className="flex items-center gap-2"><button onClick={() => goScreen('dashboard', 'home')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Remedy List ({remedyListTotal})</h2></div><div className="bg-white rounded-lg shadow p-3"><input type="text" placeholder="Search remedy..." value={remedyListQ} onChange={e => setRemedyListQ(e.target.value)} className="w-full px-3 py-2 border border-[#E8DCC3] rounded-lg text-sm text-[#173B2D]" /></div><div className="bg-white rounded-lg shadow p-2 max-h-96 overflow-y-auto">{remedyList.map((r, i) => <div key={i} className="flex items-center justify-between py-1.5 px-2 border-b border-[#E8DCC3] last:border-0"><span className="text-sm font-medium text-[#173B2D]">{r.abbrev}</span><span className="text-xs text-[#7C8F6E]">{r.full}</span></div>)}</div></div>)}

        {/* SCREEN: SAVE & HISTORY */}
        {screen === 'saveHistory' && (<div className="space-y-3"><div className="flex items-center gap-2"><button onClick={() => goScreen(repertResults.length > 0 ? 'results' : 'dashboard', repertResults.length > 0 ? 'case' : 'home')} className="text-[#173B2D]">←</button><h2 className="font-serif text-lg text-[#173B2D] flex-1">Save & History</h2></div>{repertResults.length > 0 && (<div className="bg-white rounded-lg shadow p-3"><h3 className="text-sm font-semibold text-[#173B2D] mb-2">Save Repertorization</h3><input type="text" placeholder="Case name..." value={caseName} onChange={e => setCaseName(e.target.value)} className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm mb-2 text-[#173B2D]" /><textarea placeholder="Notes..." value={caseNotes} onChange={e => setCaseNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm mb-2 text-[#173B2D]" /><button onClick={saveCase} disabled={!caseName.trim()} className="w-full bg-[#173B2D] text-[#C8A24A] py-2 rounded text-sm font-semibold disabled:opacity-40">Save Case</button></div>)}<div className="bg-white rounded-lg shadow p-3"><h3 className="text-sm font-semibold text-[#173B2D] mb-2">History ({savedCases.length})</h3>{savedCases.length === 0 ? <p className="text-sm text-[#7C8F6E] italic py-3 text-center">No saved cases yet.</p> : <div className="space-y-1">{savedCases.map((c, i) => <div key={i} className="flex items-center justify-between border border-[#E8DCC3] rounded p-2 hover:bg-[#F5EFE0]"><div className="flex-1 cursor-pointer" onClick={() => loadCase(c)}><div className="text-sm font-medium text-[#173B2D]">{c.name}</div><div className="text-xs text-[#7C8F6E]">{c.rubrics.length} rubrics · {new Date(c.date).toLocaleDateString()}</div></div><button onClick={() => setSavedCases(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-600 px-2">✕</button></div>)}</div>}</div></div>)}
      </main>

      {/* Internal Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#173B2D] border-t border-[#C8A24A]/30 z-40"><div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
        {([['home','Home','🏠'], ['chapters','Chapters','📖'], ['search','Search','🔍'], ['case','Case','⚙️'], ['more','More','⋯']] as const).map(([t, label, icon]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'home') goScreen('dashboard', 'home'); if (t === 'chapters') goScreen('chapters', 'chapters'); if (t === 'search') goScreen('search', 'search'); if (t === 'case') goScreen(selectedRubrics.length > 0 ? 'selected' : 'dashboard', 'case'); if (t === 'more') goScreen('saveHistory', 'more'); }} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${tab === t ? 'text-[#C8A24A]' : 'text-stone-400'}`}><span className="text-sm">{icon}</span><span className="text-[0.6rem]">{label}</span></button>
        ))}
      </div></div>
      <Footer />
    </div>
  );
}

export default function SynthesisPage() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5EFE0]"><p className="text-[#7C8F6E]">Loading Synthesis...</p></div>}><SynthesisImpl /></Suspense>);
}
