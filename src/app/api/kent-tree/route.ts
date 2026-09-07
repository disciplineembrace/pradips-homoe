/** GET /api/kent-tree — returns all Kent rubric entries with hierarchy
 *
 * Loads from data/kent_rebuilt.json (the freshly rebuilt Kent dataset).
 * Returns entries with full path, hierarchy level, remedies, grades,
 * cross-references, and source page info.
 */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const revalidate = 300;

let _cache: any[] | null = null;

async function loadKentData(): Promise<any[]> {
  if (_cache) return _cache;
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'kent_rebuilt.json');
  try {
    const buf = await fs.readFile(filePath);
    _cache = JSON.parse(buf.toString('utf-8'));
  } catch {
    const altPath = '/home/z/my-project/data/kent_rebuilt.json';
    const buf = await fs.readFile(altPath);
    _cache = JSON.parse(buf.toString('utf-8'));
  }
  return _cache!;
}

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const entries = await loadKentData();

  return NextResponse.json({
    total: entries.length,
    entries: entries.map(e => ({
      id: e.id,
      chapter: e.chapter,
      level: e.level,
      rubricText: e.rubricText,
      fullPath: e.fullPath,
      fullPathParts: e.fullPathParts,
      entryType: e.entryType,
      crossReference: e.crossReference,
      remedies: e.remedies,
      remediesGraded: e.remediesGraded,
      remedyCount: e.remedyCount,
      singleRemedy: e.singleRemedy,
      pdfPage: e.pdfPage,
    })),
  }, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
  });
}
