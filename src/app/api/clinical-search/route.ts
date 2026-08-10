/** GET /api/clinical-search — Quick Clinical Search (optimized)
 *
 * Searches across verified Materia Medica + Repertory data.
 * Returns results with clinical feature categorization.
 *
 * Match priority:
 *   1. EXACT — exact phrase found in name, keynote, or full text
 *   2. CLOSE — all query words found in combined text
 *   3. RELATED — any query word found
 *
 * Performance optimizations:
 *   - Cached search index built once on first request (~52MB data)
 *   - Pre-computed combined text per item (no re-concatenation per query)
 *   - Pre-cleaned display names (OCR artifacts stripped at index time)
 *   - Early-exit filtering using pre-built lowercase text
 *
 * Data quality:
 *   - Malformed Phatak OCR paths (leading ·, •, ,, ') are cleaned at index time
 *   - Falls back to title if fullPath is still malformed after cleaning
 *   - Skips entries with no usable display name
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRemedies, getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

// ============================================================
// CLINICAL PATTERN DETECTION — for categorization
// ============================================================
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

// ============================================================
// CLEAN DISPLAY NAME — strip OCR artifacts from Phatak paths
// Returns empty string if the name is too corrupted to use.
// ============================================================
function cleanDisplayName(raw: string): string {
  if (!raw) return '';
  let cleaned = raw;
  // Strip leading OCR artifacts: ·, •, ,, ', -, whitespace runs, (, )
  cleaned = cleaned.replace(/^[\s·•,\'\-_·.()]+/, '');
  // Collapse multiple internal spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  // Strip leading " - " separators
  cleaned = cleaned.replace(/^\s*-\s*/, '');
  cleaned = cleaned.trim();

  // Skip deeply corrupted entries:
  // - Starts with digit(s) followed by punctuation/letters (e.g. "11,VER", "11EARING")
  // - Contains OCR artifact patterns like • or · in the middle
  // - Less than 3 chars after cleaning
  if (cleaned.length < 3) return '';
  if (/^\d[\d,\s]*[A-Z]/.test(cleaned)) return ''; // "11,VER" or "11 EARING" pattern
  if (/[•·]/.test(cleaned.substring(1))) return ''; // • or · in middle
  // Skip if starts with malformed punctuation+letter patterns
  if (/^[,\'\-\(\)]+[A-Z]/.test(cleaned) && cleaned.length < 10) return '';

  return cleaned;
}

// ============================================================
// CACHED SEARCH INDEX — built once, reused across requests
// ============================================================
type IndexedRemedy = {
  type: 'remedy';
  id: string;
  name: string;
  displayName: string;
  author: string;
  source: string;
  keynote: string;
  full: string;
  combinedText: string; // pre-lowercased for fast search
  sections: any[];
  sourcePages: string;
};

type IndexedRubric = {
  type: 'rubric';
  id: string;
  name: string;
  displayName: string; // cleaned fullPath or title
  author: string;
  source: string;
  chapter: string;
  combinedText: string; // pre-lowercased for fast search
  parsedRemedies: { abbrev: string; grade: number }[];
  byGradeCounts: { 4: number; 3: number; 2: number; 1: number };
};

let _remedyIndex: IndexedRemedy[] | null = null;
let _rubricIndex: IndexedRubric[] | null = null;
let _indexBuilding = false;

async function buildIndex(): Promise<void> {
  if (_remedyIndex && _rubricIndex) return;
  if (_indexBuilding) {
    // Wait for another in-progress build to finish
    while (_indexBuilding) {
      await new Promise(r => setTimeout(r, 50));
    }
    return;
  }
  _indexBuilding = true;
  try {
    const [remedies, rubrics] = await Promise.all([getRemedies(), getRubrics()]);

    _remedyIndex = remedies.map(r => {
      const name = r.name || '';
      const keynote = r.keynote || '';
      const full = r.full || '';
      const combinedText = `${name} ${keynote} ${full}`.toLowerCase();
      return {
        type: 'remedy' as const,
        id: r.id,
        name,
        displayName: name,
        author: r.author || '',
        source: r.source_book || r.author || '',
        keynote,
        full,
        combinedText,
        sections: r.sections || [],
        sourcePages: r.source_pages || '',
      };
    });

    _rubricIndex = [];
    for (const r of rubrics) {
      const rawTitle = r.title || '';
      const rawFullPath = r.fullPath || '';
      // Clean display name: prefer cleaned fullPath, fall back to title
      let displayName = cleanDisplayName(rawFullPath);
      if (!displayName || displayName.length < 3) {
        displayName = cleanDisplayName(rawTitle);
      }
      // Skip entries with no usable display name
      if (!displayName || displayName.length < 3) continue;

      // Parse remedies "abbrev|grade"
      const parsedRemedies = (r.remedies || []).map((rem: any) => {
        if (typeof rem === 'string') {
          const parts = rem.split('|');
          return { abbrev: parts[0], grade: parseInt(parts[1] || '1', 10) };
        }
        return null;
      }).filter((x: any): x is { abbrev: string; grade: number } => x !== null);

      const byGradeCounts = { 4: 0, 3: 0, 2: 0, 1: 0 } as { 4: number; 3: number; 2: number; 1: number };
      for (const pr of parsedRemedies) {
        const g = (pr.grade >= 1 && pr.grade <= 4 ? pr.grade : 1) as 1 | 2 | 3 | 4;
        byGradeCounts[g]++;
      }

      const remedyText = parsedRemedies.map(pr => pr.abbrev).join(' ').toLowerCase();
      const combinedText = `${displayName} ${r.chapter || ''} ${remedyText}`.toLowerCase();

      _rubricIndex.push({
        type: 'rubric' as const,
        id: r.id,
        name: displayName,
        displayName,
        author: r.source || r.author || '',
        source: r.source || r.author || '',
        chapter: r.chapter || '',
        combinedText,
        parsedRemedies,
        byGradeCounts,
      });
    }
  } finally {
    _indexBuilding = false;
  }
}

// ============================================================
// SEARCH — uses cached index for fast lookups
// ============================================================
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

  // Build/reuse cached index
  await buildIndex();
  if (!_remedyIndex || !_rubricIndex) {
    return NextResponse.json({ error: 'Search index not ready' }, { status: 503 });
  }

  const queryWords = q.split(/\s+/).filter(w => w.length >= 2);
  const queryPhrase = q;

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

  // Search remedies (if subject allows)
  if (subject === 'all' || subject === 'materia-medica') {
    for (const r of _remedyIndex!) {
      // Source filter
      if (source !== 'all' && r.author !== source) continue;

      const name = r.name.toLowerCase();
      const combinedText = r.combinedText;

      let matchType: 'exact' | 'close' | 'related' = 'related';
      let matchText = '';
      let snippet = '';

      if (name === queryPhrase) {
        matchType = 'exact';
        matchText = 'Exact remedy name match';
        snippet = (r.keynote || r.full || '').substring(0, 300);
      } else if (name.includes(queryPhrase)) {
        matchType = 'exact';
        matchText = 'Remedy name contains query';
        snippet = (r.keynote || r.full || '').substring(0, 300);
      } else if (r.full.toLowerCase().includes(queryPhrase)) {
        matchType = 'exact';
        matchText = 'Exact phrase match in source text';
        const idx = r.full.toLowerCase().indexOf(queryPhrase);
        const start = Math.max(0, idx - 80);
        const end = Math.min(r.full.length, idx + queryPhrase.length + 120);
        snippet = '...' + r.full.substring(start, end) + '...';
      } else if (r.keynote.toLowerCase().includes(queryPhrase)) {
        matchType = 'exact';
        matchText = 'Exact phrase match in keynote';
        const idx = r.keynote.toLowerCase().indexOf(queryPhrase);
        const start = Math.max(0, idx - 80);
        const end = Math.min(r.keynote.length, idx + queryPhrase.length + 120);
        snippet = '...' + r.keynote.substring(start, end) + '...';
      } else if (queryWords.length > 1 && queryWords.every(w => combinedText.includes(w))) {
        matchType = 'close';
        matchText = 'All search terms found';
        let bestSnippet = '';
        for (const w of queryWords) {
          const idx = r.full.toLowerCase().indexOf(w);
          if (idx >= 0) {
            const start = Math.max(0, idx - 60);
            const end = Math.min(r.full.length, idx + w.length + 120);
            const s = '...' + r.full.substring(start, end) + '...';
            if (s.length > bestSnippet.length) bestSnippet = s;
          }
        }
        snippet = bestSnippet || (r.keynote || '').substring(0, 300);
      } else if (queryWords.some(w => combinedText.includes(w))) {
        matchType = 'related';
        matchText = 'Related indication';
        const firstWord = queryWords.find(w => combinedText.includes(w));
        if (firstWord && r.full.toLowerCase().includes(firstWord)) {
          const idx = r.full.toLowerCase().indexOf(firstWord);
          const start = Math.max(0, idx - 60);
          const end = Math.min(r.full.length, firstWord.length + 120);
          snippet = '...' + r.full.substring(start, end) + '...';
        } else {
          snippet = (r.keynote || '').substring(0, 200);
        }
      } else {
        continue; // no match
      }

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

      const categories = categorizeSnippet(snippet);
      results.push({
        type: 'remedy',
        id: r.id,
        name: r.displayName,
        author: r.author,
        source: r.source,
        subsection,
        matchType,
        matchText,
        snippet,
        href: `/remedy/${r.id}`,
        sourcePages: r.sourcePages,
        categories,
      });
    }
  }

  // Search rubrics (if subject allows)
  if (subject === 'all' || subject === 'repertory') {
    for (const r of _rubricIndex!) {
      // Source filter
      if (source !== 'all' && r.author !== source) continue;

      const name = r.name.toLowerCase();
      const combinedText = r.combinedText;

      let matchType: 'exact' | 'close' | 'related' = 'related';
      let matchText = '';
      let snippet = '';

      if (name.includes(queryPhrase)) {
        matchType = 'exact';
        matchText = 'Exact phrase match in rubric';
        snippet = r.displayName;
      } else if (queryWords.length > 1 && queryWords.every(w => combinedText.includes(w))) {
        matchType = 'close';
        matchText = 'All terms found in rubric';
        snippet = r.displayName;
      } else if (queryWords.some(w => combinedText.includes(w))) {
        matchType = 'related';
        matchText = 'Related rubric';
        snippet = r.displayName;
      } else {
        continue; // no match
      }

      const bg = r.byGradeCounts;
      results.push({
        type: 'rubric',
        id: r.id,
        name: r.displayName,
        author: r.author,
        source: r.source,
        subsection: r.chapter,
        matchType,
        matchText,
        snippet: snippet + (r.parsedRemedies.length > 0
          ? ` — ${r.parsedRemedies.length} remedies (G4:${bg[4]}, G3:${bg[3]}, G2:${bg[2]}, G1:${bg[1]})`
          : ''),
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
    const aIsName = a.matchText.includes('name') || a.matchText.includes('rubric');
    const bIsName = b.matchText.includes('name') || b.matchText.includes('rubric');
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
