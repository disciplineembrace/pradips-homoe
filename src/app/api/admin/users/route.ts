/**
 * GET  /api/admin/users — list all users (admin only)
 * POST /api/admin/users — create new user (admin only)
 *
 * Body: { name, email, role, status, pin }
 * Returns the generated PIN once (admin must save it — never retrievable again).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';
import { hashPin, isValidPin, logAudit, getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const roleFilter = url.searchParams.get('role') || 'all';
  const statusFilter = url.searchParams.get('status') || 'all';

  // Build where clause
  const where: any = {};
  if (roleFilter !== 'all') where.role = roleFilter;
  if (statusFilter !== 'all') where.status = statusFilter;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true,
      role: true, status: true,
      pinFailCount: true, pinLockedUntil: true,
      lastLoginAt: true, lastPinAt: true, createdAt: true, updatedAt: true,
      _count: {
        select: {
          loginLogs: { where: { event: 'login_success' } },
        },
      },
    },
  });

  // Get last login log with IP and user agent for each user
  const usersWithActivity = await Promise.all(
    users.map(async (u) => {
      const lastLogin = await db.loginLog.findFirst({
        where: { userId: u.id, event: 'login_success' },
        orderBy: { createdAt: 'desc' },
        select: { ip: true, userAgent: true, createdAt: true },
      });
      return {
        ...u,
        loginCount: u._count.loginLogs,
        lastLoginIp: lastLogin?.ip || null,
        lastLoginUserAgent: lastLogin?.userAgent || null,
      };
    })
  );

  return NextResponse.json({ users: usersWithActivity });
}

export async function POST(req: NextRequest) {
  const { errorResponse, user: admin } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const ip = getClientIp(req);
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, email, role, status, pin } = body;

  // Validate
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
  }
  if (!['admin', 'staff', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Role must be admin, staff, or user' }, { status: 400 });
  }
  if (status && !['active', 'disabled'].includes(status)) {
    return NextResponse.json({ error: 'Status must be active or disabled' }, { status: 400 });
  }

  // Check email uniqueness
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Email already in use by another user.' }, { status: 409 });
  }

  const pinHash = await hashPin(pin);

  const newUser = await db.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      pinHash,
      role,
      status: status || 'active',
    },
  });

  await logAudit({ userId: admin!.id, action: 'user_create', targetId: newUser.id, detail: `Created user ${newUser.name} (${role})`, ip });

  return NextResponse.json({
    success: true,
    generatedPin: pin,  // shown once
    user: {
      id: newUser.id, name: newUser.name, email: newUser.email,
      role: newUser.role, status: newUser.status,
      createdAt: newUser.createdAt,
    },
  });
}
