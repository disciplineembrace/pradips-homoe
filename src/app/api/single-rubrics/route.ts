/** GET /api/single-rubrics — paginated single-remedy rubrics
 *
 * Instead of loading a huge pre-computed index, this loads the existing
 * rubrics.json (which is already cached in memory) and filters for
 * single-remedy rubrics on-the-fly. This is fast because:
 * 1. rubrics.json is only 15MB (vs 62MB for pre-computed)
 * 2. The filter is simple: len(set(remedies)) == 1
 * 3. Results are cached in-process after first request
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const revalidate = 300;

type SingleRubric = {
  id: string;
  repertory: string;
  author: string;
  chapter: string;
  mainRubric: string;
  subRubrics: string[];
  singleRemedy: string;
  fullPath: string;
  grade?: number;
};

let _singleRubricsCache: SingleRubric[] | null = null;

async function getSingleRubrics(): Promise<SingleRubric[]> {
  if (_singleRubricsCache) return _singleRubricsCache;

  const allRubrics = await getRubrics();
  const results: SingleRubric[] = [];

  for (const r of allRubrics) {
    const remedies = r.remedies;
    if (!Array.isArray(remedies)) continue;
    const uniqueRemedies = [...new Set(remedies)];
    if (uniqueRemedies.length !== 1) continue;

    const author = r.author || 'Unknown';
    const path = r.path || '';
    const title = r.title || '';
    const rubricId = r.id || '';

    const chapter = path;

    // Parse title for hierarchy using — separator
    let mainRubric = title;
    let subRubrics: string[] = [];
    if (title.includes('—')) {
      const parts = title.split('—').map((p: string) => p.trim());
      mainRubric = parts[0];
      subRubrics = parts.slice(1);
    }

    const fullPathParts = [chapter, mainRubric, ...subRubrics];
    const fullPath = fullPathParts.join(' → ');

    const repertoryName: Record<string, string> = {
      'Kent': 'Kent Repertory',
      'Phatak': 'Phatak Repertory',
      'Murphy': 'Murphy Repertory',
      'Boericke': 'William Boericke Repertory',
    };
    const repertory = repertoryName[author] || author;

    results.push({
      id: `sr_${rubricId}`,
      repertory,
      author,
      chapter,
      mainRubric,
      subRubrics,
      singleRemedy: uniqueRemedies[0],
      fullPath,
    });
  }

  _singleRubricsCache = results;
  return results;
}

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const author = url.searchParams.get('author') || '';
  const chapter = url.searchParams.get('chapter') || '';
  const remedy = url.searchParams.get('remedy') || '';
  const sort = url.searchParams.get('sort') || 'rubric-az';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '25', 10)));
  const view = url.searchParams.get('view') || 'rubric';

  let items = await getSingleRubrics();

  if (author) items = items.filter(r => r.author === author);
  if (chapter) items = items.filter(r => r.chapter === chapter);
  if (remedy) items = items.filter(r => r.singleRemedy === remedy);

  if (q) {
    items = items.filter(r => {
      const searchText = [
        r.repertory, r.author, r.chapter, r.mainRubric,
        ...r.subRubrics, r.singleRemedy, r.fullPath
      ].join(' ').toLowerCase();
      return searchText.includes(q);
    });
  }

  switch (sort) {
    case 'rubric-az':
      items.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
      break;
    case 'rubric-za':
      items.sort((a, b) => b.fullPath.localeCompare(a.fullPath));
      break;
    case 'remedy-az':
      items.sort((a, b) => a.singleRemedy.localeCompare(b.singleRemedy));
      break;
    case 'remedy-za':
      items.sort((a, b) => b.singleRemedy.localeCompare(a.singleRemedy));
      break;
    case 'chapter-az':
      items.sort((a, b) => a.chapter.localeCompare(b.chapter));
      break;
    case 'repertory-az':
      items.sort((a, b) => a.repertory.localeCompare(b.repertory));
      break;
  }

  const total = items.length;

  if (view === 'remedy') {
    const byRemedy: Record<string, SingleRubric[]> = {};
    for (const r of items) {
      if (!byRemedy[r.singleRemedy]) byRemedy[r.singleRemedy] = [];
      byRemedy[r.singleRemedy].push(r);
    }
    const remedyEntries = Object.entries(byRemedy)
      .map(([remedy, rubrics]) => ({ remedy, count: rubrics.length, rubrics }))
      .sort((a, b) => b.count - a.count);
    const remedyTotal = remedyEntries.length;
    const start = (page - 1) * pageSize;
    const pagedRemedies = remedyEntries.slice(start, start + pageSize);
    return NextResponse.json({
      total: remedyTotal, totalRubrics: total, page, pageSize,
      items: pagedRemedies, view: 'remedy',
    }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
  }

  if (view === 'repertory') {
    const byAuthor: Record<string, SingleRubric[]> = {};
    for (const r of items) {
      if (!byAuthor[r.repertory]) byAuthor[r.repertory] = [];
      byAuthor[r.repertory].push(r);
    }
    const authorEntries = Object.entries(byAuthor)
      .map(([author, rubrics]) => ({ author, count: rubrics.length, rubrics: rubrics.slice(0, 12) }))
      .sort((a, b) => b.count - a.count);
    return NextResponse.json({
      total: authorEntries.length, totalRubrics: total,
      items: authorEntries, view: 'repertory',
    }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } });
  }

  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  const allItems = await getSingleRubrics();
  const authors = [...new Set(allItems.map(r => r.author))].sort();
  const chapters = [...new Set(allItems.map(r => r.chapter))].sort();
  const remedies = [...new Set(allItems.map(r => r.singleRemedy))].sort();

  return NextResponse.json({
    total, page, pageSize, items: pagedItems,
    filters: { authors, chapters, remedies }, view: 'rubric',
  }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
}
