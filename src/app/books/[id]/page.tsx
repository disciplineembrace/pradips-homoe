'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type Chapter = { id: string; title: string; content: string };
type Book = {
  id: string;
  title: string;
  author: string;
  description?: string;
  cover?: string;
  chapters: Chapter[];
};

type Theme = 'light' | 'dark' | 'sepia';

const SETTINGS_KEY = 'ph_reader_settings';

const THEME_STYLES: Record<Theme, { bg: string; text: string; muted: string; border: string; bar: string }> = {
  light: {
    bg: 'bg-white',
    text: 'text-stone-800',
    muted: 'text-stone-500',
    border: 'border-stone-200',
    bar: 'bg-white border-stone-200',
  },
  dark: {
    bg: 'bg-[#0f1f17]',
    text: 'text-stone-200',
    muted: 'text-stone-400',
    border: 'border-[#2a3d31]',
    bar: 'bg-[#173B2D] border-[#2a3d31]',
  },
  sepia: {
    bg: 'bg-[#F5EFE0]',
    text: 'text-[#3d2f1f]',
    muted: 'text-[#7C8F6E]',
    border: 'border-[#E8DCC3]',
    bar: 'bg-[#EDE3CC] border-[#E8DCC3]',
  },
};

type ReaderSettings = { fontSize: number; theme: Theme };

function loadSettings(): ReaderSettings {
  if (typeof window === 'undefined') return { fontSize: 17, theme: 'sepia' };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { fontSize: 17, theme: 'sepia' };
    const parsed = JSON.parse(raw);
    return {
      fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : 17,
      theme: ['light', 'dark', 'sepia'].includes(parsed.theme) ? parsed.theme : 'sepia',
    };
  } catch {
    return { fontSize: 17, theme: 'sepia' };
  }
}

