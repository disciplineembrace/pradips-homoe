'use client';
/// ============================================================
/// SYNTHESIS REPERTORY — Upgraded Clinical Workspace
/// "Updated Version by Dr. Pradip"
/// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import {
  DoctorProfile, PatientDetails, SelectedRubric, RepertorizationResult,
  Chapter, TreeNode, SearchResult, CrossRef,
  loadProfile, loadActiveCase, saveActiveCase, clearActiveCase,
  loadCases, saveCase, deleteCase, loadCaseById, SavedCase,
  generateCaseNo, getRubricId, getRubricName, getRubricPath,
  GRADE_COLORS, PRINT_GRADE_COLORS,
} from './storage';
import { ProfileSettings } from './profile-settings';
import { CasePaper } from './case-paper';
import { ReportSheet } from './report-sheet';
import { StepGuide } from './step-guide';
import { EditCaseModal, DeleteConfirmDialog } from './case-actions';
import {
  SYNTH_COLORS, PageTitle, CaseBadge, WorkflowIndicator,
  GradeLegend, RemedyResultCard,
} from './synthesis-ui';
import { RubricTree } from './rubric-tree';
import { SynthesisCircle, LeafGrowth, SkeletonTable, EmptyState, WorkflowSteps, PulseDot, Icons } from './components';

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
  // Browse mode: 'tree' = recursive expand/collapse hierarchy view (new),
  // 'list' = single-level breadcrumb navigation (legacy). Default 'tree'
  // per the rubric-hierarchy spec. Tree state (expanded nodes, loaded
  // children) is preserved when toggling back, so the user's last-opened
  // branch is remembered.
  const [browseMode, setBrowseMode] = useState<'tree' | 'list'>('tree');
  // Chapter-level tree roots (for tree view): loaded once from the chapters
  // list and reused as the top-level nodes of the RubricTree.
  const [treeRoots, setTreeRoots] = useState<TreeNode[]>([]);

  // Active rubric (for remedy display)
  const [activeRubric, setActiveRubric] = useState<TreeNode | SearchResult | null>(null);
  const [rubricRemedies, setRubricRemedies] = useState<Record<number, { byGrade: Record<number, { abbrev: string; full: string }[]>; total: number }>>({});
  const [loadingRemedies, setLoadingRemedies] = useState(false);
  // Per-symptomId loading/failed flags — used by CasePaper to show
  // accurate "Loading remedy count..." / "Remedy count unavailable"
  // states on each selected-rubric card. We do NOT show 0 while
  // still loading or after a failed fetch.
  const [rubricRemedyLoadingMap, setRubricRemedyLoadingMap] = useState<Record<number, boolean>>({});
  const [rubricRemedyFailedMap, setRubricRemedyFailedMap] = useState<Record<number, boolean>>({});
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
  // SAVED-CASE ACTION STATE
  // (Edit / Share / Delete — Synthesis-only, scoped to history view)
  // ============================================================
  const [menuOpenCaseId, setMenuOpenCaseId] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<SavedCase | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [reportCase, setReportCase] = useState<SavedCase | null>(null);
  // Per-case loading state — key = `${caseId}:${action}` where action ∈ open|edit|share|delete|save
  const [caseActionLoading, setCaseActionLoading] = useState<Record<string, boolean>>({});
  // Lightweight toast: { type: 'success'|'error'|'info', msg: string, id: number }
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string; id: number } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, msg, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const setCaseAction = useCallback((caseId: string, action: string, loading: boolean) => {
    setCaseActionLoading(prev => {
      const next = { ...prev };
      const key = `${caseId}:${action}`;
      if (loading) next[key] = true; else delete next[key];
      return next;
    });
  }, []);

  const isCaseActionLoading = useCallback((caseId: string, action: string) => {
    return !!caseActionLoading[`${caseId}:${action}`];
  }, [caseActionLoading]);

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
      .then(d => {
        const chs = d.chapters || [];
        setChapters(chs);
        // Build tree roots (top-level nodes) for the recursive tree view.
        // Each chapter becomes a top-level TreeNode with f=0 (no parent).
        setTreeRoots(chs.map((c: Chapter) => ({
          i: c.id, f: 0, n: c.name, l: 1, c: c.id, p: c.path,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Load saved cases count for dashboard
    setCases(loadCases());
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
    setRubricRemedyLoadingMap(prev => ({ ...prev, [symptomId]: true }));
    setRubricRemedyFailedMap(prev => { const n = { ...prev }; delete n[symptomId]; return n; });
    try {
      const res = await fetch(`/api/synthesis?action=remedies&symptomId=${symptomId}`);
      if (!res.ok) throw new Error('remedy fetch failed');
      const d = await res.json();
      setRubricRemedies(prev => ({ ...prev, [symptomId]: { byGrade: d.byGrade || {}, total: d.total || 0 } }));
      // Update remedyCount on any already-selected rubric with this symptomId
      // so the case-paper UI shows the verified count.
      setSelectedRubrics(prev => prev.map(r => r.symptomId === symptomId ? { ...r, remedyCount: d.total || 0 } : r));
    } catch {
      setRubricRemedyFailedMap(prev => ({ ...prev, [symptomId]: true }));
    }
    setLoadingRemedies(false);
    setRubricRemedyLoadingMap(prev => { const n = { ...prev }; delete n[symptomId]; return n; });
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
    // If we haven't fetched remedy counts for this rubric yet, do so
    // now so the case-paper UI can display the verified count instead
    // of showing 0 while loading. The fetcher sets loading/failed maps.
    if (!rubricRemedies[symptomId]) {
      loadRubricRemedies(symptomId);
    }
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
    setCases(loadCases()); // Refresh cases state
    setPatient(prev => ({ ...prev, caseNo: caseId }));
    setError('Case saved successfully.');
    setTimeout(() => setError(''), 3000);
  };

  const handleOpenCase = (c: SavedCase) => {
    if (isCaseActionLoading(c.id, 'open')) return;
    setCaseAction(c.id, 'open', true);
    setMenuOpenCaseId(null);
    try {
      // Defensive validation — case ID must match and case must still exist.
      const fresh = loadCaseById(c.id);
      if (!fresh) {
        showToast('error', 'Unable to open this case. It may have been deleted.');
        setCaseAction(c.id, 'open', false);
        return;
      }
      setPatient(fresh.patient);
      setSelectedRubrics(fresh.rubrics);
      setResults(fresh.results);
      // Persist as active session case (does NOT create a duplicate saved case)
      saveActiveCase({ patient: fresh.patient, rubrics: fresh.rubrics, results: fresh.results });
      // Backfill remedy counts for any rubric that was saved with count 0
      // (e.g. older saved cases) — this does NOT modify the source DB,
      // only refreshes the user-owned saved case's display count.
      fresh.rubrics.forEach(r => {
        if (r.remedyCount === 0 && !rubricRemedies[r.symptomId]) {
          loadRubricRemedies(r.symptomId);
        }
      });
      showToast('success', `Case "${fresh.patient.patientName || 'Unknown Patient'}" loaded.`);
      setView('case');
    } catch {
      showToast('error', 'Unable to open this case. Please retry.');
    } finally {
      setCaseAction(c.id, 'open', false);
    }
  };

  // ============================================================
  // EDIT CASE — open editable modal for a saved case
  // ============================================================
  const handleEditCase = (c: SavedCase) => {
    setMenuOpenCaseId(null);
    const fresh = loadCaseById(c.id);
    if (!fresh) {
      showToast('error', 'Unable to edit this case. It may have been deleted.');
      return;
    }
    setEditingCase(fresh);
  };

  const handleSaveEditedCase = (updated: SavedCase) => {
    if (!editingCase) return;
    if (isCaseActionLoading(editingCase.id, 'save')) return;
    setCaseAction(editingCase.id, 'save', true);
    try {
      // Defensive validation — preserve id, createdAt, repertorizedAt from the original.
      const original = loadCaseById(editingCase.id);
      if (!original) {
        showToast('error', 'Unable to save. This case no longer exists.');
        setCaseAction(editingCase.id, 'save', false);
        return;
      }
      const sanitized: SavedCase = {
        ...updated,
        id: original.id, // ID cannot change — prevents duplicate creation
        createdAt: original.createdAt,
        updatedAt: new Date().toISOString(),
        repertorizedAt: original.repertorizedAt,
        // Patient caseNo stays locked to case id to avoid ID/link drift
        patient: { ...updated.patient, caseNo: original.patient.caseNo || original.id },
      };
      saveCase(sanitized);
      setCases(loadCases());
      setEditingCase(null);
      showToast('success', 'Case updated successfully.');
    } catch {
      showToast('error', 'Unable to save changes. Please retry.');
    } finally {
      setCaseAction(editingCase.id, 'save', false);
    }
  };

  // ============================================================
  // SHARE CASE — open the report sheet for this specific saved case
  // (PDF print + download + native mobile share handled by ReportSheet)
  // ============================================================
  const handleShareCase = (c: SavedCase) => {
    if (isCaseActionLoading(c.id, 'share')) return;
    setCaseAction(c.id, 'share', true);
    setMenuOpenCaseId(null);
    try {
      const fresh = loadCaseById(c.id);
      if (!fresh) {
        showToast('error', 'Unable to share this case. It may have been deleted.');
        setCaseAction(c.id, 'share', false);
        return;
      }
      if (!fresh.results || fresh.results.length === 0) {
        showToast('info', 'This case has no repertorization results to share yet. Open it and repertorize first.');
        setCaseAction(c.id, 'share', false);
        return;
      }
      // Brief "Preparing Case Report..." state — let user see the spinner briefly
      // before the modal opens, so the loading state is visible.
      setTimeout(() => {
        setReportCase(fresh);
        setCaseAction(c.id, 'share', false);
        showToast('success', 'Case report is ready to share.');
      }, 350);
    } catch {
      showToast('error', 'Unable to prepare the case report. Please retry.');
      setCaseAction(c.id, 'share', false);
    }
  };

  // ============================================================
  // DELETE CASE — two-step confirmation, single-submit guarded
  // ============================================================
  const handleRequestDelete = (c: SavedCase) => {
    setMenuOpenCaseId(null);
    setConfirmingDeleteId(c.id);
  };

  const handleConfirmDelete = () => {
    if (!confirmingDeleteId) return;
    if (isCaseActionLoading(confirmingDeleteId, 'delete')) return;
    setCaseAction(confirmingDeleteId, 'delete', true);
    try {
      // Defensive re-verification — case must still exist locally before delete.
      const fresh = loadCaseById(confirmingDeleteId);
      if (!fresh) {
        showToast('error', 'Unable to delete this case. It may have already been removed.');
        setCaseAction(confirmingDeleteId, 'delete', false);
        setConfirmingDeleteId(null);
        return;
      }
      deleteCase(confirmingDeleteId);
      setCases(loadCases());
      showToast('success', 'Saved case deleted successfully.');
    } catch {
      showToast('error', 'Unable to delete this case. Please retry.');
    } finally {
      setCaseAction(confirmingDeleteId, 'delete', false);
      setConfirmingDeleteId(null);
    }
  };

  const handleDeleteCase = (id: string) => {
    // Legacy direct-delete kept for backward compatibility — now routes through confirmation.
    setConfirmingDeleteId(id);
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
      <div className="min-h-screen flex flex-col bg-[#FAF8F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <SynthesisCircle text="Loading Synthesis Data..." />
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  const enabledCount = selectedRubrics.filter(r => r.enabled).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F2] synthesis-bg">
      <Navbar />
      <main className="flex-1 w-full px-3 md:px-6 py-4 md:py-6">

        {/* ===== HEADER ===== */}
        <header className="mb-4 md:mb-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-serif text-2xl md:text-3xl text-[#124C3B]">SYNTHESIS REPERTORY</h1>
            {/* Active case indicator — uses Synthesis palette (no bright blue) */}
            {selectedRubrics.length > 0 && (
              <button
                onClick={() => setView('case')}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: SYNTH_COLORS.success,
                  color: SYNTH_COLORS.primary,
                  border: '1px solid rgba(15, 74, 56, 0.18)',
                }}
              >
                <PulseDot color={SYNTH_COLORS.primary} /> Case {patient.caseNo ? `#${patient.caseNo}` : 'Draft'} • {enabledCount} Rubrics
              </button>
            )}
          </div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#6B7280] mt-1">Updated Version by Dr. Pradip</p>
          <div className="w-16 h-0.5 bg-[#C49A3A] mt-3"></div>
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
            {/* Workflow Steps */}
            <WorkflowSteps currentStep={1} />

            {/* Hero — premium clinical theme.
                NOTE: "Synthesis Repertory" title is already shown in the
                page <header> above (with gold underline + "Updated Version
                by Dr. Pradip"). We do NOT duplicate the title here per
                design spec. This hero is a compact clinical hero showing
                only the tagline + accent. */}
            <div className="bg-gradient-to-br from-[#124C3B] to-[#0B392D] rounded-xl p-5 md:p-7 mb-6 shadow-lg border border-[#C49A3A]/20">
              <div className="flex items-center gap-4">
                {/* Compact emblem */}
                <div className="w-14 h-14 rounded-full bg-[#C49A3A]/15 border border-[#C49A3A]/40 flex items-center justify-center flex-shrink-0">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C49A3A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8 6 6 10 6 14c0 4 2 8 6 8s6-4 6-8c0-4-2-8-6-12z" fill="#C49A3A" fillOpacity="0.25"/>
                    <path d="M12 6v14" stroke="#C49A3A" strokeWidth="1.2" opacity="0.6"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base text-stone-100 font-medium leading-snug">
                    Professional Repertorization Engine
                  </p>
                  <p className="text-xs text-[#C49A3A]/80 mt-1 uppercase tracking-[0.15em]">
                    Updated Version by Dr. Pradip
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid — 2x3 grid with SVG icons.
                White cards, ivory-cream border, gold accent on hover. */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Rubrics', value: stats.rubrics.toLocaleString(), Icon: Icons.Rubrics },
                { label: 'Remedies', value: stats.remedies.toLocaleString(), Icon: Icons.Remedies },
                { label: 'Relationships', value: '1,156,961', Icon: Icons.Relationships },
                { label: 'Authors', value: '933', Icon: Icons.Authors },
                { label: 'Chapters', value: stats.chapters, Icon: Icons.Chapters },
                { label: 'Cross Refs', value: stats.crossRefs.toLocaleString(), Icon: Icons.CrossRefs },
              ].map(s => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-[#DEDACF] p-4 text-center hover:border-[#C49A3A] hover:shadow-md transition-all"
                  style={{ boxShadow: '0 1px 3px rgba(15, 74, 56, 0.04)' }}
                >
                  <div className="flex justify-center mb-1.5"><s.Icon size={24} /></div>
                  <div className="text-xl font-bold text-[#124C3B] font-serif">{s.value}</div>
                  <div className="text-[0.65rem] text-[#778078] uppercase tracking-[0.12em] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* New Repertorization button — primary action */}
            <button
              onClick={handleNewCase}
              className="w-full mb-4 px-6 py-3.5 bg-[#124C3B] text-white rounded-xl text-sm font-bold uppercase tracking-[0.12em] hover:bg-[#0B392D] active:scale-[0.99] transition-all shadow-sm"
            >
              + Start New Repertorization
            </button>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'How It Works', Icon: Icons.HowItWorks, onClick: () => setShowStepGuide(true), desc: '9-step workflow guide' },
                { label: 'Chapters', Icon: Icons.Chapters, view: 'browse' as const, desc: 'Browse rubric hierarchy' },
                { label: 'Search', Icon: Icons.Search, view: 'search' as const, desc: 'Search 180K+ rubrics' },
                { label: `Case Paper${selectedRubrics.length > 0 ? ` (${enabledCount})` : ''}`, Icon: Icons.Case, view: 'case' as const, desc: 'Patient details & rubrics' },
                { label: `History (${cases.length})`, Icon: Icons.History, view: 'history' as const, desc: 'Saved cases' },
                { label: 'Profile', Icon: Icons.Profile, view: 'profile' as const, desc: 'Doctor/Clinic branding' },
                { label: 'Report', Icon: Icons.Report, onClick: () => results.length > 0 && setShowReport(true), desc: 'View repertorization report' },
                { label: 'New Case', Icon: Icons.NewCase, onClick: () => handleNewCase(), desc: 'Start fresh repertorization' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => item.onClick ? item.onClick() : setView(item.view)}
                  className={`bg-white rounded-2xl border p-4 text-left transition-all ${
                    item.label === 'How It Works'
                      ? 'border-[#C49A3A]/50 hover:bg-[#FAF8F2] hover:border-[#C49A3A]'
                      : 'border-[#DEDACF] hover:shadow-md hover:border-[#C49A3A]/60'
                  }`}
                  style={{ boxShadow: '0 1px 3px rgba(15, 74, 56, 0.04)' }}
                >
                  <div className="mb-1.5"><item.Icon size={24} /></div>
                  <div className="text-sm font-semibold text-[#124C3B]">{item.label}</div>
                  <div className="text-xs text-[#778078] mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>

            {/* Workflow Steps Preview */}
            <div
              className="mt-6 bg-white rounded-2xl border p-4"
              style={{ borderColor: SYNTH_COLORS.border, boxShadow: '0 1px 3px rgba(15, 74, 56, 0.04)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#124C3B] uppercase tracking-[0.12em]">Workflow Steps</h3>
                <button
                  onClick={() => setShowStepGuide(true)}
                  className="text-xs hover:underline font-semibold"
                  style={{ color: SYNTH_COLORS.primary }}
                >
                  View Full Guide →
                </button>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {['🏠 Dashboard', '🔍 Search', '📋 Select', '📄 Case Paper', '⚙️ Repertorize', '📊 Results', '💊 Details', '🔄 Compare', '💾 Save'].map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1 flex-shrink-0">
                    <div
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: '#FAF8F2',
                        border: `1px solid ${SYNTH_COLORS.border}`,
                        color: SYNTH_COLORS.text,
                      }}
                    >
                      {idx + 1}. {s}
                    </div>
                    {idx < 8 && <span className="text-[#C49A3A]/60 text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== BROWSE VIEW (Chapter → Rubric → Sub-rubric) ===== */}
        {view === 'browse' && (
          <div>
            {/* Step badge + view-mode toggle */}
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }}>1</div>
                <span className="text-sm font-semibold" style={{ color: SYNTH_COLORS.primary }}>Browse Chapters & Rubrics</span>
              </div>
              {/* Tree / List mode toggle — preserves all state when switching */}
              <div
                className="inline-flex rounded-md overflow-hidden border"
                style={{ border: `1px solid ${SYNTH_COLORS.border}` }}
              >
                <button
                  type="button"
                  onClick={() => setBrowseMode('tree')}
                  className="px-3 py-1 text-xs font-semibold transition-colors"
                  style={
                    browseMode === 'tree'
                      ? { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }
                      : { backgroundColor: '#FFFFFF', color: SYNTH_COLORS.textSecondary }
                  }
                  title="Recursive tree view with expand/collapse (unlimited hierarchy depth)"
                >
                  🌳 Tree View
                </button>
                <button
                  type="button"
                  onClick={() => setBrowseMode('list')}
                  className="px-3 py-1 text-xs font-semibold transition-colors"
                  style={
                    browseMode === 'list'
                      ? { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }
                      : { backgroundColor: '#FFFFFF', color: SYNTH_COLORS.textSecondary }
                  }
                  title="Single-level breadcrumb navigation (legacy)"
                >
                  📋 List View
                </button>
              </div>
            </div>

            {/* ===== TREE VIEW — recursive, lazy-loaded, unlimited depth ===== */}
            {browseMode === 'tree' && (
              <div
                className="rounded-xl bg-white shadow-sm overflow-hidden"
                style={{ border: `1px solid ${SYNTH_COLORS.border}` }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center justify-between gap-2"
                  style={{
                    borderColor: SYNTH_COLORS.border,
                    backgroundColor: '#FBFAF6',
                  }}
                >
                  <div>
                    <h2
                      className="text-sm font-bold uppercase tracking-wider"
                      style={{ color: SYNTH_COLORS.primary }}
                    >
                      Rubric Hierarchy — Full Tree
                    </h2>
                    <div
                      className="mt-1 h-[2px] w-12"
                      style={{ backgroundColor: SYNTH_COLORS.gold }}
                    />
                    <p className="text-xs mt-1.5" style={{ color: SYNTH_COLORS.textSecondary }}>
                      Tap ▶ to expand any rubric and reveal unlimited nested sub-rubrics. Tap <strong>Remedies</strong> to view grade-wise remedies for any rubric.
                    </p>
                  </div>
                </div>
                <div className="p-2 max-h-[600px] overflow-y-auto">
                  <RubricTree
                    nodes={treeRoots}
                    expandedNodes={expandedNodes}
                    treeChildren={treeChildren}
                    loadingChildren={loadingChildren}
                    rubricRemedies={rubricRemedies}
                    rubricRemedyLoadingMap={rubricRemedyLoadingMap}
                    rubricRemedyFailedMap={rubricRemedyFailedMap}
                    selectedRubrics={selectedRubrics}
                    onToggleExpand={toggleNode}
                    onLoadChildren={loadChildren}
                    onLoadRemedies={loadRubricRemedies}
                    onAddRubric={addRubricToCase}
                    onNavigateInto={navigateInto}
                    sourceRepertory="Synthesis"
                  />
                </div>
              </div>
            )}

            {/* Breadcrumb (only used in List View mode) */}
            {browseMode === 'list' && breadcrumb.length > 0 && (
              <div className="mb-3 p-2 bg-white rounded-lg border border-stone-200 flex items-center gap-1 text-sm overflow-x-auto">
                <button onClick={() => setView('dashboard')} className="text-stone-400 hover:text-[#124C3B]">≡</button>
                {breadcrumb.map((node, idx) => (
                  <div key={node.i} className="flex items-center gap-1">
                    <span className="text-stone-300">›</span>
                    <button
                      onClick={() => navigateToBreadcrumb(idx)}
                      className={`px-1.5 py-0.5 rounded hover:bg-stone-100 ${
                        idx === breadcrumb.length - 1 ? 'font-bold text-[#124C3B]' : 'text-stone-600'
                      }`}
                    >
                      {node.n}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ===== LIST VIEW — single-level breadcrumb navigation (legacy) ===== */}
            {browseMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* LEFT: Tree / Children */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-stone-200">
                <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#124C3B] uppercase tracking-wider">
                    {breadcrumb.length === 0 ? 'Select Chapter' : `Rubrics in ${breadcrumb[breadcrumb.length - 1].n}`}
                  </h2>
                  {breadcrumb.length > 0 && (
                    <button onClick={() => setBreadcrumb([])} className="text-xs hover:underline" style={{ color: SYNTH_COLORS.primary }}>← All Chapters</button>
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
                          className="p-3 border border-stone-200 rounded-lg text-left hover:bg-stone-50 hover:border-[#C49A3A] transition-all"
                        >
                          <div className="text-sm font-semibold text-[#124C3B]">{ch.name}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Children of current node */
                    (() => {
                      const currentNode = breadcrumb[breadcrumb.length - 1];
                      const children = treeChildren[currentNode.i];
                      const isLoading = loadingChildren.has(currentNode.i);
                      if (isLoading) return <div className="py-2"><LeafGrowth text="Loading Chapters..." /></div>;
                      if (!children) return <div className="text-center py-4 text-sm text-stone-400">No children loaded.</div>;
                      if (children.length === 0) return <div className="text-center py-4 text-sm text-stone-400">No sub-rubrics. This may be a terminal rubric.</div>;
                      return (
                        <div className="space-y-0.5">
                          {children.map(child => (
                            <div
                              key={child.i}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                activeRubric && getRubricId(activeRubric) === child.i ? 'bg-[#EAF4EF] border border-[#124C3B]' : 'hover:bg-stone-50 border border-transparent'
                              }`}
                              onClick={() => navigateInto(child)}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleNode(child.i); }}
                                className="text-stone-400 text-xs w-4 hover:text-stone-600"
                              >
                                {treeChildren[child.i] ? (expandedNodes.has(child.i) ? '▼' : '▸') : '▸'}
                              </button>
                              <span className="text-sm flex-1 truncate text-[#124C3B]">{child.n}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); addRubricToCase(child); }}
                                className="px-2 py-0.5 text-xs text-white rounded" style={{ backgroundColor: SYNTH_COLORS.primary }}
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
                  <h2 className="text-sm font-semibold text-[#124C3B] uppercase tracking-wider">Rubric Remedies</h2>
                </div>
                <div className="p-3 max-h-[500px] overflow-y-auto">
                  {!activeRubric ? (
                    <EmptyState icon="💊" title="No Rubric Selected" message="Select a rubric to view its remedies and grades." />
                  ) : loadingRemedies ? (
                    <SynthesisCircle text="Loading Remedies and Grades..." />
                  ) : (
                    <div>
                      <div className="mb-3 p-3 rounded" style={{ backgroundColor: SYNTH_COLORS.success, border: '1px solid rgba(15, 74, 56, 0.2)' }}>
                        <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Current Rubric</div>
                        <div className="text-sm font-medium text-[#124C3B]">{getRubricPath(activeRubric)}</div>
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
                            : ''
                        }`}
                        style={!selectedRubrics.some(r => r.symptomId === getRubricId(activeRubric)) ? { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' } : undefined}
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
                                        className={`px-2 py-0.5 bg-white border border-stone-200 rounded text-xs font-mono text-[#124C3B]`}
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
                                className="block text-left text-xs hover:underline" style={{ color: SYNTH_COLORS.primary }}
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
            )} {/* end List View mode */}
          </div>
        )}

        {/* ===== SEARCH VIEW ===== */}
        {view === 'search' && (
          <div>
            {/* Step badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }}>2</div>
              <span className="text-sm font-semibold text-[#124C3B]">Search Rubric</span>
            </div>
            <div
              className="bg-white rounded-xl border p-4 mb-4"
              style={{ borderColor: SYNTH_COLORS.border, boxShadow: '0 1px 3px rgba(15, 74, 56, 0.04)' }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search rubric, symptom or clinical term..."
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  autoFocus
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${SYNTH_COLORS.border}`,
                    color: SYNTH_COLORS.text,
                  }}
                />
                <button
                  onClick={() => performSearch(searchQuery)}
                  className="px-6 py-2.5 bg-[#124C3B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B392D] transition-colors"
                >
                  Search
                </button>
              </div>
              {searchQuery && (
                <div className="mt-2 text-xs" style={{ color: SYNTH_COLORS.textSecondary }}>
                  {searching ? 'Searching...' : `${searchTotal} rubrics found`}
                </div>
              )}
            </div>

            <div
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: SYNTH_COLORS.border, boxShadow: '0 1px 3px rgba(15, 74, 56, 0.04)' }}
            >
              <div
                className="px-4 py-2.5 border-b flex items-center justify-between gap-2"
                style={{ borderColor: SYNTH_COLORS.border, backgroundColor: '#FBFAF6' }}
              >
                <div>
                  <h2
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: SYNTH_COLORS.primary }}
                  >
                    Search Results
                  </h2>
                  <div
                    className="mt-1 h-[2px] w-10"
                    style={{ backgroundColor: SYNTH_COLORS.gold }}
                  />
                </div>
              </div>
              <div className="p-3 max-h-[500px] overflow-y-auto">
                {searchResults.length === 0 && !searching && searchQuery ? (
                  <EmptyState icon="🔍" title="No Rubrics Found" message="Try a different search term or browse chapters instead." />
                ) : searchResults.length === 0 ? (
                  <EmptyState icon="🔍" title="Search Rubrics" message="Start typing to search 180,386 rubrics across all chapters." />
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.map(r => {
                      const alreadyAdded = selectedRubrics.some(sr => sr.symptomId === r.id);
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                            activeRubric && getRubricId(activeRubric) === r.id
                              ? 'border-[#124C3B] bg-[#EAF4EF]'
                              : 'border-[#DEDACF] hover:bg-[#FAF8F2] hover:border-[#124C3B]/40'
                          }`}
                          onClick={() => {
                            setActiveRubric(r);
                            loadRubricRemedies(r.id);
                            loadCrossRefs(r.id);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#124C3B] truncate">{r.name}</div>
                            <div className="text-xs text-[#778078] truncate">{r.path}</div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); addRubricToCase(r); }}
                            className="px-2.5 py-1 text-xs rounded font-semibold transition-colors flex-shrink-0"
                            style={
                              alreadyAdded
                                ? { backgroundColor: '#EAF4EF', color: SYNTH_COLORS.primary, border: `1px solid ${SYNTH_COLORS.primary}` }
                                : { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }
                            }
                          >
                            {alreadyAdded ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
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
            onViewRemedies={(symptomId) => {
              // Find the rubric in the current tree/search results and open
              // the remedies panel by setting it as the active rubric.
              // If we can't find the original object, construct a minimal
              // SearchResult-like object from the selected rubric.
              const sr = selectedRubrics.find(r => r.symptomId === symptomId);
              if (!sr) return;
              setActiveRubric({
                id: sr.symptomId,
                name: sr.name,
                path: sr.path,
                level: sr.level,
                chapterId: sr.chapterId,
                fatherId: 0,
              } as SearchResult);
              // Ensure remedy data is loaded
              loadRubricRemedies(sr.symptomId);
              loadCrossRefs(sr.symptomId);
              // Switch to browse view so the remedies panel is visible
              setView('browse');
            }}
            repertorizing={repertorizing}
            rubricRemedyLoading={rubricRemedyLoadingMap}
            rubricRemedyFailed={rubricRemedyFailedMap}
          />
        )}

        {/* ===== REPERTORIZATION PROGRESS VIEW (Step 4) ===== */}
        {view === 'case' && repertorizing && (
          <div
            className="bg-white rounded-2xl border overflow-hidden max-w-lg mx-auto"
            style={{ borderColor: SYNTH_COLORS.border, boxShadow: '0 1px 3px rgba(15, 74, 56, 0.04)' }}
          >
            {/* Step header with dark green badge */}
            <div
              className="px-4 py-3 border-b flex items-center gap-2"
              style={{ borderColor: SYNTH_COLORS.border, backgroundColor: '#FBFAF6' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }}
              >
                4
              </div>
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: SYNTH_COLORS.primary }}
              >
                Repertorization in Progress
              </h2>
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
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={
                        step.done
                          ? { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }
                          : { backgroundColor: '#F3F1EA', color: SYNTH_COLORS.textSecondary, border: `1px solid ${SYNTH_COLORS.border}` }
                      }
                    >
                      {step.done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className="text-sm"
                      style={{ color: step.done ? SYNTH_COLORS.text : SYNTH_COLORS.textSecondary }}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Circular progress */}
              <div className="flex flex-col items-center my-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45" fill="none" stroke={SYNTH_COLORS.primary} strokeWidth="8"
                      strokeDasharray="282.6" strokeDashoffset="70.65"
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#124C3B]">75%</span>
                  </div>
                </div>
                <p className="text-sm mt-3" style={{ color: SYNTH_COLORS.textSecondary }}>Please wait...</p>
                <p className="text-xs" style={{ color: SYNTH_COLORS.textSecondary }}>Calculating Verified Results...</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== RESULTS VIEW — shown when results are available ===== */}
        {view === 'case' && !repertorizing && results.length > 0 && (
          <div className="space-y-4">
            {/* Page title row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <PageTitle compact />
                <div className="mt-1">
                  <CaseBadge caseNo={patient.caseNo} rubricCount={selectedRubrics.length} />
                </div>
              </div>
            </div>

            {/* Workflow indicator — Step 3 (Results) active */}
            <WorkflowIndicator currentStep={3} />

            {/* Results header + Report Preview */}
            <div
              className="rounded-xl bg-white shadow-sm overflow-hidden"
              style={{ border: `1px solid ${SYNTH_COLORS.border}` }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between gap-2"
                style={{
                  borderColor: SYNTH_COLORS.border,
                  backgroundColor: '#FBFAF6',
                }}
              >
                <div>
                  <h2
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: SYNTH_COLORS.primary }}
                  >
                    Result — Remedy Ranking
                  </h2>
                  <div
                    className="mt-1 h-[2px] w-12"
                    style={{ backgroundColor: SYNTH_COLORS.gold }}
                  />
                </div>
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: SYNTH_COLORS.primary,
                    color: '#FFFFFF',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Report Preview
                </button>
              </div>

              {/* Mobile-friendly remedy cards (Top 10) */}
              <div className="p-3 space-y-2">
                <p className="text-xs mb-2" style={{ color: SYNTH_COLORS.textSecondary }}>
                  Top {Math.min(10, results.length)} remedies — sorted by verified repertorization score.
                </p>
                {results.slice(0, 10).map((r, idx) => (
                  <RemedyResultCard
                    key={r.abbrev}
                    rank={idx + 1}
                    abbrev={r.abbrev}
                    full={r.full}
                    score={r.totalScore}
                    coverageCount={r.coverageCount}
                    coverageTotal={r.coverageTotal}
                    coverageLabel={r.coverage}
                    rubricCount={r.coverageCount}
                    onClick={() => {
                      // Open the existing ReportSheet which contains the
                      // detailed analysis (grade contribution, covered/missing
                      // rubrics, etc.). The report preview already includes
                      // Top 10 remedies with grade breakdowns.
                      setShowReport(true);
                    }}
                  />
                ))}
              </div>

              {/* Grade legend — shown because grade colors appear in the
                  report detail view (which opens from any result card). */}
              <div className="px-3 pb-3">
                <GradeLegend />
              </div>
            </div>

            {/* Save Case + Start New (secondary actions) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveCase}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: SYNTH_COLORS.primary,
                  border: `1.5px solid ${SYNTH_COLORS.primary}`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Case
              </button>
              <button
                onClick={handleNewCase}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: SYNTH_COLORS.primary,
                  color: '#FFFFFF',
                  border: `1.5px solid ${SYNTH_COLORS.primary}`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5v14" />
                </svg>
                New Case
              </button>
            </div>
          </div>
        )}

        {/* ===== HISTORY VIEW ===== */}
        {view === 'history' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-stone-200">
              <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#124C3B] uppercase tracking-wider">Saved Cases</h2>
                <button onClick={() => setView('dashboard')} className="text-xs hover:underline" style={{ color: SYNTH_COLORS.primary }}>← Back</button>
              </div>
              <div className="p-3">
                {(() => {
                  const allCases = cases;
                  if (allCases.length === 0) {
                    return <EmptyState icon="📂" title="No Case History" message="Your saved repertorization cases will appear here." actionLabel="Start New Case" onAction={() => handleNewCase()} />;
                  }
                  return (
                    <div className="space-y-2">
                      {allCases.map(c => {
                        const openLoading = isCaseActionLoading(c.id, 'open');
                        const shareLoading = isCaseActionLoading(c.id, 'share');
                        const deleteLoading = isCaseActionLoading(c.id, 'delete');
                        const saveLoading = isCaseActionLoading(c.id, 'save');
                        const anyLoading = openLoading || shareLoading || deleteLoading || saveLoading;
                        return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border bg-white hover:bg-[#FAF8F2] relative transition-colors"
                      style={{ borderColor: SYNTH_COLORS.border }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#124C3B]">{c.patient.patientName || 'Unknown Patient'}</div>
                          <div className="text-xs text-[#778078]">
                            Case: {c.patient.caseNo} · {c.patient.age || '?'} yrs · {c.patient.sex || '?'} · {c.patient.date}
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5">
                            {c.rubrics.length} rubrics · {c.results.length > 0 ? `${c.results.length} results` : 'Not repertorized'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* OPEN — primary action, always visible */}
                          <button
                            onClick={() => handleOpenCase(c)}
                            disabled={anyLoading}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#124C3B] text-white rounded-md hover:bg-[#0B392D] disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px] transition-colors"
                            title="Open case"
                          >
                            {openLoading ? (
                              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Icons.Eye size={14} className="text-white" />
                            )}
                            <span>Open</span>
                          </button>
                          {/* ⋮ MORE — opens Edit / Share / Delete dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpenCaseId(menuOpenCaseId === c.id ? null : c.id)}
                              disabled={anyLoading}
                              className="flex items-center justify-center w-8 h-8 text-[#778078] hover:bg-[#FAF8F2] rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="More actions"
                              aria-label="More actions"
                            >
                              <Icons.MoreVertical size={16} className="text-[#778078]" />
                            </button>
                            {menuOpenCaseId === c.id && (
                              <>
                                {/* Click-away overlay */}
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setMenuOpenCaseId(null)}
                                />
                                {/* Dropdown menu */}
                                <div
                                  className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-md shadow-lg z-50 overflow-hidden"
                                  style={{ borderColor: SYNTH_COLORS.border }}
                                >
                                  <button
                                    onClick={() => handleEditCase(c)}
                                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-[#FAF8F2] text-left transition-colors"
                                    style={{ color: SYNTH_COLORS.text }}
                                  >
                                    <Icons.Pencil size={14} className="text-[#778078]" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleShareCase(c)}
                                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-[#FAF8F2] text-left transition-colors"
                                    style={{ color: SYNTH_COLORS.text }}
                                  >
                                    <Icons.Share size={14} className="text-[#778078]" />
                                    <span>Share</span>
                                  </button>
                                  <div className="border-t" style={{ borderColor: SYNTH_COLORS.border }} />
                                  <button
                                    onClick={() => handleRequestDelete(c)}
                                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-red-50 text-left transition-colors"
                                    style={{ color: SYNTH_COLORS.delete }}
                                  >
                                    <Icons.Trash size={14} className="text-[#C83B3B]" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Inline loading indicator for share/save (so user sees feedback even before modal opens) */}
                      {(shareLoading || saveLoading) && (
                        <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center z-10 pointer-events-none">
                          <div
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md shadow-sm"
                            style={{ borderColor: SYNTH_COLORS.border }}
                          >
                            <span className="inline-block w-3 h-3 border-2 border-[#124C3B]/30 border-t-[#124C3B] rounded-full animate-spin" />
                            <span className="text-xs text-[#243A32] font-medium">
                              {shareLoading ? 'Preparing Case Report...' : 'Saving Changes...'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ===== PROFILE VIEW ===== */}
        {view === 'profile' && (
          <div
            className="bg-white rounded-2xl border p-6"
            style={{ borderColor: SYNTH_COLORS.border, boxShadow: '0 1px 3px rgba(15, 74, 56, 0.04)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg text-[#124C3B]">Report Profile / Clinic Profile</h2>
                <p className="text-xs text-[#778078]">User-specific branding for Synthesis reports only</p>
              </div>
              <button
                onClick={() => setView('dashboard')}
                className="text-xs hover:underline font-semibold"
                style={{ color: SYNTH_COLORS.primary }}
              >
                ← Back
              </button>
            </div>

            {/* Profile summary */}
            <div
              className="p-4 rounded-xl mb-4"
              style={{
                backgroundColor: '#FBFAF6',
                border: `1px solid ${SYNTH_COLORS.border}`,
              }}
            >
              <div className="flex items-start gap-4">
                {profile.logo && <img src={profile.logo} alt="" className="w-16 h-16 object-contain" />}
                <div className="flex-1">
                  {profile.doctorName
                    ? <div className="text-sm font-semibold text-[#124C3B]">{profile.doctorName}</div>
                    : <div className="text-sm text-[#9CA3AF]">No doctor name set</div>}
                  {profile.qualification && <div className="text-xs text-[#778078]">{profile.qualification}</div>}
                  {profile.clinicName && <div className="text-xs text-[#243A32] mt-1">{profile.clinicName}</div>}
                  {profile.clinicAddress && <div className="text-xs text-[#778078]">{profile.clinicAddress}</div>}
                  <div className="text-xs text-[#9CA3AF] mt-1">
                    {profile.phone && <span className="mr-2">📞 {profile.phone}</span>}
                    {profile.email && <span className="mr-2">✉ {profile.email}</span>}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileSettings(true)}
              className="px-5 py-2 bg-[#124C3B] text-white rounded-lg text-sm font-semibold hover:bg-[#0B392D] transition-colors"
            >
              Edit Profile
            </button>

            {results.length > 0 && (
              <button
                onClick={() => setShowReport(true)}
                className="ml-2 px-5 py-2 text-white rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: SYNTH_COLORS.primary }}
              >
                Preview Report
              </button>
            )}
          </div>
        )}

      </main>

      {/* ===== BOTTOM NAVIGATION BAR (Synthesis-specific) =====
          Per spec:
          - Background: #124C3B (primary dark green)
          - Inactive: soft neutral text
          - Active: gold accent + small gold indicator above icon */}
      <div className="sticky bottom-0 z-20 bg-[#124C3B] border-t border-[#C49A3A]/30 lg:hidden">
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
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: item.active ? '#C49A3A' : '#9CA3AF' }}
            >
              {/* Small gold top-indicator for active item */}
              {item.active && (
                <span
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                  style={{ backgroundColor: '#C49A3A' }}
                />
              )}
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

      {/* ===== EDIT CASE MODAL — Synthesis-only ===== */}
      {editingCase && (
        <EditCaseModal
          caseData={editingCase}
          saving={isCaseActionLoading(editingCase.id, 'save')}
          onSave={handleSaveEditedCase}
          onCancel={() => setEditingCase(null)}
        />
      )}

      {/* ===== DELETE CONFIRMATION DIALOG — Synthesis-only ===== */}
      {confirmingDeleteId && (
        <DeleteConfirmDialog
          caseId={confirmingDeleteId}
          deleting={isCaseActionLoading(confirmingDeleteId, 'delete')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDeleteId(null)}
        />
      )}

      {/* ===== SHARE REPORT MODAL — opens ReportSheet for the selected saved case ===== */}
      {reportCase && (
        <ReportSheet
          patient={reportCase.patient}
          rubrics={reportCase.rubrics}
          results={reportCase.results}
          profile={profile}
          onClose={() => setReportCase(null)}
        />
      )}

      {/* ===== TOAST — Synthesis-only feedback messages ===== */}
      {toast && (
        <div
          key={toast.id}
          className={`fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium max-w-[90vw] text-center no-print-toast ${
            toast.type === 'success'
              ? 'bg-[#124C3B] text-white'
              : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-stone-800 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

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
          /* Synthesis-only: hide toast + saved-case action UI from printed/shared PDFs */
          .no-print-toast { display: none !important; }
          @page {
            size: A4;
            margin: 10mm;
          }
        }

        /* Subtle botanical background pattern for Synthesis section only */
        .synthesis-bg {
          background-image:
            radial-gradient(circle at 20% 50%, rgba(30, 107, 82, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(15, 61, 46, 0.02) 0%, transparent 50%);
          background-attachment: fixed;
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .synthesis-bg * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
