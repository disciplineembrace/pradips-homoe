import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession, logLogin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getSession();
  if (session) {
    await logLogin({ userId: session.userId, loginId: session.loginId, event: 'logout', ip: 'server' });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
