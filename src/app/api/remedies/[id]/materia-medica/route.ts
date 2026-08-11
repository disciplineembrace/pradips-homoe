/** GET /api/remedies/[id]/materia-medica — get full MM for a remedy (requires auth) */
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
  return NextResponse.json({
    id: r.id,
    name: r.name,
    common: r.common || '',
    author: r.author,
    chapter: r.chapter || '',
    organ: r.organ || '',
    keynote: r.keynote || '',
    constitution: r.constitution || '',
    full: r.full || '',
    modalities: r.modalities || '',
    relationships: r.relationships || '',
    dose: r.dose || '',
  });
}
