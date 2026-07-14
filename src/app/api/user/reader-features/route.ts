/** GET /api/user/reader-features — fetch all user-feature data from Supabase.
 *
 * Returns:
 *   { enabled: false }                          — Supabase not configured or user not authed
 *   { enabled: true, bookmarks, favorites, ... } — Supabase data
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { isSupabaseServerConfigured } from '@/database/supabase/client';
import {
  BookmarksRepo, FavoritesRepo, NotesRepo, HistoryRepo, HighlightsRepo,
} from '@/database/supabase/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  // If Supabase is not configured, signal the client to use localStorage.
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ enabled: false });
  }

  try {
    const userId = user!.id;
    const [bookmarks, favorites, notes, history, highlights] = await Promise.all([
      BookmarksRepo.listBookmarks(userId),
      FavoritesRepo.listFavorites(userId),
      NotesRepo.listNotes(userId),
      HistoryRepo.listHistory(userId),
      HighlightsRepo.listHighlights(userId),
    ]);

    return NextResponse.json({
      enabled: true,
      bookmarks,
      favorites,
      notes,
      history,
      highlights,
    });
  } catch (e: any) {
    // If Supabase tables don't exist yet (schema not applied), gracefully
    // fall back to localStorage mode so the UI continues working.
    const msg = String(e?.message || e);
    if (
      msg.includes('Could not find the table') ||
      msg.includes('schema cache') ||
      msg.includes('relation') && msg.includes('does not exist')
    ) {
      return NextResponse.json({ enabled: false, reason: 'schema-not-applied' });
    }
    // For any other error, also fall back to localStorage (don't break UI).
    return NextResponse.json({ enabled: false, error: msg });
  }
}
