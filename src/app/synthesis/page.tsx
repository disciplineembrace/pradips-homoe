'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// ============================================================
// TYPES
// ============================================================
interface Chapter { id: number; name: string; path: string; }
interface TreeNode {
  i: number; f: number; n: string; l: number; c: number; p: string;
}
interface SearchResult {
  id: number; name: string; path: string; level: number; chapterId: number; fatherId: number;
}
interface GradeRemedy { abbrev: string; full: string; }
interface CrossRef {
  id: number; text: string; kind: string; dest_path: string;
  dest_level: number; dest_chapter_id: number; dest_remedies_count: number;
}
interface SelectedRubric {
  symptomId: number;
  name: string;
  path: string;
  chapterId: number;
  level: number;
  weight: number;
  remedyCount: number;
}
interface RepertorizeResult {
  abbrev: string;
  full: string;
  totalScore: number;
  coverage: string;
  coverageCount: number;
  coverageTotal: number;
  rubrics: { symptomId: number; grade: number; weight: number }[];
}
interface RemedyDetail {
  abbrev: string;
  full: string;
  totalScore: number;
  coverage: string;
  rubrics: { symptomId: number; grade: number; weight: number; rubricPath?: string }[];
}


// Helper to normalize rubric fields from either type
function getRubricId(r: SearchResult | TreeNode): number {
  return (r as any).i || (r as any).id;
}
function getRubricName(r: SearchResult | TreeNode): string {
  return (r as any).n || (r as any).name;
}
function getRubricPath(r: SearchResult | TreeNode): string {
  return (r as any).p || (r as any).path;
}
function getRubricChapterId(r: SearchResult | TreeNode): number {
  return (r as any).c || (r as any).chapterId;
}
function getRubricLevel(r: SearchResult | TreeNode): number {
  return (r as any).l || (r as any).level;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SynthesisPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  // State persistence keys
  const STORAGE_KEY = 'synthesis_workspace_state';

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Tree state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [treeChildren, setTreeChildren] = useState<Record<number, TreeNode[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<number>>(new Set());

  // Rubric detail state
  const [activeRubric, setActiveRubric] = useState<SearchResult | TreeNode | null>(null);
  const [rubricRemedies, setRubricRemedies] = useState<Record<number, { byGrade: Record<number, GradeRemedy[]>; total: number }>>({});
  const [loadingRemedies, setLoadingRemedies] = useState(false);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [loadingCrossRefs, setLoadingCrossRefs] = useState(false);

  // Selected rubrics (case)
  const [selectedRubrics, setSelectedRubrics] = useState<SelectedRubric[]>([]);

  // Repertorization results
  const [results, setResults] = useState<RepertorizeResult[]>([]);
  const [repertorizing, setRepertorizing] = useState(false);
  const [hasRepertorized, setHasRepertorized] = useState(false);

  // Comparison
  const [showComparison, setShowComparison] = useState(false);

  // Remedy detail modal
  const [remedyDetail, setRemedyDetail] = useState<RemedyDetail | null>(null);
  const [loadingRemedyDetail, setLoadingRemedyDetail] = useState(false);

  // Error state
  const [error, setError] = useState('');
  const [loadingState, setLoadingState] = useState(true);

  // Refs for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // ============================================================
  // AUTH CHECK
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
  // LOAD CHAPTERS ON MOUNT
  // ============================================================
  useEffect(() => {
    if (!session) return;
    fetch('/api/synthesis?action=chapters')
      .then(r => r.json())
      .then(d => {
        setChapters(d.chapters || []);
        setLoadingState(false);
      })
      .catch(() => {
        setError('Unable to load Synthesis chapters.');
        setLoadingState(false);
      });
  }, [session]);

  // ============================================================
  // STATE PERSISTENCE (save/restore)
  // ============================================================
  useEffect(() => {
    if (!session) return;
    // Restore saved state
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.selectedRubrics) setSelectedRubrics(state.selectedRubrics);
        if (state.searchQuery) setSearchQuery(state.searchQuery);
        if (state.expandedNodes) setExpandedNodes(new Set(state.expandedNodes));
        if (state.activeRubric) setActiveRubric(state.activeRubric);
      }
    } catch {}
  }, [session]);

  // Save state on changes
  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedRubrics,
        searchQuery,
        expandedNodes: Array.from(expandedNodes),
        activeRubric,
      }));
    } catch {}
  }, [session, selectedRubrics, searchQuery, expandedNodes, activeRubric]);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================================
  // DEBOUNCED SEARCH
  // ============================================================
  const performSearch = useCallback((q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchMode(false);
      return;
    }
    setSearching(true);
    setSearchMode(true);
    fetch(`/api/synthesis?action=search&q=${encodeURIComponent(q.trim())}&pageSize=50`)
      .then(r => r.json())
      .then(d => {
        setSearchResults(d.results || []);
        setSearchTotal(d.total || 0);
      })
      .catch(() => {
        setSearchResults([]);
        setSearchTotal(0);
      })
      .finally(() => setSearching(false));
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(value), 350);
  };

  // ============================================================
  // TREE EXPAND/COLLAPSE
  // ============================================================
  const loadChildren = async (parentId: number) => {
    if (treeChildren[parentId]) return;
    setLoadingChildren(prev => new Set(prev).add(parentId));
    try {
      const res = await fetch(`/api/synthesis?action=tree&parentId=${parentId}`);
      const d = await res.json();
      setTreeChildren(prev => ({ ...prev, [parentId]: d.children || [] }));
    } catch {
      setError('Unable to load rubric children.');
    } finally {
      setLoadingChildren(prev => { const n = new Set(prev); n.delete(parentId); return n; });
    }
  };

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
        loadChildren(nodeId);
      }
      return next;
    });
  };

  // ============================================================
  // RUBRIC REMEDIES
  // ============================================================
  const loadRubricRemedies = async (symptomId: number) => {
    if (rubricRemedies[symptomId]) return;
    setLoadingRemedies(true);
    try {
      const res = await fetch(`/api/synthesis?action=remedies&symptomId=${symptomId}`);
      const d = await res.json();
      setRubricRemedies(prev => ({
        ...prev,
        [symptomId]: { byGrade: d.byGrade || {}, total: d.total || 0 },
      }));
    } catch {
      setError('Unable to load remedies for this rubric.');
    } finally {
      setLoadingRemedies(false);
    }
  };

  const loadCrossRefs = async (symptomId: number) => {
    setLoadingCrossRefs(true);
    try {
      const res = await fetch(`/api/synthesis?action=crossrefs&symptomId=${symptomId}`);
      const d = await res.json();
      setCrossRefs(d.crossRefs || []);
    } catch {
      setCrossRefs([]);
    } finally {
      setLoadingCrossRefs(false);
    }
  };

  const onRubricClick = (rubric: SearchResult | TreeNode) => {
    setActiveRubric(rubric);
    const symptomId = getRubricId(rubric);
    loadRubricRemedies(symptomId);
    loadCrossRefs(symptomId);
  };

  // ============================================================
  // SELECT RUBRIC (ADD TO CASE)
  // ============================================================
  const addRubric = (rubric: SearchResult | TreeNode) => {
    const symptomId = getRubricId(rubric);
    // Prevent duplicates
    if (selectedRubrics.some(r => r.symptomId === symptomId)) {
      setError('This rubric is already selected.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const newRubric: SelectedRubric = {
      symptomId,
      name: getRubricName(rubric),
      path: getRubricPath(rubric),
      chapterId: getRubricChapterId(rubric),
      level: getRubricLevel(rubric),
      weight: 1,
      remedyCount: rubricRemedies[symptomId]?.total || 0,
    };
    setSelectedRubrics(prev => [...prev, newRubric]);
    setHasRepertorized(false);
    setResults([]);
  };

  const removeRubric = (symptomId: number) => {
    setSelectedRubrics(prev => prev.filter(r => r.symptomId !== symptomId));
    setHasRepertorized(false);
    setResults([]);
  };

  const updateWeight = (symptomId: number, weight: number) => {
    setSelectedRubrics(prev =>
      prev.map(r => r.symptomId === symptomId ? { ...r, weight } : r)
    );
    setHasRepertorized(false);
    setResults([]);
  };

  // ============================================================
  // REPERTORIZE
  // ============================================================
  const repertorize = async () => {
    if (selectedRubrics.length === 0) {
      setError('Please select at least one rubric to repertorize.');
      return;
    }
    setRepertorizing(true);
    setError('');
    try {
      const symptomIds = selectedRubrics.map(r => r.symptomId).join(',');
      const weights = selectedRubrics.map(r => r.weight).join(',');
      const res = await fetch(`/api/synthesis?action=repertorize&symptomIds=${symptomIds}&weights=${weights}`);
      const d = await res.json();
      setResults(d.results || []);
      setHasRepertorized(true);
    } catch {
      setError('Unable to perform repertorization. Please try again.');
    } finally {
      setRepertorizing(false);
    }
  };

  // ============================================================
  // REMEDY DETAIL
  // ============================================================
  const viewRemedyDetail = (result: RepertorizeResult) => {
    setLoadingRemedyDetail(true);
    // Build detail from result data + selected rubrics
    const detail: RemedyDetail = {
      abbrev: result.abbrev,
      full: result.full,
      totalScore: result.totalScore,
      coverage: result.coverage,
      rubrics: result.rubrics.map(r => {
        const sr = selectedRubrics.find(s => s.symptomId === r.symptomId);
        return {
          ...r,
          rubricPath: sr?.path || '',
        };
      }),
    };
    setRemedyDetail(detail);
    setLoadingRemedyDetail(false);
  };

  // ============================================================
  // COMPARISON MATRIX
  // ============================================================
  const getComparisonData = () => {
    if (selectedRubrics.length === 0) return null;

    // Get all unique remedies from rubric data
    const allRemedies = new Map<string, { abbrev: string; full: string }>();
    const remedyGrades = new Map<string, Map<number, number>>(); // abbrev -> (symptomId -> grade)

    selectedRubrics.forEach(sr => {
      const data = rubricRemedies[sr.symptomId];
      if (data) {
        Object.entries(data.byGrade).forEach(([grade, remedies]) => {
          remedies.forEach(r => {
            allRemedies.set(r.abbrev, { abbrev: r.abbrev, full: r.full });
            if (!remedyGrades.has(r.abbrev)) remedyGrades.set(r.abbrev, new Map());
            remedyGrades.get(r.abbrev)!.set(sr.symptomId, parseInt(grade));
          });
        });
      }
    });

    // Find remedies common to all rubrics
    const commonToAll: string[] = [];
    const byCoverage: Record<number, string[]> = {};

    allRemedies.forEach((_, abbrev) => {
      const grades = remedyGrades.get(abbrev)!;
      const count = grades.size;
      if (count === selectedRubrics.length) {
        commonToAll.push(abbrev);
      }
      if (!byCoverage[count]) byCoverage[count] = [];
      byCoverage[count].push(abbrev);
    });

    return {
      allRemedies: Array.from(allRemedies.values()),
      remedyGrades,
      commonToAll,
      byCoverage,
      totalRubrics: selectedRubrics.length,
    };
  };

  const comparisonData = showComparison ? getComparisonData() : null;

  // ============================================================
  // RENDER: LOADING STATE
  // ============================================================
  if (!session || loadingState) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Synthesis...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ============================================================
  // RENDER: MAIN WORKSPACE
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="flex-1 w-full px-3 md:px-6 py-4 md:py-6">

        {/* ============================================================
            HEADER
        ============================================================ */}
        <header className="mb-4 md:mb-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-serif text-2xl md:text-3xl text-[#173B2D]">SYNTHESIS REPERTORY</h1>
          </div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#7C8F6E] mt-1">Updated Version by Dr. Pradip</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ============================================================
            SEARCH BAR
        ============================================================ */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search rubric, symptom or clinical term..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D] focus:ring-1 focus:ring-[#173B2D]"
            />
            <button
              onClick={() => performSearch(searchQuery)}
              className="px-6 py-2.5 bg-[#173B2D] text-white rounded-lg text-sm font-semibold hover:bg-[#0f2a20] transition-colors"
            >
              Search
            </button>
            {searchMode && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchMode(false); }}
                className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-lg text-sm hover:bg-stone-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {searchMode && (
            <div className="mt-2 text-xs text-stone-500">
              {searching ? 'Searching...' : `${searchTotal} rubrics found`}
            </div>
          )}
        </div>

        {/* ============================================================
            MAIN WORKSPACE GRID
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ====== LEFT/CENTER: RUBRIC TREE / SEARCH RESULTS ====== */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-stone-200">
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 rounded-t-lg">
              <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">
                {searchMode ? 'Search Results' : 'Rubric Tree'}
              </h2>
            </div>
            <div className="p-3 max-h-[600px] overflow-y-auto">

              {/* Search Results Mode */}
              {searchMode ? (
                <div className="space-y-1">
                  {searchResults.length === 0 && !searching && (
                    <p className="text-sm text-stone-500 text-center py-8">
                      No rubrics found. Try a different search term.
                    </p>
                  )}
                  {searchResults.map(r => (
                    <div
                      key={r.id}
                      className={`p-2.5 rounded border transition-colors cursor-pointer ${
                        activeRubric && getRubricId(activeRubric) === r.id
                          ? 'border-[#173B2D] bg-blue-50'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                      onClick={() => onRubricClick(r)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[#173B2D] truncate">{r.name}</div>
                          <div className="text-xs text-stone-500 truncate">{r.path}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-stone-400">L{r.level}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRubricClick(r); }}
                            className="px-2 py-1 text-xs bg-[#173B2D] text-white rounded hover:bg-[#0f2a20]"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); addRubric(r); }}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Tree Mode */
                <div className="space-y-0.5">
                  {chapters.map(ch => (
                    <div key={ch.id}>
                      {/* Chapter node */}
                      <button
                        onClick={() => toggleNode(ch.id)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm text-left rounded hover:bg-stone-50"
                      >
                        <span className="text-stone-400 text-xs w-4">
                          {expandedNodes.has(ch.id) ? '▼' : '▸'}
                        </span>
                        <span className="font-semibold text-[#173B2D]">{ch.name}</span>
                      </button>

                      {/* Children */}
                      {expandedNodes.has(ch.id) && (
                        <div className="ml-4 border-l border-stone-200 pl-2">
                          {loadingChildren.has(ch.id) ? (
                            <div className="px-2 py-1 text-xs text-stone-400">Loading...</div>
                          ) : treeChildren[ch.id] ? (
                            treeChildren[ch.id].map(child => (
                              <TreeBranch
                                key={child.i}
                                node={child}
                                level={1}
                                expandedNodes={expandedNodes}
                                treeChildren={treeChildren}
                                loadingChildren={loadingChildren}
                                activeRubric={activeRubric}
                                onToggle={toggleNode}
                                onRubricClick={onRubricClick}
                                onAddRubric={addRubric}
                              />
                            ))
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ====== RIGHT: RUBRIC REMEDIES & GRADES ====== */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200">
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 rounded-t-lg">
              <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Rubric Remedies</h2>
            </div>
            <div className="p-3 max-h-[600px] overflow-y-auto">
              {!activeRubric ? (
                <p className="text-sm text-stone-500 text-center py-8">
                  Select a rubric to view its remedies and grades.
                </p>
              ) : loadingRemedies ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-3 border-stone-200 border-t-[#173B2D] rounded-full animate-spin mb-2"></div>
                  <p className="text-sm text-stone-500">Loading remedies...</p>
                </div>
              ) : (
                <div>
                  {/* Rubric info */}
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Rubric</div>
                    <div className="text-sm font-medium text-[#173B2D]">
                      {(activeRubric as any).p || (activeRubric as any).path}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      Remedies: {rubricRemedies[(activeRubric as any).i || (activeRubric as any).id]?.total || 0}
                    </div>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => addRubric(activeRubric)}
                    className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    + Add Rubric to Case
                  </button>

                  {/* Remedies by grade */}
                  {(() => {
                    const symptomId = (activeRubric as any).i || (activeRubric as any).id;
                    const data = rubricRemedies[symptomId];
                    if (!data || data.total === 0) {
                      return (
                        <p className="text-sm text-stone-500 text-center py-4">
                          No verified remedy data available for this rubric.
                        </p>
                      );
                    }
                    const grades = [4, 3, 2, 1];
                    const gradeColors: Record<number, string> = {
                      4: 'border-red-400 bg-red-50',
                      3: 'border-orange-400 bg-orange-50',
                      2: 'border-blue-400 bg-blue-50',
                      1: 'border-stone-300 bg-stone-50',
                    };
                    const gradeTextColors: Record<number, string> = {
                      4: 'text-red-700',
                      3: 'text-orange-700',
                      2: 'text-blue-700',
                      1: 'text-stone-600',
                    };
                    return (
                      <div className="space-y-3">
                        {grades.map(grade => {
                          const remedies = data.byGrade[grade] || [];
                          if (remedies.length === 0) return null;
                          return (
                            <div key={grade} className={`border-l-4 ${gradeColors[grade]} pl-3 py-2`}>
                              <div className={`text-xs font-bold ${gradeTextColors[grade]} uppercase tracking-wider mb-1.5`}>
                                Grade {grade} ({remedies.length})
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {remedies.map(r => (
                                  <span
                                    key={r.abbrev}
                                    title={r.full}
                                    className="px-2 py-0.5 bg-white border border-stone-200 rounded text-xs font-mono text-[#173B2D] hover:bg-stone-100 cursor-default"
                                  >
                                    {r.abbrev}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Cross references */}
                        {crossRefs.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-stone-200">
                            <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Cross References</div>
                            <div className="space-y-1">
                              {crossRefs.map(cr => (
                                <div
                                  key={cr.id}
                                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                  onClick={() => {
                                    const node: TreeNode = {
                                      i: cr.id, f: 0, n: cr.text, l: cr.dest_level,
                                      c: cr.dest_chapter_id, p: cr.dest_path,
                                    };
                                    onRubricClick(node);
                                  }}
                                >
                                  → {cr.text}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            SELECTED RUBRICS (CASE)
        ============================================================ */}
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-stone-200">
          <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 rounded-t-lg flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">
              Selected Rubrics ({selectedRubrics.length})
            </h2>
            {selectedRubrics.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="px-3 py-1.5 text-xs bg-stone-200 text-stone-700 rounded font-semibold hover:bg-stone-300 transition-colors"
                >
                  {showComparison ? 'Hide Comparison' : 'Compare Remedies'}
                </button>
                <button
                  onClick={() => { setSelectedRubrics([]); setResults([]); setHasRepertorized(false); }}
                  className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          <div className="p-3">
            {selectedRubrics.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">
                No rubrics selected. Search or browse the tree, then click &quot;+ Add Rubric to Case&quot;.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedRubrics.map((sr, idx) => (
                  <div key={sr.symptomId} className="flex items-center gap-3 p-2.5 border border-stone-200 rounded-lg hover:bg-stone-50">
                    <span className="text-xs text-stone-400 font-mono w-6">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#173B2D] truncate">{sr.path}</div>
                      <div className="text-xs text-stone-500">Remedies: {sr.remedyCount}</div>
                    </div>
                    {/* Case weight */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-stone-500">Weight:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map(w => (
                          <button
                            key={w}
                            onClick={() => updateWeight(sr.symptomId, w)}
                            className={`w-7 h-7 text-xs rounded font-bold transition-colors ${
                              sr.weight === w
                                ? 'bg-blue-600 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => removeRubric(sr.symptomId)}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      title="Remove rubric"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Repertorize button */}
                <div className="pt-2">
                  <button
                    onClick={repertorize}
                    disabled={repertorizing}
                    className="w-full px-6 py-2.5 bg-[#173B2D] text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#0f2a20] transition-colors disabled:opacity-50"
                  >
                    {repertorizing ? 'Repertorizing...' : 'Repertorize'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            COMPARISON MATRIX
        ============================================================ */}
        {showComparison && comparisonData && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
              <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Remedy Comparison</h2>
            </div>
            <div className="p-3">
              {/* Common to all */}
              {comparisonData.commonToAll.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1.5">
                    Common to All Rubrics ({comparisonData.commonToAll.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {comparisonData.commonToAll.map(abbrev => {
                      const r = comparisonData.allRemedies.find(ar => ar.abbrev === abbrev);
                      return (
                        <span
                          key={abbrev}
                          title={r?.full}
                          className="px-2 py-0.5 bg-white border border-green-300 rounded text-xs font-mono text-green-800"
                        >
                          {abbrev}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* By coverage */}
              {Object.entries(comparisonData.byCoverage)
                .filter(([count]) => parseInt(count) < comparisonData.totalRubrics)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([count, abbrevs]) => (
                  <div key={count} className="mb-3 p-2.5 bg-stone-50 border border-stone-200 rounded">
                    <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                      Present in {count}/{comparisonData.totalRubrics} ({abbrevs.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {abbrevs.map(abbrev => {
                        const r = comparisonData.allRemedies.find(ar => ar.abbrev === abbrev);
                        return (
                          <span
                            key={abbrev}
                            title={r?.full}
                            className="px-2 py-0.5 bg-white border border-stone-300 rounded text-xs font-mono text-stone-700"
                          >
                            {abbrev}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}

              {/* Matrix table */}
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="border border-stone-200 px-2 py-1.5 text-left text-stone-600 font-semibold sticky left-0 bg-stone-100">
                        Remedy
                      </th>
                      {selectedRubrics.map(sr => (
                        <th key={sr.symptomId} className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold max-w-[120px]">
                          <div className="truncate" title={sr.path}>{sr.path}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.allRemedies
                      .sort((a, b) => {
                        const aCount = comparisonData.remedyGrades.get(a.abbrev)!.size;
                        const bCount = comparisonData.remedyGrades.get(b.abbrev)!.size;
                        if (bCount !== aCount) return bCount - aCount;
                        return a.abbrev.localeCompare(b.abbrev);
                      })
                      .slice(0, 50) // Limit to top 50 for performance
                      .map(r => {
                        const grades = comparisonData.remedyGrades.get(r.abbrev)!;
                        const count = grades.size;
                        return (
                          <tr key={r.abbrev} className={count === comparisonData.totalRubrics ? 'bg-green-50' : 'hover:bg-stone-50'}>
                            <td className="border border-stone-200 px-2 py-1 font-mono text-[#173B2D] font-medium sticky left-0 bg-inherit">
                              {r.abbrev}
                            </td>
                            {selectedRubrics.map(sr => {
                              const grade = grades.get(sr.symptomId);
                              return (
                                <td
                                  key={sr.symptomId}
                                  className={`border border-stone-200 px-2 py-1 text-center font-mono ${
                                    grade === 4 ? 'text-red-600 font-bold' :
                                    grade === 3 ? 'text-orange-600 font-semibold' :
                                    grade === 2 ? 'text-blue-600' :
                                    grade === 1 ? 'text-stone-500' : 'text-stone-300'
                                  }`}
                                >
                                  {grade || '-'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {comparisonData.allRemedies.length > 50 && (
                  <p className="text-xs text-stone-500 mt-2 text-center">
                    Showing top 50 of {comparisonData.allRemedies.length} remedies (sorted by coverage)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            REPERTORIZATION RESULTS
        ============================================================ */}
        {(hasRepertorized || repertorizing) && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
              <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Repertorization Results</h2>
            </div>
            <div className="p-3">
              {repertorizing ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-3 border-stone-200 border-t-[#173B2D] rounded-full animate-spin mb-2"></div>
                  <p className="text-sm text-stone-500">Calculating scores...</p>
                </div>
              ) : results.length === 0 ? (
                <p className="text-sm text-stone-500 text-center py-4">
                  No remedies found. Try selecting different rubrics.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-200 px-3 py-2 text-left text-stone-600 font-semibold w-12">Rank</th>
                        <th className="border border-stone-200 px-3 py-2 text-left text-stone-600 font-semibold">Remedy</th>
                        <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Score</th>
                        <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Coverage</th>
                        <th className="border border-stone-200 px-3 py-2 text-left text-stone-600 font-semibold">Grade Breakdown</th>
                        <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 50).map((r, idx) => {
                        const gradeBreakdown: Record<number, number> = {};
                        r.rubrics.forEach(rb => {
                          gradeBreakdown[rb.grade] = (gradeBreakdown[rb.grade] || 0) + 1;
                        });
                        return (
                          <tr key={r.abbrev} className="hover:bg-stone-50">
                            <td className="border border-stone-200 px-3 py-2 text-center text-stone-500 font-mono">{idx + 1}</td>
                            <td className="border border-stone-200 px-3 py-2">
                              <div className="font-mono font-semibold text-[#173B2D]">{r.abbrev}</div>
                              <div className="text-xs text-stone-500">{r.full}</div>
                            </td>
                            <td className="border border-stone-200 px-3 py-2 text-center font-bold text-[#173B2D]">{r.totalScore}</td>
                            <td className="border border-stone-200 px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                r.coverageCount === r.coverageTotal
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-stone-100 text-stone-600'
                              }`}>
                                {r.coverage}
                              </span>
                            </td>
                            <td className="border border-stone-200 px-3 py-2">
                              <div className="flex gap-1.5 text-xs">
                                {[4, 3, 2, 1].map(g => (
                                  gradeBreakdown[g] ? (
                                    <span key={g} className={`px-1.5 py-0.5 rounded font-mono ${
                                      g === 4 ? 'bg-red-100 text-red-700' :
                                      g === 3 ? 'bg-orange-100 text-orange-700' :
                                      g === 2 ? 'bg-blue-100 text-blue-700' :
                                      'bg-stone-100 text-stone-600'
                                    }`}>
                                      G{g}: {gradeBreakdown[g]}
                                    </span>
                                  ) : null
                                ))}
                              </div>
                            </td>
                            <td className="border border-stone-200 px-3 py-2 text-center">
                              <button
                                onClick={() => viewRemedyDetail(r)}
                                className="px-2 py-1 text-xs bg-[#173B2D] text-white rounded hover:bg-[#0f2a20] transition-colors"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {results.length > 50 && (
                    <p className="text-xs text-stone-500 mt-2 text-center">
                      Showing top 50 of {results.length} remedies
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ============================================================
          REMEDY DETAIL MODAL
      ============================================================ */}
      {remedyDetail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setRemedyDetail(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-[#173B2D]">{remedyDetail.full}</h3>
                <p className="text-xs text-stone-500 font-mono">{remedyDetail.abbrev}</p>
              </div>
              <button
                onClick={() => setRemedyDetail(null)}
                className="text-stone-400 hover:text-stone-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {/* Score summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Total Score</div>
                  <div className="text-2xl font-bold text-[#173B2D]">{remedyDetail.totalScore}</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Coverage</div>
                  <div className="text-2xl font-bold text-green-700">{remedyDetail.coverage}</div>
                </div>
              </div>

              {/* Rubric contribution */}
              <div>
                <h4 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider mb-2">Rubric Contribution</h4>
                <div className="space-y-1.5">
                  {remedyDetail.rubrics.map((rb, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 border border-stone-200 rounded">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-[#173B2D] truncate">{rb.rubricPath || `Symptom ${rb.symptomId}`}</div>
                        <div className="text-xs text-stone-500">Weight: {rb.weight}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          rb.grade === 4 ? 'bg-red-100 text-red-700' :
                          rb.grade === 3 ? 'bg-orange-100 text-orange-700' :
                          rb.grade === 2 ? 'bg-blue-100 text-blue-700' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          Grade {rb.grade}
                        </span>
                        <span className="text-xs text-stone-500">
                          = {rb.grade * rb.weight} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Link to Materia Medica if available */}
              <div className="mt-4 pt-4 border-t border-stone-200">
                <Link
                  href="/materia-medica"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  → View in Materia Medica
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ============================================================
// RECURSIVE TREE BRANCH COMPONENT
// ============================================================
interface TreeBranchProps {
  node: TreeNode;
  level: number;
  expandedNodes: Set<number>;
  treeChildren: Record<number, TreeNode[]>;
  loadingChildren: Set<number>;
  activeRubric: SearchResult | TreeNode | null;
  onToggle: (id: number) => void;

  onRubricClick: (node: TreeNode) => void;
  onAddRubric: (node: TreeNode) => void;
}

function TreeBranch({
  node, level, expandedNodes, treeChildren, loadingChildren,
  activeRubric, onToggle, onRubricClick, onAddRubric,
}: TreeBranchProps) {
  const isActive = activeRubric && (activeRubric as any).i === node.i;
  const hasChildren = expandedNodes.has(node.i);
  const children = treeChildren[node.i];
  const isLoading = loadingChildren.has(node.i);

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors ${
          isActive ? 'bg-blue-100 border border-blue-300' : 'hover:bg-stone-50'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onRubricClick(node)}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(node.i); }}
          className="text-stone-400 text-xs w-4 hover:text-stone-600"
        >
          {isLoading ? '⋯' : hasChildren ? '▼' : '▸'}
        </button>

        {/* Name */}
        <span className={`text-sm flex-1 truncate ${level === 1 ? 'font-medium text-[#173B2D]' : 'text-stone-700'}`}>
          {node.n}
        </span>

        {/* Add button */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddRubric(node); }}
          className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 opacity-0 group-hover:opacity-100"
          style={{ opacity: 1 }}
          title="Add to case"
        >
          +
        </button>
      </div>

      {/* Children */}
      {hasChildren && (
        <div className="border-l border-stone-200 ml-3">
          {isLoading ? (
            <div className="px-2 py-1 text-xs text-stone-400">Loading...</div>
          ) : children ? (
            children.map(child => (
              <TreeBranch
                key={child.i}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                treeChildren={treeChildren}
                loadingChildren={loadingChildren}
                activeRubric={activeRubric}
                onToggle={onToggle}

                onRubricClick={onRubricClick}
                onAddRubric={onAddRubric}
              />
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}
