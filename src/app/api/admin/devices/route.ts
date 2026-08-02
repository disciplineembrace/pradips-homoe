/** GET /api/admin/devices — List all active device sessions (admin only) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-auth';
import { getActiveDeviceSessions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const sessions = await getActiveDeviceSessions();

  return NextResponse.json({
    devices: sessions.map(s => ({
      id: s.id,
      deviceId: s.deviceId,
      userName: s.user?.name || 'Unknown',
      userEmail: s.user?.email || 'Unknown',
      userRole: s.user?.role || 'Unknown',
      deviceInfo: s.deviceInfo,
      ip: s.ip,
      loginAt: s.loginAt,
      lastActivityAt: s.lastActivityAt,
    })),
    total: sessions.length,
  });
}
