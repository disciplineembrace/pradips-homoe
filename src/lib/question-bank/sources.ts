/**
 * Question Bank — Data Source Adapter
 *
 * READ-ONLY access to existing content in the database.
 * NEVER writes, modifies, or duplicates any source data.
 *
 * Sources:
 *   - Remedies (Materia Medica) — from /data/remedies.json via getRemedies()
 *   - Rubrics (Repertory)       — from /data/rubrics.json via getRubrics()
 *   - Therapeutics               — from /data/therapeutics.json
 *   - Books                      — from /data/books/*.json
 *
 * All reads go through the existing /src/lib/data.ts and /src/lib/books-data.ts
 * loaders (which already have in-memory caching).
 *
 * AUTO-UPDATE: when a new book JSON is added to /data/books/, it will
 * automatically appear in listBooks() without code changes.
 */
import { getRemedies, getRubrics, getTherapeutics } from '@/lib/data';
import { getAllBooks, getBook } from '@/lib/books-data';
import { cached } from '@/database/neon/repositories/base';
import { splitSentences, splitSections } from './safe-split';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RemedySource {
  id: string;
  name: string;
  common?: string;
  author: string;
  chapter?: string;
  organ?: string;
  modalities?: string;
  constitution?: string;
  relationships?: string;
  dose?: string;
  keynote?: string;
  full?: string;
}

export interface RubricSource {
  id: string;
  path: string;
  title: string;
  author: string;
  remedies: string[];
}

export interface BookSource {
  id: string;
  title: string;
  author: string;
  category?: string;
  description?: string;
  totalChapters?: number;
  chapters?: Array<{ id: string; title: string; content?: string }>;
  remedies?: Array<{ id: string; name: string; content?: string }>;
}

export type SourceType = 'remedy' | 'rubric' | 'book' | 'therapeutic';

export interface SourceSummary {
  type: SourceType;
  id: string;
  title: string;
  author: string;
  chapter?: string;
  topic?: string;
  pageCount?: number;
  excerpt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Read functions (all cached, read-only)
// ─────────────────────────────────────────────────────────────────────────────

export async function listRemedies(): Promise<RemedySource[]> {
  return cached('qb:remedies:all', async () => {
    return (await getRemedies()) as RemedySource[];
  }, 30 * 60 * 1000);
}

export async function listRubrics(): Promise<RubricSource[]> {
  return cached('qb:rubrics:all', async () => {
    return (await getRubrics()) as RubricSource[];
  }, 30 * 60 * 1000);
}

export async function listBooks(): Promise<BookSource[]> {
  return cached('qb:books:all', async () => {
    const books = await getAllBooks();
    return books as BookSource[];
  }, 30 * 60 * 1000);
}

export async function getBookById(id: string): Promise<BookSource | null> {
  return cached(`qb:books:${id}`, async () => {
    const book = await getBook(id);
    return book as BookSource | null;
  }, 30 * 60 * 1000);
}

export async function listTherapeutics(): Promise<any> {
  return cached('qb:therapeutics:all', async () => {
    return await getTherapeutics();
  }, 30 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Source metadata (for UI dropdowns)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSourceMetadata() {
  return cached('qb:sources:metadata', async () => {
    const [remedies, rubrics, books, therapeutics] = await Promise.all([
      listRemedies(),
      listRubrics(),
      listBooks(),
      listTherapeutics(),
    ]);

    // Remedy authors
    const remedyAuthors = Array.from(new Set(remedies.map(r => r.author))).sort();

    // Rubric authors + their chapters
    const rubricAuthors = Array.from(new Set(rubrics.map(r => r.author))).sort();
    const chaptersByAuthor: Record<string, string[]> = {};
    for (const r of rubrics) {
      if (!chaptersByAuthor[r.author]) chaptersByAuthor[r.author] = [];
      if (!chaptersByAuthor[r.author].includes(r.path)) {
        chaptersByAuthor[r.author].push(r.path);
      }
    }
    for (const a of Object.keys(chaptersByAuthor)) {
      chaptersByAuthor[a].sort();
    }

    // Books
    const bookList = books.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      totalChapters: b.totalChapters || b.chapters?.length || 0,
    }));

    // Therapeutics count — therapeutics is an object {diseases: [...]}, not an array
    const therapeuticsCount = Array.isArray(therapeutics)
      ? therapeutics.length
      : (therapeutics?.diseases?.length || therapeutics?.total_diseases || 0);

    return {
      remedies: { count: remedies.length, authors: remedyAuthors },
      rubrics: { count: rubrics.length, authors: rubricAuthors, chaptersByAuthor },
      books: { count: books.length, list: bookList },
      therapeutics: { count: therapeuticsCount },
      totalSources: remedies.length + rubrics.length + books.length + therapeuticsCount,
    };
  }, 30 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Content extractors (for question generation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract "topics" from a remedy's keynote/full text.
 * Topics are sentence fragments that contain a clinical indication.
 */
export function extractRemedyTopics(remedy: RemedySource): string[] {
  const text = (remedy.keynote || '') + '\n' + (remedy.full || '');
  if (!text.trim()) return [];
  // Split on common section markers and sentences (ES2017-safe)
  const sectionParts = splitSections(text);
  const sections: string[] = [];
  for (const part of sectionParts) {
    sections.push(...splitSentences(part));
  }
  return sections
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 300) // meaningful but not too long
    .slice(0, 20);
}

/**
 * Extract remedy organ systems from the "organ" field.
 */
export function extractRemedyOrgans(remedy: RemedySource): string[] {
  if (!remedy.organ) return [];
  return remedy.organ
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Parse a Kent-style rubric title into main + sub rubric.
 */
export function parseRubricTitle(title: string): { main: string; sub: string } {
  const idx = title.indexOf(' — ');
  if (idx === -1) return { main: title, sub: '' };
  return {
    main: title.slice(0, idx).trim(),
    sub: title.slice(idx + 3).trim(),
  };
}
