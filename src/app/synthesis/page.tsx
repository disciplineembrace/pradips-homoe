'use client';
/// ============================================================
/// SYNTHESIS REPERTORY — Upgraded Clinical Workspace
/// "Updated Version by Dr. Pradip"
/// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  DoctorProfile, PatientDetails, SelectedRubric, RepertorizationResult,
  Chapter, TreeNode, SearchResult, CrossRef,
  loadProfile, loadActiveCase, saveActiveCase, clearActiveCase,
  loadCases, saveCase, deleteCase, SavedCase,
  generateCaseNo, getRubricId, getRubricName, getRubricPath,
  GRADE_COLORS, PRINT_GRADE_COLORS,
} from './storage';
import { ProfileSettings } from './profile-settings';
import { CasePaper } from './case-paper';
import { ReportSheet } from './report-sheet';
import { StepGuide } from './step-guide';

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SynthesisPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // View state: 'dashboard' | 'browse' | 'search' | 'case' | 'history' | 'profile'
  const [view, setView] = useState<'dashboard' | 'browse' | 'search' | 'case' | 'history' | 'profile'>('dashboard');

  // Stats
  const [stats, setStats] = useState({ rubrics: 0, remedies: 0, chapters: 0, crossRefs: 0 });

  // Chapters
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Tree state
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [treeChildren, setTreeChildren] = useState<Record<number, TreeNode[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<number>>(new Set());
  const [breadcrumb, setBreadcrumb] = useState<TreeNode[]>([]); // current path

  // Active rubric (for remedy display)
  const [activeRubric, setActiveRubric] = useState<TreeNode | SearchResult | null>(null);
  const [rubricRemedies, setRubricRemedies] = useState<Record<number, { byGrade: Record<number, { abbrev: string; full: string }[]>; total: number }>>({});
  const [loadingRemedies, setLoadingRemedies] = useState(false);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [loadingCrossRefs, setLoadingCrossRefs] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Case state (active case)
  const [patient, setPatient] = useState<PatientDetails>({
    patientName: '', caseNo: '', age: '', sex: '', date: new Date().toISOString().split('T')[0],
    contact: '', notes: '',
  });
  const [selectedRubrics, setSelectedRubrics] = useState<SelectedRubric[]>([]);
  const [results, setResults] = useState<RepertorizationResult[]>([]);
  const [repertorizing, setRepertorizing] = useState(false);

  // Doctor profile
  const [profile, setProfile] = useState<DoctorProfile>(loadProfile());
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Case history
  const [cases, setCases] = useState<SavedCase[]>([]);

  // Report
  const [showReport, setShowReport] = useState(false);

  // Step guide
  const [showStepGuide, setShowStepGuide] = useState(false);

  // Error
  const [error, setError] = useState('');

  // ============================================================
  // AUTH + INIT
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

  useEffect(() => {
    if (!session) return;
    // Load stats
    fetch('/api/synthesis?action=stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
    // Load chapters
    fetch('/api/synthesis?action=chapters')
      .then(r => r.json())
      .then(d => { setChapters(d.chapters || []); setLoading(false); })
      .catch(() => setLoading(false));
    // Restore active case
    const saved = loadActiveCase();
    if (saved) {
      setPatient(saved.patient);
      setSelectedRubrics(saved.rubrics);
      setResults(saved.results);
    }
  }, [session]);

  // Persist active case
  useEffect(() => {
    if (!session) return;
    saveActiveCase({ patient, rubrics: selectedRubrics, results });
  }, [session, patient, selectedRubrics, results]);

  // ============================================================
  // TREE OPERATIONS
  // ============================================================
  const loadChildren = useCallback(async (parentId: number) => {
    if (treeChildren[parentId]) return;
    setLoadingChildren(prev => new Set(prev).add(parentId));
    try {
      const res = await fetch(`/api/synthesis?action=tree&parentId=${parentId}`);
      const d = await res.json();
      setTreeChildren(prev => ({ ...prev, [parentId]: d.children || [] }));
    } catch {}
    setLoadingChildren(prev => { const n = new Set(prev); n.delete(parentId); return n; });
  }, [treeChildren]);

  const toggleNode = (nodeId: number, nodeName?: string, node?: TreeNode) => {
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

  // Navigate into a chapter/rubric — update breadcrumb
  const navigateInto = (node: TreeNode) => {
    setBreadcrumb(prev => {
      // If this node is already in breadcrumb, truncate to it
      const idx = prev.findIndex(n => n.i === node.i);
      if (idx >= 0) return prev.slice(0, idx + 1);
      // Otherwise add it
      return [...prev, node];
    });
    setActiveRubric(node);
    loadRubricRemedies(node.i);
    loadCrossRefs(node.i);
    // Auto-expand
    if (!expandedNodes.has(node.i)) {
      toggleNode(node.i);
    }
  };

  const navigateToChapter = (ch: Chapter) => {
    const node: TreeNode = { i: ch.id, f: 0, n: ch.name, l: 1, c: ch.id, p: ch.path };
    setBreadcrumb([node]);
    setActiveRubric(node);
    loadRubricRemedies(ch.id);
    loadCrossRefs(ch.id);
    if (!expandedNodes.has(ch.id)) toggleNode(ch.id);
  };

  const navigateToBreadcrumb = (idx: number) => {
    setBreadcrumb(prev => prev.slice(0, idx + 1));
    const node = breadcrumb[idx];
    if (node) {
      setActiveRubric(node);
      loadRubricRemedies(node.i);
      loadCrossRefs(node.i);
    }
  };

  // ============================================================
  // RUBRIC REMEDIES + CROSS REFS
  // ============================================================
  const loadRubricRemedies = async (symptomId: number) => {
    if (rubricRemedies[symptomId]) return;
    setLoadingRemedies(true);
    try {
      const res = await fetch(`/api/synthesis?action=remedies&symptomId=${symptomId}`);
      const d = await res.json();
      setRubricRemedies(prev => ({ ...prev, [symptomId]: { byGrade: d.byGrade || {}, total: d.total || 0 } }));
    } catch {}
    setLoadingRemedies(false);
  };

  const loadCrossRefs = async (symptomId: number) => {
    setLoadingCrossRefs(true);
    try {
      const res = await fetch(`/api/synthesis?action=crossrefs&symptomId=${symptomId}`);
      const d = await res.json();
      setCrossRefs(d.crossRefs || []);
    } catch { setCrossRefs([]); }
    setLoadingCrossRefs(false);
  };

  // ============================================================
  // SEARCH
  // ============================================================
  const performSearch = useCallback((q: string) => {
    if (!q.trim() || q.trim().length < 2) { setSearchResults([]); setSearchTotal(0); return; }
    setSearching(true);
    fetch(`/api/synthesis?action=search&q=${encodeURIComponent(q.trim())}&pageSize=50`)
      .then(r => r.json())
      .then(d => { setSearchResults(d.results || []); setSearchTotal(d.total || 0); })
      .catch(() => { setSearchResults([]); setSearchTotal(0); })
      .finally(() => setSearching(false));
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(value), 350);
  };

  // ============================================================
  // CASE OPERATIONS
  // ============================================================
  const addRubricToCase = (rubric: TreeNode | SearchResult) => {
    const symptomId = getRubricId(rubric);
    if (selectedRubrics.some(r => r.symptomId === symptomId)) {
      setError('This rubric is already in the case.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const newRubric: SelectedRubric = {
      symptomId,
      name: getRubricName(rubric),
      path: getRubricPath(rubric),
      chapterId: (rubric as any).c || (rubric as any).chapterId,
      level: (rubric as any).l || (rubric as any).level,
      weight: 1,
      enabled: true,
      remedyCount: rubricRemedies[symptomId]?.total || 0,
    };
    setSelectedRubrics(prev => [...prev, newRubric]);
    setResults([]);
  };

  const removeRubric = (symptomId: number) => {
    setSelectedRubrics(prev => prev.filter(r => r.symptomId !== symptomId));
    setResults([]);
  };

  const updateWeight = (symptomId: number, weight: number) => {
    setSelectedRubrics(prev => prev.map(r => r.symptomId === symptomId ? { ...r, weight } : r));
    setResults([]);
  };

  const toggleRubric = (symptomId: number) => {
    setSelectedRubrics(prev => prev.map(r => r.symptomId === symptomId ? { ...r, enabled: !r.enabled } : r));
    setResults([]);
  };

  const clearAll = () => {
    setSelectedRubrics([]);
    setResults([]);
  };

  const repertorize = async () => {
    const enabled = selectedRubrics.filter(r => r.enabled);
    if (enabled.length === 0) { setError('No enabled rubrics to repertorize.'); return; }
    setRepertorizing(true);
    setError('');
    try {
      const symptomIds = enabled.map(r => r.symptomId).join(',');
      const weights = enabled.map(r => r.weight).join(',');
      const res = await fetch(`/api/synthesis?action=repertorize&symptomIds=${symptomIds}&weights=${weights}`);
      const d = await res.json();
      setResults(d.results || []);
    } catch { setError('Repertorization failed. Please try again.'); }
    setRepertorizing(false);
  };

  // ============================================================
  // SAVE/LOAD CASES
  // ============================================================
  const handleSaveCase = () => {
    const caseId = patient.caseNo || generateCaseNo();
    const now = new Date().toISOString();
    const saved: SavedCase = {
      id: caseId,
      patient: { ...patient, caseNo: caseId },
      rubrics: selectedRubrics,
      results,
      createdAt: now,
      updatedAt: now,
      repertorizedAt: results.length > 0 ? now : null,
    };
    saveCase(saved);
    setPatient(prev => ({ ...prev, caseNo: caseId }));
    setError('Case saved successfully.');
    setTimeout(() => setError(''), 3000);
  };

  const handleOpenCase = (c: SavedCase) => {
    setPatient(c.patient);
    setSelectedRubrics(c.rubrics);
    setResults(c.results);
    setView('case');
  };

  const handleDeleteCase = (id: string) => {
    deleteCase(id);
    setCases(loadCases());
  };

  const handleNewCase = () => {
    clearAll();
    setPatient({
      patientName: '', caseNo: generateCaseNo(), age: '', sex: '',
      date: new Date().toISOString().split('T')[0], contact: '', notes: '',
    });
    setResults([]);
    setView('browse');
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (!session || loading) {
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
  // RENDER
  // ============================================================
  const enabledCount = selectedRubrics.filter(r => r.enabled).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 w-full px-3 md:px-6 py-4 md:py-6">

        {/* ===== HEADER ===== */}
        <header className="mb-4 md:mb-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-serif text-2xl md:text-3xl text-[#173B2D]">SYNTHESIS REPERTORY</h1>
            {/* Active case indicator */}
            {selectedRubrics.length > 0 && (
              <button
                onClick={() => setView('case')}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Case {patient.caseNo ? `#${patient.caseNo}` : 'Draft'} • {enabledCount} Rubrics
              </button>
            )}
          </div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#7C8F6E] mt-1">Updated Version by Dr. Pradip</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ===== DASHBOARD VIEW ===== */}
        {view === 'dashboard' && (
          <div>
            {/* Hero — matches uploaded design */}
            <div className="bg-[#173B2D] rounded-xl p-6 md:p-8 text-center mb-6">
              <h2 className="font-serif text-xl md:text-2xl text-[#C8A24A] mb-1">Synthesis Repertory</h2>
              <p className="text-sm text-stone-300">Professional Repertorization Engine</p>
              <p className="text-xs text-stone-400 mt-1">Updated by Dr Pradip</p>
            </div>

            {/* Stats Grid — 2x3 grid matching uploaded design */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Rubrics', value: stats.rubrics.toLocaleString(), icon: '📋' },
                { label: 'Remedies', value: stats.remedies.toLocaleString(), icon: '💊' },
                { label: 'Relationships', value: '1,156,961', icon: '🔗' },
                { label: 'Authors', value: '933', icon: '✍️' },
                { label: 'Chapters', value: stats.chapters, icon: '📖' },
                { label: 'Cross Refs', value: stats.crossRefs.toLocaleString(), icon: '🔀' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-lg font-bold text-[#173B2D]">{s.value}</div>
                  <div className="text-xs text-stone-500 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* New Repertorization button */}
            <button
              onClick={handleNewCase}
              className="w-full mb-4 px-6 py-3 bg-[#173B2D] text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#0f2a20] transition-colors"
            >
              + Start New Repertorization
            </button>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'How It Works', icon: '📚', onClick: () => setShowStepGuide(true), desc: '9-step workflow guide' },
                { label: 'Chapters', icon: '📖', view: 'browse' as const, desc: 'Browse rubric hierarchy' },
                { label: 'Search', icon: '🔍', view: 'search' as const, desc: 'Search 180K+ rubrics' },
                { label: `Case Paper${selectedRubrics.length > 0 ? ` (${enabledCount})` : ''}`, icon: '📋', view: 'case' as const, desc: 'Patient details & rubrics' },
                { label: `History (${loadCases().length})`, icon: '📂', view: 'history' as const, desc: 'Saved cases' },
                { label: 'Profile', icon: '👤', view: 'profile' as const, desc: 'Doctor/Clinic branding' },
                { label: 'Report', icon: '📄', onClick: () => results.length > 0 && setShowReport(true), desc: 'View repertorization report' },
                { label: 'New Case', icon: '➕', onClick: () => handleNewCase(), desc: 'Start fresh repertorization' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => item.onClick ? item.onClick() : setView(item.view)}
                  className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-all ${
                    item.label === 'How It Works'
                      ? 'border-[#C8A24A] hover:bg-[#FFF8E7] hover:border-[#C8A24A]'
                      : 'border-stone-200 hover:shadow-md hover:border-[#C8A24A]'
                  }`}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-sm font-semibold text-[#173B2D]">{item.label}</div>
                  <div className="text-xs text-stone-500">{item.desc}</div>
                </button>
              ))}
            </div>

            {/* Workflow Steps Preview */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-stone-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Workflow Steps</h3>
                <button
                  onClick={() => setShowStepGuide(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View Full Guide →
                </button>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {['🏠 Dashboard', '🔍 Search', '📋 Select', '📄 Case Paper', '⚙️ Repertorize', '📊 Results', '💊 Details', '🔄 Compare', '💾 Save'].map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1 flex-shrink-0">
                    <div className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-600 whitespace-nowrap">
                      {idx + 1}. {s}
                    </div>
                    {idx < 8 && <span className="text-stone-300 text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== BROWSE VIEW (Chapter → Rubric → Sub-rubric) ===== */}
        {view === 'browse' && (
          <div>
            {/* Step badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
              <span className="text-sm font-semibold text-[#173B2D]">Browse Chapters & Rubrics</span>
            </div>
            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-stone-200 flex items-center gap-1 text-sm overflow-x-auto">
                <button onClick={() => setView('dashboard')} className="text-stone-400 hover:text-[#173B2D]">≡</button>
                {breadcrumb.map((node, idx) => (
                  <div key={node.i} className="flex items-center gap-1">
                    <span className="text-stone-300">›</span>
                    <button
                      onClick={() => navigateToBreadcrumb(idx)}
                      className={`px-1.5 py-0.5 rounded hover:bg-stone-100 ${
                        idx === breadcrumb.length - 1 ? 'font-bold text-[#173B2D]' : 'text-stone-600'
                      }`}
                    >
                      {node.n}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* LEFT: Tree / Children */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-stone-200">
                <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">
                    {breadcrumb.length === 0 ? 'Select Chapter' : `Rubrics in ${breadcrumb[breadcrumb.length - 1].n}`}
                  </h2>
                  {breadcrumb.length > 0 && (
                    <button onClick={() => setBreadcrumb([])} className="text-xs text-blue-600 hover:underline">← All Chapters</button>
                  )}
                </div>
                <div className="p-3 max-h-[500px] overflow-y-auto">
                  {breadcrumb.length === 0 ? (
                    /* Chapter grid */
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {chapters.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => navigateToChapter(ch)}
                          className="p-3 border border-stone-200 rounded-lg text-left hover:bg-stone-50 hover:border-[#C8A24A] transition-all"
                        >
                          <div className="text-sm font-semibold text-[#173B2D]">{ch.name}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Children of current node */
                    (() => {
                      const currentNode = breadcrumb[breadcrumb.length - 1];
                      const children = treeChildren[currentNode.i];
                      const isLoading = loadingChildren.has(currentNode.i);
                      if (isLoading) return <div className="text-center py-4 text-sm text-stone-400">Loading rubrics...</div>;
                      if (!children) return <div className="text-center py-4 text-sm text-stone-400">No children loaded.</div>;
                      if (children.length === 0) return <div className="text-center py-4 text-sm text-stone-400">No sub-rubrics. This may be a terminal rubric.</div>;
                      return (
                        <div className="space-y-0.5">
                          {children.map(child => (
                            <div
                              key={child.i}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                activeRubric && getRubricId(activeRubric) === child.i ? 'bg-blue-50 border border-blue-300' : 'hover:bg-stone-50 border border-transparent'
                              }`}
                              onClick={() => navigateInto(child)}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleNode(child.i); }}
                                className="text-stone-400 text-xs w-4 hover:text-stone-600"
                              >
                                {treeChildren[child.i] ? (expandedNodes.has(child.i) ? '▼' : '▸') : '▸'}
                              </button>
                              <span className="text-sm flex-1 truncate text-[#173B2D]">{child.n}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); addRubricToCase(child); }}
                                className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                {selectedRubrics.some(r => r.symptomId === child.i) ? '✓ Added' : '+ Add'}
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* RIGHT: Rubric Remedies */}
              <div className="bg-white rounded-lg shadow-sm border border-stone-200">
                <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50">
                  <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Rubric Remedies</h2>
                </div>
                <div className="p-3 max-h-[500px] overflow-y-auto">
                  {!activeRubric ? (
                    <p className="text-sm text-stone-500 text-center py-8">Select a rubric to view remedies.</p>
                  ) : loadingRemedies ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-3 border-stone-200 border-t-[#173B2D] rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-stone-500">Loading remedies...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Current Rubric</div>
                        <div className="text-sm font-medium text-[#173B2D]">{getRubricPath(activeRubric)}</div>
                        <div className="text-xs text-stone-500 mt-1">
                          Remedies: {rubricRemedies[getRubricId(activeRubric)]?.total || 0}
                        </div>
                      </div>

                      <button
                        onClick={() => addRubricToCase(activeRubric)}
                        disabled={selectedRubrics.some(r => r.symptomId === getRubricId(activeRubric))}
                        className={`w-full mb-3 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                          selectedRubrics.some(r => r.symptomId === getRubricId(activeRubric))
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {selectedRubrics.some(r => r.symptomId === getRubricId(activeRubric)) ? '✓ Added to Case' : '+ Add to Case'}
                      </button>

                      {(() => {
                        const sid = getRubricId(activeRubric);
                        const data = rubricRemedies[sid];
                        if (!data || data.total === 0) {
                          return <p className="text-sm text-stone-500 text-center py-4">No verified remedy data for this rubric.</p>;
                        }
                        return (
                          <div className="space-y-2">
                            {[4, 3, 2, 1].map(grade => {
                              const remedies = data.byGrade[grade] || [];
                              if (remedies.length === 0) return null;
                              const colors = GRADE_COLORS[grade];
                              return (
                                <div key={grade} className={`border-l-4 ${colors.border} ${colors.bg} pl-3 py-2`}>
                                  <div className={`text-xs font-bold ${colors.text} uppercase tracking-wider mb-1.5`}>
                                    Grade {grade} ({remedies.length})
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {remedies.map(r => (
                                      <span
                                        key={r.abbrev}
                                        title={r.full}
                                        className={`px-2 py-0.5 bg-white border border-stone-200 rounded text-xs font-mono text-[#173B2D]`}
                                      >
                                        {r.abbrev}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Cross references */}
                      {crossRefs.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-200">
                          <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Cross References</div>
                          <div className="space-y-1">
                            {crossRefs.map(cr => (
                              <button
                                key={cr.id}
                                onClick={() => {
                                  const node: TreeNode = { i: cr.id, f: 0, n: cr.text, l: cr.dest_level, c: cr.dest_chapter_id, p: cr.dest_path };
                                  navigateInto(node);
                                }}
                                className="block text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                → {cr.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== SEARCH VIEW ===== */}
        {view === 'search' && (
          <div>
            {/* Step badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
              <span className="text-sm font-semibold text-[#173B2D]">Search Rubric</span>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search rubric, symptom or clinical term..."
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  autoFocus
                  className="flex-1 px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
                />
                <button onClick={() => performSearch(searchQuery)} className="px-6 py-2.5 bg-[#173B2D] text-white rounded-lg text-sm font-semibold hover:bg-[#0f2a20]">Search</button>
              </div>
              {searchQuery && <div className="mt-2 text-xs text-stone-500">{searching ? 'Searching...' : `${searchTotal} rubrics found`}</div>}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-stone-200">
              <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50">
                <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Search Results</h2>
              </div>
              <div className="p-3 max-h-[500px] overflow-y-auto">
                {searchResults.length === 0 && !searching && searchQuery ? (
                  <p className="text-sm text-stone-500 text-center py-8">No results. Try a different search term.</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-8">Start typing to search 180,386 rubrics.</p>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map(r => (
                      <div
                        key={r.id}
                        className={`flex items-center gap-2 p-2.5 border rounded cursor-pointer transition-colors ${
                          activeRubric && getRubricId(activeRubric) === r.id ? 'border-[#173B2D] bg-blue-50' : 'border-stone-200 hover:bg-stone-50'
                        }`}
                        onClick={() => {
                          setActiveRubric(r);
                          loadRubricRemedies(r.id);
                          loadCrossRefs(r.id);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#173B2D] truncate">{r.name}</div>
                          <div className="text-xs text-stone-500 truncate">{r.path}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addRubricToCase(r); }}
                          className={`px-2 py-1 text-xs rounded ${
                            selectedRubrics.some(sr => sr.symptomId === r.id) ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {selectedRubrics.some(sr => sr.symptomId === r.id) ? '✓' : '+ Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== CASE VIEW ===== */}
        {view === 'case' && !repertorizing && (
          <CasePaper
            patient={patient}
            rubrics={selectedRubrics}
            results={results}
            onPatientChange={setPatient}
            onRemoveRubric={removeRubric}
            onUpdateWeight={updateWeight}
            onToggleRubric={toggleRubric}
            onRepertorize={repertorize}
            onClearAll={clearAll}
            onSaveCase={handleSaveCase}
            repertorizing={repertorizing}
          />
        )}

        {/* ===== REPERTORIZATION PROGRESS VIEW (Step 4) ===== */}
        {view === 'case' && repertorizing && (
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden max-w-lg mx-auto">
            {/* Step header with blue badge */}
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">4</div>
              <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Repertorization in Progress</h2>
            </div>
            <div className="p-6 md:p-8">
              {/* Progress checklist */}
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Reading selected rubrics', done: true },
                  { label: 'Fetching remedy data', done: true },
                  { label: 'Reading remedy grades', done: true },
                  { label: 'Applying rubric weights', done: true },
                  { label: 'Calculating scores', done: true },
                  { label: 'Sorting remedies', done: false },
                  { label: 'Finalizing results', done: false },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.done ? 'bg-green-500 text-white' : 'bg-stone-200 text-stone-400'
                    }`}>
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-stone-700' : 'text-stone-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>

              {/* Circular progress */}
              <div className="flex flex-col items-center my-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45" fill="none" stroke="#173B2D" strokeWidth="8"
                      strokeDasharray="282.6" strokeDashoffset="70.65"
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#173B2D]">75%</span>
                  </div>
                </div>
                <p className="text-sm text-stone-500 mt-3">Please wait...</p>
                <p className="text-xs text-stone-400">Calculating best matches</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== RESULTS VIEW (Step 5) — shown when results are available ===== */}
        {view === 'case' && !repertorizing && results.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">5</div>
              <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Remedy Ranking</h2>
              <button
                onClick={() => setShowReport(true)}
                className="ml-auto px-3 py-1 text-xs bg-[#173B2D] text-white rounded font-semibold hover:bg-[#0f2a20]"
              >
                Report Preview
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold w-12">Rank</th>
                    <th className="border border-stone-200 px-3 py-2 text-left text-stone-600 font-semibold">Remedy</th>
                    <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Score</th>
                    <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Coverage</th>
                    <th className="border border-stone-200 px-3 py-2 text-center text-stone-600 font-semibold">Σ Sym</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 25).map((r, idx) => (
                    <tr key={r.abbrev} className={idx < 3 ? 'bg-stone-50' : 'hover:bg-stone-50'}>
                      <td className="border border-stone-200 px-3 py-2 text-center font-mono text-stone-500">{idx + 1}</td>
                      <td className="border border-stone-200 px-3 py-2">
                        <span className="font-mono font-bold text-[#173B2D]">{r.abbrev}</span>
                        <span className="text-stone-400 ml-1 text-xs">{r.full}</span>
                      </td>
                      <td className="border border-stone-200 px-3 py-2 text-center font-bold text-[#173B2D]">{r.totalScore}</td>
                      <td className="border border-stone-200 px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                        }`}>{r.coverage}</span>
                      </td>
                      <td className="border border-stone-200 px-3 py-2 text-center text-stone-600">{r.coverageCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Grade legend */}
            <div className="px-4 py-2 border-t border-stone-200 bg-stone-50 flex gap-3 flex-wrap text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Grade 4</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-700"></span> Grade 3</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-700"></span> Grade 2</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-stone-400"></span> Grade 1</span>
            </div>
          </div>
        )}

        {/* ===== HISTORY VIEW ===== */}
        {view === 'history' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-stone-200">
              <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Saved Cases</h2>
                <button onClick={() => setView('dashboard')} className="text-xs text-blue-600 hover:underline">← Back</button>
              </div>
              <div className="p-3">
                {(() => {
                  const allCases = loadCases();
                  if (allCases.length === 0) {
                    return <p className="text-sm text-stone-500 text-center py-8">No saved cases yet.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {allCases.map(c => (
                        <div key={c.id} className="p-3 border border-stone-200 rounded-lg hover:bg-stone-50">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[#173B2D]">{c.patient.patientName || 'Unknown Patient'}</div>
                              <div className="text-xs text-stone-500">
                                Case: {c.patient.caseNo} · {c.patient.age || '?'} yrs · {c.patient.sex || '?'} · {c.patient.date}
                              </div>
                              <div className="text-xs text-stone-400 mt-0.5">
                                {c.rubrics.length} rubrics · {c.results.length > 0 ? `${c.results.length} results` : 'Not repertorized'}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => handleOpenCase(c)} className="px-3 py-1 text-xs bg-[#173B2D] text-white rounded hover:bg-[#0f2a20]">Open</button>
                              <button onClick={() => handleDeleteCase(c.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">✕</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ===== PROFILE VIEW ===== */}
        {view === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg text-[#173B2D]">Report Profile / Clinic Profile</h2>
                <p className="text-xs text-stone-500">User-specific branding for Synthesis reports only</p>
              </div>
              <button onClick={() => setView('dashboard')} className="text-xs text-blue-600 hover:underline">← Back</button>
            </div>

            {/* Profile summary */}
            <div className="p-4 border border-stone-200 rounded-lg bg-stone-50 mb-4">
              <div className="flex items-start gap-4">
                {profile.logo && <img src={profile.logo} alt="" className="w-16 h-16 object-contain" />}
                <div className="flex-1">
                  {profile.doctorName ? <div className="text-sm font-semibold text-[#173B2D]">{profile.doctorName}</div> : <div className="text-sm text-stone-400">No doctor name set</div>}
                  {profile.qualification && <div className="text-xs text-stone-500">{profile.qualification}</div>}
                  {profile.clinicName && <div className="text-xs text-stone-600 mt-1">{profile.clinicName}</div>}
                  {profile.clinicAddress && <div className="text-xs text-stone-500">{profile.clinicAddress}</div>}
                  <div className="text-xs text-stone-400 mt-1">
                    {profile.phone && <span className="mr-2">📞 {profile.phone}</span>}
                    {profile.email && <span className="mr-2">✉ {profile.email}</span>}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileSettings(true)}
              className="px-5 py-2 bg-[#173B2D] text-white rounded-lg text-sm font-semibold hover:bg-[#0f2a20]"
            >
              Edit Profile
            </button>

            {results.length > 0 && (
              <button
                onClick={() => setShowReport(true)}
                className="ml-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Preview Report
              </button>
            )}
          </div>
        )}

      </main>

      {/* ===== BOTTOM NAVIGATION BAR (Synthesis-specific) ===== */}
      <div className="sticky bottom-0 z-20 bg-[#173B2D] border-t border-[#C8A24A]/30 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {[
            { label: 'Home', icon: '🏠', view: 'dashboard' as const, active: view === 'dashboard' },
            { label: 'Chapters', icon: '📖', view: 'browse' as const, active: view === 'browse' },
            { label: 'Search', icon: '🔍', view: 'search' as const, active: view === 'search' },
            { label: 'Case', icon: '📋', view: 'case' as const, active: view === 'case' },
            { label: 'More', icon: '⋯', view: 'history' as const, active: view === 'history' || view === 'profile' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                item.active ? 'text-[#C8A24A]' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[0.65rem] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {showProfileSettings && (
        <ProfileSettings
          onClose={() => setShowProfileSettings(false)}
          onSaved={(p) => setProfile(p)}
        />
      )}

      {showReport && results.length > 0 && (
        <ReportSheet
          patient={patient}
          rubrics={selectedRubrics}
          results={results}
          profile={profile}
          onClose={() => setShowReport(false)}
        />
      )}

      {showStepGuide && (
        <StepGuide
          onClose={() => setShowStepGuide(false)}
          onStartWorkflow={() => {
            setShowStepGuide(false);
            handleNewCase();
          }}
        />
      )}

      {/* ===== BACK TO TOP BUTTON ===== */}
      {view !== 'dashboard' && (
        <button
          onClick={() => setView('dashboard')}
          className="fixed bottom-4 right-4 px-3 py-2 bg-[#173B2D] text-white rounded-lg text-xs font-semibold shadow-lg hover:bg-[#0f2a20] z-30"
        >
          ← Dashboard
        </button>
      )}

      <Footer />

      {/* ===== PRINT STYLES ===== */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            padding: 15mm;
          }
          .no-print { display: none !important; }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
