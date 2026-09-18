/**
 * /api/analytics/[...path] — catch-all dispatcher
 *
 * Consolidates 3 analytics endpoints into ONE serverless function.
 *
 * Routes:
 *   GET   /api/analytics/admin   → admin (admin only)
 *   GET   /api/analytics/stats   → stats (public)
 *   POST  /api/analytics/track   → track (public)
 */
import { NextRequest, NextResponse } from 'next/server';
import { handler_get as adminGet } from './handlers/admin';
import { handler_get as statsGet } from './handlers/stats';
import { handler_post as trackPost } from './handlers/track';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (seg0 === 'admin') return adminGet();
    if (seg0 === 'stats') return statsGet();
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (seg0 === 'track') return trackPost(req);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}
