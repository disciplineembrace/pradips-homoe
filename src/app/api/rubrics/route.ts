/** GET /api/rubrics — paginated list (requires auth+PIN)
 *
 * Returns rubrics with:
 * - remedies: string[] (original source data, preserved)
 * - byGrade: Record<number, string[]> (computed for display)
 * - remedyCount: total unique remedies
 *
 * Grade handling:
 * - Synthesis remedies have [abbrev, grade] pairs → real grades
 * - Kent/Phatak/Murphy/Boericke have plain strings → grade 1 (NORMAL/BLACK)
 *   until source grades are verified from PDFs
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';
import { groupRemediesByGrade } from '@/lib/repertory-grades';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const author = url.searchParams.get('author') || '';
  const chapter = url.searchParams.get('chapter') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '50', 10)));

  let rubrics = await getRubrics();
  if (author) rubrics = rubrics.filter(r => r.author === author);
  if (chapter) rubrics = rubrics.filter(r => r.path === chapter);
  if (q) {
    rubrics = rubrics.filter(r =>
      (r.title + ' ' + (r.path || '') + ' ' + ((r.remedies || []).join(' '))).toLowerCase().includes(q)
    );
  }

  const total = rubrics.length;
  const start = (page - 1) * pageSize;
  const pageItems = rubrics.slice(start, start + pageSize);

  // Add byGrade + remedyCount for display
  const items = pageItems.map(r => {
    const remedies = r.remedies || [];
    const { byGrade, totalRemedies } = groupRemediesByGrade(remedies, r.author || '');
    return {
      ...r,
      byGrade,
      remedyCount: totalRemedies,
    };
  });

  return NextResponse.json(
    { total, page, pageSize, items },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
  );
}
