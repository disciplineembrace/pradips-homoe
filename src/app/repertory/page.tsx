'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type Rubric = {
  id: string;
  title: string;
  path?: string;
  author: string;
  remedies?: string[];
};

type SubRubric = {
  id: string;
  title: string;
  subTitle: string;
  remedies: string[];
};

type MainRubricNode = {
  id: string;
  main: string;
  chapter: string;
  author: string;
  subRubrics: SubRubric[];
  totalRemedies: number;
  hasChildren: boolean;
};

type Chapter = {
  name: string;
  rubricCount: number;
};

const AUTHORS = ['Kent', 'Phatak', 'Murphy', 'Boericke', 'Phatak Biochemic'];
const PAGE_SIZE = 20;

export default function RepertoryPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [rubricNodes, setRubricNodes] = useState<MainRubricNode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('Kent');
  const [chapter, setChapter] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
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
  useEffect(() => { setPage(1); }, [q, author, chapter]);

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
          <h1 className="font-serif text-3xl text-[#173B2D]">Repertory</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Browse rubrics with sub-rubric hierarchy across Kent, Phatak, Murphy & Boericke</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Author tabs */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-lg shadow p-2">
          {AUTHORS.map(a => (
            <button
              key={a}
              onClick={() => { setAuthor(a); setChapter(''); }}
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
              onChange={e => setChapter(e.target.value)}
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
                onChange={e => setQ(e.target.value)}
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
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {sub.remedies.map((rm, i) => (
                                      <span key={i} className="text-[0.7rem] bg-[#F5EFE0] text-[#173B2D] px-2 py-0.5 rounded border border-[#E8DCC3]">{rm}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If no sub-rubrics but has remedies, show them directly (rare case) */}
                  {!node.hasChildren && node.totalRemedies > 0 && (
                    <div className="border-t border-[#E8DCC3] p-3 bg-[#F5EFE0]/20">
                      <p className="text-xs text-[#7C8F6E] italic">No sub-rubrics. See individual rubric entries for remedies.</p>
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
      </main>
      <Footer />
    </div>
  );
}
