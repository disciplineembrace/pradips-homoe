/** GET /api/books/[id] — get full book with chapters (requires auth) */
import { NextRequest, NextResponse } from 'next/server';
import { getBook } from '@/lib/books-data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  return NextResponse.json(book);
}
