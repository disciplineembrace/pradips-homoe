/** GET /api/rubrics/children — lazy-load direct children of a rubric node
 *
 * Returns ONE LEVEL of children for lazy-loading tree expansion.
 * Supports unlimited hierarchy depth via recursive parentId lookup.
 *
 * Query params:
 *   author   — Kent | Phatak | Murphy | Boericke (required)
 *   parentId — parent rubric ID (omit to get chapter roots)
 *   chapter  — filter by chapter (used when fetching roots)
 *
 * Response: { children: [{ id, title, fullPath, chapter, level, parentId,
 *                          hasChildren, remedyCount, byGrade, remedies }] }
 *
 * Each child includes:
 *   - hasChildren: boolean (whether this node has sub-rubrics)
 *   - remedyCount: number of remedies directly attached to this rubric
 *   - byGrade: { 4: string[], 3: string[], 2: string[], 1: string[] }
 *   - remedies: parsed { abbrev, grade }[] sorted G4→G1, alpha within grade
 *
 * Grades are the ORIGINAL source grades — never calculated or mixed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cached children index per author: { author: Map<parentId|null, RubricRecord[]> }
let _childrenIndex: Map<string, Map<string | null, any[]>> | null = null;
let _indexBuilding = false;

async function buildChildrenIndex(): Promise<Map<string, Map<string | null, any[]>>> {
  if (_childrenIndex) return _childrenIndex;
  if (_indexBuilding) {
    while (_indexBuilding) {
      await new Promise(r => setTimeout(r, 50));
    }
    return _childrenIndex!;
  }
  _indexBuilding = true;
  try {
    const allRubrics = await getRubrics();
    const index = new Map<string, Map<string | null, any[]>>();
    for (const r of allRubrics) {
      const author = r.source || (r as any).author || 'Unknown';
      if (!index.has(author)) index.set(author, new Map());
      const authorMap = index.get(author)!;
      const pid = r.parentId || null;
      if (!authorMap.has(pid)) authorMap.set(pid, []);
      authorMap.get(pid)!.push(r);
    }
    _childrenIndex = index;
    return index;
  } finally {
    _indexBuilding = false;
  }
}

function parseRemedies(remedies: string[]): { abbrev: string; grade: number }[] {
  return (remedies || []).map(rem => {
    const parts = rem.split('|');
    return { abbrev: parts[0], grade: parseInt(parts[1] || '1', 10) };
  });
}

function buildByGrade(parsed: { abbrev: string; grade: number }[]): {
  sorted: { abbrev: string; grade: number }[];
  byGrade: { 4: string[]; 3: string[]; 2: string[]; 1: string[] };
} {
  const byGrade = { 4: [] as string[], 3: [] as string[], 2: [] as string[], 1: [] as string[] };
  for (const r of parsed) {
    const g = r.grade >= 1 && r.grade <= 4 ? r.grade : 1;
    byGrade[g as 1 | 2 | 3 | 4].push(r.abbrev);
  }
  // Sort each grade alphabetically
  for (const g of [4, 3, 2, 1] as const) {
    byGrade[g].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  // Sorted flat list: G4 first (alpha), then G3, G2, G1
  const sorted: { abbrev: string; grade: number }[] = [];
  for (const g of [4, 3, 2, 1] as const) {
    for (const abbrev of byGrade[g]) {
      sorted.push({ abbrev, grade: g });
    }
  }
  return { sorted, byGrade };
}

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const author = url.searchParams.get('author') || '';
  const parentId = url.searchParams.get('parentId'); // null/empty = roots
  const chapter = url.searchParams.get('chapter') || '';

  if (!author) {
    return NextResponse.json({ error: 'author parameter required' }, { status: 400 });
  }

  const index = await buildChildrenIndex();
  const authorMap = index.get(author);
  if (!authorMap) {
    return NextResponse.json({ children: [], author, parentId: parentId || null });
  }

  // Get direct children of parentId (or roots if no parentId)
  const pidKey = parentId || null;
  let children = authorMap.get(pidKey) || [];

  // For roots, optionally filter by chapter
  if (!parentId && chapter) {
    children = children.filter(r => (r.chapter || '').toLowerCase() === chapter.toLowerCase());
  }

  // Build response — need hasChildren flag, so check if each child has its own children
  const result = children.map(r => {
    const parsed = parseRemedies(r.remedies || []);
    const { sorted, byGrade } = buildByGrade(parsed);
    const hasChildren = authorMap.has(r.id) && (authorMap.get(r.id)?.length || 0) > 0;
    const displayName = r.fullPath || r.title || '';
    return {
      id: r.id,
      title: r.title,
      fullPath: displayName,
      chapter: r.chapter || '',
      level: r.level || 0,
      parentId: r.parentId || null,
      hasChildren,
      remedyCount: parsed.length,
      byGrade,
      remedies: sorted,
    };
  });

  // Sort: rubrics with children first (so tree structure is visible), then alphabetically
  result.sort((a, b) => {
    if (a.hasChildren !== b.hasChildren) return a.hasChildren ? -1 : 1;
    return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
  });

  return NextResponse.json({
    children: result,
    author,
    parentId: parentId || null,
    chapter: chapter || null,
    count: result.length,
  });
}
