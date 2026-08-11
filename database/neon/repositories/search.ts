/**
 * Search index repository — Neon content database.
 *
 * Maintains a lightweight in-memory search index across all content types
 * (remedies, rubrics, books). Cached in-process; rebuilt lazily on first use.
 *
 * CRITICAL: search results are content-only (no user data). User-specific
 * search history (if any) goes to Supabase.
 */
import { getSearchIndex, getRemedies, getRubrics } from '@/lib/data';
import { cached } from './base';

export interface SearchHit {
  type: 'remedy' | 'rubric';
  id: string;
  name: string;
  author: string;
}

/**
 * Search across remedies + rubrics by free-text query.
 */
export async function searchContent(q: string, limit: number = 50): Promise<SearchHit[]> {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];

  return cached(`search:${query}:${limit}`, async () => {
    const idx = await getSearchIndex();
    const words = query.split(/\s+/).filter(Boolean);
    return idx
      .filter(p => words.some(w => p.text.includes(w)))
      .slice(0, limit)
      .map(p => ({ type: p.type, id: p.id, name: p.name, author: p.author }));
  }, 60 * 1000); // 1 min cache — short TTL since search is interactive
}

/**
 * Rebuild the search index (used by admin / cron).
 */
export async function rebuildSearchIndex(): Promise<{ remedies: number; rubrics: number }> {
  // Force a fresh read from disk
  const [remedies, rubrics] = await Promise.all([getRemedies(), getRubrics()]);
  return { remedies: remedies.length, rubrics: rubrics.length };
}
