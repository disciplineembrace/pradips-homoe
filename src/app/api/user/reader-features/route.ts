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
    // On any error, fall back to localStorage mode.
    return NextResponse.json({ enabled: false, error: e.message });
  }
}
