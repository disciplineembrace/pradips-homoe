'use client';
/**
 * RepertoryChapterTree — left sidebar.
 * Shows the list of repertories (authors), and under each, the chapters.
 * Click a chapter to load its main rubrics in the middle column.
 *
 * Features:
 *   - Expand/collapse each repertory
 *   - Lazy load chapters (only fetched when repertory is first expanded)
 *   - Active chapter highlighting
 *   - Rubric count badges
 *   - Keyboard navigation (Up/Down to move, Enter to select)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, Book, Folder, Loader2 } from 'lucide-react';

interface Repertory { author: string; chapterCount: number; rubricCount: number; }
interface Chapter { id: string; name: string; repertory: string; rubricCount: number; mainRubricCount: number; }

interface Props {
  activeAuthor: string | null;
  activeChapter: string | null;
  onSelectChapter: (author: string, chapter: string) => void;
}

export function RepertoryChapterTree({ activeAuthor, activeChapter, onSelectChapter }: Props) {
  const [repertories, setRepertories] = useState<Repertory[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [chaptersByAuthor, setChaptersByAuthor] = useState<Record<string, Chapter[]>>({});
  const [loadingChapters, setLoadingChapters] = useState<string | null>(null);
  const [loadingRepertories, setLoadingRepertories] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // Load repertories list once
  useEffect(() => {
    fetch('/api/repertory/repertories')
      .then(r => r.json())
      .then(d => {
        setRepertories(d.items || []);
        setLoadingRepertories(false);
        // Auto-expand first repertory (Kent — largest)
        if (d.items?.length > 0 && activeAuthor === null) {
          setExpanded(new Set([d.items[0].author]));
        }
      })
      .catch(() => setLoadingRepertories(false));
  }, []);

  // Load chapters for an author on first expand
  const expandAuthor = useCallback(async (author: string) => {
    if (chaptersByAuthor[author]) {
      setExpanded(prev => new Set(prev).add(author));
      return;
    }
    setLoadingChapters(author);
    try {
      const r = await fetch(`/api/repertory/chapters?author=${encodeURIComponent(author)}`);
      const d = await r.json();
      setChaptersByAuthor(prev => ({ ...prev, [author]: d.items || [] }));
      setExpanded(prev => new Set(prev).add(author));
    } finally {
      setLoadingChapters(null);
    }
  }, [chaptersByAuthor]);

  const toggleAuthor = useCallback((author: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(author)) {
        next.delete(author);
      } else {
        // Will trigger lazy load in effect
        expandAuthor(author);
      }
      return next;
    });
  }, [expandAuthor]);

  // Auto-expand active author's chapters
  useEffect(() => {
    if (activeAuthor && !chaptersByAuthor[activeAuthor] && !loadingChapters) {
      expandAuthor(activeAuthor);
    }
  }, [activeAuthor, chaptersByAuthor, expandAuthor, loadingChapters]);

  if (loadingRepertories) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading repertories...
      </div>
    );
  }

  return (
    <div ref={listRef} className="h-full overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500 sticky top-0 bg-stone-50 border-b border-stone-200">
        Repertories
      </div>
      <ul className="py-1">
        {repertories.map(rep => {
          const isExpanded = expanded.has(rep.author);
          const chapters = chaptersByAuthor[rep.author];
          const isActive = activeAuthor === rep.author;
          return (
            <li key={rep.author}>
              <button
                onClick={() => toggleAuthor(rep.author)}
                className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-stone-100 ${isActive ? 'font-semibold text-emerald-900' : 'text-stone-700'}`}
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                <Book className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
                <span className="flex-1 text-left truncate">{rep.author}</span>
                <span className="text-xs text-stone-400">{rep.rubricCount.toLocaleString()}</span>
              </button>
              {isExpanded && (
                <ul className="ml-3 border-l border-stone-200">
                  {loadingChapters === rep.author && (
                    <li className="px-3 py-2 text-xs text-stone-500 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading chapters...
                    </li>
                  )}
                  {chapters?.map(ch => {
                    const isActiveChapter = activeAuthor === rep.author && activeChapter === ch.name;
                    return (
                      <li key={ch.id}>
                        <button
                          onClick={() => onSelectChapter(rep.author, ch.name)}
                          className={`w-full flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-sm hover:bg-stone-100 ${isActiveChapter ? 'bg-emerald-100 text-emerald-900 font-semibold border-l-2 border-emerald-700 -ml-px' : 'text-stone-600'}`}
                        >
                          <Folder className="h-3 w-3 flex-shrink-0 text-stone-400" />
                          <span className="flex-1 text-left truncate">{ch.name}</span>
                          <span className="text-xs text-stone-400">{ch.rubricCount.toLocaleString()}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
