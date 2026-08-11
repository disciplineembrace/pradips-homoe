/**
 * Highlights repository — Supabase user features database.
 *
 * Stores user-highlighted text within book chapters / long-form content.
 * Includes optional offset range for precise re-selection in the UI.
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface HighlightRecord {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  highlighted_text: string;
  color: string;
  start_offset?: number;
  end_offset?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface HighlightInput {
  user_id: string;
  item_id: string;
  item_type: string;
  highlighted_text: string;
  color?: string;
  start_offset?: number;
  end_offset?: number;
  metadata?: Record<string, unknown>;
}

function validate(input: HighlightInput): void {
  if (!input.user_id) throw new Error('user_id is required');
  if (!input.item_id || !input.item_id.trim()) throw new Error('item_id is required');
  if (!input.item_type || !input.item_type.trim()) throw new Error('item_type is required');
  if (!input.highlighted_text || !input.highlighted_text.trim()) throw new Error('highlighted_text is required');
}

export async function listHighlights(
  userId: string,
  opts: { itemId?: string; itemType?: string } = {},
): Promise<HighlightRecord[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  let query = client.from('highlights').select('*').eq('user_id', userId);
  if (opts.itemId) query = query.eq('item_id', opts.itemId);
  if (opts.itemType) query = query.eq('item_type', opts.itemType);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list highlights: ${error.message}`);
  return (data || []) as HighlightRecord[];
}

export async function addHighlight(input: HighlightInput): Promise<HighlightRecord | null> {
  validate(input);
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const payload = { color: 'yellow', ...input };
  const { data, error } = await client
    .from('highlights')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`Failed to add highlight: ${error.message}`);
  return data as HighlightRecord;
}

export async function deleteHighlight(highlightId: string, userId: string): Promise<void> {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient()!;
  const { error } = await client
    .from('highlights')
    .delete()
    .eq('id', highlightId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to delete highlight: ${error.message}`);
}
