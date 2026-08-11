/** GET /api/question-bank/history — user's quiz attempt history */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  // History is stored via /api/question-bank/submit (in-memory)
  // For now return empty — will be populated as user takes quizzes
  return NextResponse.json({ attempts: [] });
}
