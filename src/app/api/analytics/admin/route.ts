/** GET /api/analytics/admin — admin analytics (requires auth) */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  return NextResponse.json({
    totalViews: 0,
    totalUniqueVisitors: 0,
    todayViews: 0,
    todayUniqueVisitors: 0,
    viewsByDay: [],
    topPages: [],
  });
}
