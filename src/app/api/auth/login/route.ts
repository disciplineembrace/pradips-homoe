/**
 * POST /api/auth/login
 *
 * Email + PIN login (single step).
 * Body: { email, pin }
 * 1. Find user by email
 * 2. Check status === 'active'
 * 3. Check lockout (5 fails → 15 min)
 * 4. Verify bcrypt pinHash
 * 5. Set session cookie, redirect
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPin, isValidPin, setSessionCookie,
  logLogin, logPin, getClientIp, getUserAgent,
  isPinLocked, recordPinFailure, recordPinSuccess,
  PIN_LIMIT, PIN_LOCK_MS,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ua = getUserAgent(req);

  let body: { email?: string; pin?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const email = (body.email || '').trim().toLowerCase();
  const pin = (body.pin || '').trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
  }

  try {
    // Find user by email
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      await logLogin({ name: email, event: 'login_fail', ip, userAgent: ua });
      return NextResponse.json({ error: 'Invalid email or PIN' }, { status: 401 });
    }

    // Only active accounts can login
    if (user.status === 'disabled') {
      await logLogin({ userId: user.id, name: user.name, event: 'login_fail', ip, userAgent: ua });
      return NextResponse.json({ error: 'Account disabled. Contact admin.' }, { status: 403 });
    }

    // Check lockout
    const lock = isPinLocked(user);
    if (lock.locked) {
      const minsRemaining = Math.ceil(lock.msRemaining / 60000);
      await logPin({ userId: user.id, name: user.name, event: 'pin_locked', ip, userAgent: ua });
      return NextResponse.json({
        error: `PIN locked. Try again in ${minsRemaining} minute${minsRemaining !== 1 ? 's' : ''}.`,
        locked: true,
        minutesRemaining: minsRemaining,
      }, { status: 429 });
    }

    // Verify PIN
    const ok = await verifyPin(pin, user.pinHash);
    if (!ok) {
      const result = await recordPinFailure(user.id);
      const failCount = user.pinFailCount + 1;
      await logPin({ userId: user.id, name: user.name, event: 'pin_fail', failCount, ip, userAgent: ua });
      await logLogin({ userId: user.id, name: user.name, event: 'login_fail', ip, userAgent: ua });

      if (result.locked) {
        await logPin({ userId: user.id, name: user.name, event: 'pin_locked', ip, userAgent: ua });
        return NextResponse.json({
          error: `PIN locked for 15 minutes after ${PIN_LIMIT} failed attempts.`,
          locked: true,
          minutesRemaining: PIN_LOCK_MS / 60000,
        }, { status: 429 });
      }

      const remaining = PIN_LIMIT - failCount;
      return NextResponse.json({
        error: `Invalid email or PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        attemptsRemaining: remaining,
      }, { status: 401 });
    }

    // Success
    await recordPinSuccess(user.id);
    await logPin({ userId: user.id, name: user.name, event: 'pin_success', ip, userAgent: ua });
    await logLogin({ userId: user.id, name: user.name, event: 'login_success', ip, userAgent: ua });

    await setSessionCookie({
      userId: user.id,
      name: user.name,
      role: user.role as 'admin' | 'staff' | 'user',
    });

    return NextResponse.json({
      success: true,
      redirect: user.role === 'admin' ? '/admin' : '/dashboard',
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({
      error: 'Login failed',
      debug: err?.message || String(err),
    }, { status: 500 });
  }
}
