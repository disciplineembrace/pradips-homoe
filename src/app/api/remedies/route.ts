/** GET /api/remedies — list remedies (paginated, requires auth+PIN)
 *
 * OPTIMIZED:
 * - Uses getRemediesIndex() instead of getRemedies() — loads 1.4MB
 *   instead of 20MB (93% reduction).
 * - Uses listRemedies() which builds author/letter indexes for O(1) filtering.
 * - Adds Cache-Control header for browser caching (60s swr).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listRemedies } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

// Always revalidate but allow short browser cache
export const revalidate = 60;

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const author = url.searchParams.get('author') || '';
  const letter = (url.searchParams.get('letter') || '').toUpperCase();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '50', 10)));

  const { total, items } = await listRemedies({
    q: q || undefined,
    author: author || undefined,
    letter: letter || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  return NextResponse.json(
    { total, page, pageSize, items },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  );
}
