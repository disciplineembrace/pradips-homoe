'use client';
/**
 * RepertorySidebarTabs — switchable sidebar with Favorites, History, and Notes.
 */
import { useState } from 'react';
import { Star, Clock, Trash2, ChevronRight } from 'lucide-react';
import type { FavoriteEntry, HistoryEntry } from './use-repertory-storage';

interface Props {
  favorites: FavoriteEntry[];
  history: HistoryEntry[];
  onClearFavorites: () => void;
  onClearHistory: () => void;
  onSelectRubric: (r: { id: string; title: string; repertory: string; chapter: string }) => void;
}

export function RepertorySidebarTabs({
  favorites, history, onClearFavorites, onClearHistory, onSelectRubric,
}: Props) {
  const [tab, setTab] = useState<'favorites' | 'history'>('favorites');

  return (
    <div className="h-full flex flex-col">
      {/* Tab header */}
      <div className="flex border-b border-stone-200 bg-stone-50">
        <button
          onClick={() => setTab('favorites')}
          className={`flex-1 px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${tab === 'favorites' ? 'text-emerald-900 border-b-2 border-emerald-700 bg-white' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <Star className="h-3.5 w-3.5" /> Favorites
          {favorites.length > 0 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">{favorites.length}</span>}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${tab === 'history' ? 'text-emerald-900 border-b-2 border-emerald-700 bg-white' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <Clock className="h-3.5 w-3.5" /> History
          {history.length > 0 && <span className="px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded text-xs">{history.length}</span>}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'favorites' ? (
          <>
            {favorites.length > 0 && (
              <div className="px-3 py-1.5 border-b border-stone-200 bg-stone-50">
                <button
                  onClick={onClearFavorites}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear all
                </button>
              </div>
            )}
            {favorites.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-stone-400">
                <Star className="h-6 w-6 mx-auto mb-2 opacity-30" />
                No favorites yet.
                <p className="text-xs mt-1">Click the star icon on any rubric to add it.</p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {favorites.map(f => (
                  <li key={f.id}>
                    <button
                      onClick={() => onSelectRubric({ id: f.id, title: f.title, repertory: f.repertory, chapter: f.chapter })}
                      className="w-full flex items-start gap-1.5 px-3 py-2 hover:bg-stone-50 text-left"
                    >
                      <ChevronRight className="h-3 w-3 mt-0.5 text-stone-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">{f.repertory}</span>
                          <span className="text-xs text-stone-400 truncate">{f.chapter}</span>
                        </div>
                        <div className="text-sm text-stone-700 truncate mt-0.5">{f.title}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {history.length > 0 && (
              <div className="px-3 py-1.5 border-b border-stone-200 bg-stone-50">
                <button
                  onClick={onClearHistory}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear all
                </button>
              </div>
            )}
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-stone-400">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-30" />
                No history yet.
                <p className="text-xs mt-1">Rubrics you view will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {history.map(h => (
                  <li key={h.id}>
                    <button
                      onClick={() => onSelectRubric({ id: h.id, title: h.title, repertory: h.repertory, chapter: h.chapter })}
                      className="w-full flex items-start gap-1.5 px-3 py-2 hover:bg-stone-50 text-left"
                    >
                      <ChevronRight className="h-3 w-3 mt-0.5 text-stone-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">{h.repertory}</span>
                          <span className="text-xs text-stone-400 truncate">{h.chapter}</span>
                        </div>
                        <div className="text-sm text-stone-700 truncate mt-0.5">{h.title}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{new Date(h.visitedAt).toLocaleString()}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
