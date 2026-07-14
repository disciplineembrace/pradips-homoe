/**
 * Supabase auth adapter.
 *
 * NOTE: The current project uses PIN-based auth (bcrypt + JWT cookies) backed
 * by the Neon Users table. Supabase auth is provided here for FUTURE migration
 * when the project adopts email/OAuth login. Until then, this module is a
 * no-op — it does NOT replace the existing PIN auth.
 *
 * When migration happens:
 *   1. Enable Supabase email auth + Google/GitHub OAuth in Supabase dashboard
 *   2. Replace /api/auth/login + /api/auth/logout routes to use Supabase auth
 *   3. Migrate users from Neon Users table to Supabase auth.users (one-time)
 *   4. Update /lib/require-auth.ts to verify Supabase session instead of JWT
 *
 * For now: PIN auth stays in Neon. Supabase user tables (bookmarks, notes,
 * history, etc.) reference users by `user_id` (uuid), which will eventually
 * be the Supabase auth.users.id. Until migration, we use the Neon User.id
 * (cuid) as the user_id value in Supabase tables — this is safe because the
 * tables have NO foreign key constraint to auth.users (RLS policy checks
 * current_user_id() but we won't enable that until migration).
 */
import { getSupabaseClient, isSupabaseConfigured } from '../client';

/**
 * Sign in with email + password (Supabase auth).
 * Currently disabled — PIN auth is used instead.
 */
export async function signInWithEmail(email: string, _password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured — PIN auth is active');
  }
  const client = getSupabaseClient()!;
  const { data, error } = await client.auth.signInWithPassword({ email, password: _password });
  if (error) throw error;
  return data;
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.).
 * Currently disabled.
 */
export async function signInWithOAuth(provider: 'google' | 'github' | 'apple') {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured — PIN auth is active');
  }
  const client = getSupabaseClient()!;
  const { data, error } = await client.auth.signInWithOAuth({ provider });
  if (error) throw error;
  return data;
}

/**
 * Sign out from Supabase.
 */
export async function signOut() {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient()!;
  await client.auth.signOut();
}

/**
 * Get current Supabase session (for client components).
 */
export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient()!;
  const { data } = await client.auth.getSession();
  return data.session;
}

/**
 * Send password reset email.
 */
export async function resetPassword(email: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured — PIN reset is via admin only');
  }
  const client = getSupabaseClient()!;
  const { error } = await client.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
