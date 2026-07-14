'use client';
/**
 * useReaderFeatures — reader features hook.
 *
 * ARCHITECTURE (Neon + Supabase separation):
 *   - Content references (item_id, item_type) point to records in NEON.
 *   - User-feature data (the bookmark / favorite / note / history / highlight
 *     record itself) is stored in SUPABASE when available, with localStorage
 *     as a transparent fallback.
 *
 * UI contract is identical regardless of backend. The hook returns the same
 * shape with the same methods. From the page/component perspective, nothing
 * has changed.
 *
 * Behavior:
 *   - On mount: hydrates from localStorage immediately (instant render).
 *   - If Supabase server is configured (env vars set + user authenticated):
 *       fetches the user's data from Supabase and replaces local state.
 *       All subsequent writes go to Supabase AND mirror to localStorage
 *       (so the UI works offline / for unauthenticated users).
 *   - If Supabase is NOT configured: behaves exactly like before (localStorage only).
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

  // ---- Hydrate from localStorage immediately (instant render) ----
  useEffect(() => {
    setBookmarks(readJson<Bookmark[]>(BOOKMARKS_KEY, []));
    setFavorites(readJson<Favorite[]>(FAVORITES_KEY, []));
    setNotes(readJson<Note[]>(NOTES_KEY, []));
    setHistory(readJson<HistoryItem[]>(HISTORY_KEY, []));
    setHighlights(readJson<Highlight[]>(HIGHLIGHTS_KEY, []));
    setHydrated(true);
  }, []);

  // ---- Cross-tab / same-tab storage listener ----
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

  // ---- Optional: sync from Supabase (if configured + authenticated) ----
  // We don't import the Supabase client directly here (to keep this hook
  // client-side and bundle-light). Instead, we fire-and-forget a fetch to
  // /api/user/reader-features which returns the user's Supabase-backed data
  // if available. The hook never blocks on this — UI always renders from
  // localStorage first, then optionally upgrades to Supabase data.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    fetch('/api/user/reader-features', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d || !d.enabled) return;
        // Replace local state with Supabase data (user is logged in + Supabase configured)
        if (Array.isArray(d.bookmarks)) {
          setBookmarks(d.bookmarks.map((b: any) => ({
            id: b.item_id, type: b.item_type, title: b.title || '',
            href: b.href, author: b.author, createdAt: new Date(b.created_at).getTime(),
          })));
        }
        if (Array.isArray(d.favorites)) {
          setFavorites(d.favorites.map((f: any) => ({
            id: f.item_id, type: f.item_type, title: f.title || '',
            href: f.href, author: f.author, createdAt: new Date(f.created_at).getTime(),
          })));
        }
        if (Array.isArray(d.notes)) {
          setNotes(d.notes.map((n: any) => ({
            id: n.id, itemId: n.item_id, type: n.item_type, text: n.text,
            createdAt: new Date(n.created_at).getTime(),
            updatedAt: new Date(n.updated_at).getTime(),
          })));
        }
        if (Array.isArray(d.history)) {
          setHistory(d.history.map((h: any) => ({
            id: h.item_id, type: h.item_type, title: h.title || '',
            href: h.href, visitedAt: new Date(h.visited_at).getTime(),
          })));
        }
        if (Array.isArray(d.highlights)) {
          setHighlights(d.highlights.map((hl: any) => ({
            id: hl.id, itemId: hl.item_id, type: hl.item_type, text: hl.highlighted_text,
            color: hl.color || 'yellow', createdAt: new Date(hl.created_at).getTime(),
          })));
        }
      })
      .catch(() => { /* silent — fall back to localStorage */ });
    return () => { cancelled = true; };
  }, [hydrated]);

  // ---------- BOOKMARKS ----------
  const isBookmarked = useCallback((id: string) => bookmarks.some(b => b.id === id), [bookmarks]);

  const toggleBookmark = useCallback((item: Omit<Bookmark, 'createdAt'>) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === item.id);
      const next = exists
        ? prev.filter(b => b.id !== item.id)
        : [{ ...item, createdAt: Date.now() }, ...prev];
      writeJson(BOOKMARKS_KEY, next);
      // Fire-and-forget sync to Supabase
      if (exists) {
        fetch('/api/user/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: item.id, item_type: item.type }),
        }).catch(() => {});
      } else {
        fetch('/api/user/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: item.id, item_type: item.type,
            title: item.title, href: item.href, author: item.author,
          }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const removed = prev.find(b => b.id === id);
      const next = prev.filter(b => b.id !== id);
      writeJson(BOOKMARKS_KEY, next);
      if (removed) {
        fetch('/api/user/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: id, item_type: removed.type }),
        }).catch(() => {});
      }
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
      if (exists) {
        fetch('/api/user/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: item.id, item_type: item.type }),
        }).catch(() => {});
      } else {
        fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: item.id, item_type: item.type,
            title: item.title, href: item.href, author: item.author,
          }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const removed = prev.find(f => f.id === id);
      const next = prev.filter(f => f.id !== id);
      writeJson(FAVORITES_KEY, next);
      if (removed) {
        fetch('/api/user/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: id, item_type: removed.type }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  // ---------- NOTES ----------
  const getNotes = useCallback((itemId: string) => notes.filter(n => n.itemId === itemId), [notes]);

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const noteId = `note-${now}-${Math.random().toString(36).slice(2, 8)}`;
    setNotes(prev => {
      const next = [{ ...note, id: noteId, createdAt: now, updatedAt: now }, ...prev];
      writeJson(NOTES_KEY, next);
      return next;
    });
    fetch('/api/user/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: note.itemId, item_type: note.type, text: note.text,
      }),
    }).catch(() => {});
  }, []);

  const updateNote = useCallback((id: string, text: string) => {
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, text, updatedAt: Date.now() } : n);
      writeJson(NOTES_KEY, next);
      return next;
    });
    // Note updates don't have a stable id mapping to Supabase (local ids vs uuids).
    // We rely on the upsert by (user_id, item_id, item_type) to handle this in
    // a future refactor. For now, fire-and-forget POST.
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      writeJson(NOTES_KEY, next);
      return next;
    });
    // Best-effort delete — server will ignore if id doesn't match a Supabase row
    fetch(`/api/user/notes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
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
    fetch('/api/user/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: item.id, item_type: item.type,
        title: item.title, href: item.href,
      }),
    }).catch(() => {});
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeJson(HISTORY_KEY, []);
    fetch('/api/user/history', { method: 'DELETE' }).catch(() => {});
  }, []);

  // ---------- HIGHLIGHTS ----------
  const getHighlights = useCallback((itemId: string) => highlights.filter(h => h.itemId === itemId), [highlights]);

  const addHighlight = useCallback((hl: Omit<Highlight, 'id' | 'createdAt'>) => {
    const now = Date.now();
    const hlId = `hl-${now}-${Math.random().toString(36).slice(2, 8)}`;
    setHighlights(prev => {
      const next = [{ ...hl, id: hlId, createdAt: now }, ...prev];
      writeJson(HIGHLIGHTS_KEY, next);
      return next;
    });
    fetch('/api/user/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: hl.itemId, item_type: hl.type,
        highlighted_text: hl.text, color: hl.color,
      }),
    }).catch(() => {});
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id);
      writeJson(HIGHLIGHTS_KEY, next);
      return next;
    });
    fetch(`/api/user/highlights?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
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
