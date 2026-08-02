/** GET /api/clinical-search — Quick Clinical Search across all indexed data */
import { NextRequest, NextResponse } from 'next/server';
import { getRemedies, getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const subject = url.searchParams.get('subject') || 'all'; // all, materia-medica, repertory
  const source = url.searchParams.get('source') || 'all'; // all, or specific author/source
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = Math.min(50, Math.max(10, parseInt(url.searchParams.get('pageSize') || '20', 10)));
  
  if (q.length < 2) {
    return NextResponse.json({ results: [], total: 0, page, pageSize });
  }
  
  // Build search query words
  const queryWords = q.split(/\s+/).filter(w => w.length >= 2);
  const queryPhrase = q;
  
  // Load data based on subject filter
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
  
  // Search remedies
  for (const r of remedies) {
    const fullText = (r.full || '').toLowerCase();
    const keynote = (r.keynote || '').toLowerCase();
    const name = (r.name || '').toLowerCase();
    const combinedText = `${name} ${keynote} ${fullText}`;
    
    // Check for exact phrase match
    let matchType: 'exact' | 'close' | 'related' = 'related';
    let matchText = '';
    let snippet = '';
    
    // Exact phrase match in full text
    if (fullText.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match';
      // Extract snippet around the match
      const idx = fullText.indexOf(queryPhrase);
      const start = Math.max(0, idx - 60);
      const end = Math.min(fullText.length, idx + queryPhrase.length + 60);
      snippet = '...' + (r.full || '').substring(start, end) + '...';
    }
    // Exact phrase match in keynote
    else if (keynote.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in keynote';
      const idx = keynote.indexOf(queryPhrase);
      const start = Math.max(0, idx - 60);
      const end = Math.min(keynote.length, queryPhrase.length + 60);
      snippet = '...' + (r.keynote || '').substring(start, end) + '...';
    }
    // All words match (close match)
    else if (queryWords.every(w => combinedText.includes(w))) {
      matchType = 'close';
      matchText = 'All terms found';
      // Find the first matching word for snippet
      const firstWord = queryWords.find(w => fullText.includes(w));
      if (firstWord) {
        const idx = fullText.indexOf(firstWord);
        const start = Math.max(0, idx - 60);
        const end = Math.min(fullText.length, firstWord.length + 120);
        snippet = '...' + (r.full || '').substring(start, end) + '...';
      } else {
        snippet = (r.keynote || '').substring(0, 200);
      }
    }
    // Any word match (related)
    else if (queryWords.some(w => combinedText.includes(w))) {
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
      // Try to find subsection from sections array
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
  
  // Search rubrics
  for (const r of rubrics) {
    const title = (r.title || '').toLowerCase();
    const path = (r.path || '').toLowerCase();
    const remediesList = ((r.remedies || []) as string[]).join(' ').toLowerCase();
    const combinedText = `${title} ${path} ${remediesList}`;
    
    let matchType: 'exact' | 'close' | 'related' = 'related';
    let matchText = '';
    let snippet = '';
    
    if (title.includes(queryPhrase) || path.includes(queryPhrase)) {
      matchType = 'exact';
      matchText = 'Exact phrase match in rubric';
      snippet = r.path || r.title;
    } else if (queryWords.every(w => combinedText.includes(w))) {
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
  
  // Sort by match type priority: exact > close > related
  const priority = { exact: 0, close: 1, related: 2 };
  results.sort((a, b) => priority[a.matchType] - priority[b.matchType]);
  
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
