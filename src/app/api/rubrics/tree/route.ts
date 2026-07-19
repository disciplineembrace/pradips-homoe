/** GET /api/rubrics/tree — hierarchical rubric tree (main rubric → sub-rubrics)
 *
 * Groups rubrics by their main rubric name (the part before " — " in the title).
 * Returns chapters → main rubrics → sub-rubrics with their remedies.
 *
 * Query params:
 *   author     — filter by author (Kent, Phatak, Murphy, Boericke)
 *   chapter    — filter by chapter/path (e.g., MIND, HEAD)
 *   q          — search query (matches title or remedy)
 *   page       — pagination (1-based)
 *   pageSize   — items per page (default 20, max 100)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RubricRecord {
  id: string;
  path: string;
  title: string;
  author: string;
  remedies: string[];
}

interface SubRubric {
  id: string;
  title: string;       // full title (main — sub)
  subTitle: string;    // just the sub part
  remedies: string[];
}

interface MainRubricNode {
  id: string;          // synthetic: author:chapter:mainSlug
  main: string;        // main rubric name
  chapter: string;
  author: string;
  subRubrics: SubRubric[];
  totalRemedies: number;    // distinct remedies across all sub-rubrics
  hasChildren: boolean;
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

  // Filter by author
  if (author) rubrics = rubrics.filter(r => r.author === author);
  // Filter by chapter
  if (chapter) rubrics = rubrics.filter(r => r.path === chapter);

  // Search filter
  if (q) {
    rubrics = rubrics.filter(r =>
      (r.title + ' ' + (r.path || '') + ' ' + ((r.remedies || []).join(' '))).toLowerCase().includes(q)
    );
  }

  // Group by main rubric (part before " — ")
  const byMain = new Map<string, { chapter: string; author: string; subs: SubRubric[] }>();

  for (const r of rubrics) {
    const title = r.title || '';
    let mainName: string;
    let subTitle: string;

    const dashIdx = title.indexOf(' — ');
    if (dashIdx === -1) {
      // No sub-rubric — it's a main rubric with no children
      mainName = title;
      subTitle = '';
    } else {
      mainName = title.slice(0, dashIdx).trim();
      subTitle = title.slice(dashIdx + 3).trim();
    }

    const key = `${r.author}:${r.path}:${mainName}`;
    if (!byMain.has(key)) {
      byMain.set(key, { chapter: r.path, author: r.author, subs: [] });
    }
    const entry = byMain.get(key)!;

    if (subTitle) {
      // It's a sub-rubric
      entry.subs.push({
        id: r.id,
        title: r.title,
        subTitle,
        remedies: r.remedies || [],
      });
    }
    // If no subTitle, this main rubric has no sub-rubrics (it's a leaf)
  }

  // Build the tree nodes
  const allNodes: MainRubricNode[] = [];
  for (const [key, entry] of byMain.entries()) {
    const parts = key.split(':');
    const authorName = parts[0];
    const chapterName = parts[1];
    const mainName = parts.slice(2).join(':');

    // Collect distinct remedies across all sub-rubrics
    const remedySet = new Set<string>();
    for (const s of entry.subs) {
      for (const rem of s.remedies) remedySet.add(rem);
    }

    allNodes.push({
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      main: mainName,
      chapter: chapterName,
      author: authorName,
      subRubrics: entry.subs.sort((a, b) => a.subTitle.localeCompare(b.subTitle)),
      totalRemedies: remedySet.size,
      hasChildren: entry.subs.length > 0,
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
