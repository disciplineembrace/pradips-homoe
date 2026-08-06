/** GET /api/clinical-search — Quick Clinical Search
 *
 * Searches across verified Materia Medica + Repertory data.
 * Returns results with clinical feature categorization.
 *
 * Match priority:
 *   1. EXACT — exact phrase found in name, keynote, or full text
 *   2. CLOSE — all query words found in combined text
 *   3. RELATED — any query word found
 *
 * Clinical categories extracted from source text:
 *   location, sensation, modality, concomitant, causation, 
 *   time, side, peculiar, general
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRemedies, getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

// Clinical pattern detection
const PATTERNS = {
  location: /\b(head|forehead|temple|occiput|eye|ear|nose|face|mouth|throat|neck|back|chest|abdomen|stomach|pelvis|extremit|arm|leg|hand|foot|knee|joint|spine|lumbar|cervical|dorsal)\b/gi,
  sensation: /\b(pain|ache|burning|throbbing|stitching|cutting|tearing|drawing|pressing|bursting|splitting|cramping|spasm|soreness|rawness|dryness|tickling|itching|numbness|tingling|coldness|heat|glowing)\b/gi,
  modality: /\b(worse|better|agg|amel|aggravat|ameliorat|<|>|increas|decreas|relief|relieved)\b/gi,
  concomitant: /\b(with|accompanied|concomitant|along with|associated)\b/gi,
  causation: /\b(from|after|caused by|due to|result of|following|ailments from|suppressed)\b/gi,
  time: /\b(morning|noon|afternoon|evening|night|midnight|dawn|dusk|periodic|recurrent|alternating|seasonal|weekly|monthly|annual)\b/gi,
  side: /\b(right|left|alternating|unilateral|bilateral|one.?sided)\b/gi,
  peculiar: /\b(peculiar|strange|rare|unique|characteristic|uncommon|odd|remarkable|only|never|always)\b/gi,
  extension: /\b(extend|radiat|shoot|travel|spread|running|down|up|from.*to)\b/gi,
};

function categorizeSnippet(text: string): any {
  const lower = text.toLowerCase();
  const result: any = {};

  for (const [category, pattern] of Object.entries(PATTERNS)) {
    const matches = lower.match(pattern);
    if (matches && matches.length > 0) {
      // Find the sentence containing the first match
      const matchWord = matches[0];
      const idx = lower.indexOf(matchWord);
      const sentenceStart = lower.lastIndexOf('.', idx) + 1;
      const sentenceEnd = lower.indexOf('.', idx + matchWord.length);
      const sentence = text.substring(
        sentenceStart,
        sentenceEnd > 0 ? sentenceEnd + 1 : Math.min(text.length, idx + 120)
      ).trim();
      if (sentence.length > 5) {
        result[category] = sentence.substring(0, 200);
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

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

  const queryWords = q.split(/\s+/).filter(w => w.length >= 2);
  const queryPhrase = q;

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
    categories?: any;
  };

  const results: Result[] = [];

  // Search remedies
  for (const r of remedies) {
    const name = (r.name || '').toLowerCase();
    const keynote = (r.keynote || '').toLowerCase();
    const fullText = (r.full || '').toLowerCase();
    const combinedText = `${name} ${keynote} ${fullText}`;

    let matchType: 'exact' | 'close' | 'related' = 'related';
    let matchText = '';
    let snippet = '';

    if (name === queryPhrase) {
      matchType = 'exact';
      matchText = 'Exact remedy name match';
      snippet = (r.keynote || r.full || '').substring(0, 300);
    } else if (name.startsWith(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Remedy name starts with query';
      snippet = (r.keynote || r.full || '').substring(0, 300);
    } else if (name.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Remedy name contains query';
      snippet = (r.keynote || r.full || '').substring(0, 300);
    } else if (fullText.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in source text';
      const idx = fullText.indexOf(queryPhrase);
      const start = Math.max(0, idx - 80);
      const end = Math.min(fullText.length, idx + queryPhrase.length + 120);
      snippet = '...' + (r.full || '').substring(start, end) + '...';
    } else if (keynote.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in keynote';
      const idx = keynote.indexOf(queryPhrase);
      const start = Math.max(0, idx - 80);
      const end = Math.min(keynote.length, idx + queryPhrase.length + 120);
      snippet = '...' + (r.keynote || '').substring(start, end) + '...';
    } else if (queryWords.length > 1 && queryWords.every(w => combinedText.includes(w))) {
      matchType = 'close';
      matchText = 'All search terms found';
      let bestSnippet = '';
      for (const w of queryWords) {
        const idx = fullText.indexOf(w);
        if (idx >= 0) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(fullText.length, idx + w.length + 120);
          const s = '...' + (r.full || '').substring(start, end) + '...';
          if (s.length > bestSnippet.length) bestSnippet = s;
        }
      }
      snippet = bestSnippet || (r.keynote || '').substring(0, 300);
    } else if (queryWords.some(w => combinedText.includes(w))) {
      matchType = 'related';
      matchText = 'Related indication';
      const firstWord = queryWords.find(w => combinedText.includes(w));
      if (firstWord && fullText.includes(firstWord)) {
        const idx = fullText.indexOf(firstWord);
        const start = Math.max(0, idx - 60);
        const end = Math.min(fullText.length, firstWord.length + 120);
        snippet = '...' + (r.full || '').substring(start, end) + '...';
      } else {
        snippet = (r.keynote || '').substring(0, 200);
      }
    }

    if (matchType !== 'related' || queryWords.some(w => combinedText.includes(w))) {
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

      // Categorize the snippet
      const categories = categorizeSnippet(snippet);

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
        categories,
      });
    }
  }

  // Search rubrics
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

    if (title.includes(queryPhrase) || path.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in rubric';
      snippet = r.path || r.title;
    } else if (queryWords.length > 1 && queryWords.every(w => combinedText.includes(w))) {
      matchType = 'close';
      matchText = 'All terms found in rubric';
      snippet = r.path || r.title;
    } else if (queryWords.some(w => combinedText.includes(w))) {
      matchType = 'related';
      matchText = 'Related rubric';
      snippet = r.path || r.title;
    }

    if (matchType !== 'related' || queryWords.some(w => combinedText.includes(w))) {
      results.push({
        type: 'rubric',
        id: r.id,
        name: r.title,
        author: r.source || r.author || '',
        source: r.source || r.author || '',
        subsection: r.path || '',
        matchType,
        matchText,
        snippet: snippet + ((r.remedies && r.remedies.length > 0) ? ` — Remedies: ${r.remedies.slice(0, 10).join(', ')}${r.remedies.length > 10 ? '...' : ''}` : ''),
        href: `/repertory`,
        sourcePages: '',
      });
    }
  }

  // Sort: exact > close > related, name matches first
  const priority = { exact: 0, close: 1, related: 2 };
  results.sort((a, b) => {
    const typeDiff = priority[a.matchType] - priority[b.matchType];
    if (typeDiff !== 0) return typeDiff;
    const aIsName = a.matchText.includes('name');
    const bIsName = b.matchText.includes('name');
    if (aIsName && !bIsName) return -1;
    if (!aIsName && bIsName) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Deduplicate
  const seen = new Set<string>();
  const deduped = results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const total = deduped.length;
  const start = (page - 1) * pageSize;
  const items = deduped.slice(start, start + pageSize);

  return NextResponse.json({ results: items, total, page, pageSize });
}
