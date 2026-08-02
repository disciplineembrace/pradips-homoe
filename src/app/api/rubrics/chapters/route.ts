/** GET /api/rubrics/chapters — list chapters for a given author */
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
  if (author) {
    rubrics = rubrics.filter(r => r.source === author || (r as any).author === author);
  }

  const chapterCounts = new Map<string, number>();
  for (const r of rubrics) {
    const ch = r.chapter || (r as any).path || 'UNKNOWN';
    chapterCounts.set(ch, (chapterCounts.get(ch) || 0) + 1);
  }

  const items = Array.from(chapterCounts.entries())
    .map(([name, rubricCount]) => ({ name, rubricCount }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ items, total: items.length });
}
