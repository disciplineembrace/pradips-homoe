/** POST /api/analytics/track — track a page view (public, no auth required) */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function handler_post(_req: NextRequest) {
  return NextResponse.json({ success: true });
}
