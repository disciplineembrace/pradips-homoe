/** GET /api/single-rubrics — paginated single-remedy rubrics */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const revalidate = 300;

let _cache: any[] | null = null;

async function getSingleRubrics() {
  if (_cache) return _cache;
  const all = await getRubrics();
  _cache = all.filter(r => { const rem = r.remedies; return Array.isArray(rem) && new Set(rem).size === 1; })
    .map(r => {
      const chapter = r.path || ''; const title = r.title || '';
      let mainRubric = title, subRubrics: string[] = [];
      if (title.includes('—')) { const p = title.split('—').map((s:string)=>s.trim()); mainRubric=p[0]; subRubrics=p.slice(1); }
      const fp = [chapter, mainRubric, ...subRubrics].join(' → ');
      const rn: Record<string,string> = { 'Kent':'Kent Repertory','Phatak':'Phatak Repertory','Murphy':'Murphy Repertory','Boericke':'William Boericke Repertory' };
      return { id:`sr_${r.id}`, rubricId:r.id, repertory:rn[r.author]||r.author, author:r.author, chapter, mainRubric, subRubrics, singleRemedy:r.remedies[0], fullPath:fp };
    });
  return _cache;
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
  if (q) items = items.filter(r => [r.repertory,r.author,r.chapter,r.mainRubric,...r.subRubrics,r.singleRemedy,r.fullPath].join(' ').toLowerCase().includes(q));
  switch (sort) {
    case 'rubric-az': items.sort((a,b)=>a.fullPath.localeCompare(b.fullPath)); break;
    case 'rubric-za': items.sort((a,b)=>b.fullPath.localeCompare(a.fullPath)); break;
    case 'remedy-az': items.sort((a,b)=>a.singleRemedy.localeCompare(b.singleRemedy)); break;
    case 'remedy-za': items.sort((a,b)=>b.singleRemedy.localeCompare(a.singleRemedy)); break;
    case 'chapter-az': items.sort((a,b)=>a.chapter.localeCompare(b.chapter)); break;
    case 'repertory-az': items.sort((a,b)=>a.repertory.localeCompare(b.repertory)); break;
  }
  const total = items.length;
  if (view === 'remedy') {
    const byR: Record<string,any[]> = {};
    for (const r of items) { if(!byR[r.singleRemedy])byR[r.singleRemedy]=[]; byR[r.singleRemedy].push(r); }
    const e = Object.entries(byR).map(([remedy,rubrics])=>({remedy,count:rubrics.length,rubrics})).sort((a,b)=>b.count-a.count);
    return NextResponse.json({total:e.length,totalRubrics:total,page,pageSize,items:e.slice((page-1)*pageSize,(page-1)*pageSize+pageSize),view:'remedy'},{headers:{'Cache-Control':'private, max-age=30, stale-while-revalidate=60'}});
  }
  if (view === 'repertory') {
    const byR: Record<string,any[]> = {};
    for (const r of items) { if(!byR[r.repertory])byR[r.repertory]=[]; byR[r.repertory].push(r); }
    const e = Object.entries(byR).map(([author,rubrics])=>({author,count:rubrics.length,rubrics:rubrics.slice(0,12)})).sort((a,b)=>b.count-a.count);
    return NextResponse.json({total:e.length,totalRubrics:total,items:e,view:'repertory'},{headers:{'Cache-Control':'private, max-age=60, stale-while-revalidate=120'}});
  }
  const all = await getSingleRubrics();
  const authors = [...new Set(all.map(r=>r.author))].sort();
  const chapters = [...new Set(all.map(r=>r.chapter))].sort();
  const remedies = [...new Set(all.map(r=>r.singleRemedy))].sort();
  return NextResponse.json({total,page,pageSize,items:items.slice((page-1)*pageSize,(page-1)*pageSize+pageSize),filters:{authors,chapters,remedies},view:'rubric'},{headers:{'Cache-Control':'private, max-age=30, stale-while-revalidate=60'}});
}
