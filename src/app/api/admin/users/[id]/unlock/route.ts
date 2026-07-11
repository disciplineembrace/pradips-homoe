/** POST /api/admin/users/[id]/unlock — admin clears PIN lockout */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';
import { adminUnlockPin, logAudit, logPin, getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user: admin } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const ip = getClientIp(req);
  
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
  await adminUnlockPin(id);
  await logAudit({ userId: admin!.id, action: 'pin_unlock', targetId: id, detail: `Unlocked PIN for ${target.name}`, ip });
  await logPin({ userId: id, name: target.name, event: 'pin_unlocked', ip, userAgent: 'admin' });
  
  return NextResponse.json({ success: true });
}
