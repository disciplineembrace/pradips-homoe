'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type Book = {
  id: string;
  title: string;
  author: string;
  description?: string;
  cover?: string;
  chapters: { id: string; title: string }[];
};

type CatalogItem = { label: string; href: string; icon: string; desc: string };

const REFERENCE_CATALOG: CatalogItem[] = [
  { label: 'Materia Medica — Boericke', href: '/materia-medica', icon: '📘', desc: 'Pocket Manual of Materia Medica' },
  { label: 'Materia Medica — Phatak', href: '/materia-medica', icon: '📗', desc: 'Materia Medica of Homoeopathic Medicines' },
  { label: 'Materia Medica — Murphy', href: '/materia-medica', icon: '📙', desc: 'Lotus Materia Medica (3rd Ed.)' },
  { label: 'Materia Medica — Kent', href: '/materia-medica', icon: '📕', desc: 'Materia Medica — J.T. Kent' },
  { label: 'Materia Medica — Allen', href: '/materia-medica', icon: '📔', desc: "Allen's Key Notes (10th Ed.)" },
  { label: 'Materia Medica — Sankaran', href: '/materia-medica', icon: '📓', desc: 'The Soul of Remedies' },
  { label: 'Materia Medica — Farrington', href: '/materia-medica', icon: '📔', desc: 'Clinical Materia Medica' },
  { label: 'Materia Medica — Boeger', href: '/materia-medica', icon: '📗', desc: 'Synoptic Key Materia Medica' },
  { label: 'Materia Medica — Mathur', href: '/materia-medica', icon: '📕', desc: 'K N Mathur Materia Medica' },
  { label: 'Therapeutics Encyclopedia', href: '/therapeutics', icon: '🌿', desc: 'Dr. Saif-ud-Din Saif — 408 formulas' },
  { label: 'Predictive — Theory of Suppression', href: '/predictive', icon: '⚗️', desc: 'Dr. Prafull Vijayakar' },
  { label: 'Predictive — Theory of Acutes', href: '/predictive', icon: '🌡️', desc: 'Dr. Prafull Vijayakar' },
];

export default function BooksPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Background-load books
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch('/api/books')
      .then(r => r.json())
      .then(d => setBooks(d.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Books...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Library Books</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Full e-books &amp; reference catalog of source materials</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Full E-Books */}
        <section className="mb-10">
          <h2 className="font-serif text-xl text-[#173B2D] mb-1">Full E-Books</h2>
          <p className="text-xs text-[#7C8F6E] mb-4">Click a book to open the reader with full chapter text.</p>

          {loading && books.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-[#7C8F6E]">Loading books...</div>
          ) : books.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-[#7C8F6E]">No e-books available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map(b => (
                <Link
                  key={b.id}
                  href={`/books/${b.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow border-t-4 border-[#173B2D] group"
                >
                  <div className="text-4xl mb-3">{b.cover || '📖'}</div>
                  <h3 className="font-serif text-lg text-[#173B2D] leading-tight mb-1 group-hover:text-[#C8A24A] transition-colors">{b.title}</h3>
                  <p className="text-xs italic text-[#7C8F6E] mb-2">by {b.author}</p>
                  {b.description && (
                    <p className="text-xs text-stone-600 line-clamp-3 mb-3 leading-relaxed">{b.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-wider">
                    <span className="text-[#C8A24A] font-semibold">{b.chapters.length} chapters</span>
                    <span className="text-[#173B2D] font-semibold">Read →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Reference Catalog */}
        <section>
          <h2 className="font-serif text-xl text-[#173B2D] mb-1">Reference Catalog</h2>
          <p className="text-xs text-[#7C8F6E] mb-4">Source PDFs and reference books — link to their browsable sections.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REFERENCE_CATALOG.map((c, i) => (
              <Link
                key={i}
                href={c.href}
                className="flex items-start gap-3 bg-white rounded-lg shadow hover:shadow-md p-4 transition-shadow border-l-4 border-[#C8A24A] group"
              >
                <div className="text-2xl flex-shrink-0">{c.icon}</div>
                <div className="min-w-0">
                  <h3 className="font-serif text-sm text-[#173B2D] leading-tight group-hover:text-[#C8A24A] transition-colors">{c.label}</h3>
                  <p className="text-[0.7rem] text-[#7C8F6E] mt-0.5">{c.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
