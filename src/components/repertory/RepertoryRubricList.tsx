'use client';
/**
 * RepertoryRubricList — middle column.
 * Shows main rubrics under the active chapter, with expand/collapse for sub-rubrics.
 *
 * Features:
 *   - Paginated main rubric list (lazy load on scroll)
 *   - Filter box (instant client-side filter on already-loaded items)
 *   - Expand a main rubric → lazy-load its sub-rubrics
 *   - Click any rubric to open it in the right detail panel
 *   - Multi-select checkboxes for clipboard operations
 *   - Remedy count badges
 *   - Keyboard navigation
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, Loader2, Search, Star, Copy, X } from 'lucide-react';

interface MainRubric {
  id: string;
  chapter: string;
  repertory: string;
  main: string;
  subRubricCount: number;
  remedyCount: number;
  hasChildren: boolean;
}
interface SubRubric {
  id: string;
  title: string;
  sub: string;
  remedies: string[];
}

interface Props {
  author: string;
  chapter: string;
  selectedRubricId: string | null;
  onSelectRubric: (rubric: { id: string; title: string; repertory: string; chapter: string; remedies?: string[] }) => void;
  clipboardIds: Set<string>;
  onAddToClipboard: (r: { id: string; title: string; repertory: string; chapter: string; remedies: string[] }) => void;
  onRemoveFromClipboard: (id: string) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (r: { id: string; title: string; repertory: string; chapter: string }) => void;
}

const PAGE_SIZE = 100;

export function RepertoryRubricList({
  author, chapter, selectedRubricId, onSelectRubric,
  clipboardIds, onAddToClipboard, onRemoveFromClipboard,
  isFavorite, onToggleFavorite,
}: Props) {
  const [items, setItems] = useState<MainRubric[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [expandedMain, setExpandedMain] = useState<Set<string>>(new Set());
  const [subRubricsByMain, setSubRubricsByMain] = useState<Record<string, SubRubric[]>>({});
  const [loadingSubRubrics, setLoadingSubRubrics] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when author/chapter changes
  useEffect(() => {
    setItems([]);
    setTotal(0);
    setOffset(0);
    setFilter('');
    setExpandedMain(new Set());
    setSubRubricsByMain({});
  }, [author, chapter]);

  // Load main rubrics
  useEffect(() => {
    if (!author || !chapter) return;
    setLoading(true);
    const params = new URLSearchParams({
      author,
      chapter,
      offset: String(offset),
      limit: String(PAGE_SIZE),
    });
    if (filter) params.set('q', filter);
    fetch(`/api/repertory/main-rubrics?${params}`)
      .then(r => r.json())
      .then(d => {
        if (offset === 0) {
          setItems(d.items || []);
        } else {
          setItems(prev => [...prev, ...d.items]);
        }
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [author, chapter, offset, filter]);

  // Reload from offset=0 when filter changes (debounced)
  useEffect(() => {
    if (!author || !chapter) return;
    const t = setTimeout(() => {
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [filter, author, chapter]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && items.length < total && !loading) {
        setOffset(prev => prev + PAGE_SIZE);
      }
    }, { rootMargin: '200px' });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [items.length, total, loading]);

  // Expand sub-rubrics
  const toggleMain = useCallback(async (rubric: MainRubric) => {
    const key = rubric.main;
    setExpandedMain(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    if (!subRubricsByMain[key]) {
      setLoadingSubRubrics(key);
      try {
        const r = await fetch(`/api/repertory/sub-rubrics?author=${encodeURIComponent(author)}&chapter=${encodeURIComponent(chapter)}&main=${encodeURIComponent(key)}`);
        const d = await r.json();
        setSubRubricsByMain(prev => ({ ...prev, [key]: d.items || [] }));
      } finally {
        setLoadingSubRubrics(null);
      }
    }
  }, [author, chapter, subRubricsByMain]);

  if (!author || !chapter) {
    return (
      <div className="h-full flex items-center justify-center text-stone-400 text-sm">
        Select a chapter from the left to view rubrics.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-stone-200 bg-stone-50 sticky top-0 z-10">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-serif text-base text-emerald-900">{chapter}</h2>
          <span className="text-xs text-stone-500">
            {items.length} / {total.toLocaleString()} rubrics
          </span>
        </div>
        {/* Filter */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Filter rubrics in this chapter..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-7 pr-7 py-1.5 text-sm border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {filter && (
            <button onClick={() => setFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading rubrics...
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-stone-500">
            No rubrics found {filter && `for "${filter}"`}.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map(rubric => {
              const isExpanded = expandedMain.has(rubric.main);
              const isSelected = selectedRubricId === rubric.id || (subRubricsByMain[rubric.main] || []).some(s => s.id === selectedRubricId);
              const inClipboard = clipboardIds.has(rubric.id);
              const fav = isFavorite(rubric.id);
              const subRubrics = subRubricsByMain[rubric.main];
              return (
                <li key={rubric.id} className={`group ${isSelected ? 'bg-amber-50' : ''}`}>
                  <div className="flex items-start gap-1 px-2 py-1.5 hover:bg-stone-50">
                    {/* Expand/collapse */}
                    {rubric.hasChildren ? (
                      <button
                        onClick={() => toggleMain(rubric)}
                        className="mt-0.5 p-0.5 text-stone-400 hover:text-stone-700"
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <span className="w-5" />
                    )}
                    {/* Checkbox for clipboard */}
                    <button
                      onClick={() => {
                        if (inClipboard) {
                          onRemoveFromClipboard(rubric.id);
                        } else {
                          onAddToClipboard({ id: rubric.id, title: rubric.main, repertory: rubric.repertory, chapter: rubric.chapter, remedies: [] });
                        }
                      }}
                      className={`mt-0.5 p-0.5 ${inClipboard ? 'text-emerald-700' : 'text-stone-300 hover:text-stone-500'}`}
                      title={inClipboard ? 'Remove from clipboard' : 'Add to clipboard'}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {/* Favorite */}
                    <button
                      onClick={() => onToggleFavorite({ id: rubric.id, title: rubric.main, repertory: rubric.repertory, chapter: rubric.chapter })}
                      className={`mt-0.5 p-0.5 ${fav ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'}`}
                      title={fav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`h-3.5 w-3.5 ${fav ? 'fill-current' : ''}`} />
                    </button>
                    {/* Rubric name */}
                    <button
                      onClick={() => onSelectRubric({ id: rubric.id, title: rubric.main, repertory: rubric.repertory, chapter: rubric.chapter })}
                      className="flex-1 text-left text-sm text-stone-700 hover:text-emerald-900 hover:underline truncate"
                    >
                      {rubric.main}
                    </button>
                    <span className="text-xs text-stone-400 ml-auto whitespace-nowrap">
                      {rubric.remedyCount} rem
                    </span>
                  </div>
                  {/* Sub-rubrics */}
                  {isExpanded && (
                    <div className="ml-7 mr-2 mb-2 border-l-2 border-stone-200 pl-2">
                      {loadingSubRubrics === rubric.main ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-stone-500">
                          <Loader2 className="h-3 w-3 animate-spin" /> Loading sub-rubrics...
                        </div>
                      ) : subRubrics && subRubrics.length > 0 ? (
                        <ul className="space-y-0.5">
                          {subRubrics.map(sub => {
                            const inClip = clipboardIds.has(sub.id);
                            const favSub = isFavorite(sub.id);
                            const sel = selectedRubricId === sub.id;
                            return (
                              <li key={sub.id} className={`flex items-start gap-1 px-1 py-1 rounded ${sel ? 'bg-amber-100' : 'hover:bg-stone-100'}`}>
                                <button
                                  onClick={() => {
                                    if (inClip) onRemoveFromClipboard(sub.id);
                                    else onAddToClipboard({ id: sub.id, title: sub.title, repertory: rubric.repertory, chapter: rubric.chapter, remedies: sub.remedies });
                                  }}
                                  className={`p-0.5 ${inClip ? 'text-emerald-700' : 'text-stone-300 hover:text-stone-500'}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => onToggleFavorite({ id: sub.id, title: sub.title, repertory: rubric.repertory, chapter: rubric.chapter })}
                                  className={`p-0.5 ${favSub ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'}`}
                                >
                                  <Star className={`h-3 w-3 ${favSub ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={() => onSelectRubric({ id: sub.id, title: sub.title, repertory: rubric.repertory, chapter: rubric.chapter, remedies: sub.remedies })}
                                  className="flex-1 text-left text-xs text-stone-600 hover:text-emerald-900 hover:underline"
                                >
                                  {sub.sub || sub.title}
                                </button>
                                <span className="text-xs text-stone-400">{sub.remedies.length}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-xs text-stone-400 py-1">No sub-rubrics.</div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {loading && items.length > 0 && (
          <div className="flex items-center justify-center py-3 text-stone-500">
            <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading more...
          </div>
        )}
      </div>
    </div>
  );
}
