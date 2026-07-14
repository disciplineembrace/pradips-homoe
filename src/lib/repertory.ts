/**
 * Repertory engine — derives a hierarchical tree from flat rubric records.
 *
 * Flat record shape:
 *   { id, path: "MIND", title: "AVERSION, approached to being — everything, to",
 *     author: "Kent", remedies: ["Aurum Metallicum", "caj", ...] }
 *
 * Derived tree shape (per repertory / author):
 *   Repertory (author)
 *     └─ Chapter (path)            e.g. "MIND", "HEAD", "EXTREMITIES"
 *        └─ Main Rubric            e.g. "AVERSION, approached to being"
 *           └─ Sub Rubric          e.g. "everything, to"
 *              └─ Remedies[]       e.g. ["Alumen", "am-m", ...]
 *
 * Title parsing rules:
 *   - "MAIN, sub"                    → main = "MAIN, sub", sub = ""
 *   - "MAIN, sub — qualifier"        → main = "MAIN, sub", sub = "qualifier"
 *   - "MAIN — qualifier"             → main = "MAIN",       sub = "qualifier"
 *   - "MAIN"                         → main = "MAIN",       sub = ""
 *
 * Remedy normalization:
 *   - Abbreviations (lower-case like "caj", "am-m", "calc") are kept as-is.
 *   - Full names ("Aurum Metallicum") are kept as-is.
 *   - A separate abbreviation map is built for display & cross-repertory matching.
 */
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_DIR_ALT = '/home/z/my-project/data';

let _rubrics: any[] | null = null;
let _remedies: any[] | null = null;

async function readJson(p: string): Promise<any> {
  try {
    const buf = await fs.readFile(p);
    return JSON.parse(buf.toString('utf-8'));
  } catch (e1: any) {
    if (e1.code === 'ENOENT' && p !== DATA_DIR_ALT) {
      const altP = path.join(DATA_DIR_ALT, path.basename(p));
      const buf = await fs.readFile(altP);
      return JSON.parse(buf.toString('utf-8'));
    }
    throw e1;
  }
}

async function loadRubrics(): Promise<any[]> {
  if (_rubrics) return _rubrics;
  _rubrics = await readJson(path.join(DATA_DIR, 'rubrics.json'));
  return _rubrics!;
}

