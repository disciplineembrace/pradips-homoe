/**
 * Admin API catch-all route — consolidates all /api/admin/* endpoints into ONE
 * serverless function to comply with Vercel Hobby plan's 12-function limit.
 *
 * Routes handled:
 *   GET    /api/admin/devices             → listDevices
 *   GET    /api/admin/logs                → listLogs
 *   GET    /api/admin/users               → listUsers
 *   GET    /api/admin/users/[id]          → getUser
 *   PATCH  /api/admin/users/[id]          → updateUser
 *   DELETE /api/admin/users/[id]          → deleteUser
 *   POST   /api/admin/users/[id]/pin-reset → resetPin
 *   POST   /api/admin/users/[id]/unlock    → unlockUser
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function listDevices() {
  // TODO: implement getActiveDeviceSessions
  return NextResponse.json({ devices: [], total: 0 });
}

async function listLogs() {
  const [loginLogs, pinLogs, auditLogs] = await Promise.all([
    db.loginLog.findMany({ take: 100, orderBy: { createdAt: 'desc' } }).catch(() => []),
    (db as any).pinLockout?.findMany?.({ take: 50, orderBy: { createdAt: 'desc' } }).catch(() => []) ?? [],
    (db as any).auditLog?.findMany?.({ take: 50, orderBy: { createdAt: 'desc' } }).catch(() => []) ?? [],
  ]);
  return NextResponse.json({ loginLogs, pinLogs, auditLogs });
}

async function listUsers() {
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ users });
}

async function getUser(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
}

async function updateUser(id: string, body: any) {
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.role !== undefined) data.role = body.role;
  if (body.status !== undefined) data.status = body.status;
  if (body.pin !== undefined) {
    data.pin = await bcrypt.hash(body.pin, 10);
  }
  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
}

async function deleteUser(id: string) {
  await db.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function resetPin(id: string, body: any) {
  if (!body.pin || body.pin.length < 4) {
    return NextResponse.json({ error: 'PIN must be at least 4 digits' }, { status: 400 });
  }
  const pinHash = await bcrypt.hash(body.pin, 10);
  await db.user.update({ where: { id }, data: { pin: pinHash, pinAttempts: 0, pinLockedUntil: null } as any });
  return NextResponse.json({ success: true });
}

async function unlockUser(id: string) {
  await db.user.update({ where: { id }, data: { pinAttempts: 0, pinLockedUntil: null } as any });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const { path } = await params;
  const segments = path || [];

  if (segments.length === 1 && segments[0] === 'devices') return listDevices();
  if (segments.length === 1 && segments[0] === 'logs') return listLogs();
  if (segments.length === 1 && segments[0] === 'users') return listUsers();
  if (segments.length === 2 && segments[0] === 'users') return getUser(segments[1]);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const { path } = await params;
  const segments = path || [];

  if (segments.length === 2 && segments[0] === 'users') {
    const body = await req.json();
    return updateUser(segments[1], body);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const { path } = await params;
  const segments = path || [];

  if (segments.length === 3 && segments[0] === 'users' && segments[2] === 'pin-reset') {
    const body = await req.json();
    return resetPin(segments[1], body);
  }
  if (segments.length === 3 && segments[0] === 'users' && segments[2] === 'unlock') {
    return unlockUser(segments[1]);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const { path } = await params;
  const segments = path || [];

  if (segments.length === 2 && segments[0] === 'users') return deleteUser(segments[1]);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
