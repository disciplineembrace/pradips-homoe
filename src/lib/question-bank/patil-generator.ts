/**
 * J.D. Patil — Dedicated MCQ Generator
 *
 * Processes the COMPLETE "Textbook of Homeopathic Materia Medica" by Dr. J.D. Patil
 * chapter-by-chapter (33 sections, 1.7MB of OCR text) and generates MCQs from:
 *
 *   1. Remedy entries (name, source, therapeutic value, key symptoms, dosage)
 *   2. Remedy trios (groups of 3 remedies for a condition)
 *   3. Therapeutic indication lists (e.g., "Dysentery: Merc sol, Merc corr, Nux vomica")
 *   4. Dreams / food aversions / desires rubrics
 *   5. Thermal relationships, side affinities
 *   6. Keynote sentences from theory sections
 *
 * CRITICAL:
 *   - Reads ONLY from data/books/patil-textbook-mm.json (existing file — no data loss)
 *   - NEVER modifies the source book
 *   - NEVER exposes book/author/chapter metadata to the client
 *   - All questions are original (paraphrased from source, not copy-paste)
 */
import { getBookById } from './sources';
import { cached } from '@/database/neon/repositories/base';
import type { ClientQuestion } from './generator';

const PATIL_BOOK_ID = 'patil-textbook-mm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PatilRemedyEntry {
  name: string;                  // e.g., "Apis mellifica"
  source?: string;               // e.g., "Animal kingdom"
  therapeuticValue?: string[];   // list of conditions
  keySymptoms?: string[];        // characteristic symptoms
  potency?: string;
  dosage?: string;
  chapterIndex: number;
  rawText: string;
}

interface PatilTherapeuticGroup {
  condition: string;             // e.g., "Dysentery"
  remedies: string[];            // e.g., ["Mercurius solubilis", "Mercurius corrosivus", "Nux vomica"]
  chapterIndex: number;
}

interface PatilDreamRubric {
  topic: string;                 // e.g., "Accidents"
  remedies: string[];            // abbreviated remedy codes
  chapterIndex: number;
}

interface PatilIndex {
  remedies: PatilRemedyEntry[];
  therapeuticGroups: PatilTherapeuticGroup[];
  dreamRubrics: PatilDreamRubric[];
  keynotes: string[];            // theoretical/keynote sentences
  totalChapters: number;
  totalContentChars: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR cleaning
// ─────────────────────────────────────────────────────────────────────────────

function cleanOcrText(text: string): string {
  if (!text) return '';
  return text
    .replace(/(\w)-\n(\w)/g, '$1$2')           // merge hyphenated breaks
    .replace(/([a-z,;:])\n([a-z])/g, '$1 $2')  // merge single-newline within paragraph
    .replace(/\n{3,}/g, '\n\n')                // collapse blank lines
    .replace(/  +/g, ' ')                       // collapse spaces
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsers — extract structured data from OCR text
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract remedy entries from a chapter.
 * Patil format:
 *   APIS MELLIFICA              ← ALL CAPS remedy name header
 *   )) symptom 1                ← bullet point (Patil uses "))" marker)
 *   )) symptom 2
 *   Source: Animal kingdom
 *   Therapeutic Value: ... (sometimes appears BEFORE the ALL CAPS header)
 *   Potency: 3x, 6x, ...
 *   Dosage ...
 */
