/** GET /api/rubrics/tree — hierarchical rubric tree (main rubric → sub-rubrics)
 *
 * Builds a proper hierarchy using the "level" and "chapter" fields in each rubric.
 * Level 0 = main rubric, Level 1 = sub-rubric, Level 2 = sub-sub-rubric, etc.
 *
 * Returns: chapters → main rubrics → sub-rubrics → sub-sub-rubrics with remedies.
 *
 * Query params:
 *   author     — filter by author (Kent, Phatak, Murphy, Boericke)
 *   chapter    — filter by chapter/path (e.g., Mind, MIND)
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
  chapter?: string;
  level?: number;
  cross_references?: string[];
}

interface SubRubric {
  id: string;
  title: string;       // full title (main → sub)
  subTitle: string;    // just the sub part
  remedies: string[];
  level: number;
  subRubrics?: SubRubric[];  // nested children
  crossReferences?: string[];
}

interface MainRubricNode {
  id: string;          // synthetic: author:chapter:mainSlug
  main: string;        // main rubric name
  chapter: string;
  author: string;
  subRubrics: SubRubric[];
  totalRemedies: number;    // distinct remedies across all sub-rubrics + itself
  hasChildren: boolean;
  ownRemedies?: string[];   // remedies directly on this main rubric (if level 0 with remedies)
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
  // Filter by chapter (check both "path" and "chapter" fields)
  if (chapter) {
    rubrics = rubrics.filter(r => r.path === chapter || r.chapter === chapter);
  }

  // Search filter
  if (q) {
    rubrics = rubrics.filter(r =>
      (r.title + ' ' + (r.path || '') + ' ' + (r.chapter || '') + ' ' + ((r.remedies || []).join(' '))).toLowerCase().includes(q)
    );
  }

  // Build hierarchy using level field
  // Group rubrics by their main rubric (level 0)
  // Then attach level 1+ rubrics as children

  // First, identify main rubrics (level 0 or no level field)
  // For rubrics without level field, try to parse from title
  const mainRubricsMap = new Map<string, MainRubricNode>();
  const allRubricsByKey = new Map<string, RubricRecord[]>();

  for (const r of rubrics) {
    // Determine the main rubric name
    // If level field exists and is 0, the title IS the main rubric
    // If level > 0, we need to extract the main rubric from the title or full_path
    let mainName: string;
    let subTitle: string;
    let level: number;

    if (r.level !== undefined) {
      level = r.level;
      if (level === 0) {
        mainName = r.title;
        subTitle = '';
      } else {
        // For level > 0, extract main name from title
        // Title format: "MAIN - sub - subsub" or "MAIN — sub"
        const title = r.title || '';
        // Try em-dash first (old format), then regular dash (new format)
        let dashIdx = title.indexOf(' — ');
        if (dashIdx === -1) dashIdx = title.indexOf(' - ');
        if (dashIdx > 0) {
          mainName = title.slice(0, dashIdx).trim();
          subTitle = title.slice(dashIdx + 3).trim();
        } else {
          // No separator - treat as main rubric
          mainName = title;
          subTitle = '';
          level = 0;
        }
      }
    } else {
      // No level field - parse from title
      const title = r.title || '';
      let dashIdx = title.indexOf(' — ');
      if (dashIdx === -1) dashIdx = title.indexOf(' - ');
      if (dashIdx > 0) {
        mainName = title.slice(0, dashIdx).trim();
        subTitle = title.slice(dashIdx + 3).trim();
        level = subTitle ? 1 : 0;
      } else {
        mainName = title;
        subTitle = '';
        level = 0;
      }
    }

    const chapterName = r.chapter || r.path || 'UNKNOWN';
    const key = `${r.author}:${chapterName}:${mainName}`;

    if (!mainRubricsMap.has(key)) {
      mainRubricsMap.set(key, {
        id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        main: mainName,
        chapter: chapterName,
        author: r.author,
        subRubrics: [],
        totalRemedies: 0,
        hasChildren: false,
        ownRemedies: [],
      });
    }

    const node = mainRubricsMap.get(key)!;

    if (level === 0 && subTitle === '') {
      // This is the main rubric itself - add its remedies
      if (r.remedies && r.remedies.length > 0) {
        node.ownRemedies = node.ownRemedies || [];
        node.ownRemedies.push(...r.remedies);
      }
    } else {
      // This is a sub-rubric
      node.subRubrics.push({
        id: r.id,
        title: r.title,
        subTitle: subTitle || r.title,
        remedies: r.remedies || [],
        level: level,
        crossReferences: r.cross_references || [],
      });
      node.hasChildren = true;
    }
  }

  // Calculate total remedies and sort sub-rubrics
  const allNodes: MainRubricNode[] = [];
  for (const [, node] of mainRubricsMap) {
    const remedySet = new Set<string>();

    // Add own remedies
    if (node.ownRemedies) {
      for (const rem of node.ownRemedies) remedySet.add(rem);
    }

    // Add sub-rubric remedies
    for (const s of node.subRubrics) {
      for (const rem of s.remedies) remedySet.add(rem);
    }

    node.totalRemedies = remedySet.size;
    node.subRubrics.sort((a, b) => a.subTitle.localeCompare(b.subTitle));

    allNodes.push(node);
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
