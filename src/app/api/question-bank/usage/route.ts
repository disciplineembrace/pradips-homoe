/** GET /api/question-bank/usage — get today's usage + limit for the current user */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getDailyUsage, isPremiumUser, FREE_DAILY_LIMIT } from '@/lib/question-bank/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  try {
    const premium = isPremiumUser(user!);
    const usage = await getDailyUsage(user!.id);
    return NextResponse.json({
      generated: usage.generated,
      attempted: usage.attempted,
      limit: FREE_DAILY_LIMIT,
      remaining: premium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - usage.generated),
      premium,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
