/** GET /api/rubrics/chapters — list chapters (paths) for a given author
 *
 * Returns: { items: [{ name: 'MIND', rubricCount: 3754 }, ...] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const author = url.searchParams.get('author') || '';

  let rubrics = await getRubrics();
  if (author) rubrics = rubrics.filter(r => r.author === author);

  // Count rubrics per chapter
  const chapterCounts = new Map<string, number>();
  for (const r of rubrics) {
    const ch = r.path || 'UNKNOWN';
    chapterCounts.set(ch, (chapterCounts.get(ch) || 0) + 1);
  }

  const items = Array.from(chapterCounts.entries())
    .map(([name, rubricCount]) => ({ name, rubricCount }))
    .sort((a, b) => b.rubricCount - a.rubricCount);

  return NextResponse.json({ items, total: items.length });
}
