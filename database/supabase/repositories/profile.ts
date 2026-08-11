/**
 * User profile + preferences repository — Supabase user features database.
 *
 * Manages extended user profile info and per-user preferences
 * (theme, font size, language, notification settings, custom settings).
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface UserProfileRecord {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesRecord {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large' | 'xl';
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  custom_settings?: Record<string, unknown>;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<UserProfileRecord | null> {
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to get profile: ${error.message}`);
  return data as UserProfileRecord | null;
}

export async function upsertProfile(userId: string, updates: Partial<Omit<UserProfileRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserProfileRecord | null> {
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('user_profiles')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert profile: ${error.message}`);
  return data as UserProfileRecord;
}

export async function getPreferences(userId: string): Promise<UserPreferencesRecord | null> {
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to get preferences: ${error.message}`);
  return data as UserPreferencesRecord | null;
}

export async function upsertPreferences(userId: string, updates: Partial<Omit<UserPreferencesRecord, 'user_id' | 'updated_at'>>): Promise<UserPreferencesRecord | null> {
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('user_preferences')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert preferences: ${error.message}`);
  return data as UserPreferencesRecord;
}
