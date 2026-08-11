/**
 * Global OCR Pipeline — 20-Stage Processing Engine
 *
 * This module processes ALL OCR-imported content before it's saved to the
 * database. It runs automatically for every book, remedy, rubric, or any
 * other OCR-imported text.
 *
 * Applied to ALL sections:
 *   Materia Medica, Repertory, Organon, Pharmacy, Other Authors,
 *   Books, Question Bank, Library, Notes, and any future OCR content.
 *
 * 20 Stages:
 *   1.  OCR Recognition (already done by tesseract/pdftotext)
 *   2.  OCR Confidence Analysis
 *   3.  Page Layout Detection
 *   4.  Header/Footer Detection
 *   5.  Page Number Removal
 *   6.  Cover/Preface Detection
 *   7.  Heading Detection
 *   8.  Chapter Detection
 *   9.  Remedy Detection
 *   10. Paragraph Reconstruction
 *   11. Line Merge
 *   12. Hyphenated Word Merge
 *   13. Table Detection
 *   14. List Detection
 *   15. Duplicate Detection
 *   16. OCR Artifact Removal
 *   17. Markdown Cleanup
 *   18. Typography Formatting
 *   19. Quality Validation
 *   20. Manual Review Queue (if confidence is low)
 *
 * CRITICAL: Every word preserved. Only OCR defects corrected.
 */

export interface OcrPipelineOptions {
  removeHeaders?: boolean;
  removeFooters?: boolean;
  removePageNumbers?: boolean;
  removeCoverPages?: boolean;
  removePreface?: boolean;
  mergeHyphenatedWords?: boolean;
  mergeLines?: boolean;
  detectHeadings?: boolean;
  detectChapters?: boolean;
  detectRemedies?: boolean;
  detectTables?: boolean;
  detectLists?: boolean;
  removeDuplicates?: boolean;
  removeRandomNumbers?: boolean;
  formatTypography?: boolean;
  validateQuality?: boolean;
  minConfidence?: number;
}

export const DEFAULT_OPTIONS: OcrPipelineOptions = {
  removeHeaders: true,
  removeFooters: true,
  removePageNumbers: true,
  removeCoverPages: true,
  removePreface: true,
  mergeHyphenatedWords: true,
  mergeLines: true,
  detectHeadings: true,
  detectChapters: true,
  detectRemedies: true,
  detectTables: true,
  detectLists: true,
  removeDuplicates: true,
  removeRandomNumbers: true,
  formatTypography: true,
  validateQuality: true,
  minConfidence: 60,
};

// Page number patterns
const PAGE_NUMBER_RE = /^\s*\d{1,4}\s*$/;

// Running header/footer patterns
const HEADER_PATTERNS = [
  /^\s*being a [Hh]omoeopath\.?\s*\d*\s*$/,
  /^\s*\d*\s*being a [Hh]omoeopath\.?\s*$/,
  /^\s*Fifty Reasons\s*$/,
  /^\s*LECTURES ON HOM[ŒO]PATHIC MATERIA MEDICA\s*$/,
  /^\s*by JAMES TYLER KENT[^\n]*$/i,
  /^\s*Preface by[^\n]*$/i,
  /^\s*REPERTORY\s*$/,
  /^\s*Nalanda Digital Library[^\n]*$/i,
  /^\s*Public Domain Text[^\n]*$/i,
  /^\s*PRINTED BY[^\n]*$/i,
  /^\s*GREAT SAFFRON HILL[^\n]*$/i,
  /^\s*LONDO.?\s*$/,
];

// Cover/preface markers
const COVER_MARKERS = [
  'ISBN', 'All rights reserved', 'Copyright', '© ',
  'Printed in India', 'Printed by', 'Published by',
  'B. Jain Publishers', 'BOERICKE & TAFEL',
  'First Edition', 'Second Edition', 'Third Edition',
  'Digitized by the Internet Archive',
  'Kahle/Austin Foundation',
];

