/**
 * /api/auth/[...path] — catch-all dispatcher
 *
 * Consolidates 3 auth endpoints into ONE serverless function.
 *
 * Routes:
 *   POST  /api/auth/login    → login (verify password + PIN)
 *   POST  /api/auth/logout   → logout (clear session cookie)
 *   GET   /api/auth/session  → session (check current session)
 */
import { NextRequest, NextResponse } from 'next/server';
import { handler_post as loginPost } from './handlers/login';
import { handler_post as logoutPost } from './handlers/logout';
import { handler_get as sessionGet } from './handlers/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (seg0 === 'session') return sessionGet();
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (seg0 === 'login') return loginPost(req);
    if (seg0 === 'logout') return logoutPost();
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}
