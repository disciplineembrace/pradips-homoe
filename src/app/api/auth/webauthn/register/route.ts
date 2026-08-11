/** POST /api/auth/webauthn/register — Register admin biometric credential
 *
 * Step 1: GET /api/auth/webauthn/register — Returns challenge
 * Step 2: POST /api/auth/webauthn/register — Stores credential from browser
 *
 * Admin-only: Only admin accounts can register biometric credentials.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

// GET: Return registration challenge
export async function GET() {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const challenge = crypto.randomBytes(32).toString('base64url');
  const userId = auth.session!.userId;

  // Store challenge in a temporary credential (we'll use a simple approach)
  // In production, use a proper challenge store
  return NextResponse.json({
    challenge,
    rp: {
      name: "Pradip's Homeo",
      id: process.env.NODE_ENV === 'production' ? 'pradips-homoe.vercel.app' : 'localhost',
    },
    user: {
      id: Buffer.from(userId).toString('base64url'),
      name: auth.user!.email,
      displayName: auth.user!.name,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
    timeout: 60000,
  });
}

// POST: Store the registered credential
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json();
  const { credentialId, publicKey, deviceType } = body;

  if (!credentialId || !publicKey) {
    return NextResponse.json({ error: 'Missing credential data' }, { status: 400 });
  }

  // Check if credential already exists
  const existing = await db.webAuthnCredential.findUnique({
    where: { credentialId },
  });
  if (existing) {
    return NextResponse.json({ error: 'Credential already registered' }, { status: 409 });
  }

  // Store the credential
  await db.webAuthnCredential.create({
    data: {
      userId: auth.session!.userId,
      credentialId,
      publicKey,
      deviceType: deviceType || 'platform',
    },
  });

  return NextResponse.json({ success: true, message: 'Biometric credential registered' });
}
