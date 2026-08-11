/**
 * Reading progress repository — Supabase user features database.
 *
 * Tracks per-user, per-item reading progress (scroll percentage, last chapter,
 * last position). Useful for "Continue reading" UI.
 *
 * Primary key: (user_id, item_id, item_type) — one progress record per item per user.
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface ReadingProgressRecord {
  user_id: string;
  item_id: string;
  item_type: string;
  scroll_percent: number;
  last_chapter_id?: string;
  last_position?: Record<string, unknown>;
  completed: boolean;
  updated_at: string;
}

export interface ReadingProgressInput {
  user_id: string;
  item_id: string;
  item_type: string;
  scroll_percent?: number;
  last_chapter_id?: string;
  last_position?: Record<string, unknown>;
  completed?: boolean;
}

function validate(input: ReadingProgressInput): void {
  if (!input.user_id) throw new Error('user_id is required');
  if (!input.item_id || !input.item_id.trim()) throw new Error('item_id is required');
  if (!input.item_type || !input.item_type.trim()) throw new Error('item_type is required');
  if (input.scroll_percent !== undefined) {
    if (input.scroll_percent < 0 || input.scroll_percent > 100) {
      throw new Error('scroll_percent must be between 0 and 100');
    }
  }
}

export async function getProgress(
  userId: string,
  itemId: string,
  itemType: string,
): Promise<ReadingProgressRecord | null> {
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .maybeSingle();
  if (error) throw new Error(`Failed to get progress: ${error.message}`);
  return data as ReadingProgressRecord | null;
}

export async function upsertProgress(input: ReadingProgressInput): Promise<ReadingProgressRecord | null> {
  validate(input);
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('reading_progress')
    .upsert(input, { onConflict: 'user_id,item_id,item_type' })
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert progress: ${error.message}`);
  return data as ReadingProgressRecord;
}

export async function listInProgress(userId: string, limit: number = 20): Promise<ReadingProgressRecord[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .gt('scroll_percent', 0)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to list in-progress: ${error.message}`);
  return (data || []) as ReadingProgressRecord[];
}
