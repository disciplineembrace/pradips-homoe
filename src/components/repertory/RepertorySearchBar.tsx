'use client';
/**
 * RepertorySearchBar — top global search.
 * Debounced instant search across all repertories (or selected one).
 * Keyboard navigation: Up/Down to move, Enter to open, Esc to close.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';

interface SearchResult {
  id: string;
  repertory: string;
  chapter: string;
  title: string;
  remedyCount: number;
  matchedRemedies: string[];
}

interface Props {
  onSelectRubric: (r: { id: string; title: string; repertory: string; chapter: string }) => void;
  authorFilter?: string;
  chapterFilter?: string;
}

export function RepertorySearchBar({ onSelectRubric, authorFilter, chapterFilter }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams({ q, limit: '50' });
      if (authorFilter) params.set('author', authorFilter);
      if (chapterFilter) params.set('chapter', chapterFilter);
      fetch(`/api/repertory/search?${params}`)
        .then(r => r.json())
        .then(d => {
          setResults(d.items || []);
          setActiveIdx(-1);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, authorFilter, chapterFilter]);

  // Click outside to close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const sel = activeIdx >= 0 ? results[activeIdx] : results[0];
      if (sel) {
        onSelectRubric({ id: sel.id, title: sel.title, repertory: sel.repertory, chapter: sel.chapter });
        setOpen(false);
        setQ('');
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }, [open, results, activeIdx, onSelectRubric]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search rubrics & remedies... (Ctrl+K)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => q.length >= 2 && setOpen(true)}
          className="w-full pl-9 pr-9 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-stone-400" />
        )}
        {!loading && q && (
          <button
            onClick={() => { setQ(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {/* Results dropdown */}
      {open && (results.length > 0 || (!loading && q.length >= 2)) && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-stone-500">No results for "{q}"</div>
          ) : (
            <ul className="py-1">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => {
                      onSelectRubric({ id: r.id, title: r.title, repertory: r.repertory, chapter: r.chapter });
                      setOpen(false);
                      setQ('');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${activeIdx === i ? 'bg-emerald-50' : 'hover:bg-stone-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">{r.repertory}</span>
                      <span className="text-xs text-stone-500">{r.chapter}</span>
                      <span className="ml-auto text-xs text-stone-400">{r.remedyCount} rem</span>
                    </div>
                    <div className="text-stone-800 mt-0.5 truncate">{r.title}</div>
                    {r.matchedRemedies.length > 0 && (
                      <div className="text-xs text-emerald-700 mt-0.5">
                        Matched: {r.matchedRemedies.slice(0, 3).join(', ')}
                        {r.matchedRemedies.length > 3 && ` +${r.matchedRemedies.length - 3}`}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
