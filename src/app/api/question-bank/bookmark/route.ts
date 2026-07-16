/** /api/question-bank/bookmark — POST (add) / DELETE (remove) / GET (list)
 *
 * Bookmarks store the full client-safe question JSON so it can be displayed
 * without regenerating or accessing source data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { isSupabaseServerConfigured, getSupabaseServerClient } from '@/database/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ items: [] });
  try {
    const client = getSupabaseServerClient()!;
    const { data, error } = await client
      .from('mcq_bookmarks')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ items: data || [] });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e.message });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: true, mode: 'local' });
  try {
    const body = await req.json();
    const client = getSupabaseServerClient()!;
    const { data, error } = await client
      .from('mcq_bookmarks')
      .upsert({
        user_id: user!.id,
        question_id: body.questionId,
        question_data: body.questionData,
      }, { onConflict: 'user_id,question_id' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
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
    const questionId = url.searchParams.get('id');
    if (!questionId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const client = getSupabaseServerClient()!;
    const { error } = await client
      .from('mcq_bookmarks')
      .delete()
      .eq('user_id', user!.id)
      .eq('question_id', questionId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
