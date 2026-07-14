/**
 * Database index — single entry point.
 *
 * Both clients are completely isolated — never import one from inside the other.
 *
 * Usage:
 *   import { neonClient, RemediesRepo, supabase, BookmarksRepo } from '@/database';
 *
 * Rules:
 *   - Neon: content (remedies, rubrics, books, etc.)
 *   - Supabase: user features (bookmarks, notes, history, etc.)
 *   - Never mix them.
 *   - Never duplicate data across them.
 */
export * from './neon';
export * as supabase from './supabase';
