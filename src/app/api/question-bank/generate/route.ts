/** POST /api/question-bank/generate — generate a quiz from database sources */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { generateQuestions, type GenerateOptions } from '@/lib/question-bank/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json();
    const opts: GenerateOptions = {
      sourceType: body.sourceType || 'mixed',
      bookId: body.bookId,
      author: body.author,
      chapter: body.chapter,
      topic: body.topic,
      difficulty: body.difficulty || 'any',
      questionType: body.questionType || 'any',
      count: Math.min(50, Math.max(1, body.count || 10)),
      marks: body.marks ?? 1,
      negativeMark: body.negativeMark ?? 0,
      shuffleQuestions: body.shuffleQuestions ?? true,
      shuffleOptions: body.shuffleOptions ?? true,
      language: body.language || 'en',
      multiSource: body.multiSource ?? false,
    };
    const questions = await generateQuestions(opts);
    return NextResponse.json({
      questions,
      count: questions.length,
      requested: opts.count,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
