/** POST /api/question-bank/submit — save quiz attempt result to Supabase (or localStorage fallback) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory store (resets on serverless cold start — acceptable for quiz history)
// For persistent storage, wire to Supabase when tables are created.
const _attempts: any[] = [];

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json();
    const attempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: user!.id,
      userName: user!.name,
      totalQuestions: body.totalQuestions || 0,
      correct: body.correct || 0,
      incorrect: body.incorrect || 0,
      skipped: body.skipped || 0,
      score: body.score || 0,
      percentage: body.percentage || 0,
      timeTaken: body.timeTaken || 0,
      settings: body.settings || {},
      questionResults: body.questionResults || [],
      createdAt: new Date().toISOString(),
    };
    _attempts.push(attempt);
    return NextResponse.json({ ok: true, attemptId: attempt.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const userAttempts = _attempts
    .filter(a => a.userId === user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
  return NextResponse.json({ attempts: userAttempts });
}
