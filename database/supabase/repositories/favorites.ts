/**
 * Favorites repository — Supabase user features database.
 *
 * Same shape as bookmarks — kept separate because favorites and bookmarks
 * represent different user intents (favorites = starred for quick access,
 * bookmarks = saved for later reading).
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface FavoriteRecord {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  title?: string;
  href?: string;
  author?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface FavoriteInput {
  user_id: string;
  item_id: string;
  item_type: string;
  title?: string;
  href?: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

function validate(input: FavoriteInput): void {
  if (!input.user_id) throw new Error('user_id is required');
  if (!input.item_id || !input.item_id.trim()) throw new Error('item_id is required');
  if (!input.item_type || !input.item_type.trim()) throw new Error('item_type is required');
}

export async function listFavorites(userId: string): Promise<FavoriteRecord[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list favorites: ${error.message}`);
  return (data || []) as FavoriteRecord[];
}

export async function addFavorite(input: FavoriteInput): Promise<FavoriteRecord | null> {
  validate(input);
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('favorites')
    .upsert(input, { onConflict: 'user_id,item_id,item_type' })
    .select()
    .single();
  if (error) throw new Error(`Failed to add favorite: ${error.message}`);
  return data as FavoriteRecord;
}

export async function removeFavorite(userId: string, itemId: string, itemType: string): Promise<void> {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient()!;
  const { error } = await client
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .eq('item_type', itemType);
  if (error) throw new Error(`Failed to remove favorite: ${error.message}`);
}

export async function isFavorite(userId: string, itemId: string, itemType: string): Promise<boolean> {
  if (!isSupabaseServerConfigured()) return false;
  const client = getSupabaseServerClient()!;
  const { count, error } = await client
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .eq('item_type', itemType);
  if (error) throw new Error(`Failed to check favorite: ${error.message}`);
  return (count || 0) > 0;
}
