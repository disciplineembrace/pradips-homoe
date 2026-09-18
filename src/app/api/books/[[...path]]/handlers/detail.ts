/** GET /api/books/[id] — get full book with chapters (requires auth) */
import { NextRequest, NextResponse } from 'next/server';
import { getBook } from '@/lib/books-data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function handler_get(req: NextRequest, id: string) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const book = await getBook(id);
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  return NextResponse.json(book);
}
