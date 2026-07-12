/** GET /api/books — full e-books list (requires auth) */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getBooks } from '@/lib/books-data';

export const runtime = 'nodejs';

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const books = (await getBooks()).map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    description: b.description,
    cover: b.cover,
    chapters: b.chapters.map(c => ({ id: c.id, title: c.title })),
  }));
  return NextResponse.json({ books });
}
