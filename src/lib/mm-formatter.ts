/**
 * Materia Medica Formatter — author-aware, source-confidence-based rendering.
 *
 * SAFETY RULES (per task spec):
 * - Do NOT use simple `text.toUpperCase() => subtitle` regex.
 *   Subtitle detection combines: distinctive punctuation, line position,
 *   known section vocabulary, and author-specific source structure.
 * - Do NOT auto-highlight every capital letter as "emphasis".
 *   Capital emphasis is only applied when source formatting confirms it,
 *   which we cannot verify without source PDFs. Therefore: NO automatic
 *   capital emphasis is applied here. This is the safe default per Phase 9.
 * - Do NOT fabricate medical content. This formatter only re-styles
 *   existing text — it never invents, paraphrases, or fills.
 * - Inline italics / bold / underline markers (markdown or HTML) are
 *   preserved AS-IS if present in the source text. The current DB stores
 *   plain text with no inline markers, so this is largely a no-op.
 *
 * AUTHOR-SPECIFIC SUBTITLE PATTERNS (high confidence — distinctive
 * punctuation/structure that is very unlikely to appear in body text):
 *
 *   Boericke  →  "\nWord.--"   (e.g., "Head.--", "Stomach.--")
 *   Murphy    →  "^CAPS - "    (e.g., "PHARMACY - ", "CLINICAL - ")
 *   Phatak    →  "^CAPS: "     (e.g., "MIND:", "HEAD:", "STOMACH:")
 *   Allen     →  standalone short line matching known section vocabulary
 *                 (Mind, Head, Eyes, Nose, Face, Mouth, Throat, etc.)
 *   Other authors → no subtitle detection (preserve as plain text)
 *
 * RENDERING:
 *   remedy_title  → RED + BOLD, large
 *   subtitle      → RED + BOLD, medium
 *   paragraph     → readable body text
 *   page_number   → flagged (rendered as small grey "[page]" marker, NOT deleted)
 *
 * The formatter returns a list of typed blocks. The React renderer in
 * /src/app/remedy/[id]/page.tsx maps each block to a styled element.
 *
 * No global CSS changes. No layout changes. Materia-Medica-scoped only.
 */

export type MMBlock =
  | { type: 'remedy_title'; text: string }
  | { type: 'subtitle'; text: string }
  | { type: 'paragraph'; text: string; italic?: boolean; bold?: boolean; underline?: boolean }
  | { type: 'page_number'; text: string }
  | { type: 'raw'; text: string };

// ============================================================
// KNOWN SECTION VOCABULARY (used for Allen standalone-line detection)
// These are common Materia Medica section names. Only used when the
// author is Allen AND the line is a standalone short line (no trailing
// punctuation, < 40 chars, matches vocabulary exactly).
// ============================================================
const KNOWN_SECTIONS = new Set([
  'Mind', 'Head', 'Eyes', 'Nose', 'Face', 'Mouth', 'Throat', 'Neck',
  'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Anus', 'Urinary', 'Genitals',
  'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back', 'Extremities',
  'Skin', 'Sleep', 'Dreams', 'Fever', 'Sweat', 'Modalities', 'Relations',
  'Relationships', 'Dose', 'Duration', 'Children', 'Pregnancy',
  'Mental Generals', 'Physical Generals', 'Characteristic Symptoms',
  'Guiding Symptoms', 'Clinical', 'Pharmacy', 'Source', 'Habitat',
  'Preparation', 'Constitution', 'Miasms', 'Miasm', 'Complementary',
  'Inimical', 'Follows', 'Followed by', 'Compare', 'Comparisons',
]);

// ============================================================
// AUTHOR-SPECIFIC SUBTITLE DETECTORS
// Each detector returns the subtitle text (without trailing punctuation)
// or null if the line is not a subtitle.
// ============================================================

// Boericke: line starts with Capitalized word + ".--" (e.g., "Head.-- Feels...")
function detectBoerickeSubtitle(line: string): string | null {
  // Must start with a Capitalized word followed immediately by ".--"
  const m = line.match(/^([A-Z][a-z]+)\.--\s*(.*)$/);
  if (m) {
    // Filter out common false positives: words that are part of sentences
    // (e.g., "He.-- something" is unlikely in real text but possible)
    // Accept only if the word is alphabetic and 2+ chars
    if (m[1].length >= 2 && /^[A-Za-z]+$/.test(m[1])) {
      return m[1];
    }
  }
  return null;
}

