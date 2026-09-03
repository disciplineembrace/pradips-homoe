'use client';
/// ============================================================
/// Repertory Section — Browse Kent / Phatak / Murphy / Boericke
///
/// Features:
///   • Author tabs (Kent, Phatak, Murphy, Boericke)
///   • Chapter filter dropdown (populated per author)
///   • Search by title, path, chapter, or remedy name
///   • Rubric cards show FULL PATH (not just child fragment)
///   • Remedies displayed as grade-colored badges:
///       Grade 4 = Red    (highest importance)
///       Grade 3 = Green
///       Grade 2 = Blue
///       Grade 1 = Black/Grey (normal)
///   • Remedies sorted Grade 4 → 3 → 2 → 1, alphabetical within grade
///   • Original source grading preserved — never calculated or mixed
///   • Favorite + bookmark support
///   • Pagination
///
/// No global CSS. No shared-component modifications.
/// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';
import { RepertoryTree } from './repertory-tree';

type ParsedRemedy = { abbrev: string; grade: number };

type Rubric = {
  id: string;
  title: string;
  fullPath: string;
  author: string;
  chapter: string;
  level: number;
  parentId: string | null;
  remedies: string[];
  remedyCount: number;
  byGrade: Record<number, string[]>;
};

const AUTHORS = ['Kent', 'Phatak', 'Murphy', 'Boericke'];
const PAGE_SIZE = 20;

// ============================================================
// GRADE METADATA — now uses centralized config from repertory-grades.ts
// Grade 4 = Red (HIGH), Grade 3 = Green (LOW), Grade 2 = Blue (LOWER),
// Grade 1 = Black (NORMAL/UNGRADED).
// Source-specific grade mapping is in repertory-grades.ts.
// ============================================================
import { GRADE_DISPLAY_MAP, getGradeDisplay, groupRemediesByGrade } from '@/lib/repertory-grades';

// Backward-compat: map numeric grade to display config via centralized system
const GRADE_META: Record<number, { color: string; bg: string; border: string; label: string; weight: string }> = {
  4: { color: GRADE_DISPLAY_MAP.HIGH.color, bg: GRADE_DISPLAY_MAP.HIGH.bg, border: GRADE_DISPLAY_MAP.HIGH.border, label: GRADE_DISPLAY_MAP.HIGH.label, weight: GRADE_DISPLAY_MAP.HIGH.weight },
  3: { color: GRADE_DISPLAY_MAP.LOW.color, bg: GRADE_DISPLAY_MAP.LOW.bg, border: GRADE_DISPLAY_MAP.LOW.border, label: GRADE_DISPLAY_MAP.LOW.label, weight: GRADE_DISPLAY_MAP.LOW.weight },
  2: { color: GRADE_DISPLAY_MAP.LOWER.color, bg: GRADE_DISPLAY_MAP.LOWER.bg, border: GRADE_DISPLAY_MAP.LOWER.border, label: GRADE_DISPLAY_MAP.LOWER.label, weight: GRADE_DISPLAY_MAP.LOWER.weight },
  1: { color: GRADE_DISPLAY_MAP.NORMAL.color, bg: GRADE_DISPLAY_MAP.NORMAL.bg, border: GRADE_DISPLAY_MAP.NORMAL.border, label: GRADE_DISPLAY_MAP.NORMAL.label, weight: GRADE_DISPLAY_MAP.NORMAL.weight },
};

