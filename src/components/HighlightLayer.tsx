'use client';
/**
 * HighlightLayer — renders user highlights as colored marks over the article text.
 *
 * This is a SIMPLIFIED implementation that re-renders the article's text content
 * with highlight spans applied. For a production system with complex DOM
 * structures, a more sophisticated Range-based highlighter would be needed
 * (e.g., Rangy library). This implementation works for the plain-text-heavy
 * Materia Medica content where each paragraph is a text node.
 *
 * The component listens for 'mm-highlight-added' custom events to re-render
 * when new highlights are added.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHighlightsForRemedy,
  removeHighlight,
  updateHighlightNote,
  HIGHLIGHT_STYLES,
  HIGHLIGHT_BORDER,
  type UserHighlight,
  type HighlightColor,
} from '@/lib/user-highlights';

interface Props {
  remedyId: string;
  children: React.ReactNode;
}

interface HighlightSegment {
  highlight: UserHighlight;
  text: string;
}

export function HighlightLayer({ remedyId, children }: Props) {
  const [highlights, setHighlights] = useState<UserHighlight[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [noteEditText, setNoteEditText] = useState('');
  const articleRef = useRef<HTMLElement>(null);

  // Load highlights
  const loadHighlights = useCallback(() => {
    setHighlights(getHighlightsForRemedy(remedyId));
  }, [remedyId]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights, refreshKey]);

  // Listen for new highlights
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener('mm-highlight-added', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('mm-highlight-added', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Apply highlights to text by splitting into segments
  // This is a text-based approach: we walk through all text nodes in the article
  // and wrap highlighted ranges in <mark> elements.
  const applyHighlightsToText = useCallback((text: string, globalOffset: number): React.ReactNode => {
    if (!highlights.length || !text) return text;

    // Find highlights that overlap this text segment
    const textEnd = globalOffset + text.length;
    const relevant = highlights.filter(
      h => h.startOffset < textEnd && h.endOffset > globalOffset
    );

    if (relevant.length === 0) return text;

    // Build segments
    const segments: React.ReactNode[] = [];
    let cursor = 0; // local cursor within this text

    // Sort by start offset
    const sorted = [...relevant].sort((a, b) => a.startOffset - b.startOffset);

    for (const h of sorted) {
      const localStart = Math.max(0, h.startOffset - globalOffset);
      const localEnd = Math.min(text.length, h.endOffset - globalOffset);

      if (localStart > cursor) {
        segments.push(text.slice(cursor, localStart));
      }

      const highlightText = text.slice(localStart, localEnd);
      segments.push(
        <mark
          key={h.id}
          className={`${HIGHLIGHT_STYLES[h.color]} ${HIGHLIGHT_BORDER[h.color]} rounded px-0.5 cursor-pointer relative group`}
          title={h.note || `${h.color} highlight — click to view/remove`}
          onClick={(e) => {
            e.stopPropagation();
            if (h.note) {
              setActiveNote(activeNote === h.id ? null : h.id);
              setNoteEditText(h.note);
            } else {
              // No note — offer to remove
              if (confirm(`Remove this ${h.color} highlight?`)) {
                removeHighlight(remedyId, h.id);
                setRefreshKey(k => k + 1);
              }
            }
          }}
        >
          {highlightText}
          {/* Note popup */}
          {h.note && activeNote === h.id && (
            <span
              className="absolute z-40 left-0 top-full mt-1 bg-white border border-stone-300 rounded-lg shadow-lg p-2 min-w-[200px] max-w-[300px] block"
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                value={noteEditText}
                onChange={(e) => setNoteEditText(e.target.value)}
                className="w-full text-xs p-1 border border-stone-200 rounded resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => {
                    updateHighlightNote(remedyId, h.id, noteEditText);
                    setActiveNote(null);
                    setRefreshKey(k => k + 1);
                  }}
                  className="text-xs px-2 py-0.5 bg-amber-700 text-white rounded font-semibold hover:bg-amber-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    removeHighlight(remedyId, h.id);
                    setActiveNote(null);
                    setRefreshKey(k => k + 1);
                  }}
                  className="text-xs px-2 py-0.5 text-red-600 hover:bg-red-50 rounded font-semibold"
                >
                  Delete
                </button>
                <button
                  onClick={() => setActiveNote(null)}
                  className="text-xs px-2 py-0.5 text-stone-500 hover:bg-stone-100 rounded"
                >
                  Close
                </button>
              </div>
            </span>
          )}
        </mark>
      );
      cursor = localEnd;
    }

    if (cursor < text.length) {
      segments.push(text.slice(cursor));
    }

    return <>{segments}</>;
  }, [highlights, activeNote, noteEditText, remedyId]);

  // Recursively process React children to wrap text nodes with highlights
  const processNode = useCallback((node: React.ReactNode, keyPrefix: string, globalOffset: { current: number }): React.ReactNode => {
    if (typeof node === 'string') {
      const result = applyHighlightsToText(node, globalOffset.current);
      globalOffset.current += node.length;
      return result;
    }
    if (typeof node === 'number') {
      const str = String(node);
      const result = applyHighlightsToText(str, globalOffset.current);
      globalOffset.current += str.length;
      return result;
    }
    if (Array.isArray(node)) {
      return node.map((child, i) => processNode(child, `${keyPrefix}-${i}`, globalOffset));
    }
    if (node && typeof node === 'object' && 'props' in node) {
      const el = node as React.ReactElement<any>;
      const props = el.props || {};
      const newChildren = props.children
        ? processNode(props.children, `${keyPrefix}-c`, globalOffset)
        : props.children;
      return {
        ...el,
        props: { ...props, children: newChildren },
      };
    }
    return node;
  }, [applyHighlightsToText]);

  const globalOffset = { current: 0 };
  const processedChildren = processNode(children, 'root', globalOffset);

  return (
    <div ref={articleRef as any} data-remedy-id={remedyId} className="highlight-layer">
      {processedChildren}
    </div>
  );
}
