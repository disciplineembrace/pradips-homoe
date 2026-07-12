/**
 * POST /api/analysis/calculate
 *
 * Repertorization scoring engine.
 * Takes selected rubrics with intensity + category, calculates remedy scores
 * using: Grade × Intensity + Source Correlation + Keynote Match + MM Similarity
 *
 * Scoring model:
 * - Grade 1 = 1pt, Grade 2 = 2pt, Grade 3 = 3pt (inferred from remedy position)
 * - Low intensity ×1, Medium ×1.5, High ×2
 * - Same remedy in Murphy + Phatak = +5 bonus per extra source
 * - Keynote match = +3 bonus
 * - Materia medica similarity = +3 bonus
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRubrics, getRemedies } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

interface SelectedRubric {
  id: string;
  title: string;
  path: string;
  author: string;
  remedies: string[];
  intensity: 'low' | 'medium' | 'high';
  category: 'mental' | 'general' | 'particular';
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body: { rubrics?: SelectedRubric[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const selectedRubrics = body.rubrics || [];
  if (selectedRubrics.length === 0) {
    return NextResponse.json({ error: 'No rubrics selected. Add at least one rubric to analyze.' }, { status: 400 });
  }

  // Load remedies for keynote/MM matching
  const allRemedies = await getRemedies();
  const remedyMap = new Map<string, any>();
  for (const r of allRemedies) {
    remedyMap.set(r.name.toLowerCase(), r);
  }

  // Intensity multipliers
  const intensityMultiplier: Record<string, number> = { low: 1, medium: 1.5, high: 2 };
  // Category weights
  const categoryWeight: Record<string, number> = { mental: 1.5, general: 1.2, particular: 1.0 };

  // Score each remedy
  const remedyScores: Map<string, {
    name: string;
    totalScore: number;
    murphyScore: number;
    phatakScore: number;
    kentScore: number;
    rubricsCovered: string[];
    sources: Set<string>;
    keynoteMatch: boolean;
    mmMatch: boolean;
    grades: number[];
  }> = new Map();

  for (const rubric of selectedRubrics) {
    const intensity = intensityMultiplier[rubric.intensity] || 1;
    const catWeight = categoryWeight[rubric.category] || 1;
    const source = rubric.author;

    for (let i = 0; i < (rubric.remedies || []).length; i++) {
      const remedyName = rubric.remedies[i];
      const key = remedyName.toLowerCase();

      // Infer grade from position: first 3 = grade 3, next 5 = grade 2, rest = grade 1
      let grade = 1;
      if (i < 3) grade = 3;
      else if (i < 8) grade = 2;

      const baseScore = grade * intensity * catWeight;

      if (!remedyScores.has(key)) {
        remedyScores.set(key, {
          name: remedyName,
          totalScore: 0,
          murphyScore: 0,
          phatakScore: 0,
          kentScore: 0,
          rubricsCovered: [],
          sources: new Set(),
          keynoteMatch: false,
          mmMatch: false,
          grades: [],
        });
      }

      const entry = remedyScores.get(key)!;
      entry.totalScore += baseScore;
      entry.rubricsCovered.push(`${rubric.title} (${source})`);
      entry.sources.add(source);
      entry.grades.push(grade);

      if (source === 'Murphy') entry.murphyScore += baseScore;
      if (source === 'Phatak') entry.phatakScore += baseScore;
      if (source === 'Kent') entry.kentScore += baseScore;

      // Check keynote match
      const remedy = remedyMap.get(key);
      if (remedy && remedy.keynote) {
        const keynoteLower = remedy.keynote.toLowerCase();
        const symptomWords = rubric.title.toLowerCase().split(/\s+/);
        const hasMatch = symptomWords.some(w => w.length > 3 && keynoteLower.includes(w));
        if (hasMatch) {
          entry.keynoteMatch = true;
          entry.totalScore += 3; // Keynote bonus
        }
      }

      // Check materia medica match
      if (remedy && remedy.full) {
        const mmLower = remedy.full.toLowerCase();
        const symptomWords = rubric.title.toLowerCase().split(/\s+/);
        const hasMatch = symptomWords.some(w => w.length > 3 && mmLower.includes(w));
        if (hasMatch) {
          entry.mmMatch = true;
          entry.totalScore += 3; // MM bonus
        }
      }
    }
  }

  // Apply source correlation bonus
  for (const [, entry] of remedyScores) {
    if (entry.sources.size > 1) {
      const bonus = (entry.sources.size - 1) * 5;
      entry.totalScore += bonus;
    }
  }

  // Calculate confidence level
  const maxScore = Math.max(...[...remedyScores.values()].map(e => e.totalScore), 1);

  // Sort by total score descending
  const ranked = [...remedyScores.values()]
    .map(e => ({
      name: e.name,
      totalScore: Math.round(e.totalScore * 10) / 10,
      murphyScore: Math.round(e.murphyScore * 10) / 10,
      phatakScore: Math.round(e.phatakScore * 10) / 10,
      kentScore: Math.round(e.kentScore * 10) / 10,
      rubricsCovered: e.rubricsCovered,
      rubricCount: e.rubricsCovered.length,
      sources: [...e.sources],
      sourceCount: e.sources.size,
      keynoteMatch: e.keynoteMatch,
      mmMatch: e.mmMatch,
      avgGrade: e.grades.length > 0 ? (e.grades.reduce((a, b) => a + b, 0) / e.grades.length).toFixed(1) : '0',
      confidence: e.totalScore >= maxScore * 0.8 ? 'High' : e.totalScore >= maxScore * 0.5 ? 'Medium' : 'Low',
      confidencePercent: Math.round((e.totalScore / maxScore) * 100),
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 20); // Top 20 remedies

  // Generate analysis summary
  const totalRubrics = selectedRubrics.length;
  const topRemedy = ranked[0];
  let explanation = '';

  if (topRemedy) {
    const sourceList = topRemedy.sources.join(' + ');
    explanation = `${topRemedy.name} ranks highest with a score of ${topRemedy.totalScore}, covering ${topRemedy.rubricCount} of ${totalRubrics} rubrics. `;
    explanation += `It appears in ${sourceList} repertor${topRemedy.sourceCount > 1 ? 'ies' : 'y'}. `;
    if (topRemedy.keynoteMatch) {
      explanation += `Keynote support confirmed. `;
    }
    if (topRemedy.mmMatch) {
      explanation += `Materia Medica similarity confirmed. `;
    }
    explanation += `Confidence level: ${topRemedy.confidence} (${topRemedy.confidencePercent}%). `;
    explanation += `Final remedy decision rests with the practitioner.`;
  }

  return NextResponse.json({
    success: true,
    totalRubrics,
    totalRemedies: ranked.length,
    rankedRemedies: ranked,
    explanation,
    disclaimer: 'This analysis is for educational and clinical assistance purposes only. Final remedy selection should be based on complete case analysis by a qualified homoeopathic practitioner.',
  });
}
