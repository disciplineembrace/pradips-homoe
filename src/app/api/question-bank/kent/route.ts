/** GET /api/question-bank/kent — get Kent MM book coverage stats
 *  POST /api/question-bank/kent — generate MCQs from Kent MM book only
 *
 * Reads ONLY from data/books/kent-mm.json (complete OCR text).
 * No source metadata (book/author/chapter/page) is ever sent to the client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { generateKentQuestions, getKentCoverage, type KentGenerateOptions } from '@/lib/question-bank/kent-generator';
import { getDailyUsage, incrementDailyUsage, isPremiumUser, FREE_DAILY_LIMIT } from '@/lib/question-bank/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  try {
    const coverage = await getKentCoverage();
    return NextResponse.json(coverage);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json();
    const requestedCount = Math.min(50, Math.max(1, body.count || 10));

    // Check daily limit
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
    }

    const opts: KentGenerateOptions = {
      count: requestedCount,
      questionType: body.questionType || 'any',
      difficulty: body.difficulty || 'any',
      shuffleQuestions: body.shuffleQuestions ?? true,
      shuffleOptions: body.shuffleOptions ?? true,
    };

    const result = await generateKentQuestions(opts);

    // Increment daily usage
    await incrementDailyUsage(user!.id, result.questions.length);

    return NextResponse.json({
      questions: result.questions,
      count: result.questions.length,
      requested: opts.count,
      coverage: result.coverage,
      premium,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
