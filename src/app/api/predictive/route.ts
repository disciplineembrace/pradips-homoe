/** GET /api/predictive — returns empty data (section under development)
 *
 * The Predictive Homeopathy section is currently "Coming Soon".
 * Verified content will be added in a future update.
 *
 * This route returns an empty books array instead of loading the
 * data file, saving ~224 KB of memory per serverless instance.
 *
 * The data file (data/predictive_chapters.json) is preserved on disk
 * for future re-enabling — no data has been deleted.
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  return NextResponse.json({ books: [] });
}
