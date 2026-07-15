/** GET /api/question-bank/stats — aggregate stats for the user */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  return NextResponse.json({
    totalAttempts: 0,
    avgScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    weakestTopics: [],
    strongestTopics: [],
  });
}
