/**
 * POST /api/auth/login
 * Body: { loginId, password }
 * Verifies password only. Returns partial session with pinVerified=false.
 * Frontend must then call /api/auth/verify-pin with the 6-digit PIN.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, setSessionCookie, logLogin, getClientIp, getUserAgent, isAccessExpired } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  
  let body: { loginId?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  
  const loginId = (body.loginId || '').trim().toLowerCase();
  const password = body.password || '';
  
  if (!loginId || !password) {
    return NextResponse.json({ error: 'Login ID and password required' }, { status: 400 });
  }
  
  // Find user by loginId or email
  const user = await db.user.findFirst({
    where: { OR: [{ loginId }, { email: loginId }] },
  });
  
  if (!user) {
    await logLogin({ loginId, event: 'login_fail', ip, userAgent: ua });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  if (user.status === 'blocked') {
    await logLogin({ userId: user.id, loginId, event: 'login_fail', ip, userAgent: ua });
    return NextResponse.json({ error: 'Account blocked. Contact admin.' }, { status: 403 });
  }
  
  if (isAccessExpired(user)) {
    await logLogin({ userId: user.id, loginId, event: 'login_fail', ip, userAgent: ua });
    return NextResponse.json({ error: 'Access expired. Contact admin.' }, { status: 403 });
  }
  
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
    role: user.role as 'admin' | 'user',
    pinVerified: false,
  });
  
  return NextResponse.json({
    success: true,
    requiresPin: true,
    user: { loginId: user.loginId, fullName: user.fullName, role: user.role },
  });
}
