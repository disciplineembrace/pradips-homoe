/** GET /api/repertory/chapters?author=Kent — list chapters of a repertory */
import { NextRequest, NextResponse } from 'next/server';
import { listChapters } from '@/lib/repertory';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const url = new URL(req.url);
  const author = (url.searchParams.get('author') || '').trim();
  if (!author) {
    return NextResponse.json({ error: 'Missing author parameter' }, { status: 400 });
  }
  const items = await listChapters(author);
  return NextResponse.json({ items });
}
