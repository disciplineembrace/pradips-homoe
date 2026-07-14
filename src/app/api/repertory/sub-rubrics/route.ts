/** GET /api/repertory/sub-rubrics?author=Kent&chapter=MIND&main=ANGER — list sub-rubrics under a main rubric */
import { NextRequest, NextResponse } from 'next/server';
import { listSubRubrics } from '@/lib/repertory';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const url = new URL(req.url);
  const author = (url.searchParams.get('author') || '').trim();
  const chapter = (url.searchParams.get('chapter') || '').trim();
  const main = (url.searchParams.get('main') || '').trim();

  if (!author || !chapter || !main) {
    return NextResponse.json({ error: 'Missing author, chapter, or main' }, { status: 400 });
  }
  const items = await listSubRubrics(author, chapter, main);
  return NextResponse.json({ items });
}