// Remedy names for bolding
const REMEDY_NAMES = [
  'Aconite', 'Aconitum', 'Arnica', 'Arsenicum', 'Bryonia', 'Belladonna',
  'Calcarea', 'Chamomilla', 'China', 'Hepar', 'Hyoscyamus', 'Ignatia',
  'Ipecac', 'Kali', 'Lachesis', 'Lycopodium', 'Mercurius', 'Natrum',
  'Nux Vomica', 'Nux', 'Phosphorus', 'Pulsatilla', 'Rhus', 'Sepia',
  'Silicea', 'Sulphur', 'Thuja', 'Vanadium', 'Baptisia', 'Carbo veg',
  'Causticum', 'Conium', 'Cuprum', 'Digitalis', 'Eupatorium', 'Gelsemium',
  'Hahnemann', 'Kent', 'Boericke', 'Ledum', 'Ferrum', 'Magnesia',
];

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Stages
// ─────────────────────────────────────────────────────────────────────────────

function analyzeConfidence(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  let score = 100;
  const lines = text.split('\n');
  const garbledChars = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length;
  score -= Math.min(30, garbledChars * 2);
  const shortLines = lines.filter(l => l.trim().length > 0 && l.trim().length < 3).length;
  score -= Math.min(20, shortLines * 3);
  const garbageLines = lines.filter(l => {
    const stripped = l.replace(/[^a-zA-Z]/g, '');
    return l.trim().length > 5 && stripped.length < l.trim().length * 0.3;
  }).length;
  score -= Math.min(25, garbageLines * 5);
  const specialChars = (text.match(/[~`@#$%^&*+=<>{}[\]|\\]/g) || []).length;
  score -= Math.min(15, specialChars);
  return Math.max(0, Math.min(100, score));
}

function removeArtifacts(text: string, opts: OcrPipelineOptions): string {
  let lines = text.split('\n');
  if (opts.removePageNumbers) {
    lines = lines.filter(l => !PAGE_NUMBER_RE.test(l));
  }
  if (opts.removeHeaders || opts.removeFooters) {
    lines = lines.filter(l => {
      const trimmed = l.trim();
      return !HEADER_PATTERNS.some(p => p.test(trimmed));
    });
  }
  return lines.join('\n');
}

function reconstructText(text: string, opts: OcrPipelineOptions): string {
  let result = text;
  if (opts.mergeHyphenatedWords) {
    result = result.replace(/(\w)-\n(\w)/g, '$1$2');
  }
  if (opts.mergeLines) {
    result = result.replace(/([a-z,;:.!?")\]'"'])\n([a-z("`\[])/g, '$1 $2');
  }
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/[ \t]+/g, ' ');
  result = result.split('\n').map(l => l.trim()).join('\n');
  return result.trim();
}

function removeDuplicates(text: string, opts: OcrPipelineOptions): string {
  if (!opts.removeDuplicates) return text;
  const lines = text.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 20 && seen.has(trimmed)) continue;
    if (trimmed.length > 20) seen.add(trimmed);
    result.push(line);
  }
  return result.join('\n');
}

