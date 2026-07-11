/** GET /api/therapeutics — therapeutics list (requires auth+PIN) */
import { NextRequest, NextResponse } from 'next/server';
import { getTherapeutics } from '@/lib/data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const letter = (url.searchParams.get('letter') || '').toUpperCase();
  
  const data = await getTherapeutics();
  let diseases = data.diseases || [];
  
  if (letter) diseases = diseases.filter((d: any) => d.name[0].toUpperCase() === letter);
  if (q) {
    diseases = diseases.filter((d: any) => {
      if (d.name.toLowerCase().includes(q)) return true;
      return (d.subcategories || []).some((s: any) =>
        s.name.toLowerCase().includes(q) ||
        (s.remedies || []).some((r: any) => r.name.toLowerCase().includes(q))
      );
    });
  }
  
  // Limit response size
  const items = diseases.slice(0, 100).map((d: any) => ({
    id: d.id, name: d.name, note: d.note,
    subCount: (d.subcategories || []).length,
    subcategories: (d.subcategories || []).slice(0, 6),
  }));
  
  return NextResponse.json({ total: diseases.length, items });
}
