'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type Book = {
  id: string;
  title: string;
  author: string;
  chapters: { id: string; title: string; content: string }[];
};

export default function PredictivePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [data, setData] = useState<{ books: Book[] } | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reader = useReaderFeatures();

  // Auth check — set session immediately, do NOT block on data
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Background-load predictive data
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch('/api/predictive')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ books: [] }))
      .finally(() => setLoading(false));
  }, [session]);

  const selectedBook = data?.books.find(b => b.id === selectedBookId) || null;
  const selectedChapter = selectedBook?.chapters.find(c => c.id === selectedChapterId) || null;

  function openBook(book: Book) {
    setSelectedBookId(book.id);
    setSelectedChapterId(book.chapters[0]?.id || null);
  }
  function backToBooks() {
    setSelectedBookId(null);
    setSelectedChapterId(null);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Predictive...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Predictive Homeopathy</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">The teachings of Dr. Prafull Vijayakar — Theory of Suppression, Theory of Acutes</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {loading && !data ? (
          <div className="text-center py-16 text-[#7C8F6E]">Loading books...</div>
        ) : !data || data.books.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">No books available.</div>
        ) : !selectedBook ? (
          // ---------- BOOK GRID ----------
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.books.map(b => (
              <article
                key={b.id}
                onClick={() => openBook(b)}
                className="bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow cursor-pointer border-t-4 border-[#173B2D] flex flex-col"
              >
                <div className="text-4xl mb-3">📖</div>
                <h3 className="font-serif text-lg text-[#173B2D] leading-tight mb-1">{b.title}</h3>
                <p className="text-xs italic text-[#7C8F6E] mb-3">by {b.author}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#C8A24A]">
                    {b.chapters.length} chapters
                  </span>
                  <span className="text-xs text-[#173B2D] font-semibold">Read →</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          // ---------- BOOK DETAIL: chapter list + full text ----------
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chapter list */}
            <aside className="lg:col-span-4 bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-[#173B2D] text-[#F5EFE0] px-4 py-2.5 flex items-center justify-between">
                <h2 className="font-serif text-sm uppercase tracking-wider truncate">{selectedBook.title}</h2>
                <button
                  onClick={() => reader.toggleBookmark({ id: selectedBook.id, type: 'predictive-book', title: selectedBook.title })}
                  title="Bookmark this book"
                  className={`text-sm ${reader.isBookmarked(selectedBook.id) ? 'text-[#C8A24A]' : 'text-stone-300 hover:text-[#C8A24A]'}`}
                >🔖</button>
              </div>
              <div className="px-4 py-2 bg-[#F5EFE0]">
                <button
                  onClick={backToBooks}
                  className="text-xs text-[#173B2D] hover:text-[#C8A24A] font-semibold"
                >← Back to books</button>
              </div>
              <ul className="divide-y divide-[#E8DCC3] max-h-[600px] overflow-y-auto">
                {selectedBook.chapters.map((c, i) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedChapterId(c.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F5EFE0] transition-colors ${selectedChapterId === c.id ? 'bg-[#F5EFE0] border-l-4 border-[#C8A24A] pl-3' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="text-[0.6rem] text-[#7C8F6E] uppercase tracking-wider">Chapter {i + 1}</div>
                      <div className="font-serif text-sm text-[#173B2D] leading-tight">{c.title}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Chapter content */}
            <section className="lg:col-span-8 bg-white rounded-lg shadow p-6">
              {selectedChapter ? (
                <>
                  <div className="border-b border-[#E8DCC3] pb-4 mb-4">
                    <div className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-1">
                      {selectedBook.title} · by {selectedBook.author}
                    </div>
                    <h2 className="font-serif text-2xl text-[#173B2D]">{selectedChapter.title}</h2>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => reader.toggleBookmark({ id: selectedChapter.id, type: 'predictive-chapter', title: selectedChapter.title, href: `/predictive` })}
                        className={`text-xs px-2.5 py-1 rounded-full ${reader.isBookmarked(selectedChapter.id) ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'bg-[#F5EFE0] text-[#7C8F6E]'}`}
                      >{reader.isBookmarked(selectedChapter.id) ? '🔖 Bookmarked' : '🔖 Bookmark'}</button>
                      <button
                        onClick={() => reader.toggleFavorite({ id: selectedChapter.id, type: 'predictive-chapter', title: selectedChapter.title, href: `/predictive` })}
                        className={`text-xs px-2.5 py-1 rounded-full ${reader.isFavorite(selectedChapter.id) ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'bg-[#F5EFE0] text-[#7C8F6E]'}`}
                      >{reader.isFavorite(selectedChapter.id) ? '★ Favorited' : '★ Favorite'}</button>
                    </div>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto pr-2">
                    <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{selectedChapter.content}</p>
                  </div>
                  {/* Prev/Next chapter */}
                  <div className="flex items-center justify-between border-t border-[#E8DCC3] pt-4 mt-4">
                    <button
                      onClick={() => {
                        const i = selectedBook.chapters.findIndex(c => c.id === selectedChapterId);
                        if (i > 0) setSelectedChapterId(selectedBook.chapters[i - 1].id);
                      }}
                      disabled={selectedBook.chapters.findIndex(c => c.id === selectedChapterId) === 0}
                      className="text-xs px-3 py-1.5 bg-[#F5EFE0] text-[#173B2D] rounded disabled:opacity-40 hover:bg-[#E8DCC3]"
                    >← Prev chapter</button>
                    <button
                      onClick={() => {
                        const i = selectedBook.chapters.findIndex(c => c.id === selectedChapterId);
                        if (i < selectedBook.chapters.length - 1) setSelectedChapterId(selectedBook.chapters[i + 1].id);
                      }}
                      disabled={selectedBook.chapters.findIndex(c => c.id === selectedChapterId) === selectedBook.chapters.length - 1}
                      className="text-xs px-3 py-1.5 bg-[#173B2D] text-[#F5EFE0] rounded disabled:opacity-40 hover:bg-[#2a5443]"
                    >Next chapter →</button>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-[#7C8F6E]">Select a chapter to begin reading.</div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