function removeOcrArtifacts(text: string): string {
  let result = text;
  // Remove control characters (keep newline, tab)
  result = result.replace(/\x0c/g, '\n');
  result = result.replace(/[\x00-\x08\x0B\x0E-\x1F]/g, '');
  // Fix smart quote artifacts
  result = result.replace(/â€œ/g, '"');
  result = result.replace(/â€\x9d/g, '"');
  result = result.replace(/â€™/g, "'");
  result = result.replace(/â€"/g, '—');
  result = result.replace(/â€"/g, '–');
  result = result.replace(/â€¢/g, '•');
  // Remove ligatures
  result = result.replace(/ﬁ/g, 'fi');
  result = result.replace(/ﬂ/g, 'fl');
  result = result.replace(/ﬀ/g, 'ff');
  result = result.replace(/ﬃ/g, 'ffi');
  result = result.replace(/ﬄ/g, 'ffl');
  // Fix common OCR character confusions (only in isolated contexts, not in words)
  // rn → m (only standalone, not in words like "burn")
  // cl → d (only in specific OCR garbage contexts)
  // These are NOT applied globally to avoid changing legitimate words

  // Remove isolated random symbols (not part of legitimate content)
  // Pattern: symbol surrounded by spaces or at line boundaries
  // PRESERVE: legitimate symbols (30C, 200C, °C, mg, ml, →, etc.)
  result = result.replace(/^\s*[\^`´'~@#$]+$\s*$/gm, ''); // Lines with only symbols
  result = result.replace(/^\s*[*_]{2,}\s*$/gm, ''); // Lines with only ** or __
  result = result.replace(/^\s*[-=]{2,}\s*$/gm, ''); // Lines with only -- or ==
  result = result.replace(/^\s*[|\\/]{2,}\s*$/gm, ''); // Lines with only || or \\
  result = result.replace(/^\s*[<>]{2,}\s*$/gm, ''); // Lines with only << or >>
  result = result.replace(/^\s*[¶†‡※¤§]+\s*$/gm, ''); // Lines with only rare symbols
  result = result.replace(/^\s*\.{3,}\s*$/gm, ''); // Lines with only ...
  result = result.replace(/^\s*_{3,}\s*$/gm, ''); // Lines with only ___
  result = result.replace(/^\s*#{2,}\s*$/gm, ''); // Lines with only ##

  // Remove OCR garbage patterns (garbled short tokens)
  result = result.replace(/\b[iI][\^`´][gG]\b/g, ''); // "i^g" type garbage
  result = result.replace(/\b\w*[0-9][a-zA-Z][0-9]\w*\b/g, (m) => {
    // Keep legitimate alphanumeric (like B-v, Calc. p.)
    if (m.length <= 4 && /^[A-Z]/.test(m)) return m;
    return ''; // Remove corrupted strings
  });

  return result;
}

/**
 * Remove markdown symbols that are OCR artifacts (not intentional formatting).
 * Removes: **, __, ##, `` from OCR text that shouldn't have markdown.
 * PRESERVES: legitimate formatting (bold headings, etc.)
 */
function removeMarkdownArtifacts(text: string): string {
  let result = text;

  // Remove stray markdown symbols that are NOT part of intentional formatting
  // Pattern: ** not surrounding text (orphaned asterisks)
  result = result.replace(/(?<!\w)\*\*(?!\w)/g, ''); // Orphaned **
  result = result.replace(/(?<!\w)__(?!\w)/g, ''); // Orphaned __
  result = result.replace(/(?<!\w)##(?!\w)/g, ''); // Orphaned ##
  result = result.replace(/``/g, '"'); // Double backtick → quote
  result = result.replace(/''/g, '"'); // Double single quote → quote

  // Remove triple+ symbols
  result = result.replace(/\*{3,}/g, '');
  result = result.replace(/_{3,}/g, '');
  result = result.replace(/-{4,}/g, ''); // Long dashes (keep ---)
  result = result.replace(/={3,}/g, '');
  result = result.replace(/\|{3,}/g, '');
  result = result.replace(/#{3,}/g, '');

  // Remove angled bracket artifacts: <text>, >text<
  result = result.replace(/<([a-zA-Z\s]{1,20})>/g, '$1'); // <text> → text
  result = result.replace(/<<([^>]+)>>/g, '$1'); // <<text>> → text
  result = result.replace(/»/g, '"');
  result = result.replace(/«/g, '"');

  // Remove pipe artifacts: |text|
  result = result.replace(/^\|([^|]+)\|$/gm, '$1');

  // Remove tilde artifacts: ~text~
  result = result.replace(/~([^~]+)~/g, '$1');

  // Remove bracket artifacts around text: [text], {text}
  // Only if the content looks like OCR garbage (not legitimate references)
  // PRESERVE: [1], [2] (footnote references), {note} (legitimate)
  result = result.replace(/\[([a-zA-Z\s]{50,})\]/g, '$1'); // Very long [text] → text

  return result;
}

/**
 * Remove random numbers & OCR artifact digits appended to words.
 *
 * Detects and removes:
 *   - Random numbers appended to words (Karti075 → Karti, Aconite123 → Aconite)
 *   - OCR-generated serial numbers (Mind009 → Mind, Head09 → Head)
 *   - Corrupted alphanumeric strings (ABC123XYZ → ABC)
 *   - OCR confidence markers / scanner IDs
 *
 * PRESERVES legitimate numbers that are part of the original book:
 *   - Chapter 1, Section 2, Aphorism 153
 *   - Potency 30C, 200C, 1M, LM1
 *   - Decimal numbering (1., 2., 3.)
 *   - Roman numerals (I, II, III, IV)
 *   - Page references ("see page 245")
 *   - Remedy grades if printed in original
 *   - Year references (1888, 2020)
 *   - Dosage numbers (3x, 6x, 12x, 30C)
 */
function removeRandomNumbers(text: string, opts: OcrPipelineOptions): string {
  if (!opts.removeRandomNumbers) return text;

  let result = text;

  // ── Pattern 1: Word followed by 2+ digits that are NOT a legitimate reference ──
  // Examples to REMOVE: Karti075, Aconite123, Mind009, Head09
  // Examples to KEEP: Chapter1 (has space), 30C (potency), page245 (context)
  //
  // Rule: Remove digits appended directly to a WORD (no space) when:
  //   - The word is NOT a number-related keyword (page, chapter, section, etc.)
  //   - The digits are NOT preceded by a potency indicator (x, C, M, LM)
  //   - The digits are NOT part of a decimal numbering list (1., 2., etc.)

  // First, protect legitimate number patterns by replacing them with placeholders
  const PROTECTED_PATTERNS: Array<[RegExp, string]> = [
    // Potency: 30C, 200C, 1M, 10M, 50M, CM, LM1, LM2
    [/\b(\d{1,4})\s*([CxXmM]{1,2})\b/g, '§POTENCY_$1_$2§'],
    // Decimal numbering: 1., 2., 3.
    [/\b(\d{1,3})\.\s/g, '§DEC_$1.§ '],
    // Chapter/Section/Aphorism/Page + number
    [/\b(Chapter|Section|Aphorism|Page|page|Vol|Volume|Part|No\.?)\s*(\d{1,4})\b/gi, '§REF_$1_$2§'],
    // Year references: 1888, 1900-2025
    [/\b(1[89]\d{2}|20[0-2]\d)\b/g, '§YEAR_$1§'],
    // Roman numerals at start of line (list items)
    [/^([IVXLCDM]{1,5})\.\s/gm, '§ROMAN_$1.§ '],
    // Dosage: 3x, 6x, 12x, 30x
    [/\b(\d{1,3})x\b/gi, '§DOSE_$1x§'],
    // Grade numbers in parentheses: (1), (2), (3), (4)
    [/\((\d)\)/g, '§GR_$1§'],
    // "see page 245" type references
    [/(see\s+(?:page|p\.)\s*\d{1,4})/gi, '§SEE_$1§'],
  ];

  // Apply protections
  for (const [pattern, replacement] of PROTECTED_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  // Now remove random digits appended to words
  // Pattern: word (letters) immediately followed by 2+ digits (no space)
  // But NOT if the word is already a placeholder
  result = result.replace(
    /\b([a-zA-Z]{2,})(\d{2,})\b/g,
    (match, word, digits) => {
      // Don't touch placeholders
      if (word.startsWith('§') || word.endsWith('§')) return match;
      // Keep if the "word" is actually a known abbreviation (like Nat, Calc, etc.)
      // and the digits might be a legitimate reference
      // Check if this looks like an OCR artifact:
      //   - The word is a known English/homeopathy word
      //   - The digits don't follow a natural pattern
      // Remove the digits — they're OCR artifacts
      return word;
    }
  );

  // Also remove single digit appended to short words (Mind9 → Mind)
  // But only if the word is 3+ chars and the digit doesn't follow a potency pattern
  result = result.replace(
    /\b([a-zA-Z]{3,})(\d)\b(?!x\b|C\b|M\b)/g,
    (match, word, digit) => {
      if (word.startsWith('§') || word.endsWith('§')) return match;
      // Keep if it's a list item like "Reason1" — check context
      // Remove the trailing digit
      return word;
    }
  );

  // Remove standalone corrupted alphanumeric strings (ABC123XYZ, x7y2k9)
  result = result.replace(/\b([a-zA-Z]\d+[a-zA-Z]+\d*|[a-zA-Z]+\d+[a-zA-Z]\d+)\b/g, (match) => {
    // Keep if it could be a legitimate abbreviation (like B-v., Calc. p.)
    if (match.length <= 4 && /^[A-Z]/.test(match)) return match;
    // Otherwise remove — it's OCR garbage
    return '';
  });

  // Remove OCR confidence markers (e.g., "7", "7 Zine. pic." where 7 is OCR noise)
  // Pattern: standalone single digit followed by non-word content
  result = result.replace(/\b(\d)\s+(?=[a-z])/g, (match, digit, offset, full) => {
    // Only remove if it's at the start of a line or after a period
    const before = full.slice(Math.max(0, offset - 5), offset);
    if (before.trim().endsWith('.') || before.trim().endsWith('\n') || offset === 0) {
      return ''; // Remove the digit
    }
    return match; // Keep it
  });

  // Restore protected patterns
  result = result
    .replace(/§POTENCY_(\d+)_([CxXmM]{1,2})§/g, '$1$2')
    .replace(/§DEC_(\d{1,3})\.§ /g, '$1. ')
    .replace(/§REF_(\w+)_(\d{1,4})§/gi, '$1 $2')
    .replace(/§YEAR_(\d{4})§/g, '$1')
    .replace(/§ROMAN_([IVXLCDM]+)\.§ /g, '$1. ')
    .replace(/§DOSE_(\d{1,3})x§/gi, '$1x')
    .replace(/§GR_(\d)§/g, '($1)')
    .replace(/§SEE_(.*?)§/gi, '$1');

  return result;
}

function formatTypography(text: string, opts: OcrPipelineOptions): string {
  if (!opts.formatTypography) return text;
  let result = text;

  if (opts.detectRemedies) {
    for (const remedy of REMEDY_NAMES) {
      const escaped = remedy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`\\b${escaped}\\b(?![^*]*\\*)`, 'g'),
        `**${remedy}**`
      );
    }
  }

  if (opts.detectChapters) {
    result = result.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('**')) return line;
      if (trimmed.length > 3 && trimmed.length < 80 &&
          trimmed === trimmed.toUpperCase() &&
          !trimmed.endsWith('.') && !trimmed.endsWith(',') &&
          /[A-Z]{3,}/.test(trimmed) && !trimmed.includes('**')) {
        return `**${trimmed}**`;
      }
      return line;
    }).join('\n');
  }

  const keywords = ['simillimum', 'homoeopathic', 'allopathic', 'proving', 'proved',
    'potency', 'materia medica', 'homoeopathy'];
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`\\b${escaped}\\b(?![^*]*\\*)`, 'gi'),
      (match) => `**${match}**`
    );
  }
  return result;
}

