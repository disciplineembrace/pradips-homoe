/** /api/user/favorites — POST (add) / DELETE (remove) / GET (list) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { isSupabaseServerConfigured } from '@/database/supabase/client';
import { FavoritesRepo } from '@/database/supabase/repositories';
import { isSchemaNotAppliedError } from '../_helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ items: [] });
  try {
    const items = await FavoritesRepo.listFavorites(user!.id);
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
    const item = await FavoritesRepo.addFavorite({
      user_id: user!.id,
      item_id: body.item_id,
      item_type: body.item_type,
      title: body.title,
      href: body.href,
      author: body.author,
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
    const body = await req.json();
    await FavoritesRepo.removeFavorite(user!.id, body.item_id, body.item_type);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (isSchemaNotAppliedError(e)) return NextResponse.json({ ok: true, mode: 'local' });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
