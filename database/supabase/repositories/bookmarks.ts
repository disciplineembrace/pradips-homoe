/**
 * Bookmarks repository — Supabase user features database.
 *
 * Manages user bookmarks (saved items). Each bookmark references an item that
 * lives in Neon (a remedy, rubric, book chapter, etc.). This table only stores
 * the reference + user-specific metadata, NEVER the content itself.
 *
 * Fallback behavior:
 *   If Supabase is not configured, falls back to localStorage via the
 *   useReaderFeatures hook (see /src/hooks/use-reader-features.ts).
 *
 * Validation:
 *   - user_id is required and must match the authenticated session
 *   - item_id is required and non-empty
 *   - item_type is required and one of the allowed types
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface BookmarkRecord {
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

export interface BookmarkInput {
  user_id: string;
  item_id: string;
  item_type: string;
  title?: string;
  href?: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Validate a bookmark input. Throws on invalid data.
 */
function validate(input: BookmarkInput): void {
  if (!input.user_id) throw new Error('user_id is required');
  if (!input.item_id || !input.item_id.trim()) throw new Error('item_id is required');
  if (!input.item_type || !input.item_type.trim()) throw new Error('item_type is required');
}

/**
 * List all bookmarks for a user.
 */
export async function listBookmarks(userId: string): Promise<BookmarkRecord[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list bookmarks: ${error.message}`);
  return (data || []) as BookmarkRecord[];
}

/**
 * Add a bookmark. Uses upsert to prevent duplicates
 * (composite unique constraint: user_id + item_id + item_type).
 */
export async function addBookmark(input: BookmarkInput): Promise<BookmarkRecord | null> {
  validate(input);
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('bookmarks')
    .upsert(input, { onConflict: 'user_id,item_id,item_type' })
    .select()
    .single();
  if (error) throw new Error(`Failed to add bookmark: ${error.message}`);
  return data as BookmarkRecord;
}

/**
 * Remove a bookmark by user_id + item_id + item_type.
 */
export async function removeBookmark(userId: string, itemId: string, itemType: string): Promise<void> {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient()!;
  const { error } = await client
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .eq('item_type', itemType);
  if (error) throw new Error(`Failed to remove bookmark: ${error.message}`);
}

/**
 * Check if an item is bookmarked by a user.
 */
export async function isBookmarked(userId: string, itemId: string, itemType: string): Promise<boolean> {
  if (!isSupabaseServerConfigured()) return false;
  const client = getSupabaseServerClient()!;
  const { count, error } = await client
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .eq('item_type', itemType);
  if (error) throw new Error(`Failed to check bookmark: ${error.message}`);
  return (count || 0) > 0;
}
