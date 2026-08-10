/**
 * POST /api/ai/suggest-rubrics
 *
 * AI-assisted rubric suggestion engine.
 * Takes natural language symptoms, searches existing rubrics (Murphy, Phatak, Kent),
 * and returns matching rubrics for user approval.
 *
 * Does NOT invent rubrics — only uses existing data from the database.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for',
  'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
  'this', 'that', 'these', 'those', 'from', 'as', 'when', 'where', 'while', 'about',
  'into', 'over', 'under', 'after', 'before', 'between', 'than', 'then', 'so', 'such',
  'no', 'not', 'nor', 'only', 'own', 'same', 'too', 'very', 's', 't', 'can', 'just',
  'feel', 'feeling', 'feels', 'with', 'very', 'much', 'also', 'patient', 'has', 'have',
  'had', 'suffers', 'suffering', 'complaint', 'complains', 'symptom', 'symptoms',
]);

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body: { symptoms?: string; sources?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const symptoms = (body.symptoms || '').trim().toLowerCase();
  if (!symptoms || symptoms.length < 3) {
    return NextResponse.json({ error: 'Please enter symptoms (at least 3 characters)' }, { status: 400 });
  }

  const allowedSources = body.sources?.length ? body.sources : ['Murphy', 'Phatak', 'Kent'];

  // Extract keywords from symptoms (remove stop words)
  const words = symptoms.split(/[\s,;.]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length === 0) {
    return NextResponse.json({ error: 'Could not extract meaningful keywords. Please describe symptoms more specifically.' }, { status: 400 });
  }

  // Search rubrics — find rubrics whose title or path contains any of the keywords
  const rubrics = await getRubrics();
  const scored: { rubric: any; score: number; matchedWords: string[] }[] = [];

  for (const r of rubrics) {
    const rubricSource = r.source || r.author || '';
    if (!allowedSources.includes(rubricSource)) continue;

    const titleLower = (r.title || '').toLowerCase();
    const pathLower = (r.path || '').toLowerCase();
    const combined = titleLower + ' ' + pathLower;

    let score = 0;
    const matched: string[] = [];

    for (const word of words) {
      if (titleLower.includes(word)) {
        score += 3; // Title match is stronger
        matched.push(word);
      } else if (pathLower.includes(word)) {
        score += 2; // Path match
        matched.push(word);
      } else if (r.remedies && r.remedies.some((rem: string) => {
          const remName = typeof rem === 'string' ? rem.split('|')[0] : rem;
          return remName.toLowerCase().includes(word);
        })) {
        score += 1; // Remedy name match (weaker)
        matched.push(word);
      }
    }

    if (score > 0) {
      scored.push({
        rubric: {
          id: r.id,
          title: r.title,
          path: r.path,
          author: r.source || r.author || '',
          remedies: (r.remedies || []).slice(0, 20), // Limit remedies shown
          remedyCount: (r.remedies || []).length,
        },
        score,
        matchedWords: [...new Set(matched)],
      });
    }
  }

  // Sort by score descending, take top 30
  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, 30);

  // Group by source for the response
  const bySource: Record<string, any[]> = {};
  for (const item of topResults) {
    const src = item.rubric.author || item.rubric.source || '';
    if (!bySource[src]) bySource[src] = [];
    bySource[src].push({
      ...item.rubric,
      matchScore: item.score,
      matchedKeywords: item.matchedWords,
    });
  }

  return NextResponse.json({
    success: true,
    query: symptoms,
    extractedKeywords: words,
    totalMatches: topResults.length,
    suggestions: topResults.map(s => ({
      ...s.rubric,
      matchScore: s.score,
      matchedKeywords: s.matchedWords,
    })),
    bySource,
  });
}
