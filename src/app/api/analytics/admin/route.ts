/** GET /api/analytics/admin — comprehensive analytics stats (ADMIN ONLY)
 *
 * Returns all analytics data for the admin dashboard:
 *   - Visitor stats (total, today, weekly, monthly, new vs returning)
 *   - Page analytics (most/least visited, top pages)
 *   - Device/OS/browser breakdown
 *   - Traffic sources
 *   - Search analytics (popular queries)
 *   - Reading analytics
 *   - Real-time active users
 *   - Daily trends (last 30 days)
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-auth';
import { isSupabaseServerConfigured, getSupabaseServerClient } from '@/database/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });
  }

  try {
    const client = getSupabaseServerClient()!;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const yearAgo = new Date(now.getTime() - 365 * 86400000).toISOString();

    // ── 1. VISITOR STATS ──
    const { count: totalViews } = await client.from('page_views').select('*', { count: 'exact', head: true });
    const { data: allVisitors } = await client.from('page_views').select('visitor_id');
    const uniqueVisitors = new Set(allVisitors?.map((r: any) => r.visitor_id) || []).size;

    const { count: todayViews } = await client.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', todayStr + 'T00:00:00Z');
    const { count: yesterdayViews } = await client.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', yesterday + 'T00:00:00Z').lt('created_at', yesterday + 'T23:59:59Z');

    const { count: weeklyViews } = await client.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
    const { count: monthlyViews } = await client.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo);
    const { count: yearlyViews } = await client.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', yearAgo);

    // Today's unique visitors
    const { data: todayVisitorData } = await client.from('page_views').select('visitor_id').gte('created_at', todayStr + 'T00:00:00Z');
    const todayUnique = new Set(todayVisitorData?.map((r: any) => r.visitor_id) || []).size;

    // New vs returning (from sessions)
    const { data: newVisitorsData } = await client.from('visitor_sessions').select('is_new_visitor');
    const newVisitors = newVisitorsData?.filter((r: any) => r.is_new_visitor).length || 0;
    const returningVisitors = (newVisitorsData?.length || 0) - newVisitors;

    // ── 2. PAGE ANALYTICS ──
    const { data: recentPageData } = await client.from('page_views').select('page_path').gte('created_at', monthAgo);
    const pageCounts: Record<string, number> = {};
    if (recentPageData) {
      for (const p of recentPageData) {
        const path = (p as any).page_path;
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      }
    }
    const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
    const topPages = sortedPages.slice(0, 10).map(([path, views]) => ({ path, views }));
    const leastPages = sortedPages.slice(-5).reverse().map(([path, views]) => ({ path, views }));

    // ── 3. DEVICE / OS / BROWSER ──
    const { data: sessionData } = await client.from('visitor_sessions').select('device_type, os, browser, referrer_source');
    const deviceCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    if (sessionData) {
      for (const s of sessionData) {
        const dt = (s as any).device_type || 'Unknown';
        deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
        const os = (s as any).os || 'Unknown';
        osCounts[os] = (osCounts[os] || 0) + 1;
        const br = (s as any).browser || 'Unknown';
        browserCounts[br] = (browserCounts[br] || 0) + 1;
        const src = (s as any).referrer_source || 'Direct';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      }
    }

    // ── 4. SEARCH ANALYTICS ──
    const { data: searchData } = await client.from('search_analytics').select('query, results_count').gte('created_at', monthAgo);
    const searchCounts: Record<string, { count: number; failed: number }> = {};
    if (searchData) {
      for (const s of searchData) {
        const q = (s as any).query;
        if (!searchCounts[q]) searchCounts[q] = { count: 0, failed: 0 };
        searchCounts[q].count++;
        if ((s as any).results_count === 0) searchCounts[q].failed++;
      }
    }
    const popularSearches = Object.entries(searchCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([query, data]) => ({ query, count: data.count, failed: data.failed }));
    const failedSearches = Object.entries(searchCounts)
      .filter(([, d]) => d.failed > 0)
      .sort((a, b) => b[1].failed - a[1].failed)
      .slice(0, 5)
      .map(([query, data]) => ({ query, failed: data.failed }));

    // ── 5. READING ANALYTICS ──
    const { data: readingData } = await client.from('reading_analytics').select('item_type, item_id, item_title, time_spent, completed').gte('created_at', monthAgo);
    const readingCounts: Record<string, { title: string; views: number; totalTime: number; completed: number }> = {};
    if (readingData) {
      for (const r of readingData) {
        const key = (r as any).item_id;
        if (!readingCounts[key]) {
          readingCounts[key] = { title: (r as any).item_title || key, views: 0, totalTime: 0, completed: 0 };
        }
        readingCounts[key].views++;
        readingCounts[key].totalTime += (r as any).time_spent || 0;
        if ((r as any).completed) readingCounts[key].completed++;
      }
    }
    const popularReads = Object.entries(readingCounts)
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data, avgTime: data.views > 0 ? Math.round(data.totalTime / data.views) : 0 }));

    // ── 6. DAILY TRENDS (last 30 days) ──
    const { data: dailyData } = await client.from('page_views').select('created_at, visitor_id').gte('created_at', monthAgo);
    const dailyMap: Record<string, { views: number; visitors: Set<string> }> = {};
    if (dailyData) {
      for (const d of dailyData) {
        const day = (d as any).created_at.slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { views: 0, visitors: new Set() };
        dailyMap[day].views++;
        dailyMap[day].visitors.add((d as any).visitor_id);
      }
    }
    const dailyTrends = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, views: data.views, uniqueVisitors: data.visitors.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── 7. REAL-TIME (last 5 minutes) ──
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const { data: realTimeData } = await client.from('page_views').select('visitor_id, page_path').gte('created_at', fiveMinAgo);
    const realTimeVisitors = new Set(realTimeData?.map((r: any) => r.visitor_id) || []).size;
    const realTimeViews = realTimeData?.length || 0;
    const currentPages: Record<string, number> = {};
    if (realTimeData) {
      for (const r of realTimeData) {
        const p = (r as any).page_path;
        currentPages[p] = (currentPages[p] || 0) + 1;
      }
    }
    const livePages = Object.entries(currentPages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, count]) => ({ path, count }));

    // ── 8. API PERFORMANCE ──
    const { data: apiPerfData } = await client.from('api_performance').select('endpoint, response_time, status_code').gte('created_at', weekAgo).limit(100);
    const apiStats: Record<string, { count: number; totalTime: number; errors: number }> = {};
    if (apiPerfData) {
      for (const a of apiPerfData) {
        const ep = (a as any).endpoint;
        if (!apiStats[ep]) apiStats[ep] = { count: 0, totalTime: 0, errors: 0 };
        apiStats[ep].count++;
        apiStats[ep].totalTime += (a as any).response_time || 0;
        if ((a as any).status_code >= 400) apiStats[ep].errors++;
      }
    }
    const apiPerformance = Object.entries(apiStats)
      .map(([endpoint, data]) => ({
        endpoint,
        avgResponseTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
        requestCount: data.count,
        errorCount: data.errors,
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    return NextResponse.json({
      visitors: {
        totalViews: totalViews || 0,
        uniqueVisitors,
        todayViews: todayViews || 0,
        todayUnique,
        yesterdayViews: yesterdayViews || 0,
        weeklyViews: weeklyViews || 0,
        monthlyViews: monthlyViews || 0,
        yearlyViews: yearlyViews || 0,
        newVisitors,
        returningVisitors,
      },
      pages: {
        topPages,
        leastPages,
      },
      devices: {
        distribution: Object.entries(deviceCounts).map(([type, count]) => ({ type, count })),
        os: Object.entries(osCounts).map(([os, count]) => ({ os, count })),
        browsers: Object.entries(browserCounts).map(([browser, count]) => ({ browser, count })),
      },
      trafficSources: Object.entries(sourceCounts).map(([source, count]) => ({ source, count })),
      searches: {
        popular: popularSearches,
        failed: failedSearches,
      },
      reading: popularReads,
      dailyTrends,
      realTime: {
        activeUsers: realTimeVisitors,
        liveViews: realTimeViews,
        livePages,
      },
      apiPerformance,
      generatedAt: now.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
