/**
 * Supabase repositories index — single entry point for all user-feature data access.
 *
 * Import pattern:
 *   import { BookmarksRepo, FavoritesRepo, NotesRepo, HistoryRepo,
 *            HighlightsRepo, ProgressRepo, AIChatRepo, ProfileRepo }
 *     from '@/database/supabase/repositories';
 *
 * Rules:
 *   - These repositories ONLY touch user-feature tables (bookmarks, notes, etc.)
 *   - They NEVER read or write content data (remedies, rubrics, books).
 *   - Each function gracefully returns null / [] / void when Supabase is not
 *     configured (env vars missing) so the app falls back to localStorage.
 */
import * as BookmarksRepo from './bookmarks';
import * as FavoritesRepo from './favorites';
import * as NotesRepo from './notes';
import * as HistoryRepo from './history';
import * as HighlightsRepo from './highlights';
import * as ProgressRepo from './progress';
import * as AIChatRepo from './ai-chat';
import * as ProfileRepo from './profile';

export {
  BookmarksRepo,
  FavoritesRepo,
  NotesRepo,
  HistoryRepo,
  HighlightsRepo,
  ProgressRepo,
  AIChatRepo,
  ProfileRepo,
};
