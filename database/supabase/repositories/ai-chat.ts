/**
 * AI chat history repository — Supabase user features database.
 *
 * Stores AI assistant conversation messages per user, grouped by conversation_id.
 */
import { getSupabaseServerClient, isSupabaseServerConfigured } from '../client';

export interface ChatMessageRecord {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChatMessageInput {
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

function validate(input: ChatMessageInput): void {
  if (!input.user_id) throw new Error('user_id is required');
  if (!input.conversation_id) throw new Error('conversation_id is required');
  if (!['user', 'assistant', 'system'].includes(input.role)) {
    throw new Error('role must be user, assistant, or system');
  }
  if (!input.content || !input.content.trim()) throw new Error('content is required');
}

export async function listConversations(userId: string): Promise<Array<{ conversation_id: string; last_message_at: string; message_count: number }>> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  const { data, error } = await client.rpc('list_conversations', { p_user_id: userId });
  if (error) {
    // Stored procedure may not exist yet — fall back to client-side aggregation
    const { data: all, error: err2 } = await client
      .from('ai_chat_history')
      .select('conversation_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (err2) throw new Error(`Failed to list conversations: ${err2.message}`);
    const byConv = new Map<string, { last_message_at: string; message_count: number }>();
    for (const row of (all || [])) {
      const cid = row.conversation_id;
      const existing = byConv.get(cid);
      if (!existing) {
        byConv.set(cid, { last_message_at: row.created_at, message_count: 1 });
      } else {
        existing.message_count++;
      }
    }
    return Array.from(byConv.entries()).map(([conversation_id, v]) => ({ conversation_id, ...v }));
  }
  return data || [];
}

export async function listMessages(userId: string, conversationId: string, limit: number = 100): Promise<ChatMessageRecord[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('ai_chat_history')
    .select('*')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Failed to list messages: ${error.message}`);
  return (data || []) as ChatMessageRecord[];
}

export async function addMessage(input: ChatMessageInput): Promise<ChatMessageRecord | null> {
  validate(input);
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .from('ai_chat_history')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to add message: ${error.message}`);
  return data as ChatMessageRecord;
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient()!;
  const { error } = await client
    .from('ai_chat_history')
    .delete()
    .eq('user_id', userId)
    .eq('conversation_id', conversationId);
  if (error) throw new Error(`Failed to delete conversation: ${error.message}`);
}
