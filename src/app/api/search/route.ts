/** GET /api/search — search across remedies + rubrics (requires auth+PIN)
 *
 * Returns relevant results sorted by match quality:
 *   1. Exact name match (highest priority)
 *   2. Name starts with query
 *   3. Name contains query
 *   4. Content match (keynote, rubric text)
 *
 * Returns a mix of remedies (max 30) + rubrics (max 20) = 50 total.
 * Deduplicated by id.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSearchIndex } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (q.length < 1) return NextResponse.json({ results: [], total: 0 });

  const idx = await getSearchIndex();
  const words = q.split(/\s+/).filter(Boolean);
  const queryPhrase = q;

  // Score each match: lower score = higher priority
  // 0 = exact name match
  // 1 = name starts with query
  // 2 = name contains query
  // 3 = content match
  // 99 = no match (filtered out)
  const scored = idx
    .map(p => {
      const nameLower = (p.name || '').toLowerCase();
      let score = 99;

      // Exact name match
      if (nameLower === queryPhrase) score = 0;
      // Name starts with query
      else if (nameLower.startsWith(queryPhrase)) score = 1;
      // Name contains query as a word
      else if (nameLower.includes(queryPhrase)) score = 2;
      // Name contains any query word
      else if (words.some(w => nameLower.includes(w))) score = 3;
      // Content match (keynote, full text, rubric text)
      else if (words.some(w => p.text.includes(w))) score = 4;
      // All words match in content
      else if (words.every(w => p.text.includes(w))) score = 5;

      return { ...p, score };
    })
    .filter(p => p.score < 99);

  // Sort by score (best matches first), then by name
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Deduplicate by id (keep first/best match)
  const seen = new Set<string>();
  const deduped = scored.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Split into remedies and rubrics, take max 30 remedies + 20 rubrics
  const remedies = deduped.filter(p => p.type === 'remedy').slice(0, 30);
  const rubrics = deduped.filter(p => p.type === 'rubric').slice(0, 20);
  const combined = [...remedies, ...rubrics];

  const results = combined.map(p => ({
    type: p.type,
    id: p.id,
    name: p.name,
    author: p.author,
    href: p.type === 'remedy' ? `/remedy/${p.id}` : `/repertory`,
  }));

  return NextResponse.json({ results, total: results.length });
}
