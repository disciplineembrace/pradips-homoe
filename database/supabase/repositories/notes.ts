/**
 * Notes repository — Supabase user features database.
 *
 * Stores user notes attached to any content item (remedy, rubric, book chapter, etc.).
 * The content itself lives in Neon; this table stores only the user's annotation
 * + a reference to the item.
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface NoteRecord {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  text: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  user_id: string;
  item_id: string;
  item_type: string;
  text: string;
  metadata?: Record<string, unknown>;
}

function validate(input: NoteInput): void {
  if (!input.user_id) throw new Error('user_id is required');
  if (!input.item_id || !input.item_id.trim()) throw new Error('item_id is required');
  if (!input.item_type || !input.item_type.trim()) throw new Error('item_type is required');
  if (!input.text || !input.text.trim()) throw new Error('text is required');
}

/**
 * List all notes for a user (optionally filtered by item).
 */
export async function listNotes(
  userId: string,
  opts: { itemId?: string; itemType?: string } = {},
): Promise<NoteRecord[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  let query = client.from('notes').select('*').eq('user_id', userId);
  if (opts.itemId) query = query.eq('item_id', opts.itemId);
  if (opts.itemType) query = query.eq('item_type', opts.itemType);
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw new Error(`Failed to list notes: ${error.message}`);
  return (data || []) as NoteRecord[];
}

/**
 * Add a new note.
 */
export async function addNote(input: NoteInput): Promise<NoteRecord | null> {
  validate(input);
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('notes')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to add note: ${error.message}`);
  return data as NoteRecord;
}

/**
 * Update a note's text. The updated_at column is auto-touched by trigger.
 */
export async function updateNote(noteId: string, userId: string, text: string): Promise<NoteRecord | null> {
  if (!text.trim()) throw new Error('text is required');
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('notes')
    .update({ text })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(`Failed to update note: ${error.message}`);
  return data as NoteRecord;
}

/**
 * Delete a note.
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient()!;
  const { error } = await client
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to delete note: ${error.message}`);
}
