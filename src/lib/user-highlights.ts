'use client';
/**
 * User Highlight Feature for Materia Medica
 *
 * Provides a floating toolbar that appears when the user selects text inside
 * a remedy article. Supports:
 *   - Yellow highlight (keynote)
 *   - Green highlight (important)
 *   - Pink highlight (striking)
 *   - Note (inline annotation)
 *   - Copy selection
 *   - Bookmark remedy
 *
 * Highlights are persisted per-user in localStorage (keyed by remedy id).
 * System/source highlights are separate and never touched by this module.
 *
 * STORAGE:
 *   localStorage['mm_highlights'] = {
 *     [remedyId]: [
 *       { id, text, color, note, createdAt, xpath }
 *     ]
 *   }
 *
 * NO backend changes. NO global CSS. Scoped to remedy article only.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export type HighlightColor = 'yellow' | 'green' | 'pink';

export interface UserHighlight {
  id: string;
  remedyId: string;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
  // Simple offset-based anchor (char offset within the article's textContent)
  startOffset: number;
  endOffset: number;
}

const STORAGE_KEY = 'mm_highlights';

// ============================================================
// Storage helpers
// ============================================================
function loadAllHighlights(): Record<string, UserHighlight[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAllHighlights(data: Record<string, UserHighlight[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save highlights:', e);
  }
}

export function getHighlightsForRemedy(remedyId: string): UserHighlight[] {
  const all = loadAllHighlights();
  return all[remedyId] || [];
}

export function addHighlight(h: Omit<UserHighlight, 'id' | 'createdAt'>): UserHighlight {
  const all = loadAllHighlights();
  const newH: UserHighlight = {
    ...h,
    id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  if (!all[h.remedyId]) all[h.remedyId] = [];
  all[h.remedyId].push(newH);
  saveAllHighlights(all);
  return newH;
}

export function removeHighlight(remedyId: string, highlightId: string): void {
  const all = loadAllHighlights();
  if (!all[remedyId]) return;
  all[remedyId] = all[remedyId].filter(h => h.id !== highlightId);
  saveAllHighlights(all);
}

export function updateHighlightNote(remedyId: string, highlightId: string, note: string): void {
  const all = loadAllHighlights();
  if (!all[remedyId]) return;
  const h = all[remedyId].find(h => h.id === highlightId);
  if (h) {
    h.note = note;
    saveAllHighlights(all);
  }
}

// ============================================================
// Color → CSS class mapping (soft pastel highlights)
// ============================================================
export const HIGHLIGHT_STYLES: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-100 text-stone-900',
  green: 'bg-green-100 text-stone-900',
  pink: 'bg-pink-100 text-stone-900',
};

export const HIGHLIGHT_BORDER: Record<HighlightColor, string> = {
  yellow: 'border-l-2 border-yellow-400',
  green: 'border-l-2 border-green-400',
  pink: 'border-l-2 border-pink-400',
};