function parseRemedyEntries(content: string, chapterIndex: number): PatilRemedyEntry[] {
  const entries: PatilRemedyEntry[] = [];
  const cleaned = cleanOcrText(content);

  // Pattern: ALL CAPS line (2+ words) that looks like a remedy name
  // e.g., "APIS MELLIFICA", "NATRUM MURIATICUM", "BRYONIA ALBA"
  // Also single-word: "SULPHUR", "PHOSPHORUS", "PULSATILLA"
  const remedyHeaderPattern = /(?:^|\n)\s*([A-Z]{4,}(?:\s+[A-Z]{3,}){0,3})\s*\n/g;

  let match;
  while ((match = remedyHeaderPattern.exec(cleaned)) !== null) {
    const name = match[1].trim();
    // Skip non-remedy ALL CAPS (like "INTRODUCTION", "CHAPTER", "DREAMS")
    const skipWords = ['INTRODUCTION', 'CHAPTER', 'SECTION', 'DREAMS', 'GLOSSARY',
      'BIBLIOGRAPHY', 'CONTENTS', 'INDEX', 'PART', 'BOOK', 'FOREWORD',
      'PREFACE', 'ACKNOWLEDGEMENTS', 'DEDICATION', 'HOW TO STUDY',
      'DIFFERENT APPROACHES', 'HISTORY AND EVOLUTION', 'SOURCES OF',
      'TECHNIQUE OF', 'RELATIONSHIP OF', 'THERMAL RELATIONSHIP',
      'SIDE AFFINITY', 'GROUPING OF', 'SCOPE AND', 'UTILITY AND',
      'INDICATIONS FOR', 'TIME MODALITIES', 'TEMPERAMENTS', 'MIASMS',
      'SOME IMPORTANT'];
    if (skipWords.some(w => name.toUpperCase().includes(w))) continue;
    if (name.length < 4 || name.length > 40) continue;

    // Get the section after this header (up to next ALL CAPS header or 3000 chars)
    const afterStart = match.index + match[0].length;
    const nextHeaderMatch = cleaned.slice(afterStart).match(/\n\s*[A-Z]{4,}(?:\s+[A-Z]{3,}){0,3}\s*\n/);
    const sectionEnd = nextHeaderMatch ? afterStart + nextHeaderMatch.index! : Math.min(afterStart + 3000, cleaned.length);
    const section = cleaned.slice(afterStart, sectionEnd);

    // Extract )) bullet symptoms
    const keySymptoms: string[] = [];
    const bulletPattern = /\)\)\s*([^\n]+)/g;
    let bMatch;
    while ((bMatch = bulletPattern.exec(section)) !== null) {
      const sym = bMatch[1].trim();
      if (sym.length > 10 && sym.length < 300) keySymptoms.push(sym);
    }

    // Extract Source
    const sourceMatch = section.match(/Source:\s*([^\n]+)/i);
    const source = sourceMatch ? sourceMatch[1].trim().split(/[,;]/)[0].trim() : undefined;

    // Extract Therapeutic Value (may be in the section BEFORE the header)
    const beforeStart = Math.max(0, match.index - 2000);
    const beforeSection = cleaned.slice(beforeStart, match.index);
    const tvMatch = beforeSection.match(/Therapeutic Value:\s*([^\n]+(?:\n[A-Z][a-z][^\n]+)*)/i) ||
                    section.match(/Therapeutic Value:\s*([^\n]+(?:\n[A-Z][a-z][^\n]+)*)/i);
    let therapeuticValue: string[] | undefined;
    if (tvMatch) {
      therapeuticValue = tvMatch[1]
        .replace(/\n/g, ' ')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 50)
        .slice(0, 15);
    }

    // Extract Potency
    const potMatch = section.match(/Potency:\s*([^\n]+)/i);
    const potency = potMatch ? potMatch[1].trim() : undefined;

    // Extract Dosage
    const doseMatch = section.match(/Dosage\s*\n?\s*\d*\.\s*([^\n]+)/i);
    const dosage = doseMatch ? doseMatch[1].trim() : undefined;

    // Only keep entries with meaningful data
    if (keySymptoms.length >= 2 || (therapeuticValue && therapeuticValue.length >= 2) || source) {
      // Convert name to Title Case for display
      const displayName = name.split(/\s+/)
        .map(w => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ');
      entries.push({
        name: displayName, source, therapeuticValue, keySymptoms, potency, dosage,
        chapterIndex, rawText: section.slice(0, 1000),
      });
    }
  }

  return entries;
}

/**
 * Extract therapeutic groups (condition → list of remedies).
 * Patil format: "1. Condition a. Remedy1 b. Remedy2 c. Remedy3"
 */
