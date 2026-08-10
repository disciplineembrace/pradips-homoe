/**
 * Supabase client index — single entry point for all Supabase access.
 *
 * Import pattern:
 *   import { getSupabaseClient, isSupabaseConfigured } from '@/database/supabase/client';
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
} from './supabase-client';
export type { SupabaseClient } from './supabase-client';
