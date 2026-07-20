/** GET /api/analytics/stats — get visitor statistics (public, no auth required)
 *
 * Returns: { totalViews, totalUniqueVisitors, todayViews, todayUniqueVisitors,
 *            viewsByDay: [{date, views, unique}], topPages: [{path, views}] }
 */
import { NextResponse } from 'next/server';
import { isSupabaseServerConfigured, getSupabaseServerClient } from '@/database/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({
      totalViews: 0,
      totalUniqueVisitors: 0,
      todayViews: 0,
      todayUniqueVisitors: 0,
      viewsByDay: [],
      topPages: [],
      message: 'Analytics not configured',
    });
  }

  try {
    const client = getSupabaseServerClient()!;

    // Total views
    const { count: totalViews } = await client
      .from('page_views')
      .select('*', { count: 'exact', head: true });

    // Total unique visitors
    const { data: uniqueData } = await client
      .from('page_views')
      .select('visitor_id');
    const uniqueVisitors = new Set(uniqueData?.map((r: any) => r.visitor_id) || []).size;

    // Today's views
    const today = new Date().toISOString().slice(0, 10);
    const { count: todayViews } = await client
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today + 'T00:00:00Z')
      .lt('created_at', today + 'T23:59:59Z');

    // Today's unique visitors
    const { data: todayUniqueData } = await client
      .from('page_views')
      .select('visitor_id')
      .gte('created_at', today + 'T00:00:00Z')
      .lt('created_at', today + 'T23:59:59Z');
    const todayUniqueVisitors = new Set(todayUniqueData?.map((r: any) => r.visitor_id) || []).size;

    // Views by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentViews } = await client
      .from('page_views')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    const viewsByDay: Record<string, number> = {};
    const uniqueByDay: Record<string, Set<string>> = {};
    if (recentViews) {
      for (const v of recentViews) {
        const day = (v as any).created_at.slice(0, 10);
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;
        if (!uniqueByDay[day]) uniqueByDay[day] = new Set();
        uniqueByDay[day].add((v as any).visitor_id);
      }
    }

    const viewsByDayArray = Object.entries(viewsByDay)
      .map(([date, views]) => ({
        date,
        views,
        unique: uniqueByDay[date]?.size || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top pages (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentPages } = await client
      .from('page_views')
      .select('page_path')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const pageCounts: Record<string, number> = {};
    if (recentPages) {
      for (const p of recentPages) {
        const path = (p as any).page_path;
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      }
    }

    const topPages = Object.entries(pageCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      totalViews: totalViews || 0,
      totalUniqueVisitors: uniqueVisitors,
      todayViews: todayViews || 0,
      todayUniqueVisitors,
      viewsByDay: viewsByDayArray,
      topPages,
    });
  } catch (e: any) {
    return NextResponse.json({
      totalViews: 0,
      totalUniqueVisitors: 0,
      todayViews: 0,
      todayUniqueVisitors: 0,
      viewsByDay: [],
      topPages: [],
      error: e.message,
    });
  }
}
