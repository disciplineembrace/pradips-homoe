/**
 * /api/remedies/[...path] — catch-all dispatcher
 *
 * Routes:
 *   GET /api/remedies         → list (paginated)
 *   GET /api/remedies/:id     → detail
 */
import { NextRequest, NextResponse } from 'next/server';
import { handler_get as listGet } from './handlers/list';
import { handler_get as detailGet } from './handlers/detail';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (!seg0) return listGet(req);
    return detailGet(req, seg0);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}
