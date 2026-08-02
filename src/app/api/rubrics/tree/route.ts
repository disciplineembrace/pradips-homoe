/** GET /api/rubrics/tree — universal hierarchical rubric tree
 *
 * Uses parentId field for proper parent-child hierarchy.
 * Supports unlimited nesting levels.
 *
 * Remedy format: "name|grade" (grade 1=bold, 2=italic, 3=plain)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RubricRecord {
  id: string;
  parentId: string | null;
  source: string;
  chapter: string;
  title: string;
  fullPath?: string;
  level: number;
  remedies: string[];
  crossReferences?: string[];
}

interface RemedyEntry {
  name: string;
  grade: number;
}

interface SubRubric {
  id: string;
  title: string;
  subTitle: string;
  remedies: RemedyEntry[];
  level: number;
  subRubrics?: SubRubric[];
  crossReferences?: string[];
}

interface MainRubricNode {
  id: string;
  main: string;
  chapter: string;
  author: string;
  subRubrics: SubRubric[];
  totalRemedies: number;
  hasChildren: boolean;
  ownRemedies?: RemedyEntry[];
  crossReferences?: string[];
}

function parseRemedy(rem: string): RemedyEntry {
  const parts = rem.split('|');
  return {
    name: parts[0],
    grade: parts.length > 1 ? parseInt(parts[1], 10) : 3,
  };
}

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const author = url.searchParams.get('author') || '';
  const chapter = url.searchParams.get('chapter') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '20', 10)));

  let rubrics: RubricRecord[] = await getRubrics();

  // Filter by author (check both "source" and "author" fields)
  if (author) {
    rubrics = rubrics.filter(r => r.source === author || (r as any).author === author);
  }
  // Filter by chapter
  if (chapter) {
    rubrics = rubrics.filter(r => r.chapter === chapter || (r as any).path === chapter);
  }

  // Search filter
  if (q) {
    rubrics = rubrics.filter(r => {
      const remedyText = (r.remedies || []).map(rem => rem.split('|')[0]).join(' ');
      return (r.title + ' ' + r.chapter + ' ' + remedyText).toLowerCase().includes(q);
    });
  }

  // Build hierarchy using parentId
  // Level 0 (parentId === null) = main rubrics
  // Level 1+ (parentId set) = sub-rubrics

  const mainRubrics = rubrics.filter(r => !r.parentId || r.level === 0);
  const subRubrics = rubrics.filter(r => r.parentId && r.level > 0);

  // Index sub-rubrics by parentId for fast lookup
  const subByParent = new Map<string, SubRubric[]>();
  for (const r of subRubrics) {
    const parentId = r.parentId!;
    if (!subByParent.has(parentId)) {
      subByParent.set(parentId, []);
    }
    const remedies = (r.remedies || []).map(parseRemedy);
    subByParent.get(parentId)!.push({
      id: r.id,
      title: r.fullPath || r.title,
      subTitle: r.title,
      remedies,
      level: r.level,
      crossReferences: r.crossReferences,
    });
  }

  // Build main rubric nodes
  const allNodes: MainRubricNode[] = [];

  for (const r of mainRubrics) {
    const subs = subByParent.get(r.id) || [];
    const ownRemedies = (r.remedies || []).map(parseRemedy);

    // Collect all remedies (own + sub-rubric)
    const remedySet = new Set<string>();
    for (const rem of ownRemedies) remedySet.add(rem.name);
    for (const sub of subs) {
      for (const rem of sub.remedies) remedySet.add(rem.name);
    }

    // Sort sub-rubrics alphabetically
    subs.sort((a, b) => a.subTitle.localeCompare(b.subTitle));

    allNodes.push({
      id: r.id,
      main: r.title,
      chapter: r.chapter,
      author: r.source,
      subRubrics: subs,
      totalRemedies: remedySet.size,
      hasChildren: subs.length > 0,
      ownRemedies: ownRemedies.length > 0 ? ownRemedies : undefined,
      crossReferences: r.crossReferences,
    });
  }

  // Sort main rubrics alphabetically
  allNodes.sort((a, b) => a.main.localeCompare(b.main));

  // Paginate
  const total = allNodes.length;
  const start = (page - 1) * pageSize;
  const items = allNodes.slice(start, start + pageSize);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items,
    chapter,
    author,
  });
}
