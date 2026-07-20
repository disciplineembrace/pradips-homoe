/** POST /api/analytics/track — record a page view (public, no auth required)
 *
 * Body: { pagePath, referrer?, visitorId? }
 * Tracks every page view for visitor statistics.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseServerConfigured, getSupabaseServerClient } from '@/database/supabase/client';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory fallback (resets on cold start — acceptable for basic stats)
const _memoryViews: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pagePath = body.pagePath || '/';
    const referrer = body.referrer || '';
    const userAgent = req.headers.get('user-agent') || '';
    const visitorId = body.visitorId || generateVisitorId(req);

    // Check if user is authenticated (optional)
    let isAuthenticated = false;
    try {
      const session = await getSession();
      isAuthenticated = !!session;
    } catch {}

    const view = {
      visitor_id: visitorId,
      page_path: pagePath,
      user_agent: userAgent.slice(0, 500),
      referrer: referrer.slice(0, 500),
      is_authenticated: isAuthenticated,
    };

    if (isSupabaseServerConfigured()) {
      try {
        const client = getSupabaseServerClient()!;
        await client.from('page_views').insert(view);

        // Update daily stats
        const today = new Date().toISOString().slice(0, 10);
        const { data: existing } = await client
          .from('visitor_stats')
          .select('*')
          .eq('stat_date', today)
          .maybeSingle();

        if (existing) {
          await client
            .from('visitor_stats')
            .update({
              total_views: (existing.total_views || 0) + 1,
              authenticated_views: isAuthenticated
                ? (existing.authenticated_views || 0) + 1
                : existing.authenticated_views || 0,
              anonymous_views: !isAuthenticated
                ? (existing.anonymous_views || 0) + 1
                : existing.anonymous_views || 0,
            })
            .eq('stat_date', today);
        } else {
          await client.from('visitor_stats').insert({
            stat_date: today,
            total_views: 1,
            unique_visitors: 1, // will be calculated separately
            authenticated_views: isAuthenticated ? 1 : 0,
            anonymous_views: !isAuthenticated ? 1 : 0,
          });
        }
      } catch {
        // Fall back to memory
        _memoryViews.push({ ...view, created_at: new Date().toISOString() });
      }
    } else {
      _memoryViews.push({ ...view, created_at: new Date().toISOString() });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function generateVisitorId(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  // Simple hash for visitor identification (not cryptographically secure, just for uniqueness)
  let hash = 0;
  const str = ip + ua;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'visitor_' + Math.abs(hash).toString(36);
}