function saveSettings(s: ReaderSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function BookReaderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reader = useReaderFeatures();
  const [session, setSession] = useState<any>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<ReaderSettings>({ fontSize: 17, theme: 'sepia' });
  const [hydrated, setHydrated] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [readProgress, setReadProgress] = useState(0);

  // Auth check — set session immediately
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load reader settings from localStorage (after mount)
  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  // Load book in background
  useEffect(() => {
    if (!session) return;
    fetch(`/api/books/${params.id}`)
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then(d => {
        if (!d) return;
        if (d.error) { setError(d.error); return; }
        setBook(d as Book);
        setChapterIdx(0);
      })
      .catch(() => setError('Failed to load book'));
  }, [session, params.id, router]);

  // Track reading progress within chapter
  const onContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0) setReadProgress(Math.min(100, Math.round((el.scrollTop / max) * 100)));
  }, []);

  // Persist settings
  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  const theme = THEME_STYLES[settings.theme];

  const chapter = book?.chapters[chapterIdx] || null;

  const chapterProgress = useMemo(() => {
    if (!book) return 0;
    return Math.round(((chapterIdx + (readProgress / 100)) / book.chapters.length) * 100);
  }, [book, chapterIdx, readProgress]);

  function adjustFont(delta: number) {
    setSettings(s => ({ ...s, fontSize: Math.min(28, Math.max(13, s.fontSize + delta)) }));
  }
  function cycleTheme() {
    setSettings(s => {
      const next: Theme = s.theme === 'light' ? 'sepia' : s.theme === 'sepia' ? 'dark' : 'light';
      return { ...s, theme: next };
    });
  }
  function selectTheme(t: Theme) {
    setSettings(s => ({ ...s, theme: t }));
  }
  function goPrev() {
    if (book && chapterIdx > 0) { setChapterIdx(i => i - 1); setReadProgress(0); }
  }
  function goNext() {
    if (book && chapterIdx < book.chapters.length - 1) { setChapterIdx(i => i + 1); setReadProgress(0); }
  }

  // Search within book chapters
  const searchMatches = useMemo(() => {
    if (!book || !searchQ.trim()) return [];
    const q = searchQ.trim().toLowerCase();
    const matches: { chapterIdx: number; chapterTitle: string; snippet: string }[] = [];
    book.chapters.forEach((c, ci) => {
      const lower = c.content.toLowerCase();
      let pos = lower.indexOf(q);
      while (pos !== -1 && matches.length < 50) {
        const start = Math.max(0, pos - 60);
        const end = Math.min(c.content.length, pos + q.length + 60);
        matches.push({
          chapterIdx: ci,
          chapterTitle: c.title,
          snippet: (start > 0 ? '… ' : '') + c.content.slice(start, end) + (end < c.content.length ? ' …' : ''),
        });
        pos = lower.indexOf(q, pos + 1);
      }
    });
    return matches;
  }, [book, searchQ]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading reader...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-[#173B2D] font-serif text-lg mb-2">{error}</p>
            <Link href="/books" className="inline-block mt-4 px-4 py-2 bg-[#173B2D] text-[#F5EFE0] rounded text-sm">← Back to Books</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  const isBookmarked = reader.isBookmarked(`book:${book.id}:chapter:${chapter?.id || ''}`);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {/* Reader top bar */}
        <div className={`sticky top-16 z-30 ${theme.bar} border-b ${theme.border} shadow-sm`}>
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
            <Link href="/books" className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded ${theme.text} hover:bg-black/5`}>
              ← Back
            </Link>

            {/* Contents dropdown */}
            <div className="relative">
              <button
                onClick={() => { setContentsOpen(o => !o); setSearchOpen(false); }}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded ${theme.text} hover:bg-black/5`}
              >
                ☰ Contents
              </button>
              {contentsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setContentsOpen(false)} />
                  <div className={`absolute left-0 top-full mt-1 w-72 max-h-80 overflow-y-auto ${theme.bg} border ${theme.border} rounded-lg shadow-xl z-20`}>
                    <div className={`px-3 py-2 text-[0.65rem] uppercase tracking-wider ${theme.muted} border-b ${theme.border}`}>
                      {book.chapters.length} chapters
                    </div>
                    <ul className="py-1">
                      {book.chapters.map((c, i) => (
                        <li key={c.id}>
                          <button
                            onClick={() => { setChapterIdx(i); setContentsOpen(false); setReadProgress(0); }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-black/5 ${i === chapterIdx ? 'font-bold ' + theme.text : theme.text}`}
                          >
                            <span className={theme.muted}>{i + 1}.</span> {c.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <button
                onClick={() => { setSearchOpen(o => !o); setContentsOpen(false); }}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded ${theme.text} hover:bg-black/5`}
              >
                🔍 Search
              </button>
              {searchOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
                  <div className={`absolute left-0 top-full mt-1 w-80 ${theme.bg} border ${theme.border} rounded-lg shadow-xl z-20`}>
                    <div className="p-2 border-b border-current/10">
                      <input
                        autoFocus
                        type="text"
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        placeholder="Search within book..."
                        className={`w-full px-3 py-1.5 text-xs rounded border ${theme.border} ${theme.bg} ${theme.text} focus:outline-none`}
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {searchQ.trim() && searchMatches.length === 0 && (
                        <div className={`px-3 py-4 text-xs text-center ${theme.muted}`}>No matches.</div>
                      )}
                      {searchMatches.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => { setChapterIdx(m.chapterIdx); setSearchOpen(false); setSearchQ(''); setReadProgress(0); }}
                          className={`block w-full text-left px-3 py-2 text-xs hover:bg-black/5 ${theme.text} border-b ${theme.border}`}
                        >
                          <div className={`font-semibold text-[0.65rem] uppercase tracking-wider ${theme.muted}`}>{m.chapterTitle}</div>
                          <div className="line-clamp-2">{m.snippet}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bookmark */}
            <button
              onClick={() => chapter && reader.toggleBookmark({
                id: `book:${book.id}:chapter:${chapter.id}`,
                type: 'book-chapter',
                title: `${book.title} — ${chapter.title}`,
                href: `/books/${book.id}`,
              })}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded ${isBookmarked ? 'text-[#C8A24A]' : theme.text + ' hover:bg-black/5'}`}
            >
              {isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
            </button>

            <div className="ml-auto flex items-center gap-1">
              {/* Font size */}
              <button
                onClick={() => adjustFont(-1)}
                className={`w-7 h-7 rounded text-xs ${theme.text} hover:bg-black/5`}
                title="Decrease font"
              >A−</button>
              <span className={`text-[0.6rem] ${theme.muted} w-6 text-center`}>{settings.fontSize}</span>
              <button
                onClick={() => adjustFont(1)}
                className={`w-7 h-7 rounded text-sm ${theme.text} hover:bg-black/5`}
                title="Increase font"
              >A+</button>

              {/* Theme toggle (cycles) */}
              <button
                onClick={cycleTheme}
                className={`ml-1 text-xs font-semibold px-2.5 py-1.5 rounded ${theme.text} hover:bg-black/5 capitalize`}
                title="Toggle theme"
              >
                {settings.theme === 'light' ? '☀️' : settings.theme === 'dark' ? '🌙' : '📜'} {settings.theme}
              </button>
            </div>
          </div>
        </div>

        {/* Chapter content */}
        <div className={`flex-1 ${theme.bg} ${theme.text} transition-colors`}>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className={`mb-6 pb-4 border-b ${theme.border}`}>
              <div className={`text-[0.65rem] uppercase tracking-widest ${theme.muted} mb-1`}>
                {book.title} · by {book.author}
              </div>
              <h1 className="font-serif text-2xl md:text-3xl">{chapter?.title}</h1>
              <div className={`text-[0.65rem] mt-1 ${theme.muted}`}>Chapter {chapterIdx + 1} of {book.chapters.length}</div>
            </div>

            <div
              onScroll={onContentScroll}
              className="max-h-[calc(100vh-260px)] overflow-y-auto pr-2"
            >
              <p
                className="whitespace-pre-line leading-relaxed"
                style={{ fontSize: `${settings.fontSize}px`, lineHeight: 1.7 }}
              >
                {chapter?.content}
              </p>
            </div>
          </div>
        </div>

        {/* Reader bottom bar */}
        <div className={`sticky bottom-0 z-30 ${theme.bar} border-t ${theme.border} shadow-sm`}>
          {/* Progress bar */}
          <div className={`h-1 bg-black/10`}>
            <div className="h-full bg-[#C8A24A] transition-all" style={{ width: `${chapterProgress}%` }} />
          </div>
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={chapterIdx === 0}
              className={`text-xs font-semibold px-3 py-1.5 rounded ${theme.text} hover:bg-black/5 disabled:opacity-40`}
            >← Prev</button>

            <div className={`text-xs ${theme.muted} text-center`}>
              <div className="font-semibold">{chapterProgress}% read</div>
              <div className="text-[0.6rem]">Chapter {chapterIdx + 1} / {book.chapters.length}</div>
            </div>

            <button
              onClick={goNext}
              disabled={chapterIdx === book.chapters.length - 1}
              className={`text-xs font-semibold px-3 py-1.5 rounded ${theme.bg === 'bg-white' ? 'bg-[#173B2D] text-[#F5EFE0]' : settings.theme === 'dark' ? 'bg-[#C8A24A] text-[#173B2D]' : 'bg-[#173B2D] text-[#F5EFE0]'} disabled:opacity-40`}
            >Next →</button>
          </div>

          {/* Theme selector */}
          <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center justify-center gap-1">
            {(['light', 'sepia', 'dark'] as Theme[]).map(t => (
              <button
                key={t}
                onClick={() => selectTheme(t)}
                className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded ${settings.theme === t ? 'bg-[#173B2D] text-[#F5EFE0]' : theme.muted + ' hover:bg-black/5'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
