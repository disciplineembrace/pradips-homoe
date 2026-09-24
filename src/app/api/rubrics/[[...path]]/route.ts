/**
 * /api/rubrics/[...path] — catch-all dispatcher
 *
 * Consolidates rubric-related endpoints into ONE serverless function
 * to comply with Vercel Hobby plan's 12-function limit.
 *
 * Routes handled:
 *   GET  /api/rubrics                       → list   (paginated rubric list)
 *   GET  /api/rubrics/chapters              → chapters
 *   GET  /api/rubrics/children              → children
 *   GET  /api/rubrics/tree                  → tree
 *   GET  /api/rubrics/by-remedy             → by-remedy (REVERSE LOOKUP)
 *   GET  /api/single-rubrics               → single-rubrics  (legacy alias)
 *   GET  /api/kent-tree                    → kent-tree       (legacy alias)
 *
 * NOTE: To preserve URL compatibility, /api/single-rubrics and /api/kent-tree
 * are kept as redirects at the route level. The handlers can also be invoked
 * internally via /api/rubrics/single-rubrics and /api/rubrics/kent-tree.
 */
import { NextRequest, NextResponse } from 'next/server';
import { handler as listHandler } from './handlers/list';
import { handler as chaptersHandler } from './handlers/chapters';
import { handler as childrenHandler } from './handlers/children';
import { handler as treeHandler } from './handlers/tree';
import { handler as byRemedyHandler } from './handlers/by-remedy';
import { handler as singleRubricsHandler } from './handlers/single-rubrics';
import { handler as kentTreeHandler } from './handlers/kent-tree';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const seg0 = path[0];

  try {
    if (!seg0) return listHandler(req);
    if (seg0 === 'chapters') return chaptersHandler(req);
    if (seg0 === 'children') return childrenHandler(req);
    if (seg0 === 'tree') return treeHandler(req);
    if (seg0 === 'by-remedy') return byRemedyHandler(req);
    if (seg0 === 'single-rubrics') return singleRubricsHandler(req);
    if (seg0 === 'kent-tree') return kentTreeHandler(req);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e?.message }, { status: 500 });
  }
}
