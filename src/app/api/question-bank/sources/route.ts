/** GET /api/question-bank/sources — list available data sources for question generation */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getSourceMetadata } from '@/lib/question-bank/sources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  try {
    const meta = await getSourceMetadata();
    return NextResponse.json(meta);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
