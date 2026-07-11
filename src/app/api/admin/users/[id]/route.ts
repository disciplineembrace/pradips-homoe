/**
 * GET    /api/admin/users/[id] — get one user
 * PATCH  /api/admin/users/[id] — update user (status, role, expiry, fullName, password)
 * DELETE /api/admin/users/[id] — delete user
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';
import { hashPassword, isValidPassword, logAudit, getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const u = await db.user.findUnique({
    where: { id },
    select: {
      id: true, loginId: true, email: true, fullName: true,
      role: true, status: true, accessExpiresAt: true,
      pinFailCount: true, pinLockedUntil: true,
      lastLoginAt: true, lastPinAt: true, createdAt: true, updatedAt: true,
    },
  });
  if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: u });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user: admin } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const ip = getClientIp(req);
  
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
  const updates: any = {};
  const auditActions: string[] = [];
  
  if (body.status === 'active' || body.status === 'disabled') {
    if (target.status !== body.status) {
      updates.status = body.status;
      auditActions.push(body.status === 'disabled' ? 'user_block' : 'user_unblock');
    }
  }
  if (body.role === 'admin' || body.role === 'staff' || body.role === 'user') {
    if (target.role !== body.role) {
      updates.role = body.role;
      auditActions.push('role_change');
    }
  }
  if (body.accessExpiresAt !== undefined) {
    updates.accessExpiresAt = body.accessExpiresAt ? new Date(body.accessExpiresAt) : null;
    auditActions.push('expiry_set');
  }
  if (typeof body.fullName === 'string') updates.fullName = body.fullName;
  if (typeof body.email === 'string' && body.email.includes('@')) updates.email = body.email.toLowerCase();
  
  // Password change (admin sets new password)
  if (typeof body.password === 'string' && body.password.length > 0) {
    if (!isValidPassword(body.password)) return NextResponse.json({ error: 'Password must be 6+ chars' }, { status: 400 });
    updates.passwordHash = await hashPassword(body.password);
    auditActions.push('password_change');
  }
  
  // Prevent self-demotion of last admin
  if (target.role === 'admin' && updates.role === 'user') {
    const adminCount = await db.user.count({ where: { role: 'admin', status: 'active' } });
    if (adminCount <= 1) return NextResponse.json({ error: 'Cannot demote last admin' }, { status: 400 });
  }
  // Prevent self-block
  if (target.id === admin!.id && updates.status === 'disabled') {
    return NextResponse.json({ error: 'Cannot block your own account' }, { status: 400 });
  }
  
  await db.user.update({ where: { id }, data: updates });
  
  for (const action of auditActions) {
    await logAudit({ userId: admin!.id, action, targetId: id, detail: JSON.stringify(updates).substring(0, 200), ip });
  }
  
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user: admin } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const ip = getClientIp(req);
  
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.id === admin!.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  
  // Prevent deleting last admin
  if (target.role === 'admin') {
    const adminCount = await db.user.count({ where: { role: 'admin', status: 'active' } });
    if (adminCount <= 1) return NextResponse.json({ error: 'Cannot delete last admin' }, { status: 400 });
  }
  
  await db.user.delete({ where: { id } });
  await logAudit({ userId: admin!.id, action: 'user_delete', targetId: id, detail: `Deleted user ${target.loginId}`, ip });
  
  return NextResponse.json({ success: true });
}
