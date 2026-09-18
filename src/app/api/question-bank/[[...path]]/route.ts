/**
 * /api/question-bank/[...path] — catch-all dispatcher
 *
 * Consolidates 6 question-bank endpoints into ONE serverless function to
 * comply with Vercel Hobby plan's 12-function limit.
 *
 * Routes handled:
 *   GET/POST   /api/question-bank                → generate
 *   GET        /api/question-bank/usage          → usage
 *   POST       /api/question-bank/submit         → submit
 *   GET/POST/DELETE  /api/question-bank/bookmark → bookmark
 *   GET/POST/DELETE  /api/question-bank/review    → review
 *   POST       /api/question-bank/ai-generate    → ai-generate
 */
import { NextRequest, NextResponse } from 'next/server';
import { handler_post as generatePost } from './handlers/generate';
import { handler_get as usageGet } from './handlers/usage';
import { handler_post as submitPost, handler_get as submitGet } from './handlers/submit';
import { handler_get as bookmarkGet, handler_post as bookmarkPost, handler_delete as bookmarkDelete } from './handlers/bookmark';
import { handler_get as reviewGet, handler_post as reviewPost, handler_delete as reviewDelete } from './handlers/review';
import { handler_post as aiGeneratePost } from './handlers/ai-generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (!seg0) return NextResponse.json({ error: 'Method not allowed on root' }, { status: 405 });
    if (seg0 === 'usage') return usageGet();
    if (seg0 === 'submit') return submitGet();
    if (seg0 === 'bookmark') return bookmarkGet();
    if (seg0 === 'review') return reviewGet();
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (!seg0) return generatePost(req);
    if (seg0 === 'submit') return submitPost(req);
    if (seg0 === 'bookmark') return bookmarkPost(req);
    if (seg0 === 'review') return reviewPost(req);
    if (seg0 === 'ai-generate') return aiGeneratePost(req);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];
  try {
    if (seg0 === 'bookmark') return bookmarkDelete(req);
    if (seg0 === 'review') return reviewDelete(req);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}
