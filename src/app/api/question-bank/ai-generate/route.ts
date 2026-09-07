/** POST /api/question-bank/ai-generate — AI-powered source-based question generation
 *
 * Admin-only endpoint. Accepts source text + config, returns generated draft questions.
 * Uses z-ai-web-dev-sdk LLM to generate exam-quality MCQs.
 *
 * Body:
 *   { sourceText, sourceName, count, difficulty, questionTypes, examStyle }
 *
 * Response:
 *   { questions: AISourceQuestion[], stats: { requested, generated, rejected, avgSourceSupport } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { generateFromSource, type GenerationConfig } from '@/lib/question-bank/ai-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  // Admin/staff only for AI generation (uses LLM credits)
  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return NextResponse.json(
      { error: 'ADMIN_ONLY', message: 'AI question generation is available for admin/staff only.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    if (!body.sourceText || body.sourceText.length < 50) {
      return NextResponse.json(
        { error: 'INVALID_SOURCE', message: 'Source text must be at least 50 characters.' },
        { status: 400 }
      );
    }

    const config: GenerationConfig = {
      sourceText: body.sourceText,
      sourceName: body.sourceName || 'Untitled Source',
      count: Math.min(50, Math.max(1, body.count || 10)),
      difficulty: body.difficulty || 'mixed',
      questionTypes: body.questionTypes || 'any',
      examStyle: body.examStyle,
    };

    const result = await generateFromSource(config);

    return NextResponse.json({
      questions: result.questions,
      stats: result.stats,
      errors: result.errors,
    });
  } catch (err: any) {
    console.error('AI generation error:', err);
    return NextResponse.json(
      { error: 'GENERATION_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
