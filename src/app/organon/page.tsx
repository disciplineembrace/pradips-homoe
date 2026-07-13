'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type BookSection = {
  id: string;
  title: string;
  content: string;
};

const HAHNEMANN_QUOTE = '"The physician\'s high and only mission is to restore the sick to health, to cure, as it is termed.\n\nThe highest ideal of cure is rapid, gentle and permanent restoration of the health, or removal and annihilation of the disease in its whole extent, in the shortest, most reliable, and most harmless way, on easily comprehensible principles." — Samuel Hahnemann, Organon §1–§2';

export default function OrganonPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [q, setQ] = useState('');
  const [book, setBook] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const reader = useReaderFeatures();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
        // Load the Organon book
        fetch('/api/books/organon-bk-sarkar')
          .then(r => r.json())
          .then(d => {
            if (d && !d.error) {
              setBook(d);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const sections: BookSection[] = useMemo(() => {
    if (!book || !book.chapters) return [];
    return book.chapters.map((ch: any, i: number) => ({
      id: ch.id,
      title: ch.title,
      content: ch.content,
    }));
  }, [book]);

  const filtered = useMemo(() => {
    if (!q) return sections;
    const s = q.toLowerCase();
    return sections.filter(sec =>
      sec.title.toLowerCase().includes(s) ||
      sec.content.toLowerCase().includes(s)
    );
  }, [q, sections]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Organon...</p>
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
          <h1 className="font-serif text-3xl text-[#173B2D]">Organon of Medicine</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">
            {book ? `${book.title} — by ${book.author}` : 'Samuel Hahnemann\'s foundational text — the philosophy & principles of homoeopathy'}
          </p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Dark green quote card */}
        <section className="bg-[#173B2D] text-[#F5EFE0] rounded-lg shadow-lg p-6 mb-6 border-l-4 border-[#C8A24A]">
          <div className="text-4xl text-[#C8A24A] font-serif leading-none mb-2">&ldquo;</div>
          <p className="font-serif italic text-base md:text-lg leading-relaxed whitespace-pre-line text-stone-200">
            {HAHNEMANN_QUOTE}
          </p>
        </section>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search within Organon..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
        </div>

        <div className="text-sm text-[#7C8F6E] mb-3">
          {filtered.length} section{filtered.length !== 1 ? 's' : ''}
          {book && ` — ${book.totalChapters} total`}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#7C8F6E]">Loading content...</div>
        ) : sections.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-sm text-[#7C8F6E]">No content available yet.</p>
          </div>
        ) : (
          <>
            {/* Section cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {filtered.map((sec, i) => {
                const bm = reader.isBookmarked(sec.id);
                // Find the original index
                const origIdx = sections.findIndex(s => s.id === sec.id);
                return (
                  <article
                    key={sec.id}
                    className="bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow border-t-2 border-[#173B2D] cursor-pointer"
                    onClick={() => setSelectedSection(origIdx)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#173B2D] text-[#C8A24A] flex items-center justify-center font-serif text-base">
                          {origIdx + 1}
                        </div>
                        <div>
                          <h3 className="font-serif text-lg text-[#173B2D] leading-tight">{sec.title}</h3>
                          <p className="text-[0.65rem] text-[#C8A24A] font-semibold uppercase tracking-wider">{sec.content.length.toLocaleString()} chars</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); reader.toggleBookmark({ id: sec.id, type: 'organon', name: sec.title }); }}
                        title={bm ? 'Remove bookmark' : 'Add bookmark'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors flex-shrink-0 ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >🔖</button>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed mt-2 line-clamp-3">{sec.content.substring(0, 200)}...</p>
                  </article>
                );
              })}
            </div>

            {/* Selected section content reader */}
            {sections[selectedSection] && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DCC3]">
                  <h2 className="font-serif text-xl text-[#173B2D]">{sections[selectedSection].title}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))}
                      disabled={selectedSection === 0}
                      className="text-xs bg-[#173B2D] text-white px-3 py-1.5 rounded disabled:opacity-30"
                    >← Prev</button>
                    <button
                      onClick={() => setSelectedSection(Math.min(sections.length - 1, selectedSection + 1))}
                      disabled={selectedSection === sections.length - 1}
                      className="text-xs bg-[#173B2D] text-white px-3 py-1.5 rounded disabled:opacity-30"
                    >Next →</button>
                  </div>
                </div>
                <div className="prose prose-stone max-w-none">
                  <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{sections[selectedSection].content}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Full Book Reader Link */}
        <div className="mt-8 bg-[#173B2D] rounded-lg shadow-lg p-6 text-center border-l-4 border-[#C8A24A]">
          <h2 className="font-serif text-xl text-[#C8A24A] mb-2">📖 Complete Organon by B.K. Sarkar</h2>
          <p className="text-sm text-stone-300 mb-4">Full text of Organon of Medicine translated and annotated by B.K. Sarkar. Contains Translator&apos;s Preface, Introduction, and Hahnemann&apos;s aphorisms with commentary.</p>
          <a href="/books/organon-bk-sarkar" className="inline-block bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">Read Full Book →</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
