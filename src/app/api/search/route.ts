/** GET /api/search — search across remedies + rubrics (requires auth+PIN) */
import { NextRequest, NextResponse } from 'next/server';
import { getSearchIndex } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (q.length < 1) return NextResponse.json({ results: [], total: 0 });
  
  const idx = await getSearchIndex();
  const words = q.split(/\s+/).filter(Boolean);
  const results = idx
    .filter(p => words.some(w => p.text.includes(w)))
    .slice(0, 50)
    .map(p => ({ 
      type: p.type, 
      id: p.id, 
      name: p.name, 
      author: p.author,
      href: p.type === 'remedy' ? `/remedy/${p.id}` : `/repertory`,
    }));
  
  return NextResponse.json({ results, total: results.length });
}
