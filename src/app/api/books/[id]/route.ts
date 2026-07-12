/** GET /api/books/[id] — full book with chapter content (requires auth) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getBooks } from '@/lib/books-data';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const books = await getBooks();
  const book = books.find(b => b.id === id);
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

  return NextResponse.json(book);
}
