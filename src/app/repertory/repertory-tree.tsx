'use client';
/// ============================================================
/// Repertory Tree — recursive, lazy-loaded rubric hierarchy for
/// Kent / Phatak / Murphy / Boericke repertories.
///
/// Features:
///   • Unlimited hierarchy depth (recursive parentId lookup)
///   • Lazy loading — children fetched only when node is expanded
///   • Expand/collapse with state preservation (remember last branch)
///   • Grade-colored remedy badges:
///       Grade 4 = Red    (large bold)
///       Grade 3 = Green  (medium bold)
///       Grade 2 = Blue   (normal)
///       Grade 1 = Black  (normal)
///   • Remedies sorted Grade 4 → 3 → 2 → 1, alphabetical within grade
///   • Each remedy shows: abbreviation, grade, source repertory
///   • Source integrity: only verified data from the selected repertory
///
/// No global CSS. No shared-component modifications.
/// ============================================================
import React, { useState, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================
interface ParsedRemedy {
  abbrev: string;
  grade: number;
}

interface RubricChild {
  id: string;
  title: string;
  fullPath: string;
  chapter: string;
  level: number;
  parentId: string | null;
  hasChildren: boolean;
  remedyCount: number;
  byGrade: { 4: string[]; 3: string[]; 2: string[]; 1: string[] };
  remedies: ParsedRemedy[];
}

// ============================================================
// GRADE METADATA — colors per the original repertory grading scale.
// Grade 4 = Red, Grade 3 = Green, Grade 2 = Blue, Grade 1 = Black.
// ============================================================
const GRADE_META: Record<number, {
  color: string;
  bg: string;
  border: string;
  label: string;
  sizeClass: string;
  weightClass: string;
}> = {
  4: {
    color: '#FFFFFF',
    bg: '#DC2626',       // Red — highest importance
    border: '#B91C1C',
    label: 'Grade 4',
    sizeClass: 'text-sm',
    weightClass: 'font-bold',
  },
  3: {
    color: '#FFFFFF',
    bg: '#166534',       // Green
    border: '#14532D',
    label: 'Grade 3',
    sizeClass: 'text-xs',
    weightClass: 'font-semibold',
  },
  2: {
    color: '#FFFFFF',
    bg: '#1E40AF',       // Blue
    border: '#1E3A8A',
    label: 'Grade 2',
    sizeClass: 'text-xs',
    weightClass: 'font-medium',
  },
  1: {
    color: '#FFFFFF',
    bg: '#374151',       // Black / Dark Grey
    border: '#1F2937',
    label: 'Grade 1',
    sizeClass: 'text-xs',
    weightClass: 'font-normal',
  },
};

// ============================================================
// REMEDY BADGE — colored chip showing abbreviation + grade
// ============================================================
function RemedyBadge({
  abbrev,
  grade,
  sourceRepertory,
}: {
  abbrev: string;
  grade: number;
  sourceRepertory?: string;
}) {
  const meta = GRADE_META[grade] || GRADE_META[1];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${meta.sizeClass} ${meta.weightClass} font-mono`}
      style={{
        backgroundColor: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
      title={`${abbrev} — ${meta.label}${sourceRepertory ? ' · ' + sourceRepertory : ''}`}
    >
      {abbrev}
      <span className="text-[0.55rem] opacity-80">G{grade}</span>
    </span>
  );
}

// ============================================================
// REMEDY LIST — grade-sorted badges with grade-grouped sections
// ============================================================
function RemedyList({
  remedies,
  byGrade,
  sourceRepertory,
  maxPerGrade = 50,
}: {
  remedies: ParsedRemedy[];
  byGrade: { 4: string[]; 3: string[]; 2: string[]; 1: string[] };
  sourceRepertory?: string;
  maxPerGrade?: number;
}) {
  if (remedies.length === 0) {
    return (
      <div className="pl-6 py-1.5 text-xs italic text-[#7C8F6E]">
        No remedies recorded for this rubric in the source repertory.
      </div>
    );
  }

  const grades = [4, 3, 2, 1] as const;
  return (
    <div className="pl-6 py-2 space-y-1.5">
      {/* Header */}
      <div className="text-xs text-[#7C8F6E] mb-1">
        <span className="font-semibold text-[#173B2D]">{remedies.length}</span>
        {' '}{remedies.length === 1 ? 'remedy' : 'remedies'}
        {sourceRepertory && (
          <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase tracking-wider bg-[#C8A24A]/10 text-[#C8A24A]">
            Source: {sourceRepertory}
          </span>
        )}
      </div>
      {/* Grade-grouped remedy badges */}
      {grades.map(grade => {
        const list = byGrade[grade] || [];
        if (list.length === 0) return null;
        const displayed = list.slice(0, maxPerGrade);
        const remaining = list.length - displayed.length;
        return (
          <div key={grade} className="flex items-start gap-2 flex-wrap">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[#7C8F6E] mt-0.5 min-w-[28px]">
              G{grade}:
            </span>
            <div className="flex flex-wrap gap-1 flex-1">
              {displayed.map(abbrev => (
                <RemedyBadge
                  key={`${abbrev}-${grade}`}
                  abbrev={abbrev}
                  grade={grade}
                  sourceRepertory={sourceRepertory}
                />
              ))}
              {remaining > 0 && (
                <span className="text-[0.6rem] text-[#7C8F6E] py-0.5">+{remaining} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// RECURSIVE TREE NODE — renders a single rubric + children when expanded
// ============================================================
interface RepertoryTreeNodeProps {
  node: RubricChild;
  author: string;
  // Parent-managed state (preserves expand state across re-renders):
  expandedNodes: Set<string>;
  childrenCache: Record<string, RubricChild[]>;
  loadingChildren: Set<string>;
  showRemedies: Set<string>;
  // Callbacks:
  onToggleExpand: (nodeId: string) => void;
  onToggleShowRemedies: (nodeId: string) => void;
}

function RepertoryTreeNode({
  node,
  author,
  expandedNodes,
  childrenCache,
  loadingChildren,
  showRemedies,
  onToggleExpand,
  onToggleShowRemedies,
}: RepertoryTreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const isLoadingChildren = loadingChildren.has(node.id);
  const children = childrenCache[node.id];
  const hasChildrenLoaded = !!children;
  const isShowingRemedies = showRemedies.has(node.id);
  const indent = node.level * 18; // px per level

  return (
    <div className="select-none">
      {/* Node row */}
      <div
        className="flex items-start gap-1.5 py-1.5 px-2 rounded-md transition-colors hover:bg-[#F5EFE0]"
        style={{ marginLeft: indent }}
      >
        {/* Expand/collapse arrow */}
        <button
          type="button"
          onClick={() => onToggleExpand(node.id)}
          disabled={!node.hasChildren && !hasChildrenLoaded}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[#7C8F6E] hover:text-[#173B2D] disabled:opacity-30"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          aria-expanded={isExpanded}
        >
          {isLoadingChildren ? (
            <span className="inline-block w-3 h-3 border-2 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin" />
          ) : node.hasChildren || (hasChildrenLoaded && children.length > 0) ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <span className="text-[#C8A24A] text-xs">•</span>
          )}
        </button>

        {/* Rubric name + path */}
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium leading-snug break-words text-[#173B2D]"
            title={node.fullPath}
          >
            {node.title}
          </div>
          {node.level > 0 && node.fullPath && node.fullPath !== node.title && (
            <div className="text-[0.65rem] mt-0.5 truncate text-[#7C8F6E]" title={node.fullPath}>
              {node.fullPath}
            </div>
          )}
          {/* Meta row: chapter + level + remedy count */}
          <div className="flex items-center gap-2 mt-0.5">
            {node.chapter && node.level === 0 && (
              <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#C8A24A] bg-[#C8A24A]/10 px-1.5 py-0.5 rounded">
                {node.chapter}
              </span>
            )}
            <span className="text-[0.6rem] text-[#7C8F6E]">
              {node.remedyCount > 0
                ? `${node.remedyCount} ${node.remedyCount === 1 ? 'remedy' : 'remedies'}`
                : node.hasChildren
                  ? 'has sub-rubrics'
                  : 'terminal'}
            </span>
          </div>
        </div>

        {/* Action: toggle remedies */}
        {node.remedyCount > 0 && (
          <button
            type="button"
            onClick={() => onToggleShowRemedies(node.id)}
            className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 text-[0.65rem] rounded font-medium transition-colors border"
            style={{
              color: '#173B2D',
              borderColor: isShowingRemedies ? '#173B2D' : '#E8DCC3',
              backgroundColor: isShowingRemedies ? '#F5EFE0' : '#FFFFFF',
            }}
            title="Show/hide remedies for this rubric"
          >
            {isShowingRemedies ? 'Hide' : 'Remedies'}
          </button>
        )}
      </div>

      {/* Inline remedy list */}
      {isShowingRemedies && (
        <RemedyList
          remedies={node.remedies}
          byGrade={node.byGrade}
          sourceRepertory={author}
          maxPerGrade={50}
        />
      )}

      {/* Children (recursively rendered when expanded) */}
      {isExpanded && (
        <div>
          {isLoadingChildren && !hasChildrenLoaded ? (
            <div style={{ marginLeft: indent + 24 }} className="py-1.5">
              <div className="flex items-center gap-2 text-xs text-[#7C8F6E]">
                <span className="inline-block w-3 h-3 border-2 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin" />
                Loading sub-rubrics...
              </div>
            </div>
          ) : hasChildrenLoaded && children && children.length > 0 ? (
            children.map(child => (
              <RepertoryTreeNode
                key={child.id}
                node={child}
                author={author}
                expandedNodes={expandedNodes}
                childrenCache={childrenCache}
                loadingChildren={loadingChildren}
                showRemedies={showRemedies}
                onToggleExpand={onToggleExpand}
                onToggleShowRemedies={onToggleShowRemedies}
              />
            ))
          ) : hasChildrenLoaded && (!children || children.length === 0) ? (
            <div
              className="text-xs italic py-1 text-[#7C8F6E]"
              style={{ marginLeft: indent + 24 }}
            >
              No sub-rubrics. This is a terminal rubric.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============================================================
// REPERTORY TREE — top-level wrapper managing state + data fetching
// ============================================================
interface RepertoryTreeProps {
  author: string;
  chapter?: string;
}

export function RepertoryTree({ author, chapter = '' }: RepertoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [childrenCache, setChildrenCache] = useState<Record<string, RubricChild[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());
  const [showRemedies, setShowRemedies] = useState<Set<string>>(new Set());
  const [roots, setRoots] = useState<RubricChild[] | null>(null);
  const [loadingRoots, setLoadingRoots] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset everything when author or chapter changes
  React.useEffect(() => {
    setExpandedNodes(new Set());
    setChildrenCache({});
    setLoadingChildren(new Set());
    setShowRemedies(new Set());
    setRoots(null);
    setError('');
    setLoadingRoots(true);
    const params = new URLSearchParams({ author });
    if (chapter) params.set('chapter', chapter);
    fetch(`/api/rubrics/children?${params.toString()}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(d => setRoots(d.children || []))
      .catch(e => setError(e.message || 'Failed to load rubrics'))
      .finally(() => setLoadingRoots(false));
  }, [author, chapter]);

  const loadChildren = useCallback(async (parentId: string) => {
    if (childrenCache[parentId]) return; // already cached
    setLoadingChildren(prev => new Set(prev).add(parentId));
    try {
      const params = new URLSearchParams({ author, parentId });
      const res = await fetch(`/api/rubrics/children?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load children');
      const d = await res.json();
      setChildrenCache(prev => ({ ...prev, [parentId]: d.children || [] }));
    } catch {
      // Mark as empty to avoid retry loops
      setChildrenCache(prev => ({ ...prev, [parentId]: [] }));
    } finally {
      setLoadingChildren(prev => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  }, [author, childrenCache]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
        // Lazy-load children if not cached
        if (!childrenCache[nodeId]) {
          loadChildren(nodeId);
        }
      }
      return next;
    });
  }, [childrenCache, loadChildren]);

  const handleToggleShowRemedies = useCallback((nodeId: string) => {
    setShowRemedies(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // Loading state
  if (loadingRoots) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-[#7C8F6E]">Loading {author} rubric hierarchy...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600 mb-2">Failed to load rubrics</p>
        <p className="text-xs text-[#7C8F6E]">{error}</p>
        <button
          onClick={() => {
            setLoadingRoots(true);
            setError('');
            const params = new URLSearchParams({ author });
            if (chapter) params.set('chapter', chapter);
            fetch(`/api/rubrics/children?${params.toString()}`)
              .then(r => r.json())
              .then(d => setRoots(d.children || []))
              .catch(e => setError(e.message))
              .finally(() => setLoadingRoots(false));
          }}
          className="mt-3 px-3 py-1.5 text-xs bg-[#173B2D] text-[#F5EFE0] rounded hover:bg-[#0f2a20]"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!roots || roots.length === 0) {
    return (
      <div className="text-center py-12 text-[#7C8F6E]">
        <p className="text-sm">No rubrics found for {author}{chapter ? ` in ${chapter}` : ''}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Tree stats */}
      <div className="px-3 py-2 mb-2 bg-[#F5EFE0] rounded-md text-xs text-[#7C8F6E] border border-[#E8DCC3]">
        <span className="font-semibold text-[#173B2D]">{roots.length}</span> root rubric{roots.length !== 1 ? 's' : ''}
        {chapter && <> in <span className="font-semibold text-[#173B2D]">{chapter}</span></>}
        {' · '}Tap <span className="font-mono">▶</span> to expand. Tap <span className="font-mono">Remedies</span> to view grade-wise remedies.
      </div>

      {/* Recursive tree */}
      <div className="max-h-[700px] overflow-y-auto pr-1">
        {roots.map(node => (
          <RepertoryTreeNode
            key={node.id}
            node={node}
            author={author}
            expandedNodes={expandedNodes}
            childrenCache={childrenCache}
            loadingChildren={loadingChildren}
            showRemedies={showRemedies}
            onToggleExpand={handleToggleExpand}
            onToggleShowRemedies={handleToggleShowRemedies}
          />
        ))}
      </div>
    </div>
  );
}
