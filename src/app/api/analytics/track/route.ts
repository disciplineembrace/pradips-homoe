/** POST /api/analytics/track — Enhanced analytics tracking (public, no auth required)
 *
 * Tracks: page views, events, searches, sessions
 * Body: { type: 'pageview'|'event'|'search'|'session', ...payload }
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseServerConfigured, getSupabaseServerClient } from '@/database/supabase/client';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const _memory: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type || 'pageview';
    const userAgent = req.headers.get('user-agent') || '';
    const visitorId = body.visitorId || generateVisitorId(req);
    const { deviceType, os, browser } = parseUserAgent(userAgent);
    const referrerSource = parseReferrer(body.referrer || '');

    let isAuthenticated = false;
    try {
      const session = await getSession();
      isAuthenticated = !!session;
    } catch {}

    if (!isSupabaseServerConfigured()) {
      _memory.push({ type, visitorId, ...body, created_at: new Date().toISOString() });
      return NextResponse.json({ ok: true, mode: 'local' });
    }

    const client = getSupabaseServerClient()!;

    if (type === 'pageview') {
      await client.from('page_views').insert({
        visitor_id: visitorId,
        page_path: body.pagePath || '/',
        user_agent: userAgent.slice(0, 500),
        referrer: (body.referrer || '').slice(0, 500),
        is_authenticated: isAuthenticated,
      });
      return NextResponse.json({ ok: true });
    }

    if (type === 'event') {
      await client.from('analytics_events').insert({
        visitor_id: visitorId,
        event_type: body.eventType || 'unknown',
        event_category: body.eventCategory || null,
        event_label: (body.eventLabel || '').slice(0, 500),
        event_value: body.eventValue ? String(body.eventValue).slice(0, 500) : null,
        page_path: body.pagePath || null,
      });
      return NextResponse.json({ ok: true });
    }

    if (type === 'search') {
      await client.from('search_analytics').insert({
        query: (body.query || '').slice(0, 500),
        search_type: body.searchType || null,
        results_count: body.resultsCount || 0,
        visitor_id: visitorId,
      });
      return NextResponse.json({ ok: true });
    }

    if (type === 'session') {
      // Track session start/end
      if (body.action === 'start') {
        // Check if visitor is new
        const { data: existing } = await client
          .from('visitor_sessions')
          .select('id')
          .eq('visitor_id', visitorId)
          .limit(1);
        const isNew = !existing || existing.length === 0;

        await client.from('visitor_sessions').insert({
          visitor_id: visitorId,
          session_start: new Date().toISOString(),
          page_views: 0,
          is_new_visitor: isNew,
          is_authenticated: isAuthenticated,
          device_type: deviceType,
          os,
          browser,
          referrer_source: referrerSource,
        });
      } else if (body.action === 'end' && body.sessionId) {
        await client
          .from('visitor_sessions')
          .update({ session_end: new Date().toISOString(), page_views: body.pageViews || 0 })
          .eq('id', body.sessionId);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function generateVisitorId(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  let hash = 0;
  const str = ip + ua;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'visitor_' + Math.abs(hash).toString(36);
}

function parseUserAgent(ua: string): { deviceType: string; os: string; browser: string } {
  const lower = ua.toLowerCase();
  let deviceType = 'Desktop';
  if (/mobile|android|iphone|ipod/.test(lower)) deviceType = 'Mobile';
  else if (/ipad|tablet/.test(lower)) deviceType = 'Tablet';

  let os = 'Unknown';
  if (/windows/.test(lower)) os = 'Windows';
  else if (/mac os|macintosh/.test(lower)) os = 'macOS';
  else if (/android/.test(lower)) os = 'Android';
  else if (/iphone|ipad|ipod/.test(lower)) os = 'iOS';
  else if (/linux/.test(lower)) os = 'Linux';

  let browser = 'Unknown';
  if (/edg/.test(lower)) browser = 'Edge';
  else if (/chrome/.test(lower)) browser = 'Chrome';
  else if (/firefox/.test(lower)) browser = 'Firefox';
  else if (/safari/.test(lower)) browser = 'Safari';
  else if (/opera|opr/.test(lower)) browser = 'Opera';
  else if (/brave/.test(lower)) browser = 'Brave';

  return { deviceType, os, browser };
}

function parseReferrer(referrer: string): string {
  if (!referrer) return 'Direct';
  const lower = referrer.toLowerCase();
  if (lower.includes('google')) return 'Google Search';
  if (lower.includes('bing')) return 'Bing';
  if (lower.includes('duckduckgo')) return 'DuckDuckGo';
  if (lower.includes('youtube')) return 'YouTube';
  if (lower.includes('facebook') || lower.includes('twitter') || lower.includes('instagram') || lower.includes('linkedin')) return 'Social Media';
  if (lower.includes('vercel.app') || lower.includes('pradips-homoe')) return 'Direct';
  return 'External Website';
}
