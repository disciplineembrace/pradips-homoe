/**
 * Books repository — Neon content database.
 *
 * SINGLE SOURCE OF TRUTH for e-book metadata and chapter content.
 *
 * Currently, book data lives in /data/books/*.json (loaded via src/lib/books-data.ts).
 * This repository wraps that loader. When book records migrate into Neon tables,
 * only this file changes — no other module needs to know.
 *
 * CRITICAL: this repository only handles READ operations on book content.
 * User-specific reading progress, bookmarks, highlights, notes go through
 * /database/supabase/repositories/*.
 */
import { cached } from './base';
import { getBook, getAllBooks } from '@/lib/books-data';

export interface BookRecord {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  category?: string;
  description?: string;
  totalChapters?: number;
  chapters?: Array<{ id: string; title: string }>;
}

/**
 * List all books (with chapter metadata, no chapter content).
 */
export async function listAllBooks(): Promise<BookRecord[]> {
  return cached('books:all', async () => {
    return (await getAllBooks()) as BookRecord[];
  }, 30 * 60 * 1000);
}

/**
 * Get a single book by id (with full chapter content if present).
 */
export async function getBookById(bookId: string): Promise<BookRecord | null> {
  const cacheKey = `books:byId:${bookId}`;
  return cached(cacheKey, async () => {
    return (await getBook(bookId)) as BookRecord | null;
  }, 30 * 60 * 1000);
}

// Backward-compatible aliases
export { getBook, getAllBooks };
