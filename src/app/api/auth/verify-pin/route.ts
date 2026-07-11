/**
 * POST /api/auth/verify-pin
 * Body: { pin }
 * Verifies 6-digit PIN. After 3 wrong attempts, locks for 15 minutes.
 * On success, upgrades session to pinVerified=true.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSession, verifyPin, isValidPin, setSessionCookie,
  isPinLocked, recordPinFailure, recordPinSuccess,
  logPin, getClientIp, getUserAgent, PIN_LIMIT, PIN_LOCK_MS,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.pinVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }
  
  let body: { pin?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  
  const pin = (body.pin || '').trim();
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
  }
  
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.status === 'disabled') {
    return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
  }
  
  // Check lockout
  const lock = isPinLocked(user);
  if (lock.locked) {
    const minsRemaining = Math.ceil(lock.msRemaining / 60000);
    await logPin({ userId: user.id, loginId: user.loginId, event: 'pin_locked', ip, userAgent: ua });
    return NextResponse.json({
      error: `PIN locked. Try again in ${minsRemaining} minute${minsRemaining !== 1 ? 's' : ''}.`,
      locked: true,
      minutesRemaining: minsRemaining,
    }, { status: 429 });
  }
  
  const ok = await verifyPin(pin, user.pinHash);
  if (!ok) {
    const result = await recordPinFailure(user.id);
    const failCount = user.pinFailCount + 1;
    await logPin({ userId: user.id, loginId: user.loginId, event: 'pin_fail', failCount, ip, userAgent: ua });
    
    if (result.locked) {
      await logPin({ userId: user.id, loginId: user.loginId, event: 'pin_locked', ip, userAgent: ua });
      return NextResponse.json({
        error: `PIN locked for 15 minutes after ${PIN_LIMIT} failed attempts.`,
        locked: true,
        minutesRemaining: PIN_LOCK_MS / 60000,
      }, { status: 429 });
    }
    
    const remaining = PIN_LIMIT - failCount;
    return NextResponse.json({
      error: `Wrong PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      attemptsRemaining: remaining,
    }, { status: 401 });
  }
  
  // Success
  await recordPinSuccess(user.id);
  await logPin({ userId: user.id, loginId: user.loginId, event: 'pin_success', ip, userAgent: ua });
  
  // Upgrade session
  await setSessionCookie({
    userId: user.id,
    loginId: user.loginId,
    role: user.role as 'admin' | 'user',
    pinVerified: true,
  });
  
  return NextResponse.json({
    success: true,
    redirect: user.role === 'admin' ? '/admin' : '/dashboard',
  });
}