async function loadRemedies(): Promise<any[]> {
  if (_remedies) return _remedies;
  _remedies = await readJson(path.join(DATA_DIR, 'remedies.json'));
  return _remedies!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

const DASH_SEPARATOR = ' — ';

export interface ParsedTitle {
  main: string;
  sub: string;
}

export function parseTitle(title: string): ParsedTitle {
  // Use em-dash separator (already in source data).
  const idx = title.indexOf(DASH_SEPARATOR);
  if (idx === -1) {
    return { main: title.trim(), sub: '' };
  }
  return {
    main: title.slice(0, idx).trim(),
    sub: title.slice(idx + DASH_SEPARATOR.length).trim(),
  };
}

/**
 * Normalize a remedy name to its abbreviation for cross-repertory matching.
 * "Aurum Metallicum" → "aur-m"
 * "Nux Vomica"        → "nux-v"
 * "calc"              → "calc"  (already abbreviated)
 *
 * Rules:
 *   - If the name is already lowercase / contains a hyphen → return as-is.
 *   - Otherwise take the first syllable of each word, join with hyphens.
 *
 * NOTE: this is a heuristic for fuzzy grouping only — it does NOT replace the
 * authoritative abbreviation map. The radar engine uses it purely to suggest
 * "this same remedy may appear in another repertory".
 */
export function remedyToAbbrev(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  // Already abbreviated? (lowercase or has hyphen and is short)
  if (trimmed === trimmed.toLowerCase() && trimmed.length <= 8) return trimmed;
  if (/^[a-z]{1,4}-[a-z]+$/.test(trimmed)) return trimmed;
  // Full name → take first 3-4 chars of each word, lowercase, join with hyphen
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 4);
  return words.map(w => w.slice(0, 3)).join('-');
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived types
// ─────────────────────────────────────────────────────────────────────────────

export interface RepertoryChapter {
  id: string;             // slug of chapter
  name: string;           // chapter display name (e.g. "MIND")
  repertory: string;      // author
  rubricCount: number;    // total rubrics (including sub-rubrics) under this chapter
  mainRubricCount: number;// distinct main rubrics
}

export interface MainRubricNode {
  id: string;             // synthetic id: `${chapterSlug}:${mainSlug}`
  chapter: string;        // chapter name
  repertory: string;
  main: string;           // main rubric text
  subRubricCount: number;
  remedyCount: number;    // distinct remedies across all sub-rubrics
  hasChildren: boolean;
}

export interface RubricDetail {
  id: string;
  repertory: string;
  chapter: string;
  main: string;
  sub: string;
  fullTitle: string;      // original title (main + " — " + sub)
  remedies: string[];
  // Cross-references — same main rubric in OTHER repertories
  crossReferences: Array<{
    repertory: string;
    rubricId: string;
    title: string;
    overlapCount: number; // # of remedies in common
  }>;
  // Similar rubrics — same chapter, similar main text (fuzzy)
  similarRubrics: Array<{
    repertory: string;
    rubricId: string;
    title: string;
    sharedRemedies: number;
  }>;
  // Synonyms — derived from main-rubric text similarity (same chapter, same repertory)
  synonyms: Array<{
    rubricId: string;
    title: string;
  }>;
  // Parent rubric info (for breadcrumb navigation)
  parentRubric?: {
    id: string;
    title: string;
  };
  // Child rubrics (sub-rubrics of this one if it's a main rubric)
  childRubrics: Array<{
    id: string;
    title: string;
    remedyCount: number;
  }>;
  // Sibling rubrics (other main rubrics under same chapter)
  siblingRubrics: Array<{
    id: string;
    title: string;
    remedyCount: number;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Index builders (cached)
// ─────────────────────────────────────────────────────────────────────────────

interface RubricRecord {
  id: string;
  path: string;
  title: string;
  author: string;
  remedies: string[];
}

interface RepertoryIndex {
  // author → chapter → main rubric → sub-rubrics[]
  byAuthor: Map<string, Map<string, Map<string, RubricRecord[]>>>;
  // id → record (fast lookup)
  byId: Map<string, RubricRecord>;
  // author → chapter list with counts
  chaptersByAuthor: Map<string, RepertoryChapter[]>;
}

let _index: RepertoryIndex | null = null;

async function getIndex(): Promise<RepertoryIndex> {
  if (_index) return _index;
  const rubrics = await loadRubrics();

  const byAuthor = new Map<string, Map<string, Map<string, RubricRecord[]>>>();
  const byId = new Map<string, RubricRecord>();

  for (const r of rubrics) {
    const rec: RubricRecord = {
      id: r.id,
      path: (r.path || '').trim(),
      title: (r.title || '').trim(),
      author: (r.author || '').trim(),
      remedies: Array.isArray(r.remedies) ? r.remedies : [],
    };
    if (!rec.path || !rec.title) continue;
    byId.set(rec.id, rec);

    let byChapter = byAuthor.get(rec.author);
    if (!byChapter) {
      byChapter = new Map();
      byAuthor.set(rec.author, byChapter);
    }
    let byMain = byChapter.get(rec.path);
    if (!byMain) {
      byMain = new Map();
      byChapter.set(rec.path, byMain);
    }
    const parsed = parseTitle(rec.title);
    let arr = byMain.get(parsed.main);
    if (!arr) {
      arr = [];
      byMain.set(parsed.main, arr);
    }
    arr.push(rec);
  }

  // Build chapter list with counts
  const chaptersByAuthor = new Map<string, RepertoryChapter[]>();
  for (const [author, byChapter] of byAuthor.entries()) {
    const chapters: RepertoryChapter[] = [];
    for (const [chapterName, byMain] of byChapter.entries()) {
      let rubricCount = 0;
      let mainCount = 0;
      for (const arr of byMain.values()) {
        rubricCount += arr.length;
        mainCount += 1;
      }
      chapters.push({
        id: `${author.toLowerCase()}:${chapterName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: chapterName,
        repertory: author,
        rubricCount,
        mainRubricCount: mainCount,
      });
    }
    // Sort by rubric count descending
    chapters.sort((a, b) => b.rubricCount - a.rubricCount);
    chaptersByAuthor.set(author, chapters);
  }

  _index = { byAuthor, byId, chaptersByAuthor };
  return _index;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public query functions
// ─────────────────────────────────────────────────────────────────────────────

export async function listRepertories(): Promise<Array<{
  author: string;
  chapterCount: number;
  rubricCount: number;
}>> {
  const idx = await getIndex();
  const result: Array<{ author: string; chapterCount: number; rubricCount: number }> = [];
  for (const [author, chapters] of idx.chaptersByAuthor.entries()) {
    let total = 0;
    for (const c of chapters) total += c.rubricCount;
    result.push({ author, chapterCount: chapters.length, rubricCount: total });
  }
  result.sort((a, b) => b.rubricCount - a.rubricCount);
  return result;
}

export async function listChapters(author: string): Promise<RepertoryChapter[]> {
  const idx = await getIndex();
  return idx.chaptersByAuthor.get(author) || [];
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function listMainRubrics(
  author: string,
  chapter: string,
  opts: { q?: string; offset?: number; limit?: number } = {}
): Promise<{ total: number; items: MainRubricNode[] }> {
  const idx = await getIndex();
  const byChapter = idx.byAuthor.get(author);
  if (!byChapter) return { total: 0, items: [] };
  const byMain = byChapter.get(chapter);
  if (!byMain) return { total: 0, items: [] };

  const q = (opts.q || '').trim().toLowerCase();
  const chapterSlug = slugify(chapter);
  const items: MainRubricNode[] = [];

  for (const [mainName, arr] of byMain.entries()) {
    if (q && !mainName.toLowerCase().includes(q)) continue;
    const remedySet = new Set<string>();
    for (const r of arr) for (const rem of r.remedies) remedySet.add(rem);
    items.push({
      id: `${author.toLowerCase()}:${chapterSlug}:${slugify(mainName)}`,
      chapter,
      repertory: author,
      main: mainName,
      subRubricCount: arr.length,
      remedyCount: remedySet.size,
      hasChildren: arr.length > 1 || (arr.length === 1 && arr[0].title !== mainName),
    });
  }

  items.sort((a, b) => a.main.localeCompare(b.main));
  const total = items.length;
  const offset = opts.offset || 0;
  const limit = opts.limit || 100;
  return { total, items: items.slice(offset, offset + limit) };
}

export async function listSubRubrics(
  author: string,
  chapter: string,
  main: string
): Promise<Array<{ id: string; title: string; sub: string; remedies: string[] }>> {
  const idx = await getIndex();
  const byChapter = idx.byAuthor.get(author);
  if (!byChapter) return [];
  const byMain = byChapter.get(chapter);
  if (!byMain) return [];
  const arr = byMain.get(main);
  if (!arr) return [];
  return arr
    .map(r => ({
      id: r.id,
      title: r.title,
      sub: parseTitle(r.title).sub,
      remedies: r.remedies,
    }))
    .sort((a, b) => {
      // No-sub entries first, then alphabetical
      if (!a.sub && b.sub) return -1;
      if (a.sub && !b.sub) return 1;
      return a.sub.localeCompare(b.sub);
    });
}

export async function getRubricById(id: string): Promise<RubricDetail | null> {
  const idx = await getIndex();
  const rec = idx.byId.get(id);
  if (!rec) return null;

  const parsed = parseTitle(rec.title);

  // Cross-references — same chapter & similar main in OTHER repertories
  const crossReferences: RubricDetail['crossReferences'] = [];
  for (const [author, byChapter] of idx.byAuthor.entries()) {
    if (author === rec.author) continue;
    const byMain = byChapter.get(rec.path);
    if (!byMain) continue;
    // Find main rubrics that share remedies with our rubric
    const ourRemedies = new Set(rec.remedies.map(remedyToAbbrev));
    for (const [mainName, arr] of byMain.entries()) {
      // Look at first record in each main rubric
      for (const candidate of arr) {
        const candidateRems = new Set(candidate.remedies.map(remedyToAbbrev));
        let overlap = 0;
        for (const r of ourRemedies) if (candidateRems.has(r)) overlap++;
        if (overlap >= 2) {
          crossReferences.push({
            repertory: author,
            rubricId: candidate.id,
            title: candidate.title,
            overlapCount: overlap,
          });
          break; // one per main rubric per other repertory
        }
      }
    }
  }
  crossReferences.sort((a, b) => b.overlapCount - a.overlapCount);

  // Similar rubrics — same repertory, same chapter, similar main text (different main)
  const similarRubrics: RubricDetail['similarRubrics'] = [];
  const byChapter = idx.byAuthor.get(rec.author);
  if (byChapter) {
    const byMain = byChapter.get(rec.path);
    if (byMain) {
      const ourRemedies = new Set(rec.remedies.map(remedyToAbbrev));
      for (const [mainName, arr] of byMain.entries()) {
        if (mainName === parsed.main) continue;
        // Cheap text similarity: shares a word with the main rubric
        const ourWords = new Set(parsed.main.toLowerCase().split(/\W+/).filter(w => w.length > 3));
        const theirWords = mainName.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const sharesWord = theirWords.some(w => ourWords.has(w));
        if (!sharesWord) continue;
        // Find a representative sub-rubric with most remedy overlap
        let bestId = '';
        let bestOverlap = 0;
        for (const candidate of arr) {
          const candidateRems = new Set(candidate.remedies.map(remedyToAbbrev));
          let overlap = 0;
          for (const r of ourRemedies) if (candidateRems.has(r)) overlap++;
          if (overlap > bestOverlap) {
            bestOverlap = overlap;
            bestId = candidate.id;
          }
        }
        if (bestId && bestOverlap >= 1) {
          similarRubrics.push({
            repertory: rec.author,
            rubricId: bestId,
            title: arr[0].title,
            sharedRemedies: bestOverlap,
          });
        }
      }
    }
  }
  similarRubrics.sort((a, b) => b.sharedRemedies - a.sharedRemedies);

  // Synonyms — same repertory, same chapter, similar main but distinct
  const synonyms: RubricDetail['synonyms'] = similarRubrics
    .slice(0, 5)
    .map(s => ({ rubricId: s.rubricId, title: s.title }));

  // Parent rubric — if this rubric has a sub, the "parent" is the main rubric
  // (we point to the first record under the same main that has no sub, or just to the main)
  let parentRubric: RubricDetail['parentRubric'] | undefined;
  if (parsed.sub && byChapter) {
    const byMain = byChapter.get(rec.path);
    if (byMain) {
      const arr = byMain.get(parsed.main);
      if (arr) {
        const parentRec = arr.find(r => !parseTitle(r.title).sub) || arr[0];
        if (parentRec.id !== rec.id) {
          parentRubric = { id: parentRec.id, title: parentRec.title };
        }
      }
    }
  }

  // Child rubrics — sub-rubrics under the same main (if this is a main rubric or one of them)
  const childRubrics: RubricDetail['childRubrics'] = [];
  if (byChapter) {
    const byMain = byChapter.get(rec.path);
    if (byMain) {
      const arr = byMain.get(parsed.main);
      if (arr) {
        for (const r of arr) {
          if (r.id === rec.id) continue;
          const sub = parseTitle(r.title).sub;
          if (!sub) continue;
          childRubrics.push({
            id: r.id,
            title: r.title,
            remedyCount: r.remedies.length,
          });
        }
        childRubrics.sort((a, b) => a.title.localeCompare(b.title));
      }
    }
  }

  // Sibling rubrics — other main rubrics under same chapter
  const siblingRubrics: RubricDetail['siblingRubrics'] = [];
  if (byChapter) {
    const byMain = byChapter.get(rec.path);
    if (byMain) {
      for (const [mainName, arr] of byMain.entries()) {
        if (mainName === parsed.main) continue;
        const rep = arr[0];
        const remCount = arr.reduce((s, r) => s + r.remedies.length, 0);
        siblingRubrics.push({
          id: rep.id,
          title: mainName,
          remedyCount: remCount,
        });
      }
      siblingRubrics.sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  return {
    id: rec.id,
    repertory: rec.author,
    chapter: rec.path,
    main: parsed.main,
    sub: parsed.sub,
    fullTitle: rec.title,
    remedies: rec.remedies,
    crossReferences: crossReferences.slice(0, 20),
    similarRubrics: similarRubrics.slice(0, 15),
    synonyms: synonyms.slice(0, 10),
    parentRubric,
    childRubrics: childRubrics.slice(0, 50),
    siblingRubrics: siblingRubrics.slice(0, 30),
  };
}

export async function searchRubrics(
  q: string,
  opts: { author?: string; chapter?: string; limit?: number } = {}
): Promise<Array<{
  id: string;
  repertory: string;
  chapter: string;
  title: string;
  remedyCount: number;
  matchedRemedies: string[];
}>> {
  const idx = await getIndex();
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];

  const limit = opts.limit || 50;
  const results: Array<{
    id: string; repertory: string; chapter: string; title: string;
    remedyCount: number; matchedRemedies: string[];
  }> = [];

  // Determine which authors/chapters to scan
  const authors = opts.author ? [opts.author] : Array.from(idx.byAuthor.keys());

  for (const author of authors) {
    const byChapter = idx.byAuthor.get(author);
    if (!byChapter) continue;
    const chapters = opts.chapter ? [opts.chapter] : Array.from(byChapter.keys());
    for (const chapter of chapters) {
      const byMain = byChapter.get(chapter);
      if (!byMain) continue;
      for (const arr of byMain.values()) {
        for (const r of arr) {
          // Match title or any remedy
          const titleMatch = r.title.toLowerCase().includes(query);
          const matchedRemedies = r.remedies.filter(rem =>
            rem.toLowerCase().includes(query)
          );
          if (titleMatch || matchedRemedies.length > 0) {
            results.push({
              id: r.id,
              repertory: author,
              chapter: chapter,
              title: r.title,
              remedyCount: r.remedies.length,
              matchedRemedies: matchedRemedies.slice(0, 5),
            });
          }
        }
      }
    }
  }

  // Sort: title matches first, then by remedy count
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(query) ? 0 : 1;
    const bTitle = b.title.toLowerCase().includes(query) ? 0 : 1;
    if (aTitle !== bTitle) return aTitle - bTitle;
    return b.remedyCount - a.remedyCount;
  });

  return results.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Remedy detail lookup (for "click on a remedy to open its materia medica")
// ─────────────────────────────────────────────────────────────────────────────

export async function findRemedyByApproxName(name: string): Promise<string | null> {
  const remedies = await loadRemedies();
  const q = name.trim().toLowerCase();
  // Exact match
  for (const r of remedies) {
    if (r.name && r.name.toLowerCase() === q) return r.id;
  }
  // Prefix match
  for (const r of remedies) {
    if (r.name && r.name.toLowerCase().startsWith(q)) return r.id;
  }
  // Contains
  for (const r of remedies) {
    if (r.name && r.name.toLowerCase().includes(q)) return r.id;
  }
  return null;
}
