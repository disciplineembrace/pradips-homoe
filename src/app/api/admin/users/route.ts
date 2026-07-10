/**
 * GET  /api/admin/users — list all users (admin only)
 * POST /api/admin/users — create new user (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';
import { hashPassword, hashPin, isValidPassword, isValidPin, logAudit, getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) return errorResponse;
  
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, loginId: true, email: true, fullName: true,
      role: true, status: true, accessExpiresAt: true,
      pinFailCount: true, pinLockedUntil: true,
      lastLoginAt: true, lastPinAt: true, createdAt: true,
    },
  });
  
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const { errorResponse, user: admin } = await requireAdmin();
  if (errorResponse) return errorResponse;
  
  const ip = getClientIp(req);
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  
  const { loginId, email, fullName, password, pin, role, accessExpiresAt } = body;
  
  // Validate
  if (!loginId || typeof loginId !== 'string') return NextResponse.json({ error: 'Login ID required' }, { status: 400 });
  if (!email || typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  if (!isValidPassword(password)) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  if (!isValidPin(pin)) return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
  if (role !== 'admin' && role !== 'user') return NextResponse.json({ error: 'Role must be admin or user' }, { status: 400 });
  
  // Check uniqueness
  const existing = await db.user.findFirst({ where: { OR: [{ loginId: loginId.toLowerCase() }, { email: email.toLowerCase() }] } });
  if (existing) return NextResponse.json({ error: 'Login ID or email already exists' }, { status: 409 });
  
  const passwordHash = await hashPassword(password);
  const pinHash = await hashPin(pin);
  
  const newUser = await db.user.create({
    data: {
      loginId: loginId.toLowerCase(),
      email: email.toLowerCase(),
      fullName: fullName || null,
      passwordHash, pinHash, role,
      accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
    },
  });
  
  await logAudit({ userId: admin!.id, action: 'user_create', targetId: newUser.id, detail: `Created user ${newUser.loginId} (${role})`, ip });
  
  return NextResponse.json({
    success: true,
    user: {
      id: newUser.id, loginId: newUser.loginId, email: newUser.email,
      fullName: newUser.fullName, role: newUser.role, status: newUser.status,
      accessExpiresAt: newUser.accessExpiresAt, createdAt: newUser.createdAt,
    },
  });
}
