/** GET /api/repertory/main-rubrics?author=Kent&chapter=MIND&q=&offset=0&limit=100 */
import { NextRequest, NextResponse } from 'next/server';
import { listMainRubrics } from '@/lib/repertory';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const url = new URL(req.url);
  const author = (url.searchParams.get('author') || '').trim();
  const chapter = (url.searchParams.get('chapter') || '').trim();
  const q = (url.searchParams.get('q') || '').trim();
  const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;
  const limit = Math.min(500, parseInt(url.searchParams.get('limit') || '100', 10) || 100);

  if (!author || !chapter) {
    return NextResponse.json({ error: 'Missing author or chapter' }, { status: 400 });
  }
  const result = await listMainRubrics(author, chapter, { q, offset, limit });
  return NextResponse.json(result);
}
