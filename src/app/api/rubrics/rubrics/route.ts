/** GET /api/rubrics — paginated list (requires auth+PIN) */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const author = url.searchParams.get('author') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '50', 10)));
  
  let rubrics = await getRubrics();
  if (author) rubrics = rubrics.filter(r => r.author === author);
  if (q) {
    rubrics = rubrics.filter(r =>
      (r.title + ' ' + (r.path || '') + ' ' + ((r.remedies || []).join(' '))).toLowerCase().includes(q)
    );
  }
  
  const total = rubrics.length;
  const start = (page - 1) * pageSize;
  const items = rubrics.slice(start, start + pageSize);
  
  return NextResponse.json({ total, page, pageSize, items });
}
