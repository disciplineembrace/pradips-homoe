/** GET /api/books — list all books (requires auth) */
import { NextResponse } from 'next/server';
import { getAllBooks } from '@/lib/books-data';
import { requireAuth } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function handler_get() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const books = await getAllBooks();
  return NextResponse.json({ books });
}
