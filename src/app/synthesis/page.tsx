'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type TreeNode = { i: number; f: number; n: string; l: number; c: number; p: string };
type SearchResult = { id: number; name: string; path: string; level: number; chapterId: number; fatherId: number };
type RemedyByGrade = { abbrev: string; full: string };
type SelectedRubric = { id: number; name: string; path: string; weight: number; remedyCount: number };
type RepertorizationResult = {
  abbrev: string; full: string; totalScore: number;
  coverage: string; coverageCount: number; coverageTotal: number;
  rubrics: { symptomId: number; grade: number; weight: number }[];
};

const GRADE_LABELS: Record<number, string> = { 4: 'Grade 4 (Very Strong)', 3: 'Grade 3 (Strong)', 2: 'Grade 2 (Moderate)', 1: 'Grade 1 (Mild)' };
const GRADE_COLORS: Record<number, string> = { 4: 'bg-blue-100 text-blue-900', 3: 'bg-blue-50 text-blue-800', 2: 'bg-stone-100 text-stone-700', 1: 'bg-stone-50 text-stone-600' };

function SynthesisPageImpl() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [chapters, setChapters] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Record<number, TreeNode[]>>({});
  const [selectedRubrics, setSelectedRubrics] = useState<SelectedRubric[]>([]);
  const [currentRubricRemedies, setCurrentRubricRemedies] = useState<{ symptomId: number; byGrade: Record<number, RemedyByGrade[]>; total: number } | null>(null);
  const [repertResults, setRepertResults] = useState<RepertorizationResult[]>([]);
  const [repertorizing, setRepertorizing] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      setSession(d);
    }).catch(() => router.push('/login'));
  }, [router]);

  // Load chapters on mount
  useEffect(() => {
    if (session) {
      fetch('/api/synthesis?action=chapters').then(r => r.json()).then(d => {
        if (d.chapters) {
          setChapters(d.chapters.map((c: any) => ({ i: c.id, f: 0, n: c.name, l: 1, c: c.id, p: c.path })));
        }
      });
    }
  }, [session]);

  // Debounced search
  useEffect(() => {
    if (searchQ.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/synthesis?action=search&q=${encodeURIComponent(searchQ)}`).then(r => r.json()).then(d => {
        setSearchResults(d.results || []);
        setSearching(false);
      }).catch(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ]);

  const loadChildren = useCallback(async (parentId: number) => {
    if (childrenMap[parentId]) return;
    setLoadingChildren(parentId);
    const r = await fetch(`/api/synthesis?action=tree&parentId=${parentId}`);
    const d = await r.json();
    setChildrenMap(prev => ({ ...prev, [parentId]: d.children || [] }));
    setLoadingChildren(null);
  }, [childrenMap]);

  const toggleNode = useCallback((nodeId: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) { next.delete(nodeId); } else { next.add(nodeId); }
      return next;
    });
    loadChildren(nodeId);
  }, [loadChildren]);

  const fetchRemedies = useCallback(async (symptomId: number) => {
    const r = await fetch(`/api/synthesis?action=remedies&symptomId=${symptomId}`);
    const d = await r.json();
    setCurrentRubricRemedies({ symptomId, byGrade: d.byGrade || {}, total: d.total || 0 });
  }, []);

  const addRubric = useCallback(async (rubric: SearchResult | TreeNode) => {
    const id = (rubric as any).id || (rubric as any).i;
    if (selectedRubrics.some(r => r.id === id)) return;
    
    // Fetch remedy count
    const r = await fetch(`/api/synthesis?action=remedies&symptomId=${id}`);
    const d = await r.json();
    
    setSelectedRubrics(prev => [...prev, {
      id,
      name: (rubric as any).name || (rubric as any).n,
      path: (rubric as any).path || (rubric as any).p,
      weight: 1,
      remedyCount: d.total || 0,
    }]);
  }, [selectedRubrics]);

  const removeRubric = useCallback((id: number) => {
    setSelectedRubrics(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateWeight = useCallback((id: number, weight: number) => {
    setSelectedRubrics(prev => prev.map(r => r.id === id ? { ...r, weight } : r));
  }, []);

  const repertorize = useCallback(async () => {
    if (selectedRubrics.length === 0) return;
    setRepertorizing(true);
    const symptomIds = selectedRubrics.map(r => r.id).join(',');
    const weights = selectedRubrics.map(r => r.weight).join(',');
    const r = await fetch(`/api/synthesis?action=repertorize&symptomIds=${symptomIds}&weights=${weights}`);
    const d = await r.json();
    setRepertResults(d.results || []);
    setRepertorizing(false);
  }, [selectedRubrics]);

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.i);
    const children = childrenMap[node.i] || [];
    const isSelected = selectedRubrics.some(r => r.id === node.i);
    
    return (
      <div key={node.i}>
        <div className="flex items-center gap-1 py-1 hover:bg-[#F5EFE0] rounded px-2 group" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
          <button
            onClick={() => toggleNode(node.i)}
            className="w-5 h-5 flex items-center justify-center text-xs text-[#7C8F6E] hover:text-[#173B2D]"
          >{loadingChildren === node.i ? '...' : isExpanded ? '▼' : '▸'}</button>
          <span
            onClick={() => { fetchRemedies(node.i); }}
            className={`text-sm cursor-pointer flex-1 ${isSelected ? 'text-green-700 font-semibold' : 'text-[#173B2D]'}`}
          >{node.n}</span>
          <button
            onClick={() => addRubric(node)}
            className={`text-xs px-2 py-0.5 rounded ${isSelected ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A] hover:bg-[#2a5443]'} opacity-0 group-hover:opacity-100 transition-opacity`}
          >{isSelected ? '✓' : '+ Add'}</button>
        </div>
        {isExpanded && children.map(child => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

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
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Synthesis Repertory</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Professional repertorization engine — 180,386 rubrics · 2,384 remedies · 1,156,961 graded relationships</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search rubric, symptom, or clinical term..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
            {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7C8F6E]">searching...</span>}
          </div>
          
          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto border border-[#E8DCC3] rounded-lg">
              {searchResults.map(r => {
                const isSel = selectedRubrics.some(sr => sr.id === r.id);
                return (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2 hover:bg-[#F5EFE0] border-b border-[#E8DCC3] last:border-0">
                    <div className="flex-1 cursor-pointer" onClick={() => fetchRemedies(r.id)}>
                      <span className="text-sm text-[#173B2D] font-medium">{r.name}</span>
                      <span className="text-xs text-[#7C8F6E] ml-2">{r.path}</span>
                    </div>
                    <button
                      onClick={() => addRubric(r)}
                      className={`text-xs px-2 py-1 rounded ${isSel ? 'bg-green-100 text-green-700' : 'bg-[#173B2D] text-[#C8A24A] hover:bg-[#2a5443]'}`}
                    >{isSel ? '✓ Added' : '+ Add'}</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Rubric Tree */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rubric Tree */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-serif text-lg text-[#173B2D] mb-3 pb-1 border-b border-[#E8DCC3]">Rubric Hierarchy</h2>
              <div className="max-h-96 overflow-y-auto">
                {chapters.map(ch => renderTreeNode(ch))}
              </div>
            </div>

            {/* Current Rubric Remedies */}
            {currentRubricRemedies && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-serif text-lg text-[#173B2D] mb-3 pb-1 border-b border-[#E8DCC3]">
                  Remedies — {currentRubricRemedies.total} total
                </h2>
                <div className="space-y-3">
                  {[4, 3, 2, 1].map(grade => {
                    const remedies = currentRubricRemedies.byGrade[grade] || [];
                    if (remedies.length === 0) return null;
                    return (
                      <div key={grade}>
                        <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${GRADE_COLORS[grade]}`}>
                          {GRADE_LABELS[grade]} ({remedies.length})
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {remedies.map((r, i) => (
                            <span key={i} className="text-xs bg-[#F5EFE0] border border-[#E8DCC3] rounded px-2 py-1 text-[#173B2D]" title={r.full}>
                              {r.abbrev}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Repertorization Results */}
            {repertResults.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#E8DCC3]">
                  <h2 className="font-serif text-lg text-[#173B2D]">Repertorization Results</h2>
                  <button
                    onClick={() => setShowCompare(!showCompare)}
                    className="text-xs bg-[#173B2D] text-[#C8A24A] px-3 py-1 rounded hover:bg-[#2a5443]"
                  >{showCompare ? 'Show Ranking' : 'Compare Matrix'}</button>
                </div>
                
                {!showCompare ? (
                  /* Ranking table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-[#7C8F6E] border-b border-[#E8DCC3]">
                          <th className="text-left py-2 px-2">Rank</th>
                          <th className="text-left py-2 px-2">Remedy</th>
                          <th className="text-left py-2 px-2">Score</th>
                          <th className="text-left py-2 px-2">Coverage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repertResults.slice(0, 50).map((r, i) => (
                          <tr key={r.abbrev} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0]">
                            <td className="py-2 px-2 text-[#7C8F6E]">{i + 1}</td>
                            <td className="py-2 px-2 font-medium text-[#173B2D]" title={r.full}>{r.abbrev}</td>
                            <td className="py-2 px-2 text-[#173B2D]">{r.totalScore}</td>
                            <td className="py-2 px-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                                {r.coverage}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Comparison matrix */
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#7C8F6E] border-b border-[#E8DCC3]">
                          <th className="text-left py-2 px-2">Remedy</th>
                          {selectedRubrics.map(r => (
                            <th key={r.id} className="text-center py-2 px-2 max-w-24 truncate" title={r.path}>{r.name}</th>
                          ))}
                          <th className="text-center py-2 px-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repertResults.slice(0, 20).map(r => {
                          const gradeMap: Record<number, number> = {};
                          r.rubrics.forEach(rb => { gradeMap[rb.symptomId] = rb.grade; });
                          return (
                            <tr key={r.abbrev} className="border-b border-[#E8DCC3] hover:bg-[#F5EFE0]">
                              <td className="py-1 px-2 font-medium text-[#173B2D]" title={r.full}>{r.abbrev}</td>
                              {selectedRubrics.map(sr => (
                                <td key={sr.id} className="text-center py-1 px-2">
                                  {gradeMap[sr.id] ? (
                                    <span className={`inline-block w-6 h-6 leading-6 rounded text-center ${GRADE_COLORS[gradeMap[sr.id]]}`}>{gradeMap[sr.id]}</span>
                                  ) : (
                                    <span className="text-[#E8DCC3]">—</span>
                                  )}
                                </td>
                              ))}
                              <td className="text-center py-1 px-2 font-bold text-[#173B2D]">{r.totalScore}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Selected Rubrics */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4 sticky top-20">
              <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#E8DCC3]">
                <h2 className="font-serif text-lg text-[#173B2D]">Selected Rubrics</h2>
                <span className="text-xs text-[#7C8F6E]">{selectedRubrics.length} selected</span>
              </div>
              
              {selectedRubrics.length === 0 ? (
                <p className="text-sm text-[#7C8F6E] italic py-4 text-center">Select rubrics from the tree or search to add them here.</p>
              ) : (
                <div className="space-y-3">
                  {selectedRubrics.map((r, i) => (
                    <div key={r.id} className="border border-[#E8DCC3] rounded-lg p-3 bg-[#F5EFE0]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <span className="text-xs text-[#7C8F6E]">#{i + 1}</span>
                          <span className="text-sm font-medium text-[#173B2D] ml-1">{r.name}</span>
                          <div className="text-xs text-[#7C8F6E] mt-1">{r.path}</div>
                          <div className="text-xs text-[#7C8F6E] mt-1">{r.remedyCount} remedies</div>
                        </div>
                        <button
                          onClick={() => removeRubric(r.id)}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                        >✕ Remove</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7C8F6E]">Weight:</span>
                        {[1, 2, 3, 4].map(w => (
                          <button
                            key={w}
                            onClick={() => updateWeight(r.id, w)}
                            className={`w-7 h-7 text-xs rounded ${r.weight === w ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-white border border-[#E8DCC3] text-[#173B2D] hover:bg-[#E8DCC3]'}`}
                          >{w}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={repertorize}
                    disabled={repertorizing || selectedRubrics.length === 0}
                    className="w-full bg-[#173B2D] text-[#C8A24A] py-2.5 rounded-lg font-semibold text-sm hover:bg-[#2a5443] disabled:opacity-40 transition-colors"
                  >
                    {repertorizing ? 'Repertorizing...' : 'REPERTORIZE'}
                  </button>
                  
                  {selectedRubrics.length > 0 && (
                    <button
                      onClick={() => { setSelectedRubrics([]); setRepertResults([]); }}
                      className="w-full text-xs text-red-600 hover:text-red-800 py-1"
                    >Clear all</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SynthesisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5EFE0]"><p className="text-[#7C8F6E]">Loading Synthesis...</p></div>}>
      <SynthesisPageImpl />
    </Suspense>
  );
}
