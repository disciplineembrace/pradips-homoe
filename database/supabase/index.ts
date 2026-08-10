/**
 * Supabase index — single import for all Supabase access.
 *
 * Usage:
 *   import { getSupabaseClient, BookmarksRepo, NotesRepo }
 *     from '@/database/supabase';
 *
 * Rules:
 *   - Never import this from /database/neon/*.
 *   - Never use this for content reads/writes (remedies, rubrics, books, etc.).
 */
export {
  getSupabaseClient,
  getSupabaseServerClient,
  isSupabaseConfigured,
  isSupabaseServerConfigured,
} from './client';
export type { SupabaseClient } from './client';

export * from './repositories';

// Adapters (auth, storage, realtime, profile)
export {
  signInWithEmail,
  signInWithOAuth,
  signOut,
  getSession,
  resetPassword,
} from './auth';
export {
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
  listFiles,
} from './storage';
export type { StorageBucket } from './storage';
export {
  subscribeToTable,
} from './realtime';
export type { RealtimeEvent, RealtimeSubscription } from './realtime';
