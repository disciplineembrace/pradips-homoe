/**
 * POST /api/auth/login
 *
 * Two login modes:
 * 1. Password mode: { loginId, password } → verifies password, sets partial session (pinVerified=false)
 *    Frontend then redirects to /verify-pin for the 6-digit PIN.
 * 2. PIN mode: { loginId, pin, mode: 'pin' } → verifies PIN directly, sets full session (pinVerified=true)
 *    Single-step login — no password needed.
 *
 * Only Active accounts can login. Disabled accounts are rejected.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword, verifyPin, isValidPin, setSessionCookie,
  logLogin, logPin, getClientIp, getUserAgent, isAccessExpired,
  isPinLocked, recordPinFailure, recordPinSuccess,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ua = getUserAgent(req);

  let body: { loginId?: string; password?: string; pin?: string; mode?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const loginId = (body.loginId || '').trim().toLowerCase();
  if (!loginId) return NextResponse.json({ error: 'Login ID required' }, { status: 400 });

  // Find user by loginId or email
  const user = await db.user.findFirst({ where: { OR: [{ loginId }, { email: loginId }] } });

  if (!user) {
    await logLogin({ loginId, event: 'login_fail', ip, userAgent: ua });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Only Active accounts can login
  if (user.status === 'disabled') {
    await logLogin({ userId: user.id, loginId, event: 'login_fail', ip, userAgent: ua });
    return NextResponse.json({ error: 'Account disabled. Contact admin.' }, { status: 403 });
  }

  if (isAccessExpired(user)) {
    await logLogin({ userId: user.id, loginId, event: 'login_fail', ip, userAgent: ua });
    return NextResponse.json({ error: 'Access expired. Contact admin.' }, { status: 403 });
  }

  // ===== MODE 1: Password login (2-step: password → PIN) =====
  if (body.mode !== 'pin') {
    const password = body.password || '';
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      await logLogin({ userId: user.id, loginId, event: 'login_fail', ip, userAgent: ua });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await logLogin({ userId: user.id, loginId, event: 'login_success', ip, userAgent: ua });

    // Set partial session — PIN verification still required
    await setSessionCookie({
      userId: user.id,
      loginId: user.loginId,
      role: user.role as 'admin' | 'staff' | 'user',
      pinVerified: false,
    });

    return NextResponse.json({
      success: true,
      requiresPin: true,
      user: { loginId: user.loginId, fullName: user.fullName, role: user.role },
    });
  }

  // ===== MODE 2: PIN-only login (1-step: PIN → full session) =====
  const pin = (body.pin || '').trim();
  if (!isValidPin(pin)) return NextResponse.json({ error: 'PIN must be 6 digits' }, { status: 400 });

  // Check lockout
  const lock = isPinLocked(user);
  if (lock.locked) {
    const minsRemaining = Math.ceil(lock.msRemaining / 60000);
    await logPin({ userId: user.id, loginId, event: 'pin_locked', ip, userAgent: ua });
    return NextResponse.json({
      error: `PIN locked. Try again in ${minsRemaining} minute${minsRemaining !== 1 ? 's' : ''}.`,
      locked: true,
      minutesRemaining: minsRemaining,
    }, { status: 429 });
  }

  const pinOk = await verifyPin(pin, user.pinHash);
  if (!pinOk) {
    const result = await recordPinFailure(user.id);
    const failCount = user.pinFailCount + 1;
    await logPin({ userId: user.id, loginId, event: 'pin_fail', failCount, ip, userAgent: ua });

    if (result.locked) {
      await logPin({ userId: user.id, loginId, event: 'pin_locked', ip, userAgent: ua });
      return NextResponse.json({
        error: 'PIN locked for 15 minutes after 3 failed attempts.',
        locked: true,
        minutesRemaining: 15,
      }, { status: 429 });
    }

    const remaining = 3 - failCount;
    return NextResponse.json({
      error: `Wrong PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      attemptsRemaining: remaining,
    }, { status: 401 });
  }

  // PIN verified — full session
  await recordPinSuccess(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logPin({ userId: user.id, loginId, event: 'pin_success', ip, userAgent: ua });
  await logLogin({ userId: user.id, loginId, event: 'login_success', ip, userAgent: ua });

  await setSessionCookie({
    userId: user.id,
    loginId: user.loginId,
    role: user.role as 'admin' | 'staff' | 'user',
    pinVerified: true,
  });

  return NextResponse.json({
    success: true,
    redirect: user.role === 'admin' ? '/admin' : '/dashboard',
    user: { loginId: user.loginId, fullName: user.fullName, role: user.role },
  });
}