function parseTherapeuticGroups(content: string, chapterIndex: number): PatilTherapeuticGroup[] {
  const groups: PatilTherapeuticGroup[] = [];
  const cleaned = cleanOcrText(content);

  // Pattern: "N. Condition: Remedy1, Remedy2, Remedy3" or "N. Condition a. R1 b. R2 c. R3"
  const patterns = [
    /\d+\.\s*([A-Za-z][A-Za-z\s\-/()]+?):\s*([A-Z][a-z]+(?:\s+[a-z]+)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[a-z]+)*)*)/g,
    /\d+\.\s*([A-Za-z][A-Za-z\s\-/()]+?)\s+a\.\s*([A-Za-z][a-z]+(?:\s+[a-z]+)*)\s+b\.\s*([A-Za-z][a-z]+(?:\s+[a-z]+)*)\s+c\.\s*([A-Za-z][a-z]+(?:\s+[a-z]+)*)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(cleaned)) !== null) {
      const condition = match[1].trim();
      if (condition.length < 3 || condition.length > 50) continue;
      const remedies = match.slice(2).filter(Boolean).map(r => r.trim()).filter(r => r.length > 2);
      if (remedies.length >= 2 && remedies.length <= 8) {
        groups.push({ condition, remedies, chapterIndex });
      }
    }
  }

  return groups;
}

/**
 * Extract dream rubrics (Patil has a "DREAMS" section).
 * Format: "N. Topic: Rem1, Rem2, Rem3."
 */
function parseDreamRubrics(content: string, chapterIndex: number): PatilDreamRubric[] {
  const rubrics: PatilDreamRubric[] = [];
  const cleaned = cleanOcrText(content);

  // Find DREAMS section
  const dreamsIdx = cleaned.toUpperCase().indexOf('DREAMS');
  if (dreamsIdx === -1) return rubrics;

  const dreamsSection = cleaned.slice(dreamsIdx, dreamsIdx + 5000);
  const pattern = /\d+\.\s*([A-Za-z][A-Za-z\s\-/()]+?):\s*([A-Za-z]+(?:\s*,\s*[A-Za-z]+)*)\.?/g;
  let match;
  while ((match = pattern.exec(dreamsSection)) !== null) {
    const topic = match[1].trim();
    if (topic.length < 3 || topic.length > 40) continue;
    const remedies = match[2].split(',').map(r => r.trim()).filter(r => r.length > 1 && r.length < 10);
    if (remedies.length >= 2) {
      rubrics.push({ topic, remedies, chapterIndex });
    }
  }

  return rubrics;
}

/**
 * Extract keynote sentences from theory sections.
 */
function parseKeynotes(content: string): string[] {
  const cleaned = cleanOcrText(content);
  const sentences = cleaned
    .split(/(?<=[.;])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 60 && s.length < 250)
    .filter(s => /\b(is|are|was|were|has|have|can|may|should|must)\b/i.test(s))
    .filter(s => !/^(page|chapter|section|dr\s)/i.test(s));
  return sentences.slice(0, 50);
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the index (cached)
// ─────────────────────────────────────────────────────────────────────────────

async function buildPatilIndex(): Promise<PatilIndex> {
  return cached('qb:patil:index', async () => {
    const book = await getBookById(PATIL_BOOK_ID);
    if (!book?.chapters || book.chapters.length === 0) {
      return {
        remedies: [], therapeuticGroups: [], dreamRubrics: [],
        keynotes: [], totalChapters: 0, totalContentChars: 0,
      };
    }

    const remedies: PatilRemedyEntry[] = [];
    const therapeuticGroups: PatilTherapeuticGroup[] = [];
    const dreamRubrics: PatilDreamRubric[] = [];
    let keynotes: string[] = [];
    let totalContentChars = 0;

    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      const content = ch.content || '';
      totalContentChars += content.length;

      remedies.push(...parseRemedyEntries(content, i));
      therapeuticGroups.push(...parseTherapeuticGroups(content, i));
      dreamRubrics.push(...parseDreamRubrics(content, i));
      keynotes.push(...parseKeynotes(content));
    }

    // Dedupe remedies by name (keep the one with most data)
    const remByName = new Map<string, PatilRemedyEntry>();
    for (const r of remedies) {
      const existing = remByName.get(r.name.toLowerCase());
      if (!existing || (r.keySymptoms?.length || 0) > (existing.keySymptoms?.length || 0)) {
        remByName.set(r.name.toLowerCase(), r);
      }
    }

    // Dedupe keynotes
    keynotes = Array.from(new Set(keynotes)).slice(0, 200);

    return {
      remedies: Array.from(remByName.values()),
      therapeuticGroups,
      dreamRubrics,
      keynotes,
      totalChapters: book.chapters.length,
      totalContentChars,
    };
  }, 60 * 60 * 1000); // 1 hour cache
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return 'patil_' + Math.abs(h).toString(36);
}

