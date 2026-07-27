/** GET /api/synthesis — Synthesis repertory API with full features */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
const DATA_DIR = path.join(process.cwd(), 'data', 'synthesis');

let _tree: any[] | null = null;
let _chapters: any[] | null = null;
let _remedies: Record<string, string> | null = null;
let _remedyChunks: Record<number, Record<string, any[]>> = {};
let _crossRefs: Record<string, any[]> | null = null;
let _authors: any[] | null = null;

async function loadTree() { if (_tree) return _tree; _tree = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'tree.json'), 'utf-8')); return _tree!; }
async function loadChapters() { if (_chapters) return _chapters; _chapters = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'chapters.json'), 'utf-8')); return _chapters!; }
async function loadRemedies() { if (_remedies) return _remedies; _remedies = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'remedies.json'), 'utf-8')); return _remedies!; }
async function loadCrossRefs() { if (_crossRefs) return _crossRefs; try { _crossRefs = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'cross_references.json'), 'utf-8')); } catch { _crossRefs = {}; } return _crossRefs!; }

async function getRemediesForSymptom(symptomId: number) {
  for (let i = 0; i < 8; i++) {
    if (!_remedyChunks[i]) { try { _remedyChunks[i] = JSON.parse(await fs.readFile(path.join(DATA_DIR, `remedies_chunk_${String(i).padStart(3, '0')}.json`), 'utf-8')); } catch { _remedyChunks[i] = {}; } }
    const key = String(symptomId);
    if (_remedyChunks[i][key]) return _remedyChunks[i][key];
  }
  return [];
}

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'search';

  try {
    if (action === 'chapters') {
      const chapters = await loadChapters();
      return NextResponse.json({ chapters });
    }

    if (action === 'tree') {
      const parentId = url.searchParams.get('parentId');
      const tree = await loadTree();
      if (parentId) {
        const pid = parseInt(parentId, 10);
        const children = tree.filter((n: any) => n.f === pid);
        return NextResponse.json({ children });
      } else {
        const chapters = await loadChapters();
        return NextResponse.json({ children: chapters.map((c: any) => ({ i: c.id, f: 0, n: c.name, l: 1, c: c.id, p: c.path })) });
      }
    }

    if (action === 'search') {
      const q = (url.searchParams.get('q') || '').trim().toLowerCase();
      if (q.length < 2) return NextResponse.json({ results: [], total: 0 });
      const tree = await loadTree();
      const all = tree.filter((n: any) => n.p && n.p.toLowerCase().includes(q));
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = Math.min(50, parseInt(url.searchParams.get('pageSize') || '30', 10));
      const total = all.length;
      const start = (page - 1) * pageSize;
      const results = all.slice(start, start + pageSize).map((n: any) => ({ id: n.i, name: n.n, path: n.p, level: n.l, chapterId: n.c, fatherId: n.f }));
      return NextResponse.json({ results, total, page, pageSize });
    }

    if (action === 'remedies') {
      const symptomId = parseInt(url.searchParams.get('symptomId') || '0', 10);
      if (!symptomId) return NextResponse.json({ remedies: [], total: 0 });
      const remedies = await getRemediesForSymptom(symptomId);
      const remediesList = await loadRemedies();
      const byGrade: Record<number, { abbrev: string; full: string }[]> = {};
      for (const r of remedies) { if (!byGrade[r.d]) byGrade[r.d] = []; byGrade[r.d].push({ abbrev: r.r, full: remediesList[r.r] || r.r }); }
      return NextResponse.json({ symptomId, total: remedies.length, byGrade });
    }

    if (action === 'repertorize') {
      const symptomIds = (url.searchParams.get('symptomIds') || '').split(',').filter(Boolean).map(id => parseInt(id, 10));
      const weights = (url.searchParams.get('weights') || '').split(',').filter(Boolean).map(w => parseInt(w, 10));
      if (symptomIds.length === 0) return NextResponse.json({ results: [], totalRubrics: 0 });
      const remedyScores: Record<string, { total: number; rubrics: { symptomId: number; grade: number; weight: number }[] }> = {};
      for (let i = 0; i < symptomIds.length; i++) {
        const sid = symptomIds[i]; const weight = weights[i] || 1;
        const remedies = await getRemediesForSymptom(sid);
        for (const r of remedies) { if (!remedyScores[r.r]) remedyScores[r.r] = { total: 0, rubrics: [] }; remedyScores[r.r].total += r.d * weight; remedyScores[r.r].rubrics.push({ symptomId: sid, grade: r.d, weight }); }
      }
      const totalRubrics = symptomIds.length;
      const results = Object.entries(remedyScores).map(([abbrev, data]) => ({ abbrev, full: _remedies?.[abbrev] || abbrev, totalScore: data.total, coverage: `${data.rubrics.length}/${totalRubrics}`, coverageCount: data.rubrics.length, coverageTotal: totalRubrics, rubrics: data.rubrics })).sort((a, b) => b.totalScore - a.totalScore || b.coverageCount - a.coverageCount).slice(0, 200);
      return NextResponse.json({ results, totalRubrics });
    }

    if (action === 'crossrefs') {
      const symptomId = url.searchParams.get('symptomId');
      if (!symptomId) return NextResponse.json({ crossRefs: [] });
      const crossRefs = await loadCrossRefs();
      return NextResponse.json({ crossRefs: crossRefs[symptomId] || [] });
    }

    if (action === 'remedyList') {
      const q = (url.searchParams.get('q') || '').trim().toLowerCase();
      const remedies = await loadRemedies();
      let entries = Object.entries(remedies);
      if (q) entries = entries.filter(([abbrev, full]) => abbrev.toLowerCase().includes(q) || full.toLowerCase().includes(q));
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = 100;
      const total = entries.length;
      const start = (page - 1) * pageSize;
      const items = entries.slice(start, start + pageSize).map(([abbrev, full]) => ({ abbrev, full }));
      return NextResponse.json({ remedies: items, total, page, pageSize });
    }

    if (action === 'rubricDetail') {
      const rubricId = parseInt(url.searchParams.get('rubricId') || '0', 10);
      if (!rubricId) return NextResponse.json({ error: 'Invalid rubric ID' }, { status: 400 });
      const tree = await loadTree();
      const node = tree.find((n: any) => n.i === rubricId);
      if (!node) return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
      const children = tree.filter((n: any) => n.f === rubricId);
      const remedies = await getRemediesForSymptom(rubricId);
      const remediesList = await loadRemedies();
      const crossRefs = await loadCrossRefs();
      const byGrade: Record<number, { abbrev: string; full: string }[]> = {};
      for (const r of remedies) { if (!byGrade[r.d]) byGrade[r.d] = []; byGrade[r.d].push({ abbrev: r.r, full: remediesList[r.r] || r.r }); }
      return NextResponse.json({
        rubric: { id: node.i, name: node.n, path: node.p, level: node.l, chapterId: node.c, fatherId: node.f },
        children: children.map((c: any) => ({ id: c.i, name: c.n, path: c.p, level: c.l })),
        remedyCount: remedies.length,
        byGrade,
        crossRefs: crossRefs[String(rubricId)] || [],
      });
    }

    if (action === 'stats') {
      const tree = await loadTree();
      const chapters = await loadChapters();
      const remedies = await loadRemedies();
      const crossRefs = await loadCrossRefs();
      return NextResponse.json({
        rubrics: tree.length,
        remedies: Object.keys(remedies).length,
        chapters: chapters.length,
        crossRefs: Object.values(crossRefs).reduce((sum, arr) => sum + arr.length, 0),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
