/** GET /api/me — current user's own profile (requires auth + PIN) */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET() {
  const { errorResponse, session, user } = await requireAuth();
  if (errorResponse) return errorResponse;

  return NextResponse.json({
    id: user!.id,
    loginId: user!.loginId,
    email: user!.email,
    fullName: user!.fullName,
    role: user!.role,
    status: user!.status,
    accessExpiresAt: user!.accessExpiresAt,
    pinFailCount: user!.pinFailCount,
    pinLockedUntil: user!.pinLockedUntil,
    lastLoginAt: user!.lastLoginAt,
    lastPinAt: user!.lastPinAt,
    createdAt: user!.createdAt,
  });
}
