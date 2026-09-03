/**
 * Safe sentence-splitting utility.
 *
 * WHY THIS EXISTS:
 * The original code used lookbehind regex (?<=...) which requires ES2018+.
 * The project tsconfig targets ES2017, causing SyntaxError at runtime in
 * browsers — crashing the entire React app (white screen of death).
 *
 * This function provides the same behavior using ES2017-safe code.
 */

/**
 * Split text into sentences at sentence boundaries (. or ; followed by
 * whitespace + capital letter). ES2017-safe — no lookbehind regex.
 */
export function splitSentences(text: string): string[] {
  if (!text) return [];
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;
    // If current char is . or ; and next char is whitespace followed by
    // an uppercase letter, split here
    if ((ch === '.' || ch === ';') && i + 2 < text.length) {
      const next = text[i + 1];
      const afterNext = text[i + 2];
      if (/\s/.test(next) && afterNext && /[A-Z]/.test(afterNext)) {
        result.push(current);
        current = '';
      }
    }
  }
  if (current.trim()) {
    result.push(current);
  }
  return result;
}

/**
 * Split text into sections at double-newlines or dashed dividers.
 * ES2017-safe.
 */
export function splitSections(text: string): string[] {
  if (!text) return [];
  // Split on 2+ newlines OR 2+ dashes
  return text.split(/\n\n+|--+/).filter(s => s.trim());
}
