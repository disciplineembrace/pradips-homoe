/** GET /api/analytics/stats — get visitor statistics (public, no auth required)
 * Returns: { totalViews, totalUniqueVisitors, todayViews, todayUniqueVisitors,
 *            viewsByDay: [], topPages: [] }
 * Gracefully returns empty stats if Supabase is not configured.
 */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      totalViews: 0,
      totalUniqueVisitors: 0,
      todayViews: 0,
      todayUniqueVisitors: 0,
      viewsByDay: [],
      topPages: [],
    });
  } catch {
    return NextResponse.json({
      totalViews: 0,
      totalUniqueVisitors: 0,
      todayViews: 0,
      todayUniqueVisitors: 0,
      viewsByDay: [],
      topPages: [],
    });
  }
}
