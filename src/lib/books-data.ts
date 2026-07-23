import fs from 'fs/promises';
import path from 'path';

const BOOKS_DIR = path.join(process.cwd(), 'data', 'books');
const BOOKS_DIR_ALT = '/home/z/my-project/data/books';

let _bookCache: Record<string, any> = {};

async function readJson(p: string): Promise<any> {
  try {
    const buf = await fs.readFile(p);
    return JSON.parse(buf.toString('utf-8'));
  } catch (e1: any) {
    if (e1.code === 'ENOENT' && p !== BOOKS_DIR_ALT) {
      const altP = path.join(BOOKS_DIR_ALT, path.basename(p));
      const buf = await fs.readFile(altP);
      return JSON.parse(buf.toString('utf-8'));
    }
    throw e1;
  }
}

export async function getBook(id: string): Promise<any> {
  if (_bookCache[id]) return _bookCache[id];
  try {
    const book = await readJson(path.join(BOOKS_DIR, `${id}.json`));
    _bookCache[id] = book;
    return book;
  } catch {
    return null;
  }
}

export async function getAllBooks(): Promise<any[]> {
  const bookIds: string[] = [];
  const books = [];
  for (const id of bookIds) {
    const book = await getBook(id);
    if (book) {
      books.push({
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        author: book.author,
        category: book.category,
        description: book.description,
        totalChapters: book.totalChapters,
        chapters: (book.chapters || []).map((c: any) => ({ id: c.id, title: c.title })),
      });
    }
  }
  return books;
}
