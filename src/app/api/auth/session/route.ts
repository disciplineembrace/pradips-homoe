import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, pinVerified: false });
  }
  // Fetch fresh user status
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === 'blocked') {
    return NextResponse.json({ authenticated: false, pinVerified: false });
  }
  return NextResponse.json({
    authenticated: true,
    pinVerified: session.pinVerified,
    user: {
      loginId: user.loginId,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    },
  });
}
