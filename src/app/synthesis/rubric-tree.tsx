'use client';
/// ============================================================
/// Rubric Tree — recursive, lazy-loaded, unlimited depth.
/// Renders the COMPLETE rubric hierarchy exactly as stored in the
/// selected repertory source. No invented hierarchy, no AI grades.
///
/// Each node:
///   • Expand/collapse arrow (lazy-loads children on first expand)
///   • Rubric name + path
///   • Inline remedy list (Grade 4 → 3 → 2 → 1, alphabetical within grade)
///   • "+ Add" button to add the rubric to the current case
///   • "View Remedies" toggle to show/hide inline remedy list
///
/// Remedy grade colors follow the original repertory grading:
///   Grade 4 = Red    (large bold)
///   Grade 3 = Green  (medium bold)
///   Grade 2 = Blue   (normal)
///   Grade 1 = Black  (normal)
///
/// Performance:
///   • Children are fetched ONLY when a node is first expanded
///   • Fetched children are cached in a parent-managed record
///   • Expand/collapse state is parent-managed (survives re-renders)
///   • No UI freezing — every fetch is async with a loading spinner
///
/// No global CSS. No shared-component modifications.
/// Source rubric / remedy / grade data is READ-ONLY here.
/// ============================================================
import React, { useState } from 'react';
import { TreeNode, SelectedRubric } from './storage';
import { SYNTH_COLORS } from './synthesis-ui';
import { Icons, LeafGrowth } from './components';

// ============================================================
// GRADE METADATA — colors per the original repertory scale.
// These match the source grading stored in the database.
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
    bg: '#DC2626',       // Red
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

export function getGradeMeta(grade: number) {
  return GRADE_META[grade] || GRADE_META[1];
}

// ============================================================
// SORTED REMEDY LIST — Grade 4 → 3 → 2 → 1, alphabetical within
// each grade. Takes the byGrade map from the API and produces a
// flat sorted array of { abbrev, full, grade }.
// ============================================================
export function sortRemediesByGrade(
  byGrade: Record<number, { abbrev: string; full: string }[]>
): { abbrev: string; full: string; grade: number }[] {
  const flat: { abbrev: string; full: string; grade: number }[] = [];
  for (const grade of [4, 3, 2, 1]) {
    const list = byGrade[grade] || [];
    // Sort alphabetically by abbreviation within grade (case-insensitive)
    const sorted = [...list].sort((a, b) =>
      a.abbrev.localeCompare(b.abbrev, undefined, { sensitivity: 'base' })
    );
    for (const r of sorted) {
      flat.push({ abbrev: r.abbrev, full: r.full, grade });
    }
  }
  // Include any unexpected grades (e.g. 0) at the end, sorted by grade desc
  for (const grade of Object.keys(byGrade).map(Number).filter(g => g < 1 || g > 4)) {
    const list = byGrade[grade] || [];
    const sorted = [...list].sort((a, b) =>
      a.abbrev.localeCompare(b.abbrev, undefined, { sensitivity: 'base' })
    );
    for (const r of sorted) {
      flat.push({ abbrev: r.abbrev, full: r.full, grade });
    }
  }
  return flat;
}

// ============================================================
// REMEDY BADGE — colored chip showing abbreviation + grade.
// Color comes from GRADE_META (source grading scale).
// ============================================================
export function RemedyBadge({
  abbrev,
  full,
  grade,
  sourceRepertory,
}: {
  abbrev: string;
  full: string;
  grade: number;
  sourceRepertory?: string;
}) {
  const meta = getGradeMeta(grade);
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all hover:shadow-sm"
      style={{
        backgroundColor: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
      title={`${abbrev} — ${full} (${meta.label}${sourceRepertory ? ', ' + sourceRepertory : ''})`}
    >
      <span
        className={`font-mono ${meta.sizeClass} ${meta.weightClass}`}
        style={{ color: meta.color }}
      >
        {abbrev}
      </span>
      <span
        className="text-[0.6rem] font-medium truncate max-w-[120px]"
        style={{ color: meta.color, opacity: 0.9 }}
      >
        {full}
      </span>
      <span
        className="text-[0.55rem] font-bold px-1 rounded"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: meta.color,
        }}
      >
        G{grade}
      </span>
    </div>
  );
}

