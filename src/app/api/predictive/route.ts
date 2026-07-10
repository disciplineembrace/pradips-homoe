/** GET /api/predictive — predictive books (requires auth+PIN) */
import { NextResponse } from 'next/server';
import { getPredictive } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  
  const data = await getPredictive();
  return NextResponse.json(data);
}
