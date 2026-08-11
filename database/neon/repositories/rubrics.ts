/**
 * Rubrics repository — Neon content database.
 *
 * SINGLE SOURCE OF TRUTH for rubric records (Kent, Phatak, Murphy, Boericke, etc.).
 *
 * Currently, rubric data lives in /data/rubrics.json (loaded via src/lib/data.ts).
 * This repository provides a typed interface around that loader. When the
 * project later migrates rubric records into Neon tables, only this file changes.
 *
 * CRITICAL: this repository only handles READ operations on rubric content.
 * User-specific actions (favoriting, bookmarking a rubric, note-taking) go
 * through /database/supabase/repositories/*.
 */
import { getRubrics } from '@/lib/data';
import { cached } from './base';

export interface RubricRecord {
  id: string;
  path: string;
  title: string;
  author: string;
  remedies: string[];
}

/**
 * List rubrics with filters. Cached 10 minutes.
 */
export async function listRubrics(opts: {
  q?: string;
  author?: string;
  offset?: number;
  limit?: number;
} = {}): Promise<{ total: number; items: RubricRecord[] }> {
  const cacheKey = `rubrics:list:${JSON.stringify(opts)}`;
  return cached(cacheKey, async () => {
    const all = await getRubrics();
    let filtered: RubricRecord[] = all;

    if (opts.author) {
      filtered = filtered.filter(r => r.author === opts.author);
    }
    if (opts.q) {
      const q = opts.q.toLowerCase();
      filtered = filtered.filter(r =>
        (r.title + ' ' + (r.path || '') + ' ' + r.remedies.join(' ')).toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const offset = opts.offset || 0;
    const limit = opts.limit || 50;
    const items = filtered.slice(offset, offset + limit);

    return { total, items };
  }, 10 * 60 * 1000);
}

/**
 * Get a single rubric by id.
 */
export async function getRubricById(id: string): Promise<RubricRecord | null> {
  const cacheKey = `rubrics:byId:${id}`;
  return cached(cacheKey, async () => {
    const all = await getRubrics();
    return all.find(r => r.id === id) || null;
  }, 10 * 60 * 1000);
}

/**
 * List all distinct rubric authors (Kent, Phatak, Murphy, Boericke, etc.).
 */
export async function listAuthors(): Promise<string[]> {
  return cached('rubrics:authors', async () => {
    const all = await getRubrics();
    return Array.from(new Set(all.map(r => r.author))).sort();
  }, 30 * 60 * 1000);
}

/**
 * List all distinct chapters (paths) for a given author.
 */
export async function listChaptersByAuthor(author: string): Promise<Array<{ path: string; count: number }>> {
  const cacheKey = `rubrics:chapters:${author}`;
  return cached(cacheKey, async () => {
    const all = await getRubrics();
    const byAuthor = all.filter(r => r.author === author);
    const counts = new Map<string, number>();
    for (const r of byAuthor) {
      counts.set(r.path, (counts.get(r.path) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);
  }, 30 * 60 * 1000);
}