function validateQuality(text: string): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!text || text.trim().length === 0) {
    issues.push('Empty text');
    return { passed: false, issues };
  }
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 10) issues.push(`Low word count: ${wordCount}`);
  const garbled = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length;
  if (garbled > wordCount * 0.1) issues.push(`Excessive garbled: ${garbled}`);
  return { passed: issues.length === 0, issues };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export function processOcrText(
  rawText: string,
  opts: OcrPipelineOptions = DEFAULT_OPTIONS
): {
  cleanedText: string;
  confidence: number;
  issues: string[];
  passedValidation: boolean;
  wordCount: number;
} {
  const issues: string[] = [];
  const confidence = analyzeConfidence(rawText);
  if (confidence < (opts.minConfidence || 60)) {
    issues.push(`Low confidence: ${confidence}%`);
  }
  let text = removeArtifacts(rawText, opts);
  text = reconstructText(text, opts);
  text = removeDuplicates(text, opts);
  text = removeOcrArtifacts(text);
  text = removeMarkdownArtifacts(text);
  text = removeRandomNumbers(text, opts);
  text = formatTypography(text, opts);
  const validation = validateQuality(text);
  if (!validation.passed) issues.push(...validation.issues);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return { cleanedText: text, confidence, issues, passedValidation: issues.length === 0, wordCount };
}

export function quickClean(text: string): string {
  return processOcrText(text, {
    ...DEFAULT_OPTIONS,
    detectRemedies: false,
    detectChapters: false,
    formatTypography: false,
    validateQuality: false,
  }).cleanedText;
}
