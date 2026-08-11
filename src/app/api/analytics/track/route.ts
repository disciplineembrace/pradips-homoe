/** POST /api/analytics/track — track a page view (public, no auth required) */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ success: true });
}
