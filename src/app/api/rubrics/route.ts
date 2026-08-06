/** GET /api/rubrics — paginated list with full path + grade-wise remedies
 *
 * Returns rubrics with:
 *   - fullPath (e.g. "ANSWERS, abruptly, shortly, curtly - incorrectly")
 *   - chapter (e.g. "Mind")
 *   - level (depth in hierarchy)
 *   - remedies parsed into { abbrev, grade } objects
 *   - byGrade summary: { 4: [...], 3: [...], 2: [...], 1: [...] }
 *
 * Grade colors (displayed client-side):
 *   Grade 4 = Red    (highest importance)
 *   Grade 3 = Green
 *   Grade 2 = Blue
 *   Grade 1 = Black/Grey (normal)
 *
 * Original source grading is preserved — never calculated or estimated.
 * Each repertory (Kent, Phatak, Murphy, Boericke) keeps its own grades.
 */
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
  const chapter = url.searchParams.get('chapter') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '50', 10)));

  let rubrics = await getRubrics();

  // Filter by author (source)
  if (author) {
    rubrics = rubrics.filter(r => r.source === author || (r as any).author === author);
  }

  // Filter by chapter
  if (chapter) {
    rubrics = rubrics.filter(r => (r.chapter || '').toLowerCase() === chapter.toLowerCase());
  }

  // Search query — match against title, fullPath, chapter, and remedy names
  if (q) {
    rubrics = rubrics.filter(r => {
      const title = (r.title || '').toLowerCase();
      const fullPath = (r.fullPath || '').toLowerCase();
      const chapterText = (r.chapter || '').toLowerCase();
      const remedyText = (r.remedies || []).map((rem: string) => rem.split('|')[0]).join(' ').toLowerCase();
      return title.includes(q) || fullPath.includes(q) || chapterText.includes(q) || remedyText.includes(q);
    });
  }

  const total = rubrics.length;
  const start = (page - 1) * pageSize;
  const items = rubrics.slice(start, start + pageSize).map(r => {
    // Parse remedies "abbrev|grade" → { abbrev, grade }
    const parsedRemedies = (r.remedies || []).map((rem: string) => {
      const parts = rem.split('|');
      return {
        abbrev: parts[0],
        grade: parseInt(parts[1] || '1', 10),
      };
    });

    // Group by grade for easy display
    const byGrade: Record<number, string[]> = { 4: [], 3: [], 2: [], 1: [] };
    for (const rem of parsedRemedies) {
      const g = rem.grade >= 1 && rem.grade <= 4 ? rem.grade : 1;
      byGrade[g].push(rem.abbrev);
    }

    // Use fullPath if available, otherwise fall back to title
    const displayPath = r.fullPath || r.title || '';

    return {
      id: r.id,
      title: r.title,
      fullPath: displayPath,
      author: r.source || (r as any).author,
      chapter: r.chapter || '',
      level: r.level || 0,
      parentId: r.parentId || null,
      remedies: parsedRemedies.map(r => r.abbrev),
      remedyCount: parsedRemedies.length,
      byGrade,
    };
  });

  return NextResponse.json({ total, page, pageSize, items });
}
