/** GET /api/remedies/[id] — full remedy detail (requires auth+PIN)
 *
 * OPTIMIZED:
 * - Uses getRemedyById() which does O(1) Map lookup (was O(n) Array.find
 *   over 3,734 records).
 * - Only loads the requested record, not the entire remedies.json.
 * - Adds Cache-Control header for browser caching.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRemedyById } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export const revalidate = 60;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const r = await getRemedyById(id);
  if (!r) return NextResponse.json({ error: 'Remedy not found' }, { status: 404 });

  return NextResponse.json(r, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
    },
  });
}
