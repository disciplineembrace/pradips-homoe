/** GET /api/clinical-search — Quick Clinical Search
 *
 * Search across verified Materia Medica + Repertory data.
 *
 * Match priority (strict, no fuzzy/typo tolerance):
 *   1. EXACT — exact phrase found in name, keynote, or full text
 *   2. CLOSE — all query words found in combined text
 *   3. RELATED — any query word found in combined text (limited count)
 *
 * No fake results. No AI-generated content. Source data is read-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRemedies, getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const subject = url.searchParams.get('subject') || 'all';
  const source = url.searchParams.get('source') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = Math.min(50, Math.max(10, parseInt(url.searchParams.get('pageSize') || '20', 10)));

  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0, page, pageSize });
  }

  // Build search query
  const queryWords = q.split(/\s+/).filter(w => w.length >= 2);
  const queryPhrase = q;

  // Load data
  let remedies: any[] = [];
  let rubrics: any[] = [];

  if (subject === 'all' || subject === 'materia-medica') {
    remedies = await getRemedies();
    if (source !== 'all') {
      remedies = remedies.filter(r => (r.source || r.author) === source);
    }
  }

  if (subject === 'all' || subject === 'repertory') {
    rubrics = await getRubrics();
    if (source !== 'all') {
      rubrics = rubrics.filter(r => (r.source || r.author) === source);
    }
  }

  type Result = {
    type: 'remedy' | 'rubric';
    id: string;
    name: string;
    author: string;
    source: string;
    subsection?: string;
    matchType: 'exact' | 'close' | 'related';
    matchText: string;
    snippet: string;
    href: string;
    sourcePages?: string;
  };

  const results: Result[] = [];

  // ============================================================
  // SEARCH REMEDIES (Materia Medica)
  // ============================================================
  for (const r of remedies) {
    const name = (r.name || '').toLowerCase();
    const keynote = (r.keynote || '').toLowerCase();
    const fullText = (r.full || '').toLowerCase();
    const combinedText = `${name} ${keynote} ${fullText}`;

    let matchType: 'exact' | 'close' | 'related' = 'related';
    let matchText = '';
    let snippet = '';

    // 1. EXACT name match (highest priority)
    if (name === queryPhrase) {
      matchType = 'exact';
      matchText = 'Exact remedy name match';
      snippet = (r.keynote || r.full || '').substring(0, 250);
    }
    // 2. Name starts with query
    else if (name.startsWith(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Remedy name starts with query';
      snippet = (r.keynote || r.full || '').substring(0, 250);
    }
    // 3. Name contains exact phrase
    else if (name.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Remedy name contains query';
      snippet = (r.keynote || r.full || '').substring(0, 250);
    }
    // 4. Exact phrase in full text
    else if (fullText.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in source text';
      const idx = fullText.indexOf(queryPhrase);
      const start = Math.max(0, idx - 80);
      const end = Math.min(fullText.length, idx + queryPhrase.length + 80);
      snippet = '...' + (r.full || '').substring(start, end) + '...';
    }
    // 5. Exact phrase in keynote
    else if (keynote.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in keynote';
      const idx = keynote.indexOf(queryPhrase);
      const start = Math.max(0, idx - 80);
      const end = Math.min(keynote.length, idx + queryPhrase.length + 80);
      snippet = '...' + (r.keynote || '').substring(start, end) + '...';
    }
    // 6. ALL query words found (close match)
    else if (queryWords.length > 1 && queryWords.every(w => combinedText.includes(w))) {
      matchType = 'close';
      matchText = 'All search terms found';
      // Find the best snippet — the word with the most context
      let bestSnippet = '';
      for (const w of queryWords) {
        const idx = fullText.indexOf(w);
        if (idx >= 0) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(fullText.length, idx + w.length + 100);
          const s = '...' + (r.full || '').substring(start, end) + '...';
          if (s.length > bestSnippet.length) bestSnippet = s;
        }
      }
      snippet = bestSnippet || (r.keynote || '').substring(0, 250);
    }
    // 7. Any single word found (related — lowest priority)
    else if (queryWords.some(w => combinedText.includes(w))) {
      matchType = 'related';
      matchText = 'Related indication';
      const firstWord = queryWords.find(w => combinedText.includes(w));
      if (firstWord && fullText.includes(firstWord)) {
        const idx = fullText.indexOf(firstWord);
        const start = Math.max(0, idx - 60);
        const end = Math.min(fullText.length, firstWord.length + 100);
        snippet = '...' + (r.full || '').substring(start, end) + '...';
      } else {
        snippet = (r.keynote || '').substring(0, 200);
      }
    }

    if (matchType !== 'related' || queryWords.some(w => combinedText.includes(w))) {
      // Find subsection from sections array
      let subsection = '';
      if (r.sections && Array.isArray(r.sections)) {
        for (const s of r.sections) {
          const sectionText = (s.paragraphs || []).join(' ').toLowerCase();
          if (sectionText.includes(queryPhrase) || queryWords.some(w => sectionText.includes(w))) {
            subsection = s.heading || '';
            break;
          }
        }
      }

      results.push({
        type: 'remedy',
        id: r.id,
        name: r.name,
        author: r.author || '',
        source: r.source_book || r.author || '',
        subsection,
        matchType,
        matchText,
        snippet,
        href: `/remedy/${r.id}`,
        sourcePages: r.source_pages || '',
      });
    }
  }

  // ============================================================
  // SEARCH RUBRICS (Repertory)
  // ============================================================
  for (const r of rubrics) {
    const title = (r.title || '').toLowerCase();
    const path = (r.path || '').toLowerCase();
    const remediesList = ((r.remedies || []) as string[]).map((rem: any) => {
      if (typeof rem === 'string') return rem.split('|')[0];
      return typeof rem === 'object' && rem?.name ? rem.name : String(rem);
    }).join(' ').toLowerCase();
    const combinedText = `${title} ${path} ${remediesList}`;

    let matchType: 'exact' | 'close' | 'related' = 'related';
    let matchText = '';
    let snippet = '';

    // 1. Exact phrase match in title or path
    if (title.includes(queryPhrase) || path.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in rubric';
      snippet = r.path || r.title;
    }
    // 2. All words found
    else if (queryWords.length > 1 && queryWords.every(w => combinedText.includes(w))) {
      matchType = 'close';
      matchText = 'All terms found in rubric';
      snippet = r.path || r.title;
    }
    // 3. Any word found
    else if (queryWords.some(w => combinedText.includes(w))) {
      matchType = 'related';
      matchText = 'Related rubric';
      snippet = r.path || r.title;
    }

    if (matchType !== 'related' || queryWords.some(w => combinedText.includes(w))) {
      results.push({
        type: 'rubric',
        id: r.id,
        name: r.title,
        author: r.author || '',
        source: r.author || '',
        subsection: r.path || '',
        matchType,
        matchText,
        snippet: snippet + ((r.remedies && r.remedies.length > 0) ? ` — Remedies: ${r.remedies.slice(0, 10).join(', ')}${r.remedies.length > 10 ? '...' : ''}` : ''),
        href: `/repertory`,
        sourcePages: '',
      });
    }
  }

  // ============================================================
  // SORT: exact > close > related, name matches first
  // ============================================================
  const priority = { exact: 0, close: 1, related: 2 };
  results.sort((a, b) => {
    const typeDiff = priority[a.matchType] - priority[b.matchType];
    if (typeDiff !== 0) return typeDiff;
    // Within same type, name matches before content matches
    const aIsName = a.matchText.includes('name');
    const bIsName = b.matchText.includes('name');
    if (aIsName && !bIsName) return -1;
    if (!aIsName && bIsName) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Deduplicate by id (keep strongest match)
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  // Paginate
  const total = deduped.length;
  const start = (page - 1) * pageSize;
  const items = deduped.slice(start, start + pageSize);

  return NextResponse.json({ results: items, total, page, pageSize });
}
