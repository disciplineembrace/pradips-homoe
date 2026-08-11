/** POST /api/question-bank/generate — generate a quiz from database sources
 *
 * Features:
 *   - Daily limit: 25 free MCQs/day (premium = unlimited)
 *   - Source metadata is NEVER sent to client (security)
 *   - Questions are shuffled, options are shuffled
 *   - Deduplication via content hashing
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { generateQuestions, toClientQuestions, type GenerateOptions } from '@/lib/question-bank/generator';
import { getDailyUsage, incrementDailyUsage, isPremiumUser, FREE_DAILY_LIMIT } from '@/lib/question-bank/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json();
    const requestedCount = Math.min(50, Math.max(1, body.count || 10));

    // Check daily limit for free users
    const premium = isPremiumUser(user!);
    if (!premium) {
      const usage = await getDailyUsage(user!.id);
      const remaining = FREE_DAILY_LIMIT - usage.generated;
      if (remaining <= 0) {
        return NextResponse.json({
          error: 'DAILY_LIMIT_REACHED',
          message: 'Daily Free Limit Reached',
          upgradeMessage: 'Unlock Unlimited Daily MCQs with Premium.',
          usage: { used: usage.generated, limit: FREE_DAILY_LIMIT, remaining: 0 },
          premium: false,
        }, { status: 403 });
      }
      // Cap the count at the remaining daily allowance
      const effectiveCount = Math.min(requestedCount, remaining);
      const opts: GenerateOptions = {
        sourceType: body.sourceType || 'mixed',
        bookId: body.bookId,
        author: body.author,
        chapter: body.chapter,
        topic: body.topic,
        difficulty: body.difficulty || 'any',
        questionType: body.questionType || 'any',
        count: effectiveCount,
        marks: body.marks ?? 1,
        negativeMark: body.negativeMark ?? 0,
        shuffleQuestions: body.shuffleQuestions ?? true,
        shuffleOptions: body.shuffleOptions ?? true,
        language: body.language || 'en',
        multiSource: body.multiSource ?? false,
      };
      const questions = await generateQuestions(opts);
      // Increment daily usage
      await incrementDailyUsage(user!.id, questions.length);
      const newUsage = await getDailyUsage(user!.id);
      // Sanitize: strip all source metadata before sending to client
      const clientQuestions = toClientQuestions(questions);
      return NextResponse.json({
        questions: clientQuestions,
        count: clientQuestions.length,
        requested: opts.count,
        usage: { used: newUsage.generated, limit: FREE_DAILY_LIMIT, remaining: Math.max(0, FREE_DAILY_LIMIT - newUsage.generated) },
        premium: false,
      });
    }

    // Premium user — unlimited
    const opts: GenerateOptions = {
      sourceType: body.sourceType || 'mixed',
      bookId: body.bookId,
      author: body.author,
      chapter: body.chapter,
      topic: body.topic,
      difficulty: body.difficulty || 'any',
      questionType: body.questionType || 'any',
      count: requestedCount,
      marks: body.marks ?? 1,
      negativeMark: body.negativeMark ?? 0,
      shuffleQuestions: body.shuffleQuestions ?? true,
      shuffleOptions: body.shuffleOptions ?? true,
      language: body.language || 'en',
      multiSource: body.multiSource ?? false,
    };
    const questions = await generateQuestions(opts);
    await incrementDailyUsage(user!.id, questions.length);
    // Sanitize: strip all source metadata
    const clientQuestions = toClientQuestions(questions);
    return NextResponse.json({
      questions: clientQuestions,
      count: clientQuestions.length,
      requested: opts.count,
      premium: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