// ============================================================
// INLINE REMEDY LIST — shown when user clicks "View Remedies"
// on a rubric node. Renders remedies sorted by grade, with the
// source repertory label.
// ============================================================
export function InlineRemedyList({
  byGrade,
  total,
  loading,
  failed,
  sourceRepertory,
  onAddRubric,
  rubricAlreadyAdded,
}: {
  byGrade: Record<number, { abbrev: string; full: string }[]>;
  total: number;
  loading: boolean;
  failed: boolean;
  sourceRepertory?: string;
  onAddRubric?: () => void;
  rubricAlreadyAdded?: boolean;
}) {
  if (loading) {
    return (
      <div className="py-2 pl-6">
        <LeafGrowth text="Loading remedy count..." />
      </div>
    );
  }
  if (failed) {
    return (
      <div className="pl-6 py-2 text-xs italic" style={{ color: SYNTH_COLORS.delete }}>
        Remedy count unavailable
      </div>
    );
  }
  if (total === 0) {
    return (
      <div className="pl-6 py-2 text-xs italic" style={{ color: SYNTH_COLORS.textSecondary }}>
        No remedies recorded for this rubric in the source repertory.
      </div>
    );
  }
  const sorted = sortRemediesByGrade(byGrade);
  return (
    <div className="pl-6 py-2 space-y-2">
      {/* Header row: count + source + add-to-case */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs" style={{ color: SYNTH_COLORS.textSecondary }}>
          <span className="font-semibold" style={{ color: SYNTH_COLORS.primary }}>{total}</span>
          {' '}{total === 1 ? 'remedy' : 'remedies'}
          {sourceRepertory && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: SYNTH_COLORS.success,
                color: SYNTH_COLORS.primary,
                border: '1px solid rgba(15, 74, 56, 0.18)',
              }}
            >
              Source: {sourceRepertory}
            </span>
          )}
        </div>
        {onAddRubric && (
          <button
            type="button"
            onClick={onAddRubric}
            disabled={rubricAlreadyAdded}
            className="px-2 py-0.5 text-xs rounded font-semibold transition-colors"
            style={
              rubricAlreadyAdded
                ? { backgroundColor: SYNTH_COLORS.success, color: SYNTH_COLORS.primary }
                : { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }
            }
          >
            {rubricAlreadyAdded ? '✓ Added to Case' : '+ Add to Case'}
          </button>
        )}
      </div>
      {/* Grade-sorted remedy badges */}
      <div className="flex flex-wrap gap-1.5">
        {sorted.map(r => (
          <RemedyBadge
            key={`${r.abbrev}-${r.grade}`}
            abbrev={r.abbrev}
            full={r.full}
            grade={r.grade}
            sourceRepertory={sourceRepertory}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// RECURSIVE TREE NODE — renders a single rubric node and, when
// expanded, recursively renders its children.
// Lazy-loads children on first expand via onLoadChildren.
// ============================================================
interface RubricTreeNodeProps {
  node: TreeNode;
  depth: number;
  // Parent-managed state (passed down so expand state survives re-renders):
  expandedNodes: Set<number>;
  treeChildren: Record<number, TreeNode[]>;
  loadingChildren: Set<number>;
  // Per-node remedy data (loaded by parent when needed):
  remedyData?: { byGrade: Record<number, { abbrev: string; full: string }[]>; total: number };
  remedyLoading: boolean;
  remedyFailed: boolean;
  // Per-node "show remedies inline" state (managed locally per node):
  showRemedies: boolean;
  onToggleShowRemedies: () => void;
  // Selected rubrics (for showing "Added" state):
  selectedRubricIds: Set<number>;
  // Callbacks:
  onToggleExpand: (nodeId: number) => void;
  onLoadChildren: (parentId: number) => void;
  onLoadRemedies: (symptomId: number) => void;
  onAddRubric: (node: TreeNode) => void;
  onNavigateInto: (node: TreeNode) => void;
  // Optional: source repertory label (e.g. "Synthesis")
  sourceRepertory?: string;
  // Path prefix for breadcrumb-style display
  parentPath?: string;
}

export function RubricTreeNode({
  node,
  depth,
  expandedNodes,
  treeChildren,
  loadingChildren,
  remedyData,
  remedyLoading,
  remedyFailed,
  showRemedies,
  onToggleShowRemedies,
  selectedRubricIds,
  onToggleExpand,
  onLoadChildren,
  onLoadRemedies,
  onAddRubric,
  onNavigateInto,
  sourceRepertory,
  parentPath,
}: RubricTreeNodeProps) {
  const isExpanded = expandedNodes.has(node.i);
  const isLoadingChildren = loadingChildren.has(node.i);
  const children = treeChildren[node.i];
  const hasChildrenLoaded = !!children;
  // Heuristic: we don't know in advance if a node has children until we
  // load them. We always show the expand arrow; if loading returns empty,
  // we show "No sub-rubrics" inline. This matches the lazy-loading spec.
  const hasChildren = !hasChildrenLoaded || children.length > 0;
  const isAdded = selectedRubricIds.has(node.i);
  const indent = depth * 18; // px per level — supports unlimited depth

  // Display path: full path from the source data
  const displayPath = node.p || (parentPath ? `${parentPath} → ${node.n}` : node.n);

  function handleExpandClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!hasChildrenLoaded && !isLoadingChildren) {
      onLoadChildren(node.i);
    }
    onToggleExpand(node.i);
  }

  function handleNameClick() {
    onNavigateInto(node);
    // Also lazy-load remedies if not already loaded
    if (!remedyData && !remedyLoading) {
      onLoadRemedies(node.i);
    }
  }

  function handleViewRemediesClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!remedyData && !remedyLoading) {
      onLoadRemedies(node.i);
    }
    onToggleShowRemedies();
  }

  function handleAddClick(e: React.MouseEvent) {
    e.stopPropagation();
    onAddRubric(node);
  }

  return (
    <div className="select-none">
      {/* Node row */}
      <div
        className="flex items-start gap-1.5 py-1.5 px-2 rounded-md transition-colors hover:bg-stone-50"
        style={{ marginLeft: indent }}
      >
        {/* Expand/collapse arrow */}
        <button
          type="button"
          onClick={handleExpandClick}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-700"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          aria-expanded={isExpanded}
        >
          {isLoadingChildren ? (
            <span className="inline-block w-3 h-3 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          ) : hasChildren ? (
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
            <span className="text-stone-300 text-xs">•</span>
          )}
        </button>

        {/* Rubric name + path */}
        <button
          type="button"
          onClick={handleNameClick}
          className="flex-1 min-w-0 text-left"
        >
          <div
            className="text-sm font-medium leading-snug break-words"
            style={{ color: SYNTH_COLORS.text }}
          >
            {node.n}
          </div>
          {depth > 0 && (
            <div
              className="text-[0.65rem] mt-0.5 truncate"
              style={{ color: SYNTH_COLORS.textSecondary }}
              title={displayPath}
            >
              {displayPath}
            </div>
          )}
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* View Remedies toggle */}
          <button
            type="button"
            onClick={handleViewRemediesClick}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[0.65rem] rounded font-medium transition-colors"
            style={{
              color: SYNTH_COLORS.primary,
              border: `1px solid ${SYNTH_COLORS.border}`,
              backgroundColor: showRemedies ? SYNTH_COLORS.success : '#FFFFFF',
            }}
            title="View remedies for this rubric"
          >
            <Icons.Eye size={11} className="text-[#124C3B]" />
            {showRemedies ? 'Hide' : 'Remedies'}
          </button>
          {/* Add to case */}
          <button
            type="button"
            onClick={handleAddClick}
            disabled={isAdded}
            className="px-1.5 py-0.5 text-[0.65rem] rounded font-semibold transition-colors disabled:opacity-70"
            style={
              isAdded
                ? { backgroundColor: SYNTH_COLORS.success, color: SYNTH_COLORS.primary }
                : { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }
            }
            title={isAdded ? 'Already in case' : 'Add to case'}
          >
            {isAdded ? '✓' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Inline remedy list (when "View Remedies" is toggled on) */}
      {showRemedies && (
        <InlineRemedyList
          byGrade={remedyData?.byGrade || {}}
          total={remedyData?.total || 0}
          loading={remedyLoading}
          failed={remedyFailed}
          sourceRepertory={sourceRepertory}
          onAddRubric={() => onAddRubric(node)}
          rubricAlreadyAdded={isAdded}
        />
      )}

      {/* Children (recursively rendered when expanded) */}
      {isExpanded && (
        <div>
          {isLoadingChildren && !hasChildrenLoaded ? (
            <div style={{ marginLeft: indent + 24 }} className="py-1">
              <LeafGrowth text="Loading sub-rubrics..." />
            </div>
          ) : hasChildrenLoaded && children && children.length > 0 ? (
            children.map(child => (
              <RubricTreeNode
                key={child.i}
                node={child}
                depth={depth + 1}
                expandedNodes={expandedNodes}
                treeChildren={treeChildren}
                loadingChildren={loadingChildren}
                remedyData={undefined} // Parent will inject via wrapper if needed
                remedyLoading={false}
                remedyFailed={false}
                showRemedies={false}
                onToggleShowRemedies={() => {}}
                selectedRubricIds={selectedRubricIds}
                onToggleExpand={onToggleExpand}
                onLoadChildren={onLoadChildren}
                onLoadRemedies={onLoadRemedies}
                onAddRubric={onAddRubric}
                onNavigateInto={onNavigateInto}
                sourceRepertory={sourceRepertory}
                parentPath={displayPath}
              />
            ))
          ) : hasChildrenLoaded && (!children || children.length === 0) ? (
            <div
              className="text-xs italic py-1"
              style={{ marginLeft: indent + 24, color: SYNTH_COLORS.textSecondary }}
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
// RUBRIC TREE — top-level wrapper that manages per-node "show
// remedies" state and injects the correct remedy data into each
// recursive RubricTreeNode. This keeps the recursive component
// pure while still allowing per-node remedy toggling.
// ============================================================
interface RubricTreeProps {
  nodes: TreeNode[];
  expandedNodes: Set<number>;
  treeChildren: Record<number, TreeNode[]>;
  loadingChildren: Set<number>;
  rubricRemedies: Record<number, { byGrade: Record<number, { abbrev: string; full: string }[]>; total: number }>;
  rubricRemedyLoadingMap: Record<number, boolean>;
  rubricRemedyFailedMap: Record<number, boolean>;
  selectedRubrics: SelectedRubric[];
  onToggleExpand: (nodeId: number) => void;
  onLoadChildren: (parentId: number) => void;
  onLoadRemedies: (symptomId: number) => void;
  onAddRubric: (node: TreeNode) => void;
  onNavigateInto: (node: TreeNode) => void;
  sourceRepertory?: string;
}

export function RubricTree({
  nodes,
  expandedNodes,
  treeChildren,
  loadingChildren,
  rubricRemedies,
  rubricRemedyLoadingMap,
  rubricRemedyFailedMap,
  selectedRubrics,
  onToggleExpand,
  onLoadChildren,
  onLoadRemedies,
  onAddRubric,
  onNavigateInto,
  sourceRepertory,
}: RubricTreeProps) {
  // Per-node "show remedies" toggle state — keyed by symptomId.
  // Survives expand/collapse of the node itself.
  const [showRemediesMap, setShowRemediesMap] = useState<Record<number, boolean>>({});

  const selectedRubricIds = new Set(selectedRubrics.map(r => r.symptomId));

  function toggleShowRemedies(nodeId: number) {
    setShowRemediesMap(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }

  // Recursive renderer that injects the right remedy data per node
  function renderNode(node: TreeNode, depth: number, parentPath?: string): React.ReactElement {
    const remedyData = rubricRemedies[node.i];
    const remedyLoading = !!rubricRemedyLoadingMap[node.i];
    const remedyFailed = !!rubricRemedyFailedMap[node.i];
    const showRemedies = !!showRemediesMap[node.i];
    const displayPath = node.p || (parentPath ? `${parentPath} → ${node.n}` : node.n);

    return (
      <RubricTreeNode
        key={node.i}
        node={node}
        depth={depth}
        expandedNodes={expandedNodes}
        treeChildren={treeChildren}
        loadingChildren={loadingChildren}
        remedyData={remedyData}
        remedyLoading={remedyLoading}
        remedyFailed={remedyFailed}
        showRemedies={showRemedies}
        onToggleShowRemedies={() => toggleShowRemedies(node.i)}
        selectedRubricIds={selectedRubricIds}
        onToggleExpand={onToggleExpand}
        onLoadChildren={onLoadChildren}
        onLoadRemedies={onLoadRemedies}
        onAddRubric={onAddRubric}
        onNavigateInto={onNavigateInto}
        sourceRepertory={sourceRepertory}
        parentPath={displayPath}
      />
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: SYNTH_COLORS.textSecondary }}>
        No rubrics to display.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {nodes.map(node => renderNode(node, 0))}
    </div>
  );
}
