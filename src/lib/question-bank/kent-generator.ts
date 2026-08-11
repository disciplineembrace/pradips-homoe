/**
 * Kent's Materia Medica — Dedicated MCQ Generator
 *
 * Processes the COMPLETE "Lectures on Homoeopathic Materia Medica" by James Tyler Kent
 * (163 remedies, 6.1MB OCR text) and generates MCQs from:
 *
 *   1. Remedy introductions (what is this remedy indicated for?)
 *   2. Section headings (Mind, Chest, Generals, Marasmus, Metastasis, etc.)
 *   3. Symptom descriptions within sections
 *   4. Remedy comparisons mentioned in the text
 *   5. Key characteristic phrases
 *
 * Uses the SAME remedy structure as the Patil generator:
 *   - Bold remedy name headers (**Remedy Name**)
 *   - Bold section headings (**Introduction:**, **Mind:**, **Chest:**, etc.)
 *   - Clean content with no page numbers, no codes, no abbreviations
 *
 * CRITICAL:
 *   - Reads ONLY from data/books/kent-mm.json (existing file — no data loss)
 *   - NEVER modifies the source book
 *   - NEVER exposes book/author/chapter metadata to the client
 */
import { getBookById } from './sources';
import { splitSentences } from './safe-split';
import { cached } from '@/database/neon/repositories/base';
import type { ClientQuestion } from './generator';

const KENT_BOOK_ID = 'kent-mm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface KentRemedyEntry {
  name: string;
  introduction?: string;
  sections: KentSection[];
  keyPhrases: string[];
  comparisons: string[];      // mentions of other remedies
  chapterIndex: number;
  rawText: string;
}

interface KentSection {
  heading: string;            // e.g., "Introduction", "Mind", "Chest", "Marasmus"
  content: string;
  keySentences: string[];
}

interface KentIndex {
  remedies: KentRemedyEntry[];
  allSections: KentSection[];  // flat list for cross-remedy questions
  allKeyPhrases: string[];
  totalChapters: number;
  totalContentChars: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR cleaning
// ─────────────────────────────────────────────────────────────────────────────

function cleanOcrText(text: string): string {
  if (!text) return '';
  return text
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/([a-z,;:])\n([a-z])/g, '$1 $2')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a Kent remedy entry into structured sections.
 * Kent format:
 *   **Remedy Name**
 *
 *   **Introduction:** content...
 *
 *   **Mind:** content...
 *
 *   **Chest:** content...
 *   ...
 */
function parseRemedyEntry(name: string, rawContent: string, chapterIndex: number): KentRemedyEntry {
  const cleaned = cleanOcrText(rawContent);

  // Find all section headings: **Heading:** or **Heading** at start of line
  // Use a manual scan instead of /s flag (requires es2018)
  const sectionPattern = /\*\*([A-Z][a-zA-Z]+(?:\s+[a-z]+)?):?\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\Z)/g;
  const sections: KentSection[] = [];
  let introduction: string | undefined;
  let match;
  let lastIndex = 0;

  while ((match = sectionPattern.exec(cleaned)) !== null) {
    const heading = match[1].trim();
    const content = match[2].trim();

    if (content.length < 20) continue; // skip empty/too-short sections

    // Extract key sentences (60-250 chars, must be complete sentences)
    const keySentences = splitSentences(content)
      .map(s => s.trim())
      .filter(s => s.length >= 60 && s.length <= 250)
      .filter(s => /\b(is|are|was|were|has|have|can|may|should|must|the|a|an)\b/i.test(s))
      .slice(0, 5);

    sections.push({ heading, content, keySentences });

    if (heading.toLowerCase().includes('introduction') && !introduction) {
      introduction = content.slice(0, 500);
    }

    lastIndex = sectionPattern.lastIndex;
  }

  // If no sections found, treat entire content as one section
  if (sections.length === 0 && cleaned.length > 100) {
    const keySentences = splitSentences(cleaned)
      .map(s => s.trim())
      .filter(s => s.length >= 60 && s.length <= 250)
      .slice(0, 5);
    sections.push({ heading: 'General', content: cleaned, keySentences });
    introduction = cleaned.slice(0, 500);
  }

