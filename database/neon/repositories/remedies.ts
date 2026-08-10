/**
 * Remedies repository — Neon content database.
 *
 * SINGLE SOURCE OF TRUTH for remedy records.
 *
 * Currently, remedy data lives in /data/remedies.json (loaded via src/lib/data.ts).
 * This repository provides a typed interface that wraps that loader. When the
 * project later migrates remedy records into Neon tables, only this file needs
 * to change — every other module consumes remedies through this interface.
 *
 * CRITICAL: this repository only handles READ operations on remedy content.
 * User-specific actions (favoriting, bookmarking a remedy) go through
 * /database/supabase/repositories/*.
 */
import { getRemedies } from '@/lib/data';
import { cached } from './base';

export interface RemedyRecord {
  id: string;
  name: string;
  common?: string;
  author: string;
  letter?: string;
  chapter?: string;
  organ?: string;
  modalities?: string;
  constitution?: string;
  relationships?: string;
  dose?: string;
  keynote?: string;
  full?: string;
}

/**
 * List remedies with optional filters.
 * Results are cached in-process for 10 minutes (remedy data is static).
 */
export async function listRemedies(opts: {
  q?: string;
  author?: string;
  letter?: string;
  offset?: number;
  limit?: number;
} = {}): Promise<{ total: number; items: RemedyRecord[] }> {
  const cacheKey = `remedies:list:${JSON.stringify(opts)}`;
  return cached(cacheKey, async () => {
    const all = await getRemedies();
    let filtered: RemedyRecord[] = all;

    if (opts.author) {
      filtered = filtered.filter(r => r.author === opts.author);
    }
    if (opts.letter) {
      filtered = filtered.filter(r => (r.letter || r.name[0]?.toUpperCase()) === opts.letter);
    }
    if (opts.q) {
      const q = opts.q.toLowerCase();
      filtered = filtered.filter(r =>
        (r.name + ' ' + (r.common || '') + ' ' + (r.keynote || '')).toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const offset = opts.offset || 0;
    const limit = opts.limit || 50;
    const items = filtered.slice(offset, offset + limit);

    return { total, items };
  }, 10 * 60 * 1000); // 10 min cache
}

/**
 * Get a single remedy by id.
 */
export async function getRemedyById(id: string): Promise<RemedyRecord | null> {
  const cacheKey = `remedies:byId:${id}`;
  return cached(cacheKey, async () => {
    const all = await getRemedies();
    return all.find(r => r.id === id) || null;
  }, 10 * 60 * 1000);
}

/**
 * List all distinct remedy authors (for filter dropdowns).
 */
export async function listAuthors(): Promise<string[]> {
  return cached('remedies:authors', async () => {
    const all = await getRemedies();
    return Array.from(new Set(all.map(r => r.author))).sort();
  }, 30 * 60 * 1000);
}
