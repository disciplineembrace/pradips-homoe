/**
 * Base repository — common patterns for all Neon content repositories.
 *
 * Provides:
 *   - In-process LRU cache for heavy read operations
 *   - Typed safe-read helpers
 *   - Validation utilities
 *
 * Caching strategy:
 *   - Cache key = `${repo}:${method}:${JSON.stringify(args)}`
 *   - TTL: 5 minutes by default (overridable per call)
 *   - Invalidation: explicit via `invalidate(key)` or `invalidateAll()`
 *   - On Vercel serverless, each function invocation gets its own cache
 *     (no cross-invocation persistence) — this is intentional and fine
 *     because content reads are cheap on Neon's pooled connection.
 */
type CacheEntry = { value: any; expiresAt: number };
const _cache = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  _cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidate(key: string): void {
  _cache.delete(key);
}

export function invalidateAll(): void {
  _cache.clear();
}

/**
 * Wrap a function with cache.
 * Usage: const remedies = await cached('remedies:all', () => loadRemedies());
 */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== null) return hit;
  const value = await loader();
  setCached(key, value, ttlMs);
  return value;
}

/**
 * Validate that an object has required string fields.
 * Throws if any field is missing or empty.
 */
export function validateRequired<T extends Record<string, unknown>>(
  obj: T,
  fields: Array<keyof T>,
): void {
  for (const f of fields) {
    const v = obj[f];
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      throw new Error(`Missing required field: ${String(f)}`);
    }
  }
}

/**
 * Sanitize a string for safe display (strip control chars, trim).
 */
export function sanitizeString(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s.replace(/[\x00-\x1F\x7F]/g, '').trim();
}
