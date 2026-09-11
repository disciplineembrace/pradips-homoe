'use client';
/// ============================================================
/// Kent Repertory — Mobile-First Tree View UI
/// Rebuilt to match reference image design.
///
/// Features:
///   • Mobile-first cream/green theme
///   • Tree View ONLY (no List View)
///   • Chapter selector with dynamic counts
///   • Search rubrics
///   • Expandable/collapsible hierarchy
///   • Complete rubric path in detail card
///   • Remedies with grades
///   • Single Remedy Rubric badge
///   • Cross-reference support
///   • Source page reference
/// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';
import { GRADE_DISPLAY_MAP } from '@/lib/repertory-grades';

type KentEntry = {
  id: string;
  chapter: string;
  level: number;
  rubricText: string;
  fullPath: string;
  fullPathParts: string[];
  entryType: string;
  crossReference: string | null;
  remedies: string[];
  remediesGraded: { abbrev: string; grade: number }[];
  remedyCount: number;
  singleRemedy: boolean;
  pdfPage: number;
};

type TreeNode = KentEntry & {
  children: TreeNode[];
  expanded: boolean;
};

export default function RepertoryPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [allKent, setAllKent] = useState<KentEntry[]>([]);
  const [chapters, setChapters] = useState<{ name: string; count: number }[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('MIND');
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedRubric, setSelectedRubric] = useState<KentEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KentEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalRubrics, setTotalRubrics] = useState(0);
  const [crossRefHistory, setCrossRefHistory] = useState<KentEntry[]>([]);
  const [crossRefStatus, setCrossRefStatus] = useState<'resolved' | 'ambiguous' | 'unresolved' | null>(null);
  const reader = useReaderFeatures();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      setSession(d);
    });
  }, [router]);

  useEffect(() => {
    if (reader?.favorites) {
      setSavedIds(new Set(reader.favorites.filter((f: any) => f.type === 'rubric').map((f: any) => f.id)));
    }
  }, [reader]);

  // Load Kent data
  useEffect(() => {
    if (!session) return;
    fetch('/api/rubrics?author=Kent&pageSize=100')
      .then(r => r.json())
      .then(d => {
        // Load full Kent data from the built file
        fetch('/api/kent-tree')
          .then(r => r.json())
          .then(data => {
            setAllKent(data.entries || []);
            setTotalRubrics(data.total || 0);
            const chCounts: Record<string, number> = {};
            for (const e of data.entries || []) {
              const ch = e.chapter;
              if (ch) chCounts[ch] = (chCounts[ch] || 0) + 1;
            }
            const chList = Object.entries(chCounts)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count);
            setChapters(chList);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [session]);

  // Build tree for selected chapter
  useEffect(() => {
    if (!allKent.length) return;
    const chapterEntries = allKent.filter(e => e.chapter === selectedChapter);
    const treeNodes = buildTree(chapterEntries);
    setTree(treeNodes);
  }, [allKent, selectedChapter]);

  // Search
  const performSearch = useCallback((q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const lower = q.toLowerCase();
    const results = allKent.filter(e =>
      e.rubricText?.toLowerCase().includes(lower) ||
      e.fullPath?.toLowerCase().includes(lower) ||
      e.remedies?.some(r => r.toLowerCase().includes(lower)) ||
      e.crossReference?.toLowerCase().includes(lower)
    ).slice(0, 50);
    setSearchResults(results);
  }, [allKent]);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(value), 300);
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // Handle cross-reference click — resolve target and navigate
  const handleCrossRefClick = useCallback((targetText: string) => {
    if (!allKent.length) return;

    // Prevent infinite loops — check if we're going in circles
    const target = targetText.trim().toLowerCase();

    // Strategy 1: Exact match (case-insensitive)
    const exactMatches = allKent.filter(e =>
      e.entryType !== 'cross_reference' &&
      e.rubricText?.toLowerCase().trim() === target
    );

    if (exactMatches.length === 1) {
      // Save current rubric to history for back navigation
      if (selectedRubric) {
        setCrossRefHistory(prev => [...prev, selectedRubric]);
      }
      // Switch to target's chapter if different
      if (exactMatches[0].chapter !== selectedChapter) {
        setSelectedChapter(exactMatches[0].chapter);
        setExpandedNodes(new Set());
      }
      setSelectedRubric(exactMatches[0]);
      setCrossRefStatus('resolved');
      return;
    }

    // Strategy 2: Remove ", also X" suffix
    if (target.includes(', also ')) {
      const base = target.split(', also ')[0].trim();
      const baseMatches = allKent.filter(e =>
        e.entryType !== 'cross_reference' &&
        e.rubricText?.toLowerCase().trim() === base
      );
      if (baseMatches.length === 1) {
        if (selectedRubric) setCrossRefHistory(prev => [...prev, selectedRubric]);
        if (baseMatches[0].chapter !== selectedChapter) {
          setSelectedChapter(baseMatches[0].chapter);
          setExpandedNodes(new Set());
        }
        setSelectedRubric(baseMatches[0]);
        setCrossRefStatus('resolved');
        return;
      }
    }

    // Strategy 3: First comma-separated part
    const firstPart = target.split(',')[0].trim();
    const firstPartMatches = allKent.filter(e =>
      e.entryType !== 'cross_reference' &&
      e.rubricText?.toLowerCase().trim() === firstPart
    );
    if (firstPartMatches.length === 1) {
      if (selectedRubric) setCrossRefHistory(prev => [...prev, selectedRubric]);
      if (firstPartMatches[0].chapter !== selectedChapter) {
        setSelectedChapter(firstPartMatches[0].chapter);
        setExpandedNodes(new Set());
      }
      setSelectedRubric(firstPartMatches[0]);
      setCrossRefStatus('resolved');
      return;
    }

    // Strategy 4: Search for rubrics containing the target text
    const partialMatches = allKent.filter(e =>
      e.entryType !== 'cross_reference' &&
      e.rubricText?.toLowerCase().includes(target)
    );

    if (partialMatches.length === 1) {
      if (selectedRubric) setCrossRefHistory(prev => [...prev, selectedRubric]);
      if (partialMatches[0].chapter !== selectedChapter) {
        setSelectedChapter(partialMatches[0].chapter);
        setExpandedNodes(new Set());
      }
      setSelectedRubric(partialMatches[0]);
      setCrossRefStatus('resolved');
      return;
    }

    if (partialMatches.length > 1) {
      // Ambiguous — fall back to search
      setCrossRefStatus('ambiguous');
      setSearchQuery(targetText);
      setSearchResults(partialMatches.slice(0, 50));
      setSelectedRubric(null);
      return;
    }

    // Unresolved
    setCrossRefStatus('unresolved');
  }, [allKent, selectedRubric, selectedChapter]);

  const toggleSave = (id: string, title: string) => {
    reader.toggleFavorite({ id, type: 'rubric', title, href: `/repertory`, author: 'Kent' });
    const next = new Set(savedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSavedIds(next);
  };

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F2]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#124C3B] rounded-full animate-spin"></div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F2]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-4 w-full">

        {/* HEADER */}
        <header className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-[#124C3B]">Kent Repertory</h1>
              <p className="text-xs text-[#7C8F6E] mt-0.5">Hierarchical Tree View</p>
            </div>
            <div className="flex items-center gap-2 bg-[#FFF8E1] border border-[#C49A3A]/30 rounded-full px-3 py-1.5">
              <span className="text-xs text-[#C49A3A]">📊</span>
              <span className="text-sm font-bold text-[#124C3B]">{totalRubrics.toLocaleString()}</span>
              <span className="text-xs text-[#7C8F6E]">Total Rubrics</span>
            </div>
          </div>
          <div className="w-16 h-0.5 bg-[#C49A3A] mt-2"></div>
        </header>

        {/* SEARCH */}
        <div className="bg-white rounded-lg border border-[#DEDACF] p-3 mb-3 shadow-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Search rubrics by title, path, or remedy..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-[#DEDACF] rounded-lg text-sm focus:outline-none focus:border-[#124C3B] text-[#243A32] bg-[#FAF8F2]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C8F6E] hover:text-[#124C3B]">✕</button>
            )}
          </div>
        </div>

        {/* CHAPTER SELECTOR */}
        {!searchResults && (
          <div className="bg-white rounded-lg border border-[#DEDACF] p-3 mb-3 shadow-sm">
            <label className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider mb-1.5 block">Chapter</label>
            <select
              value={selectedChapter}
              onChange={e => { setSelectedChapter(e.target.value); setExpandedNodes(new Set()); }}
              className="w-full px-3 py-2 border border-[#DEDACF] rounded-lg text-sm font-semibold text-[#124C3B] bg-[#EAF4EF] focus:outline-none focus:border-[#124C3B]"
            >
              {chapters.map(ch => (
                <option key={ch.name} value={ch.name}>{ch.name} ({ch.count.toLocaleString()} rubrics)</option>
              ))}
            </select>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {searchResults && (
          <div className="bg-white rounded-lg border border-[#DEDACF] shadow-sm mb-3 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#DEDACF] bg-[#FBFAF6] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#124C3B]">Search Results ({searchResults.length})</span>
              <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="text-xs text-[#7C8F6E] hover:text-[#124C3B]">Clear ✕</button>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#7C8F6E]">No rubrics found</div>
              ) : (
                searchResults.map(r => (
                  <button key={r.id} onClick={() => setSelectedRubric(r)}
                    className="w-full text-left px-4 py-2.5 border-b border-[#DEDACF] hover:bg-[#FAF8F2] transition-colors">
                    <div className="text-sm font-medium text-[#124C3B]">{r.rubricText}</div>
                    <div className="text-xs text-[#7C8F6E] mt-0.5">{r.fullPath}</div>
                    {r.remedyCount > 0 && (
                      <div className="text-xs text-[#C49A3A] mt-0.5">{r.remedyCount} remedies {r.singleRemedy && '· Single Remedy'}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* TREE VIEW */}
        {!searchResults && (
          <div className="bg-white rounded-lg border border-[#DEDACF] shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-8 text-[#7C8F6E] text-sm">Loading Kent Repertory...</div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {/* Chapter root */}
                <div className="px-4 py-3 bg-[#EAF4EF] border-b border-[#DEDACF] sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChapterIcon(selectedChapter)}</span>
                    <span className="font-serif text-lg font-bold text-[#124C3B]">{selectedChapter}</span>
                    <span className="text-xs text-[#7C8F6E]">
                      ({(chapters.find(c => c.name === selectedChapter)?.count || 0).toLocaleString()})
                    </span>
                  </div>
                </div>

                {/* Tree nodes */}
                <div className="p-2">
                  {tree.map(node => (
                    <TreeRow
                      key={node.id}
                      node={node}
                      level={0}
                      expandedNodes={expandedNodes}
                      onToggle={toggleNode}
                      onSelect={setSelectedRubric}
                      selectedId={selectedRubric?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETAIL CARD */}
        {selectedRubric && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center p-2" onClick={() => setSelectedRubric(null)}>
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Breadcrumb header */}
              <div className="px-4 py-3 bg-[#124C3B] text-white rounded-t-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-[#C49A3A]">Kent Repertory</span>
                  <button onClick={() => setSelectedRubric(null)} className="text-white/70 hover:text-white">✕</button>
                </div>
                <div className="text-sm font-medium leading-relaxed">
                  {selectedRubric.fullPathParts?.map((part, i) => (
                    <span key={i}>
                      {i > 0 && <span className="text-[#C49A3A] mx-1">›</span>}
                      <span className={i === (selectedRubric.fullPathParts.length - 1) ? 'font-bold' : ''}>{part}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="px-4 py-3 border-b border-[#DEDACF]">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-[#EAF4EF] text-[#124C3B] px-2 py-1 rounded">Level: {selectedRubric.level}</span>
                  <span className="text-xs bg-[#FFF8E1] text-[#C49A3A] px-2 py-1 rounded">Remedies: {selectedRubric.remedyCount}</span>
                  {selectedRubric.pdfPage && (
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded">Source: Page {selectedRubric.pdfPage}</span>
                  )}
                  {selectedRubric.singleRemedy && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded font-semibold">Single Remedy Rubric</span>
                  )}
                </div>
              </div>

              {/* Cross-reference — CLICKABLE */}
              {selectedRubric.crossReference && (
                <div className="px-4 py-3 border-b border-[#DEDACF]">
                  <div className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider mb-1">Cross Reference</div>
                  <button
                    onClick={() => handleCrossRefClick(selectedRubric.crossReference!)}
                    className="inline-flex items-center gap-1.5 text-sm text-[#124C3B] hover:text-[#0B392D] underline decoration-[#C49A3A]/50 hover:decoration-[#C49A3A] transition-colors cursor-pointer"
                  >
                    <span className="text-[#7C8F6E]">See →</span>
                    <span className="font-medium">{selectedRubric.crossReference}</span>
                  </button>
                  {crossRefStatus === 'unresolved' && selectedRubric.crossReference && (
                    <div className="text-xs text-amber-600 mt-1">⚠ Target not found in Kent database — may need manual resolution</div>
                  )}
                  {crossRefStatus === 'ambiguous' && (
                    <div className="text-xs text-amber-600 mt-1">⚠ Multiple possible targets — clicking will search</div>
                  )}
                </div>
              )}

              {/* Back navigation if navigated from cross-reference */}
              {crossRefHistory.length > 0 && (
                <div className="px-4 py-2 border-b border-[#DEDACF] bg-[#FBFAF6]">
                  <button
                    onClick={() => {
                      const prevRubric = crossRefHistory[crossRefHistory.length - 1];
                      setCrossRefHistory(crossRefHistory.slice(0, -1));
                      setSelectedRubric(prevRubric);
                      setCrossRefStatus('resolved');
                    }}
                    className="text-xs text-[#124C3B] hover:text-[#0B392D] font-medium"
                  >
                    ← Back to {crossRefHistory[crossRefHistory.length - 1]?.rubricText || 'previous rubric'}
                  </button>
                </div>
              )}

              {/* Remedies */}
              {selectedRubric.remediesGraded && selectedRubric.remediesGraded.length > 0 && (
                <div className="px-4 py-3 border-b border-[#DEDACF]">
                  <div className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider mb-2">🍃 Remedies</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRubric.remediesGraded.map((r, i) => {
                      const gradeKey = r.grade === 3 ? 'HIGH' : r.grade === 2 ? 'LOW' : 'NORMAL';
                      const meta = GRADE_DISPLAY_MAP[gradeKey as keyof typeof GRADE_DISPLAY_MAP] || GRADE_DISPLAY_MAP.NORMAL;
                      return (
                        <span key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold"
                          style={{ backgroundColor: meta.bg, color: meta.color }}>
                          {r.abbrev}
                          <span className="text-[0.55rem] opacity-80">G{r.grade}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Rubric Path */}
              <div className="px-4 py-3 border-b border-[#DEDACF]">
                <div className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider mb-1">Full Rubric Path</div>
                <div className="text-sm text-[#243A32] leading-relaxed">
                  {selectedRubric.fullPathParts?.map((part, i) => (
                    <div key={i} style={{ paddingLeft: `${i * 12}px` }} className="flex items-center gap-1">
                      {i > 0 && <span className="text-[#C49A3A]">→</span>}
                      <span className={i === 0 ? 'font-bold' : ''}>{part}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => toggleSave(selectedRubric.id, selectedRubric.rubricText)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${savedIds.has(selectedRubric.id) ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#124C3B] text-white hover:bg-[#0B392D]'}`}>
                  {savedIds.has(selectedRubric.id) ? '★ Saved' : '☆ Save'}
                </button>
                <button onClick={() => setSelectedRubric(null)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-stone-100 text-stone-600 hover:bg-stone-200">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

// ============================================================
// TREE ROW — recursive component for hierarchy
// ============================================================
function TreeRow({ node, level, expandedNodes, onToggle, onSelect, selectedId }: {
  node: TreeNode;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (entry: KentEntry) => void;
  selectedId?: string;
}) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isCrossRef = node.entryType === 'cross_reference';

  // Highlight colors by level
  const bgClass = isSelected
    ? (level === 0 ? 'bg-[#E3F2FD]' : level === 1 ? 'bg-[#EAF4EF]' : 'bg-[#F1F8E9]')
    : '';

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer rounded-md transition-colors hover:bg-[#FAF8F2] ${bgClass}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Chevron */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="w-4 h-4 flex items-center justify-center text-[#7C8F6E] hover:text-[#124C3B] flex-shrink-0"
          >
            {isExpanded ? '⌄' : '›'}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0"></span>
        )}

        {/* Rubric text */}
        <span className={`text-sm flex-1 truncate ${level === 0 ? 'font-bold text-[#124C3B]' : 'text-[#243A32]'}`}>
          {node.rubricText}
          {isCrossRef && <span className="text-[#7C8F6E] italic text-xs ml-1">(See {node.crossReference})</span>}
        </span>

        {/* Remedy count badge */}
        {node.remedyCount > 0 && (
          <span className="text-xs text-[#7C8F6E] flex-shrink-0">
            {node.remedyCount}
            {node.singleRemedy && <span className="text-pink-600 ml-1">●</span>}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeRow
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function buildTree(entries: KentEntry[]): TreeNode[] {
  // Group by level and build parent-child relationships
  const byLevel: Record<number, KentEntry[]> = {};
  for (const e of entries) {
    const lvl = e.level;
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(e);
  }

  // Sort each level by rubric text
  for (const lvl of Object.keys(byLevel)) {
    byLevel[Number(lvl)].sort((a, b) => a.rubricText.localeCompare(b.rubricText));
  }

  // Build tree recursively
  function buildNodes(entries: KentEntry[], level: number): TreeNode[] {
    return entries.map(e => ({
      ...e,
      children: [],
      expanded: false,
    }));
  }

  // Simple approach: build flat list with levels, tree structure inferred from order
  const nodes: TreeNode[] = buildNodes(byLevel[0] || [], 0);

  // Build hierarchy: each entry at level N is a child of the most recent entry at level N-1
  const stack: TreeNode[][] = [nodes];

  for (let lvl = 1; lvl <= 5; lvl++) {
    const levelEntries = byLevel[lvl] || [];
    if (levelEntries.length === 0) continue;

    const currentLevelNodes: TreeNode[] = [];
    let lastParent: TreeNode | null = null;

    // Find the deepest available parent
    for (const entry of levelEntries) {
      const node: TreeNode = { ...entry, children: [], expanded: false };

      // Find parent: walk up the stack
      let parent: TreeNode | null = null;
      for (let p = stack.length - 1; p >= 0; p--) {
        if (p === lvl - 1) {
          // Parent should be the last node at level lvl-1
          const parentList = stack[p];
          if (parentList && parentList.length > 0) {
            parent = parentList[parentList.length - 1];
          }
          break;
        }
      }

      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan — add to current level
        currentLevelNodes.push(node);
      }
    }

    // Track this level's nodes for children lookup
    // Collect all nodes at this level (including children of parents)
    const allAtLevel: TreeNode[] = [];
    function collectAtLevel(nodes: TreeNode[], targetLevel: number, currentLevel: number) {
      for (const n of nodes) {
        if (currentLevel === targetLevel) {
          allAtLevel.push(n);
        }
        if (n.children.length > 0) {
          collectAtLevel(n.children, targetLevel, currentLevel + 1);
        }
      }
    }
    collectAtLevel(nodes, lvl, 0);
    stack[lvl] = allAtLevel;
  }

  return nodes;
}

function getChapterIcon(chapter: string): string {
  const icons: Record<string, string> = {
    'MIND': '🧠',
    'HEAD': '💭',
    'EYE': '👁️',
    'EAR': '👂',
    'NOSE': '👃',
    'MOUTH': '👄',
    'TEETH': '🦷',
    'THROAT': '🗣️',
    'STOMACH': '🫃',
    'ABDOMEN': '🫄',
    'CHEST': '🫁',
    'BACK': '🦴',
    'EXTREMITIES': '🦵',
    'SKIN': '✋',
    'SLEEP': '😴',
    'DREAMS': '💭',
    'FEVER': '🌡️',
    'CHILL': '🥶',
    'PERSPIRATION': '💦',
  };
  return icons[chapter] || '📖';
}
