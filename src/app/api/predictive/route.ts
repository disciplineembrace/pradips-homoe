/** GET /api/predictive — returns predictive homeopathy books with chapters
 *
 * Loads from data/predictive_chapters.json (224 KB, 2 books, 23 chapters).
 * Data is cached in memory after first load.
 */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

let _cache: { books: any[] } | null = null;

async function loadPredictiveData() {
  if (_cache) return _cache;
  try {
    const filePath = path.join(process.cwd(), 'data', 'predictive_chapters.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    _cache = JSON.parse(raw);
  } catch {
    _cache = { books: [] };
  }
  return _cache!;
}

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const data = await loadPredictiveData();
  return NextResponse.json(data);
}
