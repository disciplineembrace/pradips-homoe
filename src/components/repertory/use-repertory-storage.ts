/**
 * useRepertoryStorage — localStorage-backed hooks for clipboard, favorites,
 * history, and notes. All keys are namespaced under "pradips-homoe:repertory:".
 */
'use client';
import { useState, useEffect, useCallback } from 'react';

const NS = 'pradips-homoe:repertory:';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    // Broadcast a custom event so other hooks on the same page update too.
    window.dispatchEvent(new CustomEvent('repertory-storage', { detail: { key } }));
  } catch {
    // ignore quota errors
  }
}

export interface ClipboardEntry {
  id: string;          // rubric id
  repertory: string;
  chapter: string;
  title: string;
  remedies: string[];
  addedAt: number;
}

export interface FavoriteEntry {
  id: string;
  repertory: string;
  chapter: string;
  title: string;
  addedAt: number;
}

export interface HistoryEntry {
  id: string;
  repertory: string;
  chapter: string;
  title: string;
  visitedAt: number;
}

export interface NoteEntry {
  id: string;          // rubric id
  text: string;
  updatedAt: number;
}

export function useClipboard() {
  const [items, setItems] = useState<ClipboardEntry[]>([]);
  useEffect(() => {
    setItems(read<ClipboardEntry[]>('clipboard', []));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === 'clipboard') setItems(read<ClipboardEntry[]>('clipboard', []));
    };
    window.addEventListener('repertory-storage', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('repertory-storage', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const add = useCallback((entry: Omit<ClipboardEntry, 'addedAt'>) => {
    const cur = read<ClipboardEntry[]>('clipboard', []);
    if (cur.some(e => e.id === entry.id)) return;
    const next = [{ ...entry, addedAt: Date.now() }, ...cur].slice(0, 100);
    write('clipboard', next);
  }, []);

  const remove = useCallback((id: string) => {
    const cur = read<ClipboardEntry[]>('clipboard', []);
    write('clipboard', cur.filter(e => e.id !== id));
  }, []);

  const clear = useCallback(() => write('clipboard', []), []);

  return { items, add, remove, clear };
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteEntry[]>([]);
  useEffect(() => {
    setItems(read<FavoriteEntry[]>('favorites', []));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === 'favorites') setItems(read<FavoriteEntry[]>('favorites', []));
    };
    window.addEventListener('repertory-storage', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('repertory-storage', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const isFav = useCallback((id: string) => {
    return read<FavoriteEntry[]>('favorites', []).some(e => e.id === id);
  }, []);

  const toggle = useCallback((entry: Omit<FavoriteEntry, 'addedAt'>) => {
    const cur = read<FavoriteEntry[]>('favorites', []);
    if (cur.some(e => e.id === entry.id)) {
      write('favorites', cur.filter(e => e.id !== entry.id));
    } else {
      write('favorites', [{ ...entry, addedAt: Date.now() }, ...cur].slice(0, 500));
    }
  }, []);

  const remove = useCallback((id: string) => {
    const cur = read<FavoriteEntry[]>('favorites', []);
    write('favorites', cur.filter(e => e.id !== id));
  }, []);

  return { items, isFav, toggle, remove };
}

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    setItems(read<HistoryEntry[]>('history', []));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === 'history') setItems(read<HistoryEntry[]>('history', []));
    };
    window.addEventListener('repertory-storage', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('repertory-storage', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const push = useCallback((entry: Omit<HistoryEntry, 'visitedAt'>) => {
    const cur = read<HistoryEntry[]>('history', []);
    // De-dupe by id — move to front
    const filtered = cur.filter(e => e.id !== entry.id);
    const next = [{ ...entry, visitedAt: Date.now() }, ...filtered].slice(0, 100);
    write('history', next);
  }, []);

  const clear = useCallback(() => write('history', []), []);

  return { items, push, clear };
}

export function useNotes(rubricId: string | null) {
  const [text, setText] = useState('');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!rubricId) {
      setText('');
      setUpdatedAt(null);
      return;
    }
    const all = read<Record<string, NoteEntry>>('notes', {});
    const entry = all[rubricId];
    if (entry) {
      setText(entry.text);
      setUpdatedAt(entry.updatedAt);
    } else {
      setText('');
      setUpdatedAt(null);
    }
  }, [rubricId]);

  const save = useCallback((newText: string) => {
    if (!rubricId) return;
    const all = read<Record<string, NoteEntry>>('notes', {});
    all[rubricId] = { id: rubricId, text: newText, updatedAt: Date.now() };
    write('notes', all);
    setUpdatedAt(all[rubricId].updatedAt);
  }, [rubricId]);

  return { text, setText, save, updatedAt };
}
