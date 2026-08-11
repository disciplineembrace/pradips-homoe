'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * useBrowseState — Reusable navigation state persistence hook.
 *
 * Preserves browse context (filters, search, pagination, scroll) across
 * list → detail → back navigation flows.
 *
 * Strategy:
 * - URL query params for shareable filter state (author, letter, page, q)
 * - sessionStorage for scroll position (per route)
 * - Reads initial state from URL on mount (direct links work)
 * - Updates URL when filters change (shareable, back-button friendly)
 * - Does NOT create duplicate history entries (uses replaceState)
 *
 * Usage:
 * const { state, setState, restoreScroll } = useBrowseState('materia-medica', {
 *   author: 'All',
 *   letter: '',
 *   q: '',
 *   page: 1,
 * });
 */
export function useBrowseState<T extends Record<string, string | number | boolean>>(
  sectionKey: string,
  defaults: T
): {
  state: T;
  setState: (partial: Partial<T>) => void;
  restoreScroll: () => void;
  saveScroll: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollKey = `browse-scroll-${sectionKey}`;
  const hasRestoredRef = useRef(false);

  // Read initial state from URL query params
  const getInitialState = (): T => {
    const state = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const urlValue = searchParams.get(key as string);
      if (urlValue !== null) {
        const defaultVal = defaults[key];
        if (typeof defaultVal === 'number') {
          const num = parseInt(urlValue, 10);
          if (!isNaN(num)) state[key] = num as T[keyof T];
        } else if (typeof defaultVal === 'boolean') {
          state[key] = (urlValue === 'true') as T[keyof T];
        } else {
          state[key] = urlValue as T[keyof T];
        }
      }
    }
    return state;
  };

  const [state, setStateInternal] = useState<T>(getInitialState);

  // Update state + URL (using replaceState to avoid history pollution)
  const setState = useCallback((partial: Partial<T>) => {
    setStateInternal(prev => {
      const next = { ...prev, ...partial };
      // Update URL query params silently (no new history entry)
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        const defaultVal = defaults[key as keyof T];
        if (value !== '' && value !== defaultVal && value != null) {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      // Use replaceState to avoid polluting browser history
      window.history.replaceState(null, '', newUrl);
      return next;
    });
  }, [pathname, defaults]);

  // Save scroll position to sessionStorage
  const saveScroll = useCallback(() => {
    try {
      sessionStorage.setItem(scrollKey, String(window.scrollY));
    } catch (e) {
      // sessionStorage might be unavailable (private browsing)
    }
  }, [scrollKey]);

  // Restore scroll position from sessionStorage
  const restoreScroll = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(scrollKey);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            window.scrollTo(0, y);
          });
          // Clear after restoring (one-time restore per navigation)
          sessionStorage.removeItem(scrollKey);
        }
      }
    } catch (e) {
      // sessionStorage unavailable
    }
  }, [scrollKey]);

  // Save scroll position before navigating away (on unmount)
  useEffect(() => {
    const handleBeforeUnload = () => saveScroll();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      saveScroll();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveScroll]);

  // Check if we're returning from a detail page (navigation type = back_forward)
  // and restore scroll if so
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry && navEntry.type === 'back_forward') {
      // Small delay to let content render before restoring scroll
      setTimeout(() => restoreScroll(), 100);
    }
  }, [restoreScroll]);

  return { state, setState, restoreScroll, saveScroll };
}
