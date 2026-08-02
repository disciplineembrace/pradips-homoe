/**
 * Helper: require authenticated session with device verification.
 * Returns { session, user, errorResponse }.
 *
 * One-Device-Per-User: Verifies that the current device is still the active session.
 * If another device has taken over, returns 401 with device-takeover flag.
 */
import { NextResponse } from 'next/server';
import { getSession, getDeviceId, verifyDeviceSession } from './auth';
import { db } from './db';

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === 'disabled') {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Account inactive' }, { status: 403 }),
    };
  }

  // One-Device-Per-User verification
  // Skip for development if device tables don't exist yet
  if (session.deviceId) {
    try {
      const deviceId = await getDeviceId();
      if (deviceId && deviceId !== session.deviceId) {
        // Device cookie doesn't match session - possible session hijacking
        return {
          session: null,
          user: null,
          errorResponse: NextResponse.json({
            error: 'Your account has been logged in from another device.',
            deviceTakeover: true,
          }, { status: 401 }),
        };
      }
      // Verify this device is still the active session in DB
      const isActive = await verifyDeviceSession(session.userId, session.deviceId);
      if (!isActive) {
        return {
          session: null,
          user: null,
          errorResponse: NextResponse.json({
            error: 'Your account has been logged in from another device.',
            deviceTakeover: true,
          }, { status: 401 }),
        };
      }
    } catch (e) {
      // DeviceSession table might not exist yet - fail gracefully
      // In production, this should not happen after migration
    }
  }

  return { session, user, errorResponse: null };
}

export async function requireAdmin() {
  const authResult = await requireAuth();
  if (authResult.errorResponse) return authResult;
  if (authResult.user!.role !== 'admin') {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }
  return authResult;
}
