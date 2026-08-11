'use client';
/**
 * HighlightToolbar — floating toolbar that appears when user selects text
 * inside a remedy article. Provides Yellow/Green/Pink highlight buttons,
 * Note, Copy, and Bookmark actions.
 *
 * Usage:
 *   <HighlightToolbar remedyId="..." articleRef={articleRef} onHighlightChange={() => {...}} />
 *
 * The toolbar auto-positions near the selection and hides when no selection.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  addHighlight,
  HIGHLIGHT_STYLES,
  type HighlightColor,
} from '@/lib/user-highlights';

interface Props {
  remedyId: string;
  articleRef: React.RefObject<HTMLElement | null>;
  onHighlightChange?: () => void;
}

export function HighlightToolbar({ remedyId, articleRef, onHighlightChange }: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Check if selection is inside the article
  const isSelectionInArticle = useCallback((): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const article = articleRef.current;
    if (!article) return false;
    return article.contains(range.commonAncestorContainer);
  }, [articleRef]);

  // Get selection text and offsets relative to article
  const getSelectionInfo = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const article = articleRef.current;
    if (!article) return null;
    if (!article.contains(range.commonAncestorContainer)) return null;

    const text = sel.toString().trim();
    if (text.length < 2) return null;

    // Calculate character offsets within article textContent
    const fullText = article.textContent || '';
    // Use the selection's start offset within the article
    // This is a simplified approach — for production we'd use Range APIs
    const preRange = document.createRange();
    preRange.selectNodeContents(article);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + text.length;

    return { text, startOffset, endOffset };
  }, [articleRef]);

  // Position toolbar near selection
  const positionToolbar = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setVisible(false);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setVisible(false);
      return;
    }

    const toolbar = toolbarRef.current;
    const toolbarWidth = 360;
    const toolbarHeight = 44;

    let left = rect.left + rect.width / 2 - toolbarWidth / 2;
    let top = rect.top - toolbarHeight - 8;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + toolbarWidth > window.innerWidth - 8) left = window.innerWidth - toolbarWidth - 8;
    if (top < 8) top = rect.bottom + 8; // show below if no room above

    setPosition({ top, left });
    setVisible(true);
  }, []);

  // Listen for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      if (showNoteInput) return; // don't hide while typing note
      const sel = window.getSelection();
      if (!sel || sel.toString().trim().length < 2) {
        setVisible(false);
        return;
      }
      if (!isSelectionInArticle()) {
        setVisible(false);
        return;
      }
      setSelectedText(sel.toString().trim());
      // Small delay to let selection stabilize
      setTimeout(positionToolbar, 10);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [isSelectionInArticle, positionToolbar, showNoteInput]);

  // Handle highlight button click
  const handleHighlight = useCallback((color: HighlightColor) => {
    const info = getSelectionInfo();
    if (!info) return;

    addHighlight({
      remedyId,
      text: info.text,
      color,
      startOffset: info.startOffset,
      endOffset: info.endOffset,
    });

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setVisible(false);
    onHighlightChange?.();

    // Force re-render of highlights by dispatching a custom event
    window.dispatchEvent(new CustomEvent('mm-highlight-added'));
  }, [getSelectionInfo, remedyId, onHighlightChange]);

  // Handle note
  const handleAddNote = useCallback(() => {
    const info = getSelectionInfo();
    if (!info) return;
    setSelectedText(info.text);
    setShowNoteInput(true);
  }, [getSelectionInfo]);

  const handleSaveNote = useCallback(() => {
    if (!noteText.trim()) {
      setShowNoteInput(false);
      return;
    }
    const info = getSelectionInfo();
    if (!info) {
      // Use stored selectedText info — but we need offsets
      setShowNoteInput(false);
      return;
    }
    addHighlight({
      remedyId,
      text: info.text,
      color: 'yellow', // notes default to yellow
      note: noteText.trim(),
      startOffset: info.startOffset,
      endOffset: info.endOffset,
    });
    setNoteText('');
    setShowNoteInput(false);
    window.getSelection()?.removeAllRanges();
    setVisible(false);
    onHighlightChange?.();
    window.dispatchEvent(new CustomEvent('mm-highlight-added'));
  }, [noteText, remedyId, getSelectionInfo, onHighlightChange]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    const info = getSelectionInfo();
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.text);
      // Brief feedback
      const btn = toolbarRef.current?.querySelector('[data-action="copy"]') as HTMLButtonElement;
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(() => { btn.textContent = orig; }, 1200);
      }
    } catch {}
  }, [getSelectionInfo]);

  // Handle bookmark (delegates to existing reader features hook via custom event)
  const handleBookmark = useCallback(() => {
    window.dispatchEvent(new CustomEvent('mm-bookmark-remedy', { detail: { remedyId } }));
    const btn = toolbarRef.current?.querySelector('[data-action="bookmark"]') as HTMLButtonElement;
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Saved';
      setTimeout(() => { btn.textContent = orig; }, 1200);
    }
  }, [remedyId]);

  if (!visible && !showNoteInput) return null;

  return (
    <>
      {/* Floating toolbar */}
      <div
        ref={toolbarRef}
        className="fixed z-50 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-stone-200 px-1.5 py-1"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          maxWidth: '360px',
        }}
        onMouseDown={(e) => e.preventDefault()} // prevent losing selection
      >
        {showNoteInput ? (
          <div className="flex items-center gap-1.5 px-1">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type a note..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNote();
                if (e.key === 'Escape') { setShowNoteInput(false); setNoteText(''); }
              }}
              className="text-xs px-2 py-1 border border-stone-300 rounded w-40 focus:outline-none focus:border-amber-600"
            />
            <button
              onClick={handleSaveNote}
              className="text-xs px-2 py-1 bg-amber-700 text-white rounded font-semibold hover:bg-amber-600"
            >
              Save
            </button>
            <button
              onClick={() => { setShowNoteInput(false); setNoteText(''); }}
              className="text-xs px-1.5 py-1 text-stone-500 hover:text-stone-700"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            {/* Highlight color buttons */}
            <button
              onClick={() => handleHighlight('yellow')}
              title="Yellow highlight — keynote"
              className="w-7 h-7 rounded border border-yellow-300 bg-yellow-200 hover:bg-yellow-300 transition-colors flex-shrink-0"
            />
            <button
              onClick={() => handleHighlight('green')}
              title="Green highlight — important"
              className="w-7 h-7 rounded border border-green-300 bg-green-200 hover:bg-green-300 transition-colors flex-shrink-0"
            />
            <button
              onClick={() => handleHighlight('pink')}
              title="Pink highlight — striking"
              className="w-7 h-7 rounded border border-pink-300 bg-pink-200 hover:bg-pink-300 transition-colors flex-shrink-0"
            />
            <div className="w-px h-5 bg-stone-300 mx-0.5" />
            {/* Note */}
            <button
              onClick={handleAddNote}
              title="Add note"
              className="text-xs px-2 py-1 text-stone-600 hover:bg-stone-100 rounded font-medium flex-shrink-0"
            >
              📝
            </button>
            {/* Copy */}
            <button
              data-action="copy"
              onClick={handleCopy}
              title="Copy"
              className="text-xs px-2 py-1 text-stone-600 hover:bg-stone-100 rounded font-medium flex-shrink-0"
            >
              Copy
            </button>
            {/* Bookmark */}
            <button
              data-action="bookmark"
              onClick={handleBookmark}
              title="Bookmark remedy"
              className="text-xs px-2 py-1 text-stone-600 hover:bg-stone-100 rounded font-medium flex-shrink-0"
            >
              🔖
            </button>
          </>
        )}
      </div>
    </>
  );
}