function GradeBadge({ abbrev, grade }: { abbrev: string; grade: number }) {
  const meta = GRADE_META[grade] || GRADE_META[1];
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.65rem] font-mono ${meta.weight}`}
      style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
      title={`${abbrev} — Grade ${grade}`}
    >
      {abbrev}
      <span className="text-[0.5rem] opacity-80">{meta.label}</span>
    </span>
  );
}

function RemediesByGrade({ byGrade, maxPerGrade = 30 }: { byGrade: Record<number, string[]>; maxPerGrade?: number }) {
  const grades = [4, 3, 2, 1];
  return (
    <div className="space-y-1.5">
      {grades.map(grade => {
        const remedies = byGrade[grade] || [];
        if (remedies.length === 0) return null;
        const sorted = [...remedies].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const displayed = sorted.slice(0, maxPerGrade);
        const remaining = sorted.length - displayed.length;
        return (
          <div key={grade} className="flex items-start gap-1.5 flex-wrap">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[#7C8F6E] mt-0.5 min-w-[28px]">
              G{grade}:
            </span>
            <div className="flex flex-wrap gap-1 flex-1">
              {displayed.map(abbrev => (
                <GradeBadge key={`${abbrev}-${grade}`} abbrev={abbrev} grade={grade} />
              ))}
              {remaining > 0 && (
                <span className="text-[0.6rem] text-[#7C8F6E] py-0.5">+{remaining} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RepertoryPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('Kent');
  const [chapter, setChapter] = useState('');
  const [chapters, setChapters] = useState<{ name: string; rubricCount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  // viewMode: 'tree' = recursive hierarchy with expand/collapse (default),
  // 'list' = flat paginated list with grade badges.
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const reader = useReaderFeatures();

  // Auth check
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load chapters when author changes
  useEffect(() => {
    if (!session) return;
    setLoadingChapters(true);
    setChapter('');
    fetch(`/api/rubrics/chapters?author=${encodeURIComponent(author)}`)
      .then(r => r.json())
      .then(d => setChapters(d.items || []))
      .catch(() => setChapters([]))
      .finally(() => setLoadingChapters(false));
  }, [session, author]);

  const loadRubrics = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (author) params.set('author', author);
    if (chapter) params.set('chapter', chapter);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    fetch(`/api/rubrics?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setRubrics(d.items || []);
        setTotal(d.total || 0);
      })
      .catch(() => { setRubrics([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, author, chapter, page]);

  useEffect(() => {
    if (session) loadRubrics();
  }, [session, loadRubrics]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [q, author, chapter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleFav(e: React.MouseEvent, r: Rubric) {
    e.preventDefault();
    e.stopPropagation();
    reader.toggleFavorite({ id: r.id, type: 'rubric', title: r.fullPath || r.title, author: r.author });
  }
  function toggleBm(e: React.MouseEvent, r: Rubric) {
    e.preventDefault();
    e.stopPropagation();
    reader.toggleBookmark({ id: r.id, type: 'rubric', title: r.fullPath || r.title, author: r.author });
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Repertory...</p>
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
          <h1 className="font-serif text-3xl text-[#173B2D]">Repertory</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">
            Browse {total.toLocaleString()} rubrics across Kent, Phatak, Murphy &amp; Boericke
          </p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Author tabs */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-lg shadow p-2">
          {AUTHORS.map(a => (
            <button
              key={a}
              onClick={() => setAuthor(a)}
              className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors ${
                author === a
                  ? 'bg-[#173B2D] text-[#F5EFE0]'
                  : 'text-[#7C8F6E] hover:bg-[#F5EFE0] hover:text-[#173B2D]'
              }`}
            >{a}</button>
          ))}
          <Link
            href="/synthesis"
            className="ml-auto px-4 py-1.5 text-xs font-semibold rounded bg-[#C8A24A]/20 text-[#C8A24A] hover:bg-[#C8A24A]/30 transition-colors"
          >Synthesis Repertory →</Link>
        </div>

        {/* View mode toggle — Tree (recursive hierarchy) vs List (flat paginated) */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div
            className="inline-flex rounded-md overflow-hidden border border-[#E8DCC3]"
          >
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'tree' ? 'bg-[#173B2D] text-[#F5EFE0]' : 'bg-white text-[#7C8F6E] hover:bg-[#F5EFE0]'
              }`}
              title="Recursive tree view with expand/collapse (unlimited hierarchy depth)"
            >
              🌳 Tree View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-[#173B2D] text-[#F5EFE0]' : 'bg-white text-[#7C8F6E] hover:bg-[#F5EFE0]'
              }`}
              title="Flat paginated list with grade-colored remedy badges"
            >
              📋 List View
            </button>
          </div>
          {viewMode === 'tree' && (
            <div className="text-xs text-[#7C8F6E]">
              Chapter filter: <strong className="text-[#173B2D]">{chapter || 'All Chapters'}</strong>
            </div>
          )}
        </div>

        {/* ===== TREE VIEW — recursive hierarchy ===== */}
        {viewMode === 'tree' && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            {/* Chapter filter for tree */}
            <div className="mb-3">
              <select
                value={chapter}
                onChange={e => setChapter(e.target.value)}
                disabled={loadingChapters}
                className="px-3 py-2 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D] bg-white disabled:opacity-50"
              >
                <option value="">All Chapters ({chapters.reduce((s, c) => s + c.rubricCount, 0)} rubrics)</option>
                {chapters.map(ch => (
                  <option key={ch.name} value={ch.name}>
                    {ch.name} ({ch.rubricCount})
                  </option>
                ))}
              </select>
            </div>
            {/* Grade legend */}
            <div className="flex items-center gap-3 mb-3 flex-wrap text-[0.65rem]">
              <span className="font-semibold text-[#7C8F6E] uppercase tracking-wider">Grade Legend:</span>
              {[
                { g: 4, label: 'Grade 4 — Highest' },
                { g: 3, label: 'Grade 3' },
                { g: 2, label: 'Grade 2' },
                { g: 1, label: 'Grade 1 — Normal' },
              ].map(({ g, label }) => {
                const meta = GRADE_META[g];
                return (
                  <span key={g} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: meta.bg }}></span>
                    <span className="text-[#7C8F6E]">{label}</span>
                  </span>
                );
              })}
            </div>
            {/* Recursive tree */}
            <RepertoryTree author={author} chapter={chapter} />
          </div>
        )}

        {/* Search + Chapter filter (only in List view) */}
        {viewMode === 'list' && (
        <>
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Search rubrics by title, path, or remedy..."
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
            </div>
            {/* Chapter filter */}
            <select
              value={chapter}
              onChange={e => setChapter(e.target.value)}
              disabled={loadingChapters}
              className="px-3 py-2.5 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D] bg-white disabled:opacity-50"
            >
              <option value="">All Chapters ({chapters.reduce((s, c) => s + c.rubricCount, 0)} rubrics)</option>
              {chapters.map(ch => (
                <option key={ch.name} value={ch.name}>
                  {ch.name} ({ch.rubricCount})
                </option>
              ))}
            </select>
          </div>

          {/* Grade legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap text-[0.65rem]">
            <span className="font-semibold text-[#7C8F6E] uppercase tracking-wider">Grade Legend:</span>
            {[
              { g: 4, label: 'Grade 4 — Highest' },
              { g: 3, label: 'Grade 3' },
              { g: 2, label: 'Grade 2' },
              { g: 1, label: 'Grade 1 — Normal' },
            ].map(({ g, label }) => {
              const meta = GRADE_META[g];
              return (
                <span key={g} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: meta.bg }}></span>
                  <span className="text-[#7C8F6E]">{label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Count */}
        <div className="text-sm text-[#7C8F6E] mb-3">
          {loading ? 'Searching...' : `${total.toLocaleString()} rubric${total !== 1 ? 's' : ''}${q ? ` matching "${q}"` : ''}${chapter ? ` in ${chapter}` : ''} · ${author}`}
        </div>

        {/* Rubric cards */}
        {loading && rubrics.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">Loading rubrics...</div>
        ) : rubrics.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">
            <p className="text-lg font-serif mb-2">No rubrics found.</p>
            <p className="text-xs">Try a different search term, author, or chapter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rubrics.map(r => {
              const fav = reader.isFavorite(r.id);
              const bm = reader.isBookmarked(r.id);
              return (
                <article
                  key={r.id}
                  className="bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow border-t-2 border-[#173B2D]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {/* Full path — primary display */}
                      <h3 className="font-serif text-base text-[#173B2D] leading-tight break-words">
                        {r.fullPath || r.title}
                      </h3>
                      {/* Chapter + level badge */}
                      <div className="flex items-center gap-2 mt-1">
                        {r.chapter && (
                          <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#C8A24A] bg-[#C8A24A]/10 px-1.5 py-0.5 rounded">
                            {r.chapter}
                          </span>
                        )}
                        {r.level > 0 && (
                          <span className="text-[0.6rem] text-[#7C8F6E]">Level {r.level}</span>
                        )}
                        <span className="text-[0.6rem] text-[#7C8F6E]">
                          · {r.remedyCount} {r.remedyCount === 1 ? 'remedy' : 'remedies'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => toggleFav(e, r)}
                        title={fav ? 'Remove favorite' : 'Add favorite'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${fav ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >★</button>
                      <button
                        onClick={(e) => toggleBm(e, r)}
                        title={bm ? 'Remove bookmark' : 'Add bookmark'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >🔖</button>
                    </div>
                  </div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#C8A24A] mb-2">{r.author}</div>

                  {/* Grade-wise remedies */}
                  {r.remedyCount > 0 && r.byGrade && (
                    <div className="mt-2 max-h-48 overflow-y-auto pr-1 -mr-1">
                      <RemediesByGrade byGrade={r.byGrade} maxPerGrade={40} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >← Prev</button>
            <span className="text-sm text-[#7C8F6E]">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >Next →</button>
          </div>
        )}
        </>
        )} {/* end List View mode */}
      </main>
      <Footer />
    </div>
  );
}
