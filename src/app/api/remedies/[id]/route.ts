/** GET /api/remedies/[id] — full remedy detail (requires auth+PIN) */
import { NextRequest, NextResponse } from 'next/server';
import { getRemedies } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  
  const { id } = await params;
  const remedies = await getRemedies();
  const r = remedies.find(x => x.id === id);
  if (!r) return NextResponse.json({ error: 'Remedy not found' }, { status: 404 });
  
  return NextResponse.json(r);
}
