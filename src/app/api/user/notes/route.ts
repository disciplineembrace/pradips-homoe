/** /api/user/notes — POST (add) / DELETE (remove by ?id=) / GET (list) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { isSupabaseServerConfigured } from '@/database/supabase/client';
import { NotesRepo } from '@/database/supabase/repositories';

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
    const items = await NotesRepo.listNotes(user!.id, { itemId, itemType });
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
    const item = await NotesRepo.addNote({
      user_id: user!.id,
      item_id: body.item_id,
      item_type: body.item_type,
      text: body.text,
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
    const url = new URL(req.url);
    const noteId = url.searchParams.get('id');
    if (!noteId) return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
    await NotesRepo.deleteNote(noteId, user!.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
