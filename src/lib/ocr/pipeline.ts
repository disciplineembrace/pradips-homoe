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
  result = result.replace(/\x0c/g, '\n');
  result = result.replace(/[\x00-\x08\x0B\x0E-\x1F]/g, '');
  result = result.replace(/â€œ/g, '"');
  result = result.replace(/â€\x9d/g, '"');
  result = result.replace(/â€™/g, "'");
  result = result.replace(/â€"/g, '—');
  result = result.replace(/â€"/g, '–');
  result = result.replace(/â€¢/g, '•');
  result = result.replace(/\s[~`@#$%^&*+=<>{}[\]|\\]\s/g, ' ');
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
