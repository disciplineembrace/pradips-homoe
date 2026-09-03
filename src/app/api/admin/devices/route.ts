/** GET /api/admin/devices — List all active device sessions (admin only) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  // TODO: implement getActiveDeviceSessions in auth.ts
  // For now return empty list — the feature is not yet implemented
  return NextResponse.json({
    devices: [],
    total: 0,
  });
}
