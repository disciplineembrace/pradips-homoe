/** GET /api/auth/session — current session status with device verification */
import { NextResponse } from 'next/server';
import { getSession, getDeviceId, verifyDeviceSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  // Fetch fresh user status
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === 'disabled') {
    return NextResponse.json({ authenticated: false });
  }

  // One-Device-Per-User: Check if this device is still active
  if (session.deviceId) {
    try {
      const isActive = await verifyDeviceSession(session.userId, session.deviceId);
      if (!isActive) {
        // Another device has taken over this account
        return NextResponse.json({
          authenticated: false,
          deviceTakeover: true,
          message: 'Your account has been logged in from another device.',
        });
      }
    } catch {
      // DeviceSession table might not exist yet - fail gracefully
    }
  }

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    name: user.name,
    role: user.role,
    status: user.status,
    deviceId: session.deviceId,
  });
}
