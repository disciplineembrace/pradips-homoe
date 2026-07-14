/** GET /api/repertory/search?q=&author=&chapter=&limit=50 — instant rubric search */
import { NextRequest, NextResponse } from 'next/server';
import { searchRubrics } from '@/lib/repertory';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const author = (url.searchParams.get('author') || '').trim();
  const chapter = (url.searchParams.get('chapter') || '').trim();
  const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50', 10) || 50);

  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }
  const items = await searchRubrics(q, { author: author || undefined, chapter: chapter || undefined, limit });
  return NextResponse.json({ items });
}
