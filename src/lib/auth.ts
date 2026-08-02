/**
 * Auth library — PIN-only auth + One-Device-Per-User + Admin Biometric
 *
 * Features:
 * - PIN authentication (bcrypt 12 rounds)
 * - JWT sessions (httpOnly cookie, 8h expiry)
 * - One device per user (new login invalidates old session)
 * - Device session tracking in database
 * - Admin WebAuthn/FIDO2 biometric support
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars';
const SESSION_COOKIE = 'ph_session';
const DEVICE_COOKIE = 'ph_device';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MINUTES = 15;

export type SessionPayload = {
  userId: string;
  name: string;
  role: 'admin' | 'staff' | 'user';
  deviceId?: string; // device session ID for one-device-per-user
};

// ============ PIN HASHING ============
export async function hashPin(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPin(plain: string, hash: string): Promise<boolean> {
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}

export function computePinLookup(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

// ============ DEVICE SESSION MANAGEMENT ============

/**
 * Create a new device session for a user.
 * Invalidates all previous active sessions for this user (one-device rule).
 */
export async function createDeviceSession(userId: string, deviceInfo: string, ip: string): Promise<string> {
  // Generate unique device ID
  const deviceId = crypto.randomUUID();

  // Invalidate all previous active sessions for this user
  await db.deviceSession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  // Create new active session
  await db.deviceSession.create({
    data: {
      userId,
      deviceId,
      deviceInfo,
      ip,
      isActive: true,
    },
  });

  return deviceId;
}

/**
 * Verify that the given device session is the current active one.
 * Returns true if this device is the active session, false otherwise.
 */
export async function verifyDeviceSession(userId: string, deviceId: string): Promise<boolean> {
  const session = await db.deviceSession.findFirst({
    where: { userId, deviceId, isActive: true },
  });
  return !!session;
}

/**
 * Update last activity time for a device session.
 */
export async function updateDeviceActivity(deviceId: string): Promise<void> {
  try {
    await db.deviceSession.update({
      where: { deviceId },
      data: { lastActivityAt: new Date() },
    });
  } catch { /* non-fatal */ }
}

/**
 * Invalidate all device sessions for a user (force logout all devices).
 */
export async function invalidateAllDeviceSessions(userId: string): Promise<void> {
  await db.deviceSession.updateMany({
    where: { userId },
    data: { isActive: false },
  });
}

/**
 * Get all active device sessions (for admin panel).
 */
export async function getActiveDeviceSessions(): Promise<any[]> {
  return db.deviceSession.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { loginAt: 'desc' },
  });
}

// ============ SESSION (JWT) ============
export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Get the device ID from the cookie.
 */
export async function getDeviceId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value || null;
}

export async function setSessionCookie(payload: SessionPayload, deviceId?: string): Promise<void> {
  const store = await cookies();
  const token = createSessionToken(payload);
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  // Set device cookie if provided
  if (deviceId) {
    store.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
  }
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
  store.set(DEVICE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const DEVICE_COOKIE_NAME = DEVICE_COOKIE;
export const PIN_LIMIT = PIN_MAX_ATTEMPTS;
export const PIN_LOCK_MS = PIN_LOCK_MINUTES * 60 * 1000;

// ============ PIN LOCKOUT ============
export function isPinLocked(user: { pinFailCount: number; pinLockedUntil: Date | null }): { locked: boolean; msRemaining: number } {
  if (user.pinFailCount >= PIN_MAX_ATTEMPTS && user.pinLockedUntil) {
    const msRemaining = user.pinLockedUntil.getTime() - Date.now();
    if (msRemaining > 0) return { locked: true, msRemaining };
  }
  return { locked: false, msRemaining: 0 };
}

export async function recordPinFailure(userId: string): Promise<{ locked: boolean; msRemaining: number }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { locked: false, msRemaining: 0 };

  const newCount = user.pinFailCount + 1;
  const shouldLock = newCount >= PIN_MAX_ATTEMPTS;
  const lockedUntil = shouldLock ? new Date(Date.now() + PIN_LOCK_MS) : user.pinLockedUntil;

  await db.user.update({
    where: { id: userId },
    data: { pinFailCount: newCount, pinLockedUntil: lockedUntil },
  });

  return { locked: shouldLock, msRemaining: shouldLock ? PIN_LOCK_MS : 0 };
}

export async function recordPinSuccess(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { pinFailCount: 0, pinLockedUntil: null, lastPinAt: new Date(), lastLoginAt: new Date() },
  });
}

export async function adminUnlockPin(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { pinFailCount: 0, pinLockedUntil: null },
  });
}

// ============ AUDIT LOGGING ============
export async function logLogin(opts: { userId?: string; name: string; event: string; ip?: string; userAgent?: string }) {
  try { await db.loginLog.create({ data: opts }); } catch { /* non-fatal */ }
}

export async function logPin(opts: { userId?: string; name: string; event: string; failCount?: number; ip?: string; userAgent?: string }) {
  try { await db.pinLog.create({ data: opts }); } catch { /* non-fatal */ }
}

export async function logAudit(opts: { userId?: string; action: string; targetId?: string; detail?: string; ip?: string }) {
  try { await db.auditLog.create({ data: opts }); } catch { /* non-fatal */ }
}

// ============ HELPERS ============
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0].trim() || 'unknown';
}

export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

export function generateRandomPin(): string {
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => n % 10).join('');
}
