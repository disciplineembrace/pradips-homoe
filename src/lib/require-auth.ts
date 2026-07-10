/**
 * Helper: require authenticated + PIN-verified session.
 * Returns { session, user, errorResponse }.
 */
import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { db } from './db';

export async function requireAuth() {
  const session = await getSession();
  if (!session || !session.pinVerified) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === 'blocked') {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Account inactive' }, { status: 403 }),
    };
  }
  return { session, user, errorResponse: null };
}

export async function requireAdmin() {
  const authResult = await requireAuth();
  if (authResult.errorResponse) return authResult;
  if (authResult.user!.role !== 'admin') {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }
  return authResult;
}
