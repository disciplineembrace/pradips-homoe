/** GET /api/remedies — list remedies (paginated, requires auth+PIN) */
import { NextRequest, NextResponse } from 'next/server';
import { getRemedies } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const author = url.searchParams.get('author') || '';
  const letter = (url.searchParams.get('letter') || '').toUpperCase();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '50', 10)));
  
  let remedies = await getRemedies();
  
  if (author) remedies = remedies.filter(r => r.author === author);
  if (letter) remedies = remedies.filter(r => r.name && r.name[0].toUpperCase() === letter);
  if (q) {
    remedies = remedies.filter(r =>
      (r.name + ' ' + (r.common || '') + ' ' + (r.keynote || '')).toLowerCase().includes(q)
    );
  }
  
  const total = remedies.length;
  const start = (page - 1) * pageSize;
  const items = remedies.slice(start, start + pageSize).map(r => ({
    id: r.id, name: r.name, common: r.common, author: r.author,
    letter: r.letter, chapter: r.chapter, organ: r.organ,
    keynote: r.keynote ? r.keynote.substring(0, 200) : '',
  }));
  
  return NextResponse.json({ total, page, pageSize, items });
}
