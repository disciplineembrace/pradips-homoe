/** GET /api/auth/webauthn/status — Check if admin has biometric registered */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const credentials = await db.webAuthnCredential.findMany({
    where: { userId: auth.session!.userId },
  });

  return NextResponse.json({
    registered: credentials.length > 0,
    count: credentials.length,
    credentials: credentials.map(c => ({
      id: c.id,
      deviceType: c.deviceType,
      createdAt: c.createdAt,
    })),
  });
}
