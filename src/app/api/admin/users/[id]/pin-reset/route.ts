/** POST /api/admin/users/[id]/pin-reset — admin sets new PIN for user */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';
import { hashPin, isValidPin, generateRandomPin, logAudit, logPin, getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user: admin } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const ip = getClientIp(req);

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  // If no PIN provided, generate a random one
  let pin = (body.pin || '').toString().trim();
  if (!pin) {
    pin = generateRandomPin();
  }

  if (!isValidPin(pin)) return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const pinHash = await hashPin(pin);
  await db.user.update({
    where: { id },
    data: { pinHash, pinFailCount: 0, pinLockedUntil: null },
  });

  await logAudit({ userId: admin!.id, action: 'pin_reset', targetId: id, detail: `PIN reset for ${target.name}`, ip });
  await logPin({ userId: id, name: target.name, event: 'pin_reset', ip, userAgent: 'admin' });

  return NextResponse.json({ success: true, generatedPin: pin });
}