  // Extract key phrases (sentences with characteristic indicators)
  const allText = sections.map(s => s.content).join(' ');
  const keyPhrases = splitSentences(allText)
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 200)
    .filter(s => /\b(characteristic|marked|peculiar|important|keynote|strongly|typically|especially|chief|grand|main)\b/i.test(s))
    .slice(0, 10);

  // Extract remedy comparisons (other remedy names mentioned)
  // Only accept words that appear in the known remedy list (to avoid "Death", "It", etc.)
  const knownRemedyNames = new Set<string>(); // populated below after all remedies parsed
  const comparisonPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  const comparisons: string[] = [];
  let cMatch;
  const comparisonSet = new Set<string>();
  const nonRemedyWords = new Set([
    'The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'While',
    'In', 'On', 'At', 'To', 'For', 'With', 'From', 'By', 'As', 'An',
    'Is', 'Are', 'Was', 'Were', 'Has', 'Have', 'Had', 'Will', 'Would',
    'Could', 'Should', 'May', 'Might', 'Must', 'Can', 'Not', 'But',
    'And', 'Or', 'If', 'Then', 'Else', 'When', 'How', 'Why', 'What',
    'Who', 'Which', 'Whose', 'Whom', 'About', 'Above', 'Below',
    'Death', 'Life', 'Mind', 'Body', 'Soul', 'Spirit', 'Nature',
    'Patient', 'Man', 'Woman', 'Child', 'Case', 'Remedy', 'Symptom',
    'Disease', 'Cure', 'Health', 'Sick', 'Well', 'Good', 'Bad',
    'First', 'Second', 'Third', 'Last', 'Next', 'Some', 'Many', 'Most',
    'All', 'None', 'Both', 'Each', 'Every', 'Such', 'Same', 'Other',
    'Only', 'Very', 'Much', 'More', 'Less', 'Even', 'Still', 'Just',
    'Now', 'Then', 'Here', 'There', 'Always', 'Never', 'Sometimes',
    'Often', 'Seldom', 'Once', 'Twice', 'Again', 'Also', 'Too',
  ]);
  while ((cMatch = comparisonPattern.exec(allText)) !== null) {
    const comp = cMatch[1].trim();
    if (comp !== name && comp.length > 3 && comp.length < 30 && !nonRemedyWords.has(comp)) {
      if (!comparisonSet.has(comp.toLowerCase())) {
        comparisonSet.add(comp.toLowerCase());
        comparisons.push(comp);
      }
    }
    if (comparisons.length >= 20) break;
  }

  return {
    name,
    introduction,
    sections,
    keyPhrases,
    comparisons,
    chapterIndex,
    rawText: rawContent.slice(0, 2000),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the index (cached)
// ─────────────────────────────────────────────────────────────────────────────

async function buildKentIndex(): Promise<KentIndex> {
  return cached('qb:kent:index', async () => {
    const book = await getBookById(KENT_BOOK_ID);
    if (!book?.remedies || book.remedies.length === 0) {
      return {
        remedies: [], allSections: [], allKeyPhrases: [],
        totalChapters: 0, totalContentChars: 0,
      };
    }

    const remedies: KentRemedyEntry[] = [];
    const allSections: KentSection[] = [];
    const allKeyPhrases: string[] = [];
    let totalContentChars = 0;

    for (let i = 0; i < book.remedies.length; i++) {
      const r = book.remedies[i];
      const content = r.content || '';
      totalContentChars += content.length;

      const entry = parseRemedyEntry(r.name, content, i);
      remedies.push(entry);
      allSections.push(...entry.sections);
      allKeyPhrases.push(...entry.keyPhrases);
    }

    return {
      remedies,
      allSections,
      allKeyPhrases: Array.from(new Set(allKeyPhrases)).slice(0, 500),
      totalChapters: book.chapters?.length || 0,
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
  return 'kent_' + Math.abs(h).toString(36);
}

const OPTION_LABELS = ['a', 'b', 'c', 'd'];

function buildOptions(correctText: string, distractors: string[], shuffleOpts = true) {
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
 * Q: Which remedy is described in the following passage?
 *    "[introduction excerpt]" — with remedy name STRIPPED from the text
 */
function genIntroductionQ(remedy: KentRemedyEntry, allRemedies: KentRemedyEntry[]): ClientQuestion | null {
  if (!remedy.introduction || remedy.introduction.length < 60) return null;

  // Strip the remedy name from the excerpt so the answer isn't given away
  let excerpt = remedy.introduction;
  // Remove **Remedy Name** markdown bold header
  excerpt = excerpt.replace(/\*\*[^*]+\*\*/g, '');
  // Remove any mention of the remedy name (case-insensitive)
  const nameRegex = new RegExp(remedy.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  excerpt = excerpt.replace(nameRegex, '[this remedy]');
  // Clean up extra whitespace
  excerpt = excerpt.replace(/\s+/g, ' ').trim();

  if (excerpt.length < 60) return null;
  excerpt = excerpt.length > 180 ? excerpt.slice(0, 180) + '...' : excerpt;

  const distractorRemedies = pick(
    allRemedies.filter(r => r.name !== remedy.name), 3
  ).map(r => r.name);
  if (distractorRemedies.length < 3) return null;

  const options = buildOptions(remedy.name, distractorRemedies);
  const correctId = options.find(o => o.isCorrect)!.id;
  const difficulty = pickDifficulty();

  return makeClientQuestion(
    `kent-intro:${remedy.name}`,
    'single',
    difficulty,
    `Which remedy is described in the following passage?\n\n"${excerpt}"`,
    options,
    [correctId],
    `The passage describes the characteristic indications of ${remedy.name}. The description matches the symptom profile and clinical applications documented in the lecture on this remedy.`,
  );
}

/**
 * Q: Which section heading in [Remedy] discusses [topic from content]?
 * Excerpt is cleaned (no bold markers, no remedy name).
 */
function genSectionTopicQ(remedy: KentRemedyEntry, allRemedies: KentRemedyEntry[]): ClientQuestion | null {
  if (remedy.sections.length < 2) return null;
  const section = pick(remedy.sections, 1)[0];
  if (!section.keySentences || section.keySentences.length === 0) return null;

  let sentence = pick(section.keySentences, 1)[0];
  // Clean the sentence
  sentence = sentence.replace(/\*\*[^*]+\*\*/g, '');
  const nameRegex = new RegExp(remedy.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  sentence = sentence.replace(nameRegex, '[this remedy]');
  sentence = sentence.replace(/\s+/g, ' ').trim();
  if (sentence.length < 40) return null;

  const excerpt = sentence.length > 150 ? sentence.slice(0, 150) + '...' : sentence;

  // Distractors: section headings from other remedies
  const otherRemedies = allRemedies.filter(r => r.name !== remedy.name && r.sections.length > 0);
  if (otherRemedies.length < 3) return null;
  const distractorHeadings: string[] = [];
  for (const r of pick(otherRemedies, 5)) {
    const s = pick(r.sections, 1)[0];
    if (s && s.heading !== section.heading && !distractorHeadings.includes(s.heading)) {
      distractorHeadings.push(s.heading);
    }
    if (distractorHeadings.length >= 3) break;
  }
  if (distractorHeadings.length < 3) return null;

  const options = buildOptions(section.heading, distractorHeadings);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `kent-section:${remedy.name}:${section.heading}`,
    'chapter_based',
    'medium',
    `The following content appears under which section heading?\n\n"${excerpt}"`,
    options,
    [correctId],
    `This content is discussed under the "${section.heading}" section. The section covers specific aspects of a remedy's symptom picture.`,
  );
}

/**
 * Q: Which remedy has the following characteristic?
 *    "[key phrase]" — with remedy name STRIPPED
 */
function genKeyPhraseQ(remedy: KentRemedyEntry, allRemedies: KentRemedyEntry[]): ClientQuestion | null {
  if (remedy.keyPhrases.length === 0) return null;
  const phrase = pick(remedy.keyPhrases, 1)[0];
  if (!phrase || phrase.length < 40) return null;

  // Strip remedy name and bold markers from the phrase
  let excerpt = phrase.replace(/\*\*[^*]+\*\*/g, '');
  const nameRegex = new RegExp(remedy.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  excerpt = excerpt.replace(nameRegex, '[this remedy]');
  excerpt = excerpt.replace(/\s+/g, ' ').trim();

  if (excerpt.length < 40) return null;
  excerpt = excerpt.length > 180 ? excerpt.slice(0, 180) + '...' : excerpt;

  const distractorRemedies = pick(
    allRemedies.filter(r => r.name !== remedy.name), 3
  ).map(r => r.name);
  if (distractorRemedies.length < 3) return null;

  const options = buildOptions(remedy.name, distractorRemedies);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `kent-keyphrase:${remedy.name}:${phrase.slice(0, 30)}`,
    'single',
    'hard',
    `Which remedy has the following characteristic?\n\n"${excerpt}"`,
    options,
    [correctId],
    `The described characteristic is a keynote of ${remedy.name}. This feature helps differentiate it from other remedies with similar symptom pictures.`,
  );
}

/**
 * Q: [Remedy] is often compared with which of the following?
 * Only uses comparison candidates that are ACTUAL remedy names from the book.
 */
function genComparisonQ(remedy: KentRemedyEntry, allRemedies: KentRemedyEntry[]): ClientQuestion | null {
  // Build a set of known remedy names for validation
  const knownRemedyNames = new Set(allRemedies.map(r => r.name));
  // Filter comparisons to only include known remedy names
  const validComparisons = remedy.comparisons.filter(c => knownRemedyNames.has(c));
  if (validComparisons.length < 1) return null;

  const correctComparison = pick(validComparisons, 1)[0];
  // Distractors: remedy names NOT in the comparisons list
  const otherRemedies = allRemedies
    .map(r => r.name)
    .filter(n => n !== remedy.name && !remedy.comparisons.includes(n));
  const distractors = pick(otherRemedies, 3);
  if (distractors.length < 3) return null;

  const options = buildOptions(correctComparison, distractors);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `kent-comparison:${remedy.name}:${correctComparison}`,
    'single',
    'medium',
    `In the lecture on ${remedy.name}, which remedy is mentioned for comparison?`,
    options,
    [correctId],
    `${correctComparison} is mentioned in the ${remedy.name} lecture as a related remedy for comparison. This comparative study helps differentiate remedies with similar symptom pictures.`,
  );
}

/**
 * Q: Which of the following statements about [Remedy] is documented in the lecture?
 * Options are cleaned (no bold markers, no newlines, trimmed).
 */
function genStatementQ(remedy: KentRemedyEntry, allRemedies: KentRemedyEntry[]): ClientQuestion | null {
  if (remedy.keyPhrases.length === 0) return null;
  const correctStatement = pick(remedy.keyPhrases, 1)[0];
  if (!correctStatement || correctStatement.length < 60) return null;

  const otherRemedies = allRemedies.filter(r => r.name !== remedy.name && r.keyPhrases.length > 0);
  if (otherRemedies.length < 3) return null;
  const distractors: string[] = [];
  for (const r of pick(otherRemedies, 5)) {
    if (r.keyPhrases.length > 0) {
      const p = pick(r.keyPhrases, 1)[0];
      if (p && p !== correctStatement && !distractors.includes(p)) {
        // Clean the statement
        const cleaned = p.replace(/\*\*[^*]+\*\*/g, '').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 40) {
          distractors.push(cleaned.length > 180 ? cleaned.slice(0, 180) + '...' : cleaned);
        }
      }
    }
    if (distractors.length >= 3) break;
  }
  if (distractors.length < 3) return null;

  // Clean the correct statement
  const correctText = correctStatement
    .replace(/\*\*[^*]+\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  if (correctText.length < 40) return null;

  const options = buildOptions(
    correctText + (correctStatement.length > 180 ? '...' : ''),
    distractors,
  );
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `kent-statement:${remedy.name}:${correctStatement.slice(0, 30)}`,
    'statement_based',
    'hard',
    `Which of the following statements about ${remedy.name} is documented in the lecture?`,
    options,
    [correctId],
    `The correct statement accurately reflects the content of the ${remedy.name} lecture. The other statements describe different remedies and do not apply to ${remedy.name}.`,
  );
}

/**
 * Q: Which remedy is indicated for the following clinical picture?
 *    "[introduction excerpt]" — clinical scenario style
 *    Strips the remedy name from the scenario so the answer isn't given away.
 */
function genClinicalQ(remedy: KentRemedyEntry, allRemedies: KentRemedyEntry[]): ClientQuestion | null {
  if (!remedy.introduction || remedy.introduction.length < 80) return null;

  // Strip remedy name from the scenario
  let scenario = remedy.introduction;
  scenario = scenario.replace(/\*\*[^*]+\*\*/g, '');
  const nameRegex = new RegExp(remedy.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  scenario = scenario.replace(nameRegex, '[this remedy]');
  scenario = scenario.replace(/\s+/g, ' ').trim();

  if (scenario.length < 80) return null;
  scenario = scenario.length > 200 ? scenario.slice(0, 200) + '...' : scenario;

  const distractorRemedies = pick(
    allRemedies.filter(r => r.name !== remedy.name), 3
  ).map(r => r.name);
  if (distractorRemedies.length < 3) return null;

  const options = buildOptions(remedy.name, distractorRemedies);
  const correctId = options.find(o => o.isCorrect)!.id;

  return makeClientQuestion(
    `kent-clinical:${remedy.name}`,
    'clinical_based',
    'hard',
    `A patient presents with the following clinical picture:\n\n"${scenario}"\n\nWhich remedy is most indicated?`,
    options,
    [correctId],
    `The clinical picture described matches the symptom profile of ${remedy.name}. The characteristic indications align with this remedy's documented symptom picture.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export interface KentGenerateOptions {
  count: number;
  questionType?: 'any' | 'single' | 'clinical_based' | 'statement_based' | 'chapter_based';
  difficulty?: 'any' | 'easy' | 'medium' | 'hard';
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export async function generateKentQuestions(opts: KentGenerateOptions): Promise<{
  questions: ClientQuestion[];
  coverage: { remedies: number; sections: number; keyPhrases: number; totalChapters: number; };
}> {
  const index = await buildKentIndex();
  const {
    count, questionType = 'any', difficulty = 'any',
    shuffleQuestions = true, shuffleOptions = true,
  } = opts;

  const questions: ClientQuestion[] = [];
  const usedIds = new Set<string>();

  type GenFn = () => ClientQuestion | null;
  const generators: GenFn[] = [];

  // Introduction questions
  if (questionType === 'any' || questionType === 'single') {
    for (const r of index.remedies) {
      generators.push(() => genIntroductionQ(r, index.remedies));
    }
  }

  // Section topic questions
  if (questionType === 'any' || questionType === 'chapter_based') {
    for (const r of index.remedies) {
      generators.push(() => genSectionTopicQ(r, index.remedies));
    }
  }

  // Key phrase questions
  if (questionType === 'any' || questionType === 'single') {
    for (const r of index.remedies) {
      generators.push(() => genKeyPhraseQ(r, index.remedies));
    }
  }

  // Comparison questions
  if (questionType === 'any' || questionType === 'single') {
    for (const r of index.remedies) {
      generators.push(() => genComparisonQ(r, index.remedies));
    }
  }

  // Statement questions
  if (questionType === 'any' || questionType === 'statement_based') {
    for (const r of index.remedies) {
      generators.push(() => genStatementQ(r, index.remedies));
    }
  }

  // Clinical scenario questions
  if (questionType === 'any' || questionType === 'clinical_based') {
    for (const r of index.remedies) {
      generators.push(() => genClinicalQ(r, index.remedies));
    }
  }

  const shuffledGens = shuffleQuestions ? shuffle(generators) : generators;
  for (const gen of shuffledGens) {
    if (questions.length >= count) break;
    try {
      const q = gen();
      if (q && !usedIds.has(q.id)) {
        usedIds.add(q.id);
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
      sections: index.allSections.length,
      keyPhrases: index.allKeyPhrases.length,
      totalChapters: index.totalChapters,
    },
  };
}

/**
 * Get Kent book coverage stats (no sensitive data).
 */
export async function getKentCoverage() {
  const index = await buildKentIndex();
  return {
    totalChapters: index.totalChapters,
    totalContentChars: index.totalContentChars,
    remediesExtracted: index.remedies.length,
    totalSections: index.allSections.length,
    keyPhrases: index.allKeyPhrases.length,
    bookTitle: 'Lectures on Homoeopathic Materia Medica',
  };
}
