/**
 * Supabase client — user features database.
 *
 * Manages: authentication, user profiles, sessions, OAuth, storage, realtime,
 * notifications, user preferences, bookmarks, reading progress, highlights,
 * notes, recently viewed, AI chat history, user settings.
 *
 * CRITICAL RULES:
 *   - This client MUST NEVER be used for content reads/writes (remedies,
 *     rubrics, books, etc.) — those belong in Neon.
 *   - This client MUST NEVER be imported from /database/neon/*.
 *   - All user-feature writes go through /database/supabase/repositories/*.
 *
 * Fallback behavior:
 *   If NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set,
 *   this module returns `null` and the app gracefully falls back to
 *   localStorage-backed reader features (see useReaderFeatures hook).
 *   This keeps the UI fully functional during development and until the
 *   Supabase project is provisioned.
 *
 * In production (Vercel), set both env vars + SUPABASE_SERVICE_ROLE_KEY to
 * enable Supabase-backed user features with zero code changes.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _client: SupabaseClient | null = null;
let _serverClient: SupabaseClient | null = null;

/**
 * Browser-side Supabase client (uses anon key, respects RLS).
 * Returns null if env vars are not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

/**
 * Server-side Supabase client (uses service role key, bypasses RLS).
 * Use ONLY in API routes / server components — never expose to client.
 *
 * Returns null if env vars are not configured.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!SUPABASE_URL) return null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) return null;
  if (_serverClient) return _serverClient;
  _serverClient = createClient(SUPABASE_URL, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _serverClient;
}

/**
 * Check whether Supabase is configured (env vars set).
 * Use this to decide whether to use Supabase-backed or localStorage-backed features.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Check whether the server-side (service-role) client is available.
 */
export function isSupabaseServerConfigured(): boolean {
  return Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export type { SupabaseClient };