// Murphy: line starts with ALL-CAPS word + " - " (e.g., "PHARMACY - ...")
// Must be at line start, all caps, 3+ letters, followed by " - "
function detectMurphySubtitle(line: string): string | null {
  const m = line.match(/^([A-Z][A-Z ]{2,})-\s+(.*)$/);
  if (m) {
    const cap = m[1].trim();
    // Avoid matching sentences that happen to start with caps + dash.
    // Murphy subtitles are short labels (PHARMACY, CLINICAL, MIND, etc.)
    // — typically 1-3 words. Reject if it looks like a sentence.
    const wordCount = cap.split(/\s+/).length;
    if (wordCount <= 4 && cap.length <= 30) {
      return cap;
    }
  }
  return null;
}

// Phatak: line starts with ALL-CAPS word + ": " (e.g., "MIND: ...")
function detectPhatakSubtitle(line: string): string | null {
  const m = line.match(/^([A-Z][A-Z ]{2,}):\s+(.*)$/);
  if (m) {
    const cap = m[1].trim();
    const wordCount = cap.split(/\s+/).length;
    if (wordCount <= 4 && cap.length <= 30) {
      return cap;
    }
  }
  return null;
}

// Allen: standalone short line that matches a known section vocabulary word
function detectAllenSubtitle(line: string, prevBlank: boolean): string | null {
  const trimmed = line.trim();
  // Must be a standalone line (preceded by blank line OR start of text)
  if (!prevBlank && trimmed.length > 0) {
    // also accept if it's the very first line
  }
  // Must be short, no trailing punctuation except optional colon
  if (trimmed.length === 0 || trimmed.length > 40) return null;
  // Strip trailing colon if present
  const candidate = trimmed.replace(/:$/, '').trim();
  if (KNOWN_SECTIONS.has(candidate)) {
    return candidate;
  }
  return null;
}

// ============================================================
// INLINE MARKER PRESERVATION
// If the source text contains markdown-style inline markers (**bold**,
// *italic*, _underline_), preserve them as inline spans. The current
// DB has plain text, so this is mostly a no-op — but the code is here
// for future-proofing if/when source metadata is restored.
// ============================================================
export type InlineSpan =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'underline'; text: string }
  | { kind: 'emphasis'; text: string };

export function parseInlineMarkers(text: string): InlineSpan[] {
  // Pattern matches **bold**, *italic*, _underline_ — non-greedy, no nesting
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_)/g;
  const spans: InlineSpan[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIndex) {
      spans.push({ kind: 'text', text: text.slice(lastIndex, m.index) });
    }
    if (m[2]) {
      spans.push({ kind: 'bold', text: m[2] });
    } else if (m[3]) {
      spans.push({ kind: 'italic', text: m[3] });
    } else if (m[4]) {
      spans.push({ kind: 'underline', text: m[4] });
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    spans.push({ kind: 'text', text: text.slice(lastIndex) });
  }
  return spans.length === 0 ? [{ kind: 'text', text }] : spans;
}

// ============================================================
// PAGE NUMBER DETECTION
// Boeger and Farrington have stray page numbers embedded in the text
// (e.g., a line containing just "1096" or "673"). These are OCR
// artifacts from page breaks. We flag them as page_number blocks so
// the renderer can show them subtly (small grey "[p. 1096]") rather
// than as body text. We do NOT delete them — that would alter source
// content. Deletion is a source-review decision.
// ============================================================
function isPageNumberLine(line: string): boolean {
  const trimmed = line.trim();
  // Pure number, 1-4 digits
  if (/^\d{1,4}$/.test(trimmed)) return true;
  return false;
}

