/**
 * Neon database index — single import for all Neon access.
 *
 * Usage:
 *   import { neonClient, RemediesRepo } from '@/database/neon';
 *
 * Rules:
 *   - Never import this from /database/supabase/*.
 *   - Never use this for user-feature writes (bookmarks, notes, history, etc.).
 */
export { neonClient } from './client';
export type { NeonClient } from './client';
export * from './repositories';
