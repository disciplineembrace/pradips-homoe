import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession, logLogin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function handler_post() {
  const session = await getSession();
  if (session) {
    await logLogin({ userId: session.userId, name: session.name, event: 'logout', ip: 'server' });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
