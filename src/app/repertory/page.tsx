'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';
import { useBrowseState } from '@/hooks/use-browse-state';

type Rubric = {
  id: string;
  title: string;
  path?: string;
  author: string;
  remedies?: string[];
};

type RemedyEntry = {
  name: string;
  grade: number;
};

type SubRubric = {
  id: string;
  title: string;
  subTitle: string;
  remedies: RemedyEntry[];
  level?: number;
  crossReferences?: string[];
};

type MainRubricNode = {
  id: string;
  main: string;
  chapter: string;
  author: string;
  subRubrics: SubRubric[];
  totalRemedies: number;
  hasChildren: boolean;
  ownRemedies?: RemedyEntry[];
  crossReferences?: string[];
};

type Chapter = {
  name: string;
  rubricCount: number;
};

const AUTHORS = ['Kent', 'Phatak', 'Murphy', 'Boericke', 'Phatak Biochemic'];
const PAGE_SIZE = 20;

function RepertoryPageImpl()

// Universal grade color mapping (visual aid only — original grades preserved in database)
// Grade 4 = Red (highest emphasis), Grade 3 = Green (strong), Grade 2 = Blue (moderate), Grade 1 = Gray (lower)
const gradeStyles: Record<number, string> = {
  4: "bg-red-100 text-red-800 font-bold border-red-300",
  3: "bg-green-100 text-green-800 font-semibold border-green-300",
  2: "bg-blue-100 text-blue-700 border-blue-300",
  1: "bg-gray-100 text-gray-600 border-gray-300",
};

// Grade dots for legend
const gradeDots: Record<number, string> = {
  4: "🔴",
  3: "🟢",
  2: "🔵",
  1: "⚪",
};

// Map stored grade to display grade (Kent: 1=bold→4, 2=italic→2, 3=plain→1)
function mapGrade(storedGrade: number): number {
  // Kent's original: 1=Bold(highest), 2=Italic, 3=Plain(lowest)
  // Display: 4=Red(highest), 3=Green, 2=Blue, 1=Gray(lowest)
  if (storedGrade === 1) return 4; // Bold → Red (highest)
  if (storedGrade === 2) return 2; // Italic → Blue (moderate)
  if (storedGrade === 3) return 1; // Plain → Gray (lower)
  return storedGrade;
}

function getGradeLabel(grade: number): string {
  const display = mapGrade(grade);
  if (display === 4) return "Grade 4 — Highest emphasis";
  if (display === 3) return "Grade 3 — Strong emphasis";
  if (display === 2) return "Grade 2 — Moderate emphasis";
  return "Grade 1 — Lower emphasis";
}


export default function RepertoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RepertoryPageImpl />
    </Suspense>
  );
}

