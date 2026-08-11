/** /api/user/highlights — POST (add) / DELETE (remove by ?id=) / GET (list) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { isSupabaseServerConfigured } from '@/database/supabase/client';
import { HighlightsRepo } from '@/database/supabase/repositories';
import { isSchemaNotAppliedError } from '../_helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ items: [] });
  try {
    const url = new URL(req.url);
    const itemId = url.searchParams.get('item_id') || undefined;
    const itemType = url.searchParams.get('item_type') || undefined;
    const items = await HighlightsRepo.listHighlights(user!.id, { itemId, itemType });
    return NextResponse.json({ items });
  } catch (e: any) {
    if (isSchemaNotAppliedError(e)) return NextResponse.json({ items: [] });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: true, mode: 'local' });
  try {
    const body = await req.json();
    const item = await HighlightsRepo.addHighlight({
      user_id: user!.id,
      item_id: body.item_id,
      item_type: body.item_type,
      highlighted_text: body.highlighted_text,
      color: body.color,
      start_offset: body.start_offset,
      end_offset: body.end_offset,
      metadata: body.metadata,
    });
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    if (isSchemaNotAppliedError(e)) return NextResponse.json({ ok: true, mode: 'local' });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: true, mode: 'local' });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await HighlightsRepo.deleteHighlight(id, user!.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (isSchemaNotAppliedError(e)) return NextResponse.json({ ok: true, mode: 'local' });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