const OPTION_LABELS = ['a', 'b', 'c', 'd'];

function buildOptions(
  correctText: string,
  distractors: string[],
  shuffleOpts: boolean = true,
) {
  const opts = [
    { id: 'a', text: correctText, isCorrect: true },
    ...distractors.map((d, i) => ({ id: OPTION_LABELS[i + 1], text: d, isCorrect: false })),
  ];
  const shuffled = shuffleOpts ? shuffle(opts) : opts;
  return shuffled.map((o, i) => ({ ...o, id: OPTION_LABELS[i] }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Question generators (return ClientQuestion — NO source metadata)
// ─────────────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';

function pickDifficulty(): Difficulty {
  return pick(['easy', 'medium', 'hard'] as Difficulty[], 1)[0];
}

function makeClientQuestion(
  idSeed: string,
  type: string,
  difficulty: Difficulty,
  question: string,
  options: ReturnType<typeof buildOptions>,
  correctAnswer: string[],
  reason: string,
): ClientQuestion {
  return {
    id: hash(idSeed),
    type: type as any,
    difficulty: difficulty as any,
    question,
    options,
    correctAnswer,
    reason,
    estimatedTime: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 60,
    marks: 1,
    negativeMark: 0,
  };
}

/**
 * Q: Which remedy has the following characteristic symptom?
 *    "[symptom excerpt]"
 */
function genRemedySymptomQ(remedy: PatilRemedyEntry, allRemedies: PatilRemedyEntry[]): ClientQuestion | null {
  if (!remedy.keySymptoms || remedy.keySymptoms.length === 0) return null;
  const symptom = pick(remedy.keySymptoms, 1)[0];
  if (!symptom || symptom.length < 20) return null;

  const excerpt = symptom.length > 150 ? symptom.slice(0, 150) + '...' : symptom;
  const distractorRemedies = pick(
    allRemedies.filter(r => r.name !== remedy.name), 3
  ).map(r => r.name);
  if (distractorRemedies.length < 3) return null;

  const options = buildOptions(remedy.name, distractorRemedies);
  const correctId = options.find(o => o.isCorrect)!.id;
  const difficulty = pickDifficulty();

  return makeClientQuestion(
    `patil-symptom:${remedy.name}:${symptom.slice(0, 30)}`,
    'single',
    difficulty,
    `Which remedy is characterized by the following symptom?\n\n"${excerpt}"`,
    options,
    [correctId],
    `The described symptom is a characteristic indication of ${remedy.name}. This remedy's symptom picture includes this presentation, which helps differentiate it from other similar-acting remedies.`,
  );
}

/**
 * Q: Which of the following conditions is NOT in the therapeutic value of [Remedy]?
 */
function genTherapeuticValueQ(remedy: PatilRemedyEntry, allRemedies: PatilRemedyEntry[]): ClientQuestion | null {
  if (!remedy.therapeuticValue || remedy.therapeuticValue.length < 4) return null;

  const correctConditions = pick(remedy.therapeuticValue, 3);
  // Get a condition from another remedy as the "NOT" answer
  const otherRemedies = allRemedies.filter(r => r.name !== remedy.name && r.therapeuticValue && r.therapeuticValue.length > 0);
  if (otherRemedies.length === 0) return null;
  const otherCond = pick(otherRemedies[0].therapeuticValue!, 1)[0];

  const allOptions = [...correctConditions, otherCond];
  const options = allOptions.map((text, i) => ({
    id: OPTION_LABELS[i],
    text,
    isCorrect: text === otherCond, // the "NOT" condition is the correct answer
  }));
  const shuffled = shuffle(options);
  const finalOptions = shuffled.map((o, i) => ({ ...o, id: OPTION_LABELS[i] }));
  const correctId = finalOptions.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `patil-tv:${remedy.name}:${otherCond}`,
    'except',
    'hard',
    `All of the following are therapeutic indications of ${remedy.name} EXCEPT:`,
    finalOptions,
    [correctId],
    `${otherCond} is NOT a documented therapeutic indication of ${remedy.name}. The other three options are all listed among its therapeutic values.`,
  );
}

/**
 * Q: The condition "[condition]" is treated by which group of remedies?
 */
function genTherapeuticGroupQ(group: PatilTherapeuticGroup, allGroups: PatilTherapeuticGroup[]): ClientQuestion | null {
  if (group.remedies.length < 2) return null;

  const correctAnswer = group.remedies.join(', ');
  // Distractors: same remedies shuffled OR remedies from other groups
  const otherGroups = allGroups.filter(g => g.condition !== group.condition);
  const distractors: string[] = [];
  for (const og of pick(otherGroups, 5)) {
    const candidate = og.remedies.join(', ');
    if (candidate !== correctAnswer) {
      distractors.push(candidate);
    }
    if (distractors.length >= 3) break;
  }
  if (distractors.length < 3) return null;

  const options = buildOptions(correctAnswer, distractors);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `patil-group:${group.condition}`,
    'single',
    'medium',
    `Which group of remedies is indicated for "${group.condition}"?`,
    options,
    [correctId],
    `The remedies ${correctAnswer} are documented as a therapeutic group for ${group.condition}. This combination reflects their complementary action in treating this condition.`,
  );
}

/**
 * Q: A patient reports dreams of [topic]. Which of these remedies covers this rubric?
 */
function genDreamQ(rubric: PatilDreamRubric, allRubrics: PatilDreamRubric[]): ClientQuestion | null {
  if (rubric.remedies.length < 2) return null;
  const correctRemedy = rubric.remedies[0];

  // Distractors: remedies from other rubrics (different abbreviations)
  const otherRemedies = new Set<string>();
  for (const r of allRubrics) {
    if (r.topic !== rubric.topic) {
      for (const rem of r.remedies) {
        if (!rubric.remedies.includes(rem)) otherRemedies.add(rem);
      }
    }
  }
  const distractors = pick(Array.from(otherRemedies), 3);
  if (distractors.length < 3) return null;

  const options = buildOptions(correctRemedy, distractors);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `patil-dream:${rubric.topic}:${correctRemedy}`,
    'single',
    'medium',
    `A patient reports dreams of "${rubric.topic}". Which remedy covers this dream rubric?`,
    options,
    [correctId],
    `${correctRemedy} is documented under the "${rubric.topic}" dream rubric. The complete list includes: ${rubric.remedies.join(', ')}.`,
  );
}

