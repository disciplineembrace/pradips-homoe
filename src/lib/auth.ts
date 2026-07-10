/**
 * Auth library — password + fixed 6-digit PIN authentication
 * - Passwords hashed with bcrypt (10 rounds)
 * - PINs hashed with bcrypt (12 rounds — slower, more expensive to brute force)
 * - Sessions managed with JWT (httpOnly cookie)
 * - PIN lockout: 3 wrong attempts → 15 minute lock
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars';
const SESSION_COOKIE = 'ph_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const PIN_MAX_ATTEMPTS = 3;
const PIN_LOCK_MINUTES = 15;

export type SessionPayload = {
  userId: string;
  loginId: string;
  role: 'admin' | 'user';
  pinVerified: boolean;
};

// ============ HASHING ============
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}

export async function hashPin(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPin(plain: string, hash: string): Promise<boolean> {
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function isValidPassword(pwd: string): boolean {
  return typeof pwd === 'string' && pwd.length >= 6 && pwd.length <= 128;
}

// ============ SESSION ============
export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
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

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  const token = createSessionToken(payload);
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
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
    data: { pinFailCount: 0, pinLockedUntil: null, lastPinAt: new Date() },
  });
}

export async function adminUnlockPin(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { pinFailCount: 0, pinLockedUntil: null },
  });
}

// ============ AUDIT LOGGING ============
export async function logLogin(opts: { userId?: string; loginId: string; event: string; ip?: string; userAgent?: string }) {
  try {
    await db.loginLog.create({ data: opts });
  } catch (e) { /* non-fatal */ }
}

export async function logPin(opts: { userId?: string; loginId: string; event: string; failCount?: number; ip?: string; userAgent?: string }) {
  try {
    await db.pinLog.create({ data: opts });
  } catch (e) { /* non-fatal */ }
}

export async function logAudit(opts: { userId?: string; action: string; targetId?: string; detail?: string; ip?: string }) {
  try {
    await db.auditLog.create({ data: opts });
  } catch (e) { /* non-fatal */ }
}

// ============ HELPERS ============
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0].trim() || 'unknown';
}

export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

// Check if user's access has expired
export function isAccessExpired(user: { accessExpiresAt: Date | null }): boolean {
  if (!user.accessExpiresAt) return false;
  return user.accessExpiresAt.getTime() < Date.now();
}
