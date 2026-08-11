/**
 * Reading history repository — Supabase user features database.
 *
 * Tracks recently viewed items. Uses upsert to "move to front" — when the same
 * item is viewed again, the visited_at timestamp is updated to now.
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface HistoryRecord {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  title?: string;
  href?: string;
  metadata?: Record<string, unknown>;
  visited_at: string;
}

export interface HistoryInput {
  user_id: string;
  item_id: string;
  item_type: string;
  title?: string;
  href?: string;
  metadata?: Record<string, unknown>;
}

function validate(input: HistoryInput): void {
  if (!input.user_id) throw new Error('user_id is required');
  if (!input.item_id || !input.item_id.trim()) throw new Error('item_id is required');
  if (!input.item_type || !input.item_type.trim()) throw new Error('item_type is required');
}

export async function listHistory(userId: string, limit: number = 100): Promise<HistoryRecord[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('reading_history')
    .select('*')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to list history: ${error.message}`);
  return (data || []) as HistoryRecord[];
}

/**
 * Add a history entry. Uses upsert to update visited_at if the item was
 * already viewed (composite unique constraint: user_id + item_id + item_type).
 */
export async function addHistory(input: HistoryInput): Promise<HistoryRecord | null> {
  validate(input);
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('reading_history')
    .upsert(
      { ...input, visited_at: new Date().toISOString() },
      { onConflict: 'user_id,item_id,item_type' },
    )
    .select()
    .single();
  if (error) throw new Error(`Failed to add history: ${error.message}`);
  return data as HistoryRecord;
}

export async function clearHistory(userId: string): Promise<void> {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient()!;
  const { error } = await client
    .from('reading_history')
    .delete()
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to clear history: ${error.message}`);
}
