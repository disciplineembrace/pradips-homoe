'use client';
/**
 * useReaderFeatures — localStorage-backed reader features
 * Provides bookmarks, favorites, notes, history, and highlights
 * that persist per-browser. Each feature is keyed by a stable item id.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY_PREFIX = 'ph_';
const BOOKMARKS_KEY = `${KEY_PREFIX}bookmarks`;
const FAVORITES_KEY = `${KEY_PREFIX}favorites`;
const NOTES_KEY = `${KEY_PREFIX}notes`;
const HISTORY_KEY = `${KEY_PREFIX}history`;
const HIGHLIGHTS_KEY = `${KEY_PREFIX}highlights`;

export type Bookmark = {
  id: string;        // unique id of item (e.g. remedy id, chapter id)
  type: string;      // 'remedy' | 'rubric' | 'chapter' | 'therapeutic' | etc.
  title: string;
  href?: string;
  author?: string;
  createdAt: number;
};

export type Favorite = {
  id: string;
  type: string;
  title: string;
  href?: string;
  author?: string;
  createdAt: number;
};

export type Note = {
  id: string;        // note id
  itemId: string;    // id of the item the note is attached to
  type: string;
  text: string;
  createdAt: number;
  updatedAt: number;
};

export type HistoryItem = {
  id: string;
  type: string;
  title: string;
  href?: string;
  visitedAt: number;
};

export type Highlight = {
  id: string;        // highlight id
  itemId: string;
  type: string;
  text: string;
  color: string;
  createdAt: number;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Dispatch a storage event so same-tab listeners can react.
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(value) }));
  } catch {
    /* ignore quota errors */
  }
}

export function useReaderFeatures() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setBookmarks(readJson<Bookmark[]>(BOOKMARKS_KEY, []));
    setFavorites(readJson<Favorite[]>(FAVORITES_KEY, []));
    setNotes(readJson<Note[]>(NOTES_KEY, []));
    setHistory(readJson<HistoryItem[]>(HISTORY_KEY, []));
    setHighlights(readJson<Highlight[]>(HIGHLIGHTS_KEY, []));
    setHydrated(true);
  }, []);

  // Listen for cross-tab/same-tab updates
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (e.key === BOOKMARKS_KEY) setBookmarks(readJson<Bookmark[]>(BOOKMARKS_KEY, []));
      if (e.key === FAVORITES_KEY) setFavorites(readJson<Favorite[]>(FAVORITES_KEY, []));
      if (e.key === NOTES_KEY) setNotes(readJson<Note[]>(NOTES_KEY, []));
      if (e.key === HISTORY_KEY) setHistory(readJson<HistoryItem[]>(HISTORY_KEY, []));
      if (e.key === HIGHLIGHTS_KEY) setHighlights(readJson<Highlight[]>(HIGHLIGHTS_KEY, []));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ---------- BOOKMARKS ----------
  const isBookmarked = useCallback((id: string) => bookmarks.some(b => b.id === id), [bookmarks]);

  const toggleBookmark = useCallback((item: Omit<Bookmark, 'createdAt'>) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === item.id);
      const next = exists
        ? prev.filter(b => b.id !== item.id)
        : [{ ...item, createdAt: Date.now() }, ...prev];
      writeJson(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.id !== id);
      writeJson(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  // ---------- FAVORITES ----------
  const isFavorite = useCallback((id: string) => favorites.some(f => f.id === id), [favorites]);

  const toggleFavorite = useCallback((item: Omit<Favorite, 'createdAt'>) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id);
      const next = exists
        ? prev.filter(f => f.id !== item.id)
        : [{ ...item, createdAt: Date.now() }, ...prev];
      writeJson(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      writeJson(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  // ---------- NOTES ----------
  const getNotes = useCallback((itemId: string) => notes.filter(n => n.itemId === itemId), [notes]);

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    setNotes(prev => {
      const now = Date.now();
      const next = [{ ...note, id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now, updatedAt: now }, ...prev];
      writeJson(NOTES_KEY, next);
      return next;
    });
  }, []);

  const updateNote = useCallback((id: string, text: string) => {
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, text, updatedAt: Date.now() } : n);
      writeJson(NOTES_KEY, next);
      return next;
    });
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      writeJson(NOTES_KEY, next);
      return next;
    });
  }, []);

  // ---------- HISTORY ----------
  const addHistory = useCallback((item: Omit<HistoryItem, 'visitedAt'>) => {
    setHistory(prev => {
      // Move-to-front, dedupe by id, keep last 100
      const filtered = prev.filter(h => h.id !== item.id);
      const next = [{ ...item, visitedAt: Date.now() }, ...filtered].slice(0, 100);
      writeJson(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeJson(HISTORY_KEY, []);
  }, []);

  // ---------- HIGHLIGHTS ----------
  const getHighlights = useCallback((itemId: string) => highlights.filter(h => h.itemId === itemId), [highlights]);

  const addHighlight = useCallback((hl: Omit<Highlight, 'id' | 'createdAt'>) => {
    setHighlights(prev => {
      const now = Date.now();
      const next = [{ ...hl, id: `hl-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now }, ...prev];
      writeJson(HIGHLIGHTS_KEY, next);
      return next;
    });
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id);
      writeJson(HIGHLIGHTS_KEY, next);
      return next;
    });
  }, []);

  return {
    hydrated,
    bookmarks,
    favorites,
    notes,
    history,
    highlights,
    // bookmarks
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    // favorites
    isFavorite,
    toggleFavorite,
    removeFavorite,
    // notes
    getNotes,
    addNote,
    updateNote,
    removeNote,
    // history
    addHistory,
    clearHistory,
    // highlights
    getHighlights,
    addHighlight,
    removeHighlight,
  };
}
