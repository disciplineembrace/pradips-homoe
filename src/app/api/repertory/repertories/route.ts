/** GET /api/repertory/repertories — list all available repertories (authors) */
import { NextResponse } from 'next/server';
import { listRepertories } from '@/lib/repertory';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const items = await listRepertories();
  return NextResponse.json({ items });
}