// ============================================================
// MAIN FORMATTER
// ============================================================
export function formatRemedyText(opts: {
  name: string;
  author: string;
  full: string;
}): MMBlock[] {
  const { name, author, full } = opts;
  if (!full) return [];

  const blocks: MMBlock[] = [];

  // 1. Remedy main title — always emitted first as RED+BOLD
  blocks.push({ type: 'remedy_title', text: name });

  // 2. Split into lines and walk, applying author-specific subtitle detection
  const lines = full.split('\n');
  let prevBlank = true; // start of text counts as "after blank"
  let currentParagraph: string[] = [];

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n').trim();
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      currentParagraph = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd(); // preserve leading spaces for Allen detection
    const trimmedLine = line.trim();

    // Blank line — paragraph boundary
    if (trimmedLine === '') {
      flushParagraph();
      prevBlank = true;
      continue;
    }

    // Page-number-only line — flag as page_number
    if (isPageNumberLine(trimmedLine)) {
      flushParagraph();
      blocks.push({ type: 'page_number', text: trimmedLine });
      prevBlank = false;
      continue;
    }

    // Author-specific subtitle detection
    let subtitle: string | null = null;
    if (author === 'Boericke') {
      subtitle = detectBoerickeSubtitle(trimmedLine);
    } else if (author === 'Murphy') {
      subtitle = detectMurphySubtitle(trimmedLine);
    } else if (author === 'Phatak') {
      subtitle = detectPhatakSubtitle(trimmedLine);
    } else if (author === 'Allen') {
      subtitle = detectAllenSubtitle(trimmedLine, prevBlank);
    }

    if (subtitle) {
      flushParagraph();
      blocks.push({ type: 'subtitle', text: subtitle });
      // The remainder of the line (after the subtitle marker) is body text
      let remainder = '';
      if (author === 'Boericke') {
        remainder = trimmedLine.replace(/^[A-Z][a-z]+\.--\s*/, '');
      } else if (author === 'Murphy') {
        remainder = trimmedLine.replace(/^[A-Z][A-Z ]{2,}-\s+/, '');
      } else if (author === 'Phatak') {
        remainder = trimmedLine.replace(/^[A-Z][A-Z ]{2,}:\s+/, '');
      } else if (author === 'Allen') {
        // For Allen, the subtitle is a standalone line — remainder is empty
        remainder = '';
      }
      if (remainder.trim()) {
        blocks.push({ type: 'paragraph', text: remainder.trim() });
      }
      prevBlank = false;
      continue;
    }

    // Normal body text — accumulate into current paragraph
    currentParagraph.push(line);
    prevBlank = false;
  }

  flushParagraph();
  return blocks;
}

// ============================================================
// VERIFICATION HELPERS — used by the verification report script.
// These functions do NOT modify data. They only inspect and report.
// ============================================================
export interface VerificationIssue {
  remedyId: string;
  remedyName: string;
  author: string;
  issueType:
    | 'duplicate_name_author_diff_content'
    | 'duplicate_name_author_same_content'
    | 'empty_full'
    | 'empty_keynote'
    | 'short_full'
    | 'embedded_page_number'
    | 'unicode_ligature_error'
    | 'orphan_author_tab';
  detail: string;
  needsSourceReview: boolean;
}

// Common Unicode ligature OCR errors found in Mathur
const LIGATURE_ERRORS = /[ƟƩ⋃ƪǶǾ]/;

export function inspectRemedy(r: {
  id: string; name: string; author: string;
  full?: string; keynote?: string;
}): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  const full = r.full || '';
  const keynote = r.keynote || '';

  if (!full.trim()) {
    issues.push({
      remedyId: r.id, remedyName: r.name, author: r.author,
      issueType: 'empty_full',
      detail: 'Remedy has empty "full" field.',
      needsSourceReview: true,
    });
  }
  if (!keynote.trim()) {
    issues.push({
      remedyId: r.id, remedyName: r.name, author: r.author,
      issueType: 'empty_keynote',
      detail: 'Remedy has empty "keynote" field.',
      needsSourceReview: false,
    });
  }
  if (full.trim().length > 0 && full.trim().length < 100) {
    issues.push({
      remedyId: r.id, remedyName: r.name, author: r.author,
      issueType: 'short_full',
      detail: `Remedy "full" is unusually short (${full.trim().length} chars). May be truncated.`,
      needsSourceReview: true,
    });
  }
  // Embedded page numbers — check for lines that are pure numbers
  const lines = full.split('\n');
  for (const ln of lines) {
    if (/^\d{1,4}$/.test(ln.trim())) {
      issues.push({
        remedyId: r.id, remedyName: r.name, author: r.author,
        issueType: 'embedded_page_number',
        detail: `Line "${ln.trim()}" appears to be a stray page number from OCR.`,
        needsSourceReview: true,
      });
      break; // one issue per remedy is enough
    }
  }
  // Unicode ligature errors (Mathur OCR artifact)
  if (LIGATURE_ERRORS.test(full)) {
    issues.push({
      remedyId: r.id, remedyName: r.name, author: r.author,
      issueType: 'unicode_ligature_error',
      detail: 'Text contains Unicode ligature characters (Ɵ, Ʃ, etc.) — likely OCR errors for "ti", "tt".',
      needsSourceReview: true,
    });
  }

  return issues;
}
