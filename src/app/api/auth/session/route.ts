/** GET /api/auth/session — current session status */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  // Fetch fresh user status
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === 'disabled') {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    name: user.name,
    role: user.role,
    status: user.status,
  });
}