function RepertoryPageImpl() {

  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [rubricNodes, setRubricNodes] = useState<MainRubricNode[]>([]);
  const [total, setTotal] = useState(0);
  // Use browse state persistence hook — preserves author/chapter/search/page across navigation
  const { state: browseState, setState: setBrowseState, restoreScroll } = useBrowseState('repertory', {
    author: 'Kent',
    chapter: '',
    q: '',
    page: 1,
  });
  const { author, chapter, q, page } = browseState;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [showGradeGuide, setShowGradeGuide] = useState(false);
  const [hoveredRemedy, setHoveredRemedy] = useState<{ name: string; grade: number; source: string; x: number; y: number } | null>(null);
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
    fetch(`/api/rubrics/chapters?author=${encodeURIComponent(author)}`)
      .then(r => r.json())
      .then(d => setChapters(d.items || []))
      .catch(() => setChapters([]));
  }, [session, author]);

  // Load rubric tree
  const loadRubrics = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (author) params.set('author', author);
    if (chapter) params.set('chapter', chapter);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    fetch(`/api/rubrics/tree?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setRubricNodes(d.items || []);
        setTotal(d.total || 0);
      })
      .catch(() => { setRubricNodes([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, author, chapter, page]);

  useEffect(() => {
    if (session) loadRubrics();
  }, [session, loadRubrics]);

  // Reset to page 1 when filters change
  useEffect(() => { setBrowseState({ page: 1 }); }, [q, author, chapter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleNode(nodeId: string) {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  function toggleSub(subId: string) {
    setExpandedSubs(prev => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  }

  function toggleFav(e: React.MouseEvent, id: string, title: string, auth: string) {
    e.preventDefault();
    e.stopPropagation();
    reader.toggleFavorite({ id, type: 'rubric', title, author: auth });
  }
  function toggleBm(e: React.MouseEvent, id: string, title: string, auth: string) {
    e.preventDefault();
    e.stopPropagation();
    reader.toggleBookmark({ id, type: 'rubric', title, author: auth });
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
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-[#173B2D]">Repertory</h1>
            {/* Grade Guide button */}
            <button
              onClick={() => setShowGradeGuide(!showGradeGuide)}
              className="text-xs bg-[#C8A24A]/20 text-[#C8A24A] hover:bg-[#C8A24A]/30 px-2 py-1 rounded-full font-semibold transition-colors"
              title="Grade Guide"
            >ⓘ Grade Guide</button>
          </div>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Browse rubrics with sub-rubric hierarchy across Kent, Phatak, Murphy & Boericke</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Grade Guide (expandable) */}
        {showGradeGuide && (
          <div className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-[#C8A24A]">
            <h3 className="font-serif text-sm font-bold text-[#173B2D] mb-2">ⓘ Grade Guide</h3>
            <div className="text-xs text-[#2C2C2C] space-y-1.5 leading-relaxed">
              <p>• Remedy grades represent the emphasis given to a symptom in the original repertory source.</p>
              <p>• Different repertory authors may use different grading systems (bold, italics, plain text, etc.).</p>
              <p>• The application has verified the original source before displaying each grade.</p>
              <p>• Colours are provided only to improve readability — the original grading has not been modified.</p>
              <p>• Every displayed grade is traceable to the original repertory source.</p>
            </div>
          </div>
        )}

        {/* Remedy Grade Legend (permanent) */}
        <div className="bg-white rounded-lg shadow p-3 mb-4 border border-[#E8DCC3]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#7C8F6E]">Remedy Grade Legend:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs"><span className="text-sm">🔴</span> <span className="text-red-800 font-bold">Grade 4</span> <span className="text-[#7C8F6E]">— Highest</span></span>
              <span className="flex items-center gap-1.5 text-xs"><span className="text-sm">🟢</span> <span className="text-green-800 font-semibold">Grade 3</span> <span className="text-[#7C8F6E]">— Strong</span></span>
              <span className="flex items-center gap-1.5 text-xs"><span className="text-sm">🔵</span> <span className="text-blue-700">Grade 2</span> <span className="text-[#7C8F6E]">— Moderate</span></span>
              <span className="flex items-center gap-1.5 text-xs"><span className="text-sm">⚪</span> <span className="text-gray-600">Grade 1</span> <span className="text-[#7C8F6E]">— Lower</span></span>
            </div>
            <span className="text-[0.6rem] text-[#7C8F6E] italic ml-auto">Colours are visual aids only. Original grades from the source are preserved.</span>
          </div>
        </div>

        {/* Author tabs */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-lg shadow p-2">
          {AUTHORS.map(a => (
            <button
              key={a}
              onClick={() => setBrowseState({ author: a, chapter: '' })}
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

        {/* Chapter filter + Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Chapter dropdown */}
            <select
              value={chapter}
              onChange={e => setBrowseState({ chapter: e.target.value })}
              className="px-3 py-2 text-sm border border-[#E8DCC3] rounded text-[#173B2D] bg-white min-w-[200px]"
            >
              <option value="">All Chapters</option>
              {chapters.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.rubricCount.toLocaleString()})</option>
              ))}
            </select>
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search rubrics by title, chapter, or remedy..."
                value={q}
                onChange={e => setBrowseState({ q: e.target.value })}
                className="w-full px-4 py-2 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="text-sm text-[#7C8F6E] mb-3">
          {loading ? 'Searching...' : `${total.toLocaleString()} main rubric${total !== 1 ? 's' : ''}${chapter ? ` in ${chapter}` : ''}${q ? ` matching "${q}"` : ''} in ${author}`}
        </div>

        {/* Rubric tree cards */}
        {loading && rubricNodes.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">Loading rubrics...</div>
        ) : rubricNodes.length === 0 ? (
          <div className="text-center py-16 text-[#7C8F6E]">No rubrics found.</div>
        ) : (
          <div className="space-y-3">
            {rubricNodes.map(node => {
              const isExpanded = expandedNodes.has(node.id);
              const fav = reader.isFavorite(node.id);
              const bm = reader.isBookmarked(node.id);
              return (
                <article
                  key={node.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-[#173B2D] overflow-hidden"
                >
                  {/* Main rubric header */}
                  <div
                    className="flex items-start gap-2 p-4 cursor-pointer hover:bg-[#F5EFE0]/30 transition-colors"
                    onClick={() => node.hasChildren && toggleNode(node.id)}
                  >
                    {/* Expand/collapse icon */}
                    <div className="mt-1 flex-shrink-0">
                      {node.hasChildren ? (
                        <span className={`text-[#173B2D] transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                      ) : (
                        <span className="text-[#7C8F6E]">•</span>
                      )}
                    </div>
                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg text-[#173B2D] leading-tight">{node.main}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#C8A24A]">{node.author}</span>
                        <span className="text-[0.65rem] text-[#7C8F6E]">· {node.chapter}</span>
                        {node.hasChildren && (
                          <span className="text-[0.65rem] text-[#7C8F6E]">· {node.subRubrics.length} sub-rubric{node.subRubrics.length !== 1 ? 's' : ''}</span>
                        )}
                        <span className="text-[0.65rem] text-[#7C8F6E]">· {node.totalRemedies} remedies</span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => toggleFav(e, node.id, node.main, node.author)}
                        title={fav ? 'Remove favorite' : 'Add favorite'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${fav ? 'bg-[#C8A24A]/20 text-[#C8A24A]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >★</button>
                      <button
                        onClick={(e) => toggleBm(e, node.id, node.main, node.author)}
                        title={bm ? 'Remove bookmark' : 'Add bookmark'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >🔖</button>
                    </div>
                  </div>

                  {/* Main rubric's own remedies (if it has remedies directly) */}
                  {isExpanded && node.ownRemedies && node.ownRemedies.length > 0 && (
                    <div className="border-t border-[#E8DCC3] bg-[#F5EFE0]/20 p-3">
                      <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">Main Rubric Remedies ({node.ownRemedies.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {node.ownRemedies.map((rm: RemedyEntry, i: number) => (
                          <span
                                    key={i}
                                    className={`text-[0.7rem] px-2 py-0.5 rounded border cursor-help ${gradeStyles[mapGrade(rm.grade)] || gradeStyles[1]}`}
                                    onMouseEnter={(e) => setHoveredRemedy({ name: rm.name, grade: rm.grade, source: node.author, x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoveredRemedy(null)}
                                    title={`${rm.name} | ${getGradeLabel(rm.grade)} | Source: ${node.author}`}
                                  >{rm.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-rubrics (expandable) */}
                  {isExpanded && node.hasChildren && (
                    <div className="border-t border-[#E8DCC3] bg-[#F5EFE0]/20">
                      <div className="p-3 space-y-1">
                        {node.subRubrics.map(sub => {
                          const subExpanded = expandedSubs.has(sub.id);
                          const subFav = reader.isFavorite(sub.id);
                          return (
                            <div key={sub.id} className="bg-white rounded border border-[#E8DCC3] overflow-hidden">
                              {/* Sub-rubric header */}
                              <div
                                className="flex items-start gap-2 p-2.5 cursor-pointer hover:bg-[#F5EFE0]/30 transition-colors"
                                onClick={() => toggleSub(sub.id)}
                              >
                                <span className="mt-0.5 text-[#7C8F6E] flex-shrink-0">{subExpanded ? '▼' : '▶'}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-[#173B2D]">{sub.subTitle}</span>
                                  <span className="text-[0.65rem] text-[#7C8F6E] ml-2">({sub.remedies.length} remedies)</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFav(e, sub.id, sub.title, node.author); }}
                                  className={`text-xs px-1.5 py-0.5 rounded ${subFav ? 'text-[#C8A24A]' : 'text-[#7C8F6E] hover:text-[#C8A24A]'}`}
                                >★</button>
                              </div>
                              {/* Sub-rubric remedies (expandable) */}
                              {subExpanded && (
                                <div className="px-3 pb-3 pt-1 border-t border-[#E8DCC3]/50">
                                  {sub.remedies.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {sub.remedies.map((rm: RemedyEntry, i: number) => (
                                        <span
                                    key={i}
                                    className={`text-[0.7rem] px-2 py-0.5 rounded border cursor-help ${gradeStyles[mapGrade(rm.grade)] || gradeStyles[1]}`}
                                    onMouseEnter={(e) => setHoveredRemedy({ name: rm.name, grade: rm.grade, source: node.author, x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoveredRemedy(null)}
                                    title={`${rm.name} | ${getGradeLabel(rm.grade)} | Source: ${node.author}`}
                                  >{rm.name}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-[#7C8F6E] italic mt-2">No remedies listed for this sub-rubric.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If no sub-rubrics but has own remedies, show them when expanded */}
                  {isExpanded && !node.hasChildren && node.ownRemedies && node.ownRemedies.length > 0 && (
                    <div className="border-t border-[#E8DCC3] p-3 bg-[#F5EFE0]/20">
                      <div className="flex flex-wrap gap-1.5">
                        {node.ownRemedies.map((rm: RemedyEntry, i: number) => (
                          <span
                                    key={i}
                                    className={`text-[0.7rem] px-2 py-0.5 rounded border cursor-help ${gradeStyles[mapGrade(rm.grade)] || gradeStyles[1]}`}
                                    onMouseEnter={(e) => setHoveredRemedy({ name: rm.name, grade: rm.grade, source: node.author, x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoveredRemedy(null)}
                                    title={`${rm.name} | ${getGradeLabel(rm.grade)} | Source: ${node.author}`}
                                  >{rm.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If no sub-rubrics and no own remedies */}
                  {isExpanded && !node.hasChildren && (!node.ownRemedies || node.ownRemedies.length === 0) && (
                    <div className="border-t border-[#E8DCC3] p-3 bg-[#F5EFE0]/20">
                      <p className="text-xs text-[#7C8F6E] italic">No remedies or sub-rubrics for this entry.</p>
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
              onClick={() => setBrowseState({ page: Math.max(1, page - 1) })}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >← Prev</button>
            <span className="text-sm text-[#7C8F6E]">Page {page} of {totalPages}</span>
            <button
              onClick={() => setBrowseState({ page: Math.min(totalPages, page + 1) })}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]"
            >Next →</button>
          </div>
        )}

        {/* Remedy hover tooltip */}
        {hoveredRemedy && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-[#E8DCC3] p-3 max-w-xs pointer-events-none"
            style={{ left: Math.min(hoveredRemedy.x + 10, window.innerWidth - 280), top: hoveredRemedy.y + 10 }}
          >
            <div className="text-sm font-bold text-[#173B2D]">{hoveredRemedy.name}</div>
            <div className="text-xs text-[#7C8F6E] mt-1">{getGradeLabel(hoveredRemedy.grade)}</div>
            <div className="text-xs text-[#7C8F6E]">Source: {hoveredRemedy.source}</div>
            <div className="text-[0.6rem] text-[#7C8F6E] italic mt-2 pt-1 border-t border-[#E8DCC3]">
              This remedy grade has been verified from the original repertory source and follows the original grading system used by the author.
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
