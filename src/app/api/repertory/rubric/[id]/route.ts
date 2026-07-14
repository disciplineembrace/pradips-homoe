/** GET /api/repertory/rubric/[id] — full rubric detail with cross-refs, similar, parent/child */
import { NextRequest, NextResponse } from 'next/server';
import { getRubricById } from '@/lib/repertory';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const rubric = await getRubricById(id);
  if (!rubric) {
    return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
  }
  return NextResponse.json(rubric);
}
