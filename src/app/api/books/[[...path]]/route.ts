/**
 * /api/books/[...path] — catch-all dispatcher
 *
 * Routes:
 *   GET /api/books         → list all books
 *   GET /api/books/:id     → get book detail with chapters
 */
import { NextRequest, NextResponse } from 'next/server';
import { handler_get as listGet } from './handlers/list';
import { handler_get as detailGet } from './handlers/detail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (!seg0) return listGet();
    // seg0 is the book id
    return detailGet(req, seg0);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}
