/**
 * Supabase realtime adapter — live updates for collaborative features.
 *
 * Channels:
 *   - bookmarks:{user_id}     — bookmark added/removed
 *   - notes:{user_id}         — note added/updated/deleted
 *   - reading_progress        — progress updated
 *   - notifications:{user_id} — new notification
 *
 * Currently no realtime features are wired up in the UI. This adapter is
 * provided for future use (e.g. multi-device bookmark sync, collaborative
 * note-taking).
 */
import { getSupabaseClient, isSupabaseConfigured } from '../client';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

/**
 * Subscribe to changes on a specific table for the current user.
 *
 * Usage (client component):
 *   const sub = subscribeToTable('bookmarks', (event, row) => {
 *     console.log('Bookmark changed:', event, row);
 *   });
 *   useEffect(() => () => sub.unsubscribe(), []);
 */
export function subscribeToTable(
  table: string,
  callback: (event: RealtimeEvent, row: Record<string, unknown>) => void,
  opts: { filter?: string } = {},
): RealtimeSubscription {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }
  const client = getSupabaseClient()!;
  const channel = client
    .channel(`realtime:${table}:${opts.filter || 'all'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: opts.filter,
      },
      (payload: { eventType: RealtimeEvent; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        callback(payload.eventType, payload.new || payload.old || {});
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}
