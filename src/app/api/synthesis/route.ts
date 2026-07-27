/** GET /api/synthesis — Synthesis repertory search and repertorization API */
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

async function loadTree() {
  if (_tree) return _tree;
  const data = await fs.readFile(path.join(DATA_DIR, 'tree.json'), 'utf-8');
  _tree = JSON.parse(data);
  return _tree!;
}

async function loadChapters() {
  if (_chapters) return _chapters;
  const data = await fs.readFile(path.join(DATA_DIR, 'chapters.json'), 'utf-8');
  _chapters = JSON.parse(data);
  return _chapters!;
}

async function loadRemedies() {
  if (_remedies) return _remedies;
  const data = await fs.readFile(path.join(DATA_DIR, 'remedies.json'), 'utf-8');
  _remedies = JSON.parse(data);
  return _remedies!;
}

async function loadCrossRefs() {
  if (_crossRefs) return _crossRefs;
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'cross_references.json'), 'utf-8');
    _crossRefs = JSON.parse(data);
  } catch {
    _crossRefs = {};
  }
  return _crossRefs!;
}

async function loadRemedyChunk(symptomId: number) {
  const chunkIdx = Math.floor(symptomId / 20000) % 8;
  // Actually, symptom IDs are large numbers like 13401754
  // Need a different chunking strategy - find which chunk contains this symptom
  // Let's load all chunks lazily and search
  if (_remedyChunks[chunkIdx]) return _remedyChunks[chunkIdx];
  try {
    const data = await fs.readFile(path.join(DATA_DIR, `remedies_chunk_${String(chunkIdx).padStart(3, '0')}.json`), 'utf-8');
    _remedyChunks[chunkIdx] = JSON.parse(data);
    return _remedyChunks[chunkIdx];
  } catch {
    return {};
  }
}

async function getRemediesForSymptom(symptomId: number): Promise<{r: string, d: number}[]> {
  // Search all chunks for this symptom
  for (let i = 0; i < 8; i++) {
    if (!_remedyChunks[i]) {
      try {
        const data = await fs.readFile(path.join(DATA_DIR, `remedies_chunk_${String(i).padStart(3, '0')}.json`), 'utf-8');
        _remedyChunks[i] = JSON.parse(data);
      } catch {
        _remedyChunks[i] = {};
      }
    }
    const key = String(symptomId);
    if (_remedyChunks[i][key]) {
      return _remedyChunks[i][key];
    }
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
        // Return top-level (chapters)
        const chapters = await loadChapters();
        return NextResponse.json({ children: chapters.map((c: any) => ({
          i: c.id, f: 0, n: c.name, l: 1, c: c.id, p: c.path
        })) });
      }
    }
    
    if (action === 'search') {
      const q = (url.searchParams.get('q') || '').trim().toLowerCase();
      if (q.length < 2) return NextResponse.json({ results: [] });
      
      const tree = await loadTree();
      const results = tree
        .filter((n: any) => n.p && n.p.toLowerCase().includes(q))
        .slice(0, 50)
        .map((n: any) => ({
          id: n.i,
          name: n.n,
          path: n.p,
          level: n.l,
          chapterId: n.c,
          fatherId: n.f,
        }));
      
      return NextResponse.json({ results });
    }
    
    if (action === 'remedies') {
      const symptomId = parseInt(url.searchParams.get('symptomId') || '0', 10);
      if (!symptomId) return NextResponse.json({ remedies: [], total: 0 });
      
      const remedies = await getRemediesForSymptom(symptomId);
      const remediesList = await loadRemedies();
      
      // Group by degree
      const byGrade: Record<number, { abbrev: string, full: string }[]> = {};
      for (const r of remedies) {
        if (!byGrade[r.d]) byGrade[r.d] = [];
        byGrade[r.d].push({
          abbrev: r.r,
          full: remediesList[r.r] || r.r,
        });
      }
      
      return NextResponse.json({
        symptomId,
        total: remedies.length,
        byGrade,
      });
    }
    
    if (action === 'repertorize') {
      const symptomIds = (url.searchParams.get('symptomIds') || '').split(',')
        .filter(Boolean).map(id => parseInt(id, 10));
      const weights = (url.searchParams.get('weights') || '').split(',')
        .filter(Boolean).map(w => parseInt(w, 10));
      
      if (symptomIds.length === 0) return NextResponse.json({ results: [] });
      
      // Get remedies for each selected symptom
      const remedyScores: Record<string, { total: number, rubrics: {symptomId: number, grade: number, weight: number}[] }> = {};
      
      for (let i = 0; i < symptomIds.length; i++) {
        const sid = symptomIds[i];
        const weight = weights[i] || 1;
        const remedies = await getRemediesForSymptom(sid);
        
        for (const r of remedies) {
          if (!remedyScores[r.r]) {
            remedyScores[r.r] = { total: 0, rubrics: [] };
          }
          const score = r.d * weight;
          remedyScores[r.r].total += score;
          remedyScores[r.r].rubrics.push({ symptomId: sid, grade: r.d, weight });
        }
      }
      
      // Calculate coverage and sort
      const totalRubrics = symptomIds.length;
      const results = Object.entries(remedyScores)
        .map(([abbrev, data]) => ({
          abbrev,
          full: _remedies?.[abbrev] || abbrev,
          totalScore: data.total,
          coverage: `${data.rubrics.length}/${totalRubrics}`,
          coverageCount: data.rubrics.length,
          coverageTotal: totalRubrics,
          rubrics: data.rubrics,
        }))
        .sort((a, b) => b.totalScore - a.totalScore || b.coverageCount - a.coverageCount)
        .slice(0, 100);
      
      return NextResponse.json({ results, totalRubrics });
    }
    
    if (action === 'crossrefs') {
      const symptomId = url.searchParams.get('symptomId');
      if (!symptomId) return NextResponse.json({ crossRefs: [] });
      
      const crossRefs = await loadCrossRefs();
      const refs = crossRefs[symptomId] || [];
      return NextResponse.json({ crossRefs: refs });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
