/** GET /api/single-rubrics — paginated single-remedy rubrics list */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const revalidate = 300;

type SingleRubric = {
  id: string;
  rubricId: string;
  rubricPath: string;
  rubricTitle: string;
  chapter: string;
  author: string;
  remedy: string;
  remedyCount: number;
  uniqueRemedyCount: number;
};

let _cache: SingleRubric[] | null = null;

async function loadSingleRubrics(): Promise<SingleRubric[]> {
  if (_cache) return _cache;
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'single-rubrics-single-remedy.json');
  try {
    const buf = await fs.readFile(filePath);
    _cache = JSON.parse(buf.toString('utf-8'));
  } catch {
    const altPath = '/home/z/my-project/data/single-rubrics-single-remedy.json';
    const buf = await fs.readFile(altPath);
    _cache = JSON.parse(buf.toString('utf-8'));
  }
  return _cache!;
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

  let items = await loadSingleRubrics();

  if (author) items = items.filter(r => r.author === author);
  if (chapter) items = items.filter(r => r.chapter === chapter);
  if (remedy) items = items.filter(r => r.remedy === remedy);
  if (q) {
    items = items.filter(r =>
      (r.rubricPath + ' ' + r.rubricTitle + ' ' + r.remedy + ' ' + r.chapter + ' ' + r.author).toLowerCase().includes(q)
    );
  }

  switch (sort) {
    case 'rubric-az':
      items.sort((a, b) => a.rubricPath.localeCompare(b.rubricPath));
      break;
    case 'rubric-za':
      items.sort((a, b) => b.rubricPath.localeCompare(a.rubricPath));
      break;
    case 'remedy-az':
      items.sort((a, b) => a.remedy.localeCompare(b.remedy));
      break;
    case 'remedy-za':
      items.sort((a, b) => b.remedy.localeCompare(a.remedy));
      break;
    case 'chapter-az':
      items.sort((a, b) => a.chapter.localeCompare(b.chapter));
      break;
    case 'repertory-az':
      items.sort((a, b) => a.author.localeCompare(b.author));
      break;
  }

  const total = items.length;

  if (view === 'remedy') {
    const byRemedy: Record<string, SingleRubric[]> = {};
    for (const r of items) {
      if (!byRemedy[r.remedy]) byRemedy[r.remedy] = [];
      byRemedy[r.remedy].push(r);
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
      if (!byAuthor[r.author]) byAuthor[r.author] = [];
      byAuthor[r.author].push(r);
    }
    const authorEntries = Object.entries(byAuthor)
      .map(([author, rubrics]) => ({ author, count: rubrics.length, rubrics: rubrics.slice(0, 50) }))
      .sort((a, b) => b.count - a.count);
    return NextResponse.json({
      total: authorEntries.length, totalRubrics: total,
      items: authorEntries, view: 'repertory',
    }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } });
  }

  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  const allItems = await loadSingleRubrics();
  const authors = [...new Set(allItems.map(r => r.author))].sort();
  const chapters = [...new Set(allItems.map(r => r.chapter))].sort();
  const remedies = [...new Set(allItems.map(r => r.remedy))].sort();

  return NextResponse.json({
    total, page, pageSize, items: pagedItems,
    filters: { authors, chapters, remedies }, view: 'rubric',
  }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
}
