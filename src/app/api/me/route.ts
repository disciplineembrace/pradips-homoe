/** GET /api/me — current user's own profile (requires auth) */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET() {
  const { errorResponse, user } = await requireAuth();
  if (errorResponse) return errorResponse;

  return NextResponse.json({
    id: user!.id,
    name: user!.name,
    email: user!.email,
    role: user!.role,
    status: user!.status,
    pinFailCount: user!.pinFailCount,
    pinLockedUntil: user!.pinLockedUntil,
    lastLoginAt: user!.lastLoginAt,
    lastPinAt: user!.lastPinAt,
    createdAt: user!.createdAt,
  });
}
