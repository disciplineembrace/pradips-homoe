/** /api/user/bookmarks — POST (add) / DELETE (remove) / GET (list) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { isSupabaseServerConfigured } from '@/database/supabase/client';
import { BookmarksRepo } from '@/database/supabase/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ items: [] });
  try {
    const items = await BookmarksRepo.listBookmarks(user!.id);
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: true, mode: 'local' });
  try {
    const body = await req.json();
    const item = await BookmarksRepo.addBookmark({
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: true, mode: 'local' });
  try {
    const body = await req.json();
    await BookmarksRepo.removeBookmark(user!.id, body.item_id, body.item_type);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