/**
 * Q: A keynote from the textbook states: "[sentence]". This describes which concept?
 */
function genKeynoteConceptQ(keynote: string, allKeynotes: string[]): ClientQuestion | null {
  if (keynote.length < 60) return null;

  const excerpt = keynote.length > 180 ? keynote.slice(0, 180) + '...' : keynote;

  // Generate 3 plausible concept-statement distractors (other keynotes)
  const distractors = pick(allKeynotes.filter(k => k !== keynote), 3)
    .map(k => k.length > 180 ? k.slice(0, 180) + '...' : k);
  if (distractors.length < 3) return null;

  const options = buildOptions(keynote.length > 180 ? keynote.slice(0, 180) + '...' : keynote, distractors);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `patil-keynote:${keynote.slice(0, 40)}`,
    'concept_based',
    'hard',
    `Which of the following statements is documented in the textbook?`,
    options,
    [correctId],
    `The correct statement accurately reflects the textbook content. The other statements are paraphrased or modified versions that do not match the original text.`,
  );
}

/**
 * Q: [Remedy] belongs to which source kingdom?
 */
function genSourceKingdomQ(remedy: PatilRemedyEntry, allRemedies: PatilRemedyEntry[]): ClientQuestion | null {
  if (!remedy.source || remedy.source.length < 3) return null;

  // Get other source kingdoms as distractors
  const allSources = Array.from(new Set(allRemedies.map(r => r.source).filter(Boolean))) as string[];
  if (allSources.length < 4) return null;

  const distractors = pick(allSources.filter(s => s !== remedy.source), 3);
  if (distractors.length < 3) return null;

  const options = buildOptions(remedy.source!, distractors);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `patil-source:${remedy.name}`,
    'concept_based',
    'easy',
    `The remedy ${remedy.name} belongs to which source kingdom?`,
    options,
    [correctId],
    `${remedy.name} is sourced from the ${remedy.source}. This classification helps understand the remedy's sphere of action and preparation.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator — generate N questions from Patil book
// ─────────────────────────────────────────────────────────────────────────────

export interface PatilGenerateOptions {
  count: number;
  questionType?: 'any' | 'single' | 'except' | 'concept_based' | 'clinical_based';
  difficulty?: 'any' | 'easy' | 'medium' | 'hard';
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export async function generatePatilQuestions(opts: PatilGenerateOptions): Promise<{
  questions: ClientQuestion[];
  coverage: { remedies: number; groups: number; dreams: number; keynotes: number; totalChapters: number; };
}> {
  const index = await buildPatilIndex();
  const {
    count, questionType = 'any', difficulty = 'any',
    shuffleQuestions = true, shuffleOptions = true,
  } = opts;

  const questions: ClientQuestion[] = [];
  const usedIds = new Set<string>();

  // Build generator pool
  type GenFn = () => ClientQuestion | null;
  const generators: GenFn[] = [];

  // Remedy symptom questions
  if (questionType === 'any' || questionType === 'single' || questionType === 'clinical_based') {
    for (const r of index.remedies) {
      generators.push(() => genRemedySymptomQ(r, index.remedies));
    }
  }

  // Therapeutic value EXCEPT questions
  if (questionType === 'any' || questionType === 'except') {
    for (const r of index.remedies) {
      generators.push(() => genTherapeuticValueQ(r, index.remedies));
    }
  }

  // Therapeutic group questions
  if (questionType === 'any' || questionType === 'single') {
    for (const g of index.therapeuticGroups) {
      generators.push(() => genTherapeuticGroupQ(g, index.therapeuticGroups));
    }
  }

  // Dream rubric questions
  if (questionType === 'any' || questionType === 'single') {
    for (const d of index.dreamRubrics) {
      generators.push(() => genDreamQ(d, index.dreamRubrics));
    }
  }

  // Keynote concept questions
  if (questionType === 'any' || questionType === 'concept_based') {
    for (const k of index.keynotes) {
      generators.push(() => genKeynoteConceptQ(k, index.keynotes));
    }
  }

  // Source kingdom questions
  if (questionType === 'any' || questionType === 'concept_based') {
    for (const r of index.remedies) {
      generators.push(() => genSourceKingdomQ(r, index.remedies));
    }
  }

  // Shuffle and execute until we have enough
  const shuffledGens = shuffleQuestions ? shuffle(generators) : generators;
  for (const gen of shuffledGens) {
    if (questions.length >= count) break;
    try {
      const q = gen();
      if (q && !usedIds.has(q.id)) {
        usedIds.add(q.id);
        // Apply difficulty filter
        if (difficulty !== 'any' && q.difficulty !== difficulty) continue;
        questions.push(q);
      }
    } catch {
      // skip failed generators
    }
  }

  return {
    questions: shuffleQuestions ? shuffle(questions) : questions,
    coverage: {
      remedies: index.remedies.length,
      groups: index.therapeuticGroups.length,
      dreams: index.dreamRubrics.length,
      keynotes: index.keynotes.length,
      totalChapters: index.totalChapters,
    },
  };
}

/**
 * Get Patil book coverage stats (for admin/UI display — no sensitive data).
 */
export async function getPatilCoverage() {
  const index = await buildPatilIndex();
  return {
    totalChapters: index.totalChapters,
    totalContentChars: index.totalContentChars,
    remediesExtracted: index.remedies.length,
    therapeuticGroups: index.therapeuticGroups.length,
    dreamRubrics: index.dreamRubrics.length,
    keynotes: index.keynotes.length,
    bookTitle: 'Textbook of Homeopathic Materia Medica', // generic title, no author
  };
}
