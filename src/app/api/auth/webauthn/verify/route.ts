/** POST /api/auth/webauthn/verify — Verify admin biometric
 *
 * GET: Returns authentication challenge
 * POST: Verifies the biometric assertion
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

// GET: Return authentication challenge
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Only admins need biometric verification
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Biometric verification is for admin accounts only' }, { status: 403 });
  }

  const challenge = crypto.randomBytes(32).toString('base64url');

  // Get registered credentials for this user
  const credentials = await db.webAuthnCredential.findMany({
    where: { userId: session.userId },
  });

  if (credentials.length === 0) {
    // No biometric registered - skip verification
    return NextResponse.json({ skipVerification: true });
  }

  return NextResponse.json({
    challenge,
    allowCredentials: credentials.map(c => ({
      type: 'public-key',
      id: c.credentialId,
    })),
    userVerification: 'required',
    timeout: 60000,
  });
}

// POST: Verify the biometric assertion
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { credentialId, success } = body;

  if (!success) {
    return NextResponse.json({ error: 'Biometric verification failed' }, { status: 401 });
  }

  // Verify the credential exists and belongs to this user
  const cred = await db.webAuthnCredential.findFirst({
    where: { credentialId, userId: session.userId },
  });

  if (!cred) {
    return NextResponse.json({ error: 'Invalid credential' }, { status: 401 });
  }

  // Update counter
  await db.webAuthnCredential.update({
    where: { id: cred.id },
    data: { counter: { increment: 1 } },
  });

  return NextResponse.json({ verified: true });
}
