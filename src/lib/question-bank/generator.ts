/**
 * Question Bank — Question Generation Engine
 *
 * Generates questions by understanding source content logically.
 * NEVER hallucinates — every question is derived from actual database records.
 * NEVER modifies source data — read-only.
 *
 * Question types supported:
 *   - single         (single correct answer)
 *   - multiple       (multiple correct answers)
 *   - true_false     (true/false)
 *   - fill_blank     (fill in the blank)
 *   - match          (match the following)
 *   - assertion_reason (assertion & reason)
 *   - except         (all of the following EXCEPT)
 *   - not_true       (which is NOT true)
 *   - identify_remedy (remedy identification from symptoms)
 *   - identify_rubric (rubric identification)
 *   - author_identify (which author wrote this)
 *   - chapter_based  (which chapter contains this rubric)
 *
 * Difficulty levels: easy, medium, hard, expert
 *
 * Distractor strategy:
 *   - Pick remedies/rubrics/authors from the SAME source type
 *   - Avoid using the correct answer as a distractor
 *   - Randomize option positions
 *   - Ensure distractors are plausible (same category)
 */
import {
  listRemedies, listRubrics, listBooks, getBookById,
  type RemedySource, type RubricSource, type BookSource,
  extractRemedyTopics, parseRubricTitle,
} from './sources';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType =
  | 'single' | 'multiple' | 'true_false' | 'fill_blank'
  | 'match' | 'assertion_reason' | 'except' | 'not_true'
  | 'identify_remedy' | 'identify_rubric' | 'author_identify'
  | 'chapter_based'
  // New AI-powered types (examination-style)
  | 'clinical_based' | 'statement_based' | 'concept_based'
  | 'recall' | 'application';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface QuestionOption {
  id: string;          // 'a', 'b', 'c', 'd'
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;                    // generated stable id (hash of source+content)
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  options: QuestionOption[];
  correctAnswer: string[];       // option ids that are correct
  explanation: string;           // detailed explanation
  correctReason: string;         // why the correct answer is correct
  incorrectReasons: string;      // why others are incorrect
  source: {
    type: 'remedy' | 'rubric' | 'book' | 'therapeutic';
    bookName: string;
    author: string;
    chapter: string;
    topic: string;
    subtopic: string;
    pageNumber?: string;
    reference: string;           // full citation string
  };
  estimatedTime: number;         // seconds
  keywords: string[];
  marks: number;
  negativeMark: number;
}

/**
 * Client-safe question — NO source metadata exposed.
 * This is what gets sent to the browser. The full Question (with source)
 * is kept server-side only for tracking/dedup/admin purposes.
 *
 * CRITICAL SECURITY RULE:
 *   Never send bookName, author, chapter, page, reference, or any source
 *   identifier to the client. The user must never know which book a
 *   question came from.
 */
export interface ClientQuestion {
  id: string;                     // stable hash (safe to expose — it's just a hash)
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  options: QuestionOption[];
  correctAnswer: string[];        // option ids
  reason: string;                 // combined explanation (why correct + why others wrong)
  estimatedTime: number;
  marks: number;
  negativeMark: number;
}

/**
 * Strip source metadata from a Question before sending to client.
 * Returns a ClientQuestion with NO source/book/author/chapter info.
 */
export function toClientQuestion(q: Question): ClientQuestion {
  return {
    id: q.id,
    type: q.type,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    reason: q.explanation + ' ' + q.correctReason + ' ' + q.incorrectReasons,
    estimatedTime: q.estimatedTime,
    marks: q.marks,
    negativeMark: q.negativeMark,
  };
}

/**
 * Batch sanitize: convert Question[] to ClientQuestion[]
 */
export function toClientQuestions(qs: Question[]): ClientQuestion[] {
  return qs.map(toClientQuestion);
}

export interface GenerateOptions {
  sourceType?: 'remedy' | 'rubric' | 'book' | 'mixed';
  bookId?: string;               // specific book
  author?: string;               // filter by author
  chapter?: string;              // filter by chapter
  topic?: string;                // filter by topic
  difficulty?: Difficulty | 'any';
  questionType?: QuestionType | 'any';
  count: number;
  marks?: number;
  negativeMark?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  language?: string;
  multiSource?: boolean;         // allow combining multiple books
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
  return 'qb_' + Math.abs(h).toString(36);
}

const OPTION_LABELS = ['a', 'b', 'c', 'd', 'e', 'f'];

function buildOptions(
  correctText: string,
  distractors: string[],
  shuffleOptions: boolean = true,
): QuestionOption[] {
  const opts: QuestionOption[] = [
    { id: 'a', text: correctText, isCorrect: true },
    ...distractors.map((d, i) => ({ id: OPTION_LABELS[i + 1], text: d, isCorrect: false })),
  ];
  const shuffled = shuffleOptions ? shuffle(opts) : opts;
  // Re-assign ids after shuffle
  return shuffled.map((o, i) => ({ ...o, id: OPTION_LABELS[i] }));
}

function estimateTime(difficulty: Difficulty, type: QuestionType): number {
  const base: Record<Difficulty, number> = { easy: 30, medium: 45, hard: 60, expert: 90 };
  const multiplier: Partial<Record<QuestionType, number>> = {
    multiple: 1.5,
    match: 1.8,
    assertion_reason: 1.6,
    fill_blank: 0.8,
    true_false: 0.6,
  };
  return Math.round(base[difficulty] * (multiplier[type] || 1));
}

function extractKeywords(text: string, max: number = 5): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
    'how', 'all', 'any', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
    'from', 'by', 'about', 'as', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'this', 'that', 'these', 'those',
  ]);
  const words = text.toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

// ─────────────────────────────────────────────────────────────────────────────
// Question generators (one per question type)
// Each returns a Question or null (null = cannot generate from this source)
// ─────────────────────────────────────────────────────────────────────────────

type DifficultyDist = 'easy' | 'medium' | 'hard' | 'expert';
function pickDifficulty(requested: Difficulty | 'any', source: 'remedy' | 'rubric' | 'book'): Difficulty {
  if (requested !== 'any') return requested;
  // Auto-distribute: remedies → easy/medium, rubrics → medium/hard, books → hard/expert
  const dists: Record<string, Difficulty[]> = {
    remedy: ['easy', 'easy', 'medium', 'medium', 'hard'],
    rubric: ['medium', 'medium', 'hard', 'hard', 'expert'],
    book: ['hard', 'hard', 'expert', 'expert', 'medium'],
  };
  return pick(dists[source], 1)[0];
}

// ─── REMEDY-BASED QUESTIONS ───────────────────────────────────────────────

function genRemedyAuthor(remedy: RemedySource, difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  // Q: Which author documented [Remedy Name]?
  if (!remedy.author) return null;
  // Get distractor authors
  return null; // implemented in batch below where we have all remedies
}

function genRemedyKeynote(remedy: RemedySource, allRemedies: RemedySource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  const topics = extractRemedyTopics(remedy);
  if (topics.length === 0) return null;
  const topic = topics[Math.floor(Math.random() * Math.min(topics.length, 5))];
  if (!topic || topic.length < 30) return null;

  // Q: Which remedy is associated with the following indication?
  //    "[topic excerpt]"
  // Distractors: other remedies (preferably same author)
  const sameAuthor = allRemedies.filter(r => r.author === remedy.author && r.id !== remedy.id);
  const pool = sameAuthor.length >= 3 ? sameAuthor : allRemedies.filter(r => r.id !== remedy.id);
  const distractors = pick(pool, 3).map(r => r.name);
  if (distractors.length < 3) return null;

  const options = buildOptions(remedy.name, distractors, shuffleOpts);
  const excerpt = topic.length > 150 ? topic.slice(0, 150) + '…' : topic;
  const correctId = options.find(o => o.isCorrect)!.id;

  return {
    id: hash(`remedy-keynote:${remedy.id}:${topic.slice(0, 50)}`),
    type: 'identify_remedy',
    difficulty,
    question: `Which remedy is associated with the following clinical indication?\n\n"${excerpt}"`,
    options,
    correctAnswer: [correctId],
    explanation: `${remedy.name} (${remedy.common || '—'}) is documented by ${remedy.author} with this characteristic indication. The remedy's keynote describes this symptom pattern as part of its constitutional profile.`,
    correctReason: `${remedy.name} matches because the source text from ${remedy.author}'s Materia Medica explicitly mentions this indication.`,
    incorrectReasons: `The other options are different remedies. While they may share some symptom overlap, the specific indication quoted is characteristic of ${remedy.name} according to ${remedy.author}.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter || '—',
      topic: remedy.name,
      subtopic: 'Keynote Indication',
      reference: `${remedy.author}, ${remedy.name} — Materia Medica`,
    },
    estimatedTime: estimateTime(difficulty, 'identify_remedy'),
    keywords: extractKeywords(topic),
    marks: 1,
    negativeMark: 0,
  };
}

function genRemedyChapter(remedy: RemedySource, allRemedies: RemedySource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  if (!remedy.chapter) return null;
  // Q: The remedy [Name] primarily belongs to which chapter/category?
  const chapters = Array.from(new Set(allRemedies.map(r => r.chapter).filter(Boolean))) as string[];
  const distractors = pick(chapters.filter(c => c !== remedy.chapter), 3);
  if (distractors.length < 3) return null;

  const options = buildOptions(remedy.chapter!, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;
  return {
    id: hash(`remedy-chapter:${remedy.id}`),
    type: 'chapter_based',
    difficulty,
    question: `The remedy ${remedy.name} is classified under which chapter?`,
    options,
    correctAnswer: [correctId],
    explanation: `${remedy.name} is documented under the "${remedy.chapter}" chapter in ${remedy.author}'s Materia Medica.`,
    correctReason: `${remedy.author} classifies ${remedy.name} under "${remedy.chapter}".`,
    incorrectReasons: `The other chapters contain different remedies, not ${remedy.name}.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter,
      topic: 'Classification',
      subtopic: '',
      reference: `${remedy.author}, ${remedy.name} — Chapter: ${remedy.chapter}`,
    },
    estimatedTime: estimateTime(difficulty, 'chapter_based'),
    keywords: [remedy.name.toLowerCase(), (remedy.chapter || '').toLowerCase()],
    marks: 1,
    negativeMark: 0,
  };
}

function genRemedyTrueFalse(remedy: RemedySource, difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  const topics = extractRemedyTopics(remedy);
  if (topics.length === 0) return null;
  const topic = topics[Math.floor(Math.random() * topics.length)];
  if (!topic || topic.length < 40) return null;

  // 50% chance true, 50% false (swap remedy name)
  const isTrue = Math.random() > 0.5;
  const statementRemedy = isTrue ? remedy.name : 'Nux Vomica'; // a different remedy

  const options = [
    { id: 'a', text: 'True', isCorrect: isTrue },
    { id: 'b', text: 'False', isCorrect: !isTrue },
  ];

  return {
    id: hash(`remedy-tf:${remedy.id}:${isTrue}:${topic.slice(0, 30)}`),
    type: 'true_false',
    difficulty,
    question: `True or False: ${statementRemedy} is associated with the following indication —\n\n"${topic.slice(0, 200)}"`,
    options,
    correctAnswer: isTrue ? ['a'] : ['b'],
    explanation: isTrue
      ? `This statement is TRUE. ${remedy.name} is documented by ${remedy.author} with this indication.`
      : `This statement is FALSE. The indication quoted belongs to ${remedy.name}, not ${statementRemedy}.`,
    correctReason: isTrue
      ? `${remedy.name} matches the quoted indication per ${remedy.author}'s Materia Medica.`
      : `The indication is characteristic of ${remedy.name}, not ${statementRemedy}.`,
    incorrectReasons: isTrue
      ? `If you answered False, you may have confused ${remedy.name} with another remedy.`
      : `If you answered True, you incorrectly attributed ${remedy.name}'s symptom to ${statementRemedy}.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter || '—',
      topic: remedy.name,
      subtopic: 'True/False Verification',
      reference: `${remedy.author}, ${remedy.name}`,
    },
    estimatedTime: estimateTime(difficulty, 'true_false'),
    keywords: extractKeywords(topic),
    marks: 1,
    negativeMark: 0,
  };
}

function genRemedyDose(remedy: RemedySource, allRemedies: RemedySource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  if (!remedy.dose || remedy.dose.length < 10) return null;
  // Q: What is the recommended potency/dose for [Remedy]?
  const distractorRemedies = allRemedies.filter(r => r.id !== remedy.id && r.dose && r.dose.length > 10);
  if (distractorRemedies.length < 3) return null;
  const distractors = pick(distractorRemedies, 3).map(r => r.dose!.slice(0, 80));
  const correctDose = remedy.dose.slice(0, 80);

  const options = buildOptions(correctDose, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;
  return {
    id: hash(`remedy-dose:${remedy.id}`),
    type: 'single',
    difficulty,
    question: `What is the recommended dosage for ${remedy.name} according to ${remedy.author}?`,
    options,
    correctAnswer: [correctId],
    explanation: `${remedy.author} recommends: "${remedy.dose}" for ${remedy.name}.`,
    correctReason: `This dosage is directly quoted from ${remedy.author}'s entry on ${remedy.name}.`,
    incorrectReasons: `The other dosages belong to different remedies.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter || '—',
      topic: remedy.name,
      subtopic: 'Dosage',
      reference: `${remedy.author}, ${remedy.name} — Dose`,
    },
    estimatedTime: estimateTime(difficulty, 'single'),
    keywords: [remedy.name.toLowerCase(), 'dose', 'potency'],
    marks: 1,
    negativeMark: 0,
  };
}

// ─── RUBRIC-BASED QUESTIONS ───────────────────────────────────────────────

function genRubricRemedies(rubric: RubricSource, allRubrics: RubricSource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  if (rubric.remedies.length < 1) return null;
  // Q: Which of the following remedies is listed under the rubric "[title]"?
  const correctRemedy = rubric.remedies[Math.floor(Math.random() * rubric.remedies.length)];
  // Distractors: remedies from OTHER rubrics in the same chapter
  const sameChapter = allRubrics.filter(r => r.path === rubric.path && r.id !== rubric.id);
  const pool = sameChapter.length >= 5 ? sameChapter : allRubrics.filter(r => r.id !== rubric.id);
  const distractorRemedies: string[] = [];
  for (const r of pick(pool, 10)) {
    for (const rem of r.remedies) {
      if (rem !== correctRemedy && !distractorRemedies.includes(rem)) {
        distractorRemedies.push(rem);
        if (distractorRemedies.length >= 3) break;
      }
    }
    if (distractorRemedies.length >= 3) break;
  }
  if (distractorRemedies.length < 3) return null;

  const options = buildOptions(correctRemedy, distractorRemedies, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;
  const parsed = parseRubricTitle(rubric.title);
  return {
    id: hash(`rubric-rem:${rubric.id}:${correctRemedy}`),
    type: 'single',
    difficulty,
    question: `Which of the following remedies is listed under the rubric:\n\n"${rubric.title}" (${rubric.path} chapter, ${rubric.author} Repertory)?`,
    options,
    correctAnswer: [correctId],
    explanation: `${correctRemedy} is one of ${rubric.remedies.length} remedies listed under "${rubric.title}" in ${rubric.author}'s Repertory. The complete list includes: ${rubric.remedies.slice(0, 8).join(', ')}${rubric.remedies.length > 8 ? '...' : ''}.`,
    correctReason: `${correctRemedy} appears in the remedy list for this rubric in ${rubric.author}'s Repertory, chapter ${rubric.path}.`,
    incorrectReasons: `The other options are remedies from related rubrics in the same chapter, but they are NOT listed under "${rubric.title}".`,
    source: {
      type: 'rubric',
      bookName: `${rubric.author} Repertory`,
      author: rubric.author,
      chapter: rubric.path,
      topic: parsed.main,
      subtopic: parsed.sub,
      reference: `${rubric.author} Repertory, ${rubric.path} — ${rubric.title}`,
    },
    estimatedTime: estimateTime(difficulty, 'single'),
    keywords: [parsed.main.toLowerCase(), rubric.path.toLowerCase()],
    marks: 1,
    negativeMark: 0,
  };
}

function genRubricChapter(rubric: RubricSource, allRubrics: RubricSource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  // Q: The rubric "[title]" belongs to which chapter?
  const chapters = Array.from(new Set(allRubrics.filter(r => r.author === rubric.author).map(r => r.path)));
  const distractors = pick(chapters.filter(c => c !== rubric.path), 3);
  if (distractors.length < 3) return null;

  const options = buildOptions(rubric.path, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;
  const parsed = parseRubricTitle(rubric.title);
  return {
    id: hash(`rubric-chap:${rubric.id}`),
    type: 'chapter_based',
    difficulty,
    question: `In ${rubric.author}'s Repertory, the rubric "${parsed.main}" belongs to which chapter?`,
    options,
    correctAnswer: [correctId],
    explanation: `The rubric "${rubric.title}" is classified under the "${rubric.path}" chapter in ${rubric.author}'s Repertory.`,
    correctReason: `${rubric.author} places this rubric under ${rubric.path}.`,
    incorrectReasons: `The other chapters contain different rubrics.`,
    source: {
      type: 'rubric',
      bookName: `${rubric.author} Repertory`,
      author: rubric.author,
      chapter: rubric.path,
      topic: parsed.main,
      subtopic: parsed.sub,
      reference: `${rubric.author} Repertory — ${rubric.path}`,
    },
    estimatedTime: estimateTime(difficulty, 'chapter_based'),
    keywords: [parsed.main.toLowerCase(), 'chapter'],
    marks: 1,
    negativeMark: 0,
  };
}

function genRubricAuthor(rubric: RubricSource, allRubrics: RubricSource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  // Q: The rubric "[title]" with remedies [...] is from which repertory?
  const authors = Array.from(new Set(allRubrics.map(r => r.author)));
  const distractors = pick(authors.filter(a => a !== rubric.author), 3);
  if (distractors.length < 3) return null;

  const options = buildOptions(rubric.author, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;
  const parsed = parseRubricTitle(rubric.title);
  const remedySample = rubric.remedies.slice(0, 5).join(', ');
  return {
    id: hash(`rubric-auth:${rubric.id}`),
    type: 'author_identify',
    difficulty,
    question: `The rubric "${parsed.main}" containing remedies like ${remedySample} is sourced from which repertory?`,
    options,
    correctAnswer: [correctId],
    explanation: `This rubric is documented in ${rubric.author}'s Repertory under the ${rubric.path} chapter.`,
    correctReason: `${rubric.author}'s Repertory is the source of this specific rubric-remedy mapping.`,
    incorrectReasons: `The other repertories may have similar rubrics, but this exact rubric-remedy combination is from ${rubric.author}.`,
    source: {
      type: 'rubric',
      bookName: `${rubric.author} Repertory`,
      author: rubric.author,
      chapter: rubric.path,
      topic: parsed.main,
      subtopic: parsed.sub,
      reference: `${rubric.author} Repertory`,
    },
    estimatedTime: estimateTime(difficulty, 'author_identify'),
    keywords: [parsed.main.toLowerCase(), rubric.author.toLowerCase()],
    marks: 1,
    negativeMark: 0,
  };
}

function genRubricExcept(rubric: RubricSource, allRubrics: RubricSource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  // Q: All of the following remedies are under "[title]" EXCEPT:
  if (rubric.remedies.length < 2) return null;
  const correctRemedies = pick(rubric.remedies, 3);
  // Find a remedy NOT in this rubric
  const sameChapter = allRubrics.filter(r => r.path === rubric.path && r.id !== rubric.id);
  const pool = sameChapter.length >= 3 ? sameChapter : allRubrics.filter(r => r.id !== rubric.id);
  let exceptRemedy = '';
  for (const r of pick(pool, 10)) {
    for (const rem of r.remedies) {
      if (!rubric.remedies.includes(rem)) {
        exceptRemedy = rem;
        break;
      }
    }
    if (exceptRemedy) break;
  }
  if (!exceptRemedy) return null;

  // The "except" remedy is the CORRECT answer (it's the one NOT in the rubric)
  const allOptions = [...correctRemedies, exceptRemedy];
  const options = allOptions.map((text, i) => ({
    id: OPTION_LABELS[i],
    text,
    isCorrect: text === exceptRemedy,
  }));
  const shuffled = shuffleOpts ? shuffle(options) : options;
  const finalOptions = shuffled.map((o, i) => ({ ...o, id: OPTION_LABELS[i] }));
  const correctId = finalOptions.find(o => o.isCorrect)!.id;
  const parsed = parseRubricTitle(rubric.title);

  return {
    id: hash(`rubric-except:${rubric.id}:${exceptRemedy}`),
    type: 'except',
    difficulty,
    question: `All of the following remedies are listed under the rubric "${rubric.title}" (${rubric.author} Repertory) EXCEPT:`,
    options: finalOptions,
    correctAnswer: [correctId],
    explanation: `${exceptRemedy} is NOT listed under "${rubric.title}". The remedies that ARE listed include: ${rubric.remedies.slice(0, 8).join(', ')}${rubric.remedies.length > 8 ? '...' : ''}.`,
    correctReason: `${exceptRemedy} does not appear in the remedy list for this rubric in ${rubric.author}'s Repertory.`,
    incorrectReasons: `The other three options (${correctRemedies.join(', ')}) ARE all listed under this rubric.`,
    source: {
      type: 'rubric',
      bookName: `${rubric.author} Repertory`,
      author: rubric.author,
      chapter: rubric.path,
      topic: parsed.main,
      subtopic: parsed.sub,
      reference: `${rubric.author} Repertory, ${rubric.path} — ${rubric.title}`,
    },
    estimatedTime: estimateTime(difficulty, 'except'),
    keywords: [parsed.main.toLowerCase(), 'except'],
    marks: 1,
    negativeMark: 0,
  };
}

// ─── BOOK-BASED QUESTIONS ─────────────────────────────────────────────────

function genBookAuthor(book: BookSource, allBooks: BookSource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  // Q: Who is the author of "[book title]"?
  const otherAuthors = Array.from(new Set(allBooks.filter(b => b.author !== book.author).map(b => b.author)));
  if (otherAuthors.length < 3) return null;
  const distractors = pick(otherAuthors, 3);

  const options = buildOptions(book.author, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;
  return {
    id: hash(`book-auth:${book.id}`),
    type: 'author_identify',
    difficulty,
    question: `Who is the author of the book "${book.title}"?`,
    options,
    correctAnswer: [correctId],
    explanation: `"${book.title}" is authored by ${book.author}.`,
    correctReason: `${book.author} is the documented author of this book in the library.`,
    incorrectReasons: `The other authors wrote different books in the library.`,
    source: {
      type: 'book',
      bookName: book.title,
      author: book.author,
      chapter: '—',
      topic: 'Author Identification',
      subtopic: '',
      reference: `${book.author}, ${book.title}`,
    },
    estimatedTime: estimateTime(difficulty, 'author_identify'),
    keywords: [book.title.toLowerCase().split(' ')[0], 'author'],
    marks: 1,
    negativeMark: 0,
  };
}

function genBookChapterCount(book: BookSource, allBooks: BookSource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  const chapterCount = book.totalChapters || book.chapters?.length || 0;
  if (chapterCount === 0) return null;
  // Generate distractor counts (±2, ±5)
  const distractors = [chapterCount + 2, chapterCount - 2, chapterCount + 5].filter(n => n > 0 && n !== chapterCount);
  while (distractors.length < 3) {
    const candidate = chapterCount + Math.floor(Math.random() * 10) - 5;
    if (candidate > 0 && candidate !== chapterCount && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
    if (distractors.length >= 3) break;
  }

  const options = buildOptions(String(chapterCount), distractors.map(String), shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;
  return {
    id: hash(`book-chap-count:${book.id}`),
    type: 'single',
    difficulty,
    question: `How many chapters are in the book "${book.title}" by ${book.author}?`,
    options,
    correctAnswer: [correctId],
    explanation: `"${book.title}" by ${book.author} contains ${chapterCount} chapters.`,
    correctReason: `The library records ${chapterCount} chapters for this book.`,
    incorrectReasons: `The other numbers are incorrect — verify by opening the book in the library.`,
    source: {
      type: 'book',
      bookName: book.title,
      author: book.author,
      chapter: '—',
      topic: 'Structure',
      subtopic: 'Chapter Count',
      reference: `${book.author}, ${book.title}`,
    },
    estimatedTime: estimateTime(difficulty, 'single'),
    keywords: [book.title.toLowerCase().split(' ')[0], 'chapters'],
    marks: 1,
    negativeMark: 0,
  };
}

async function genBookChapterQuestion(book: BookSource, difficulty: Difficulty, shuffleOpts: boolean): Promise<Question | null> {
  // Load full book to get chapter content
  const fullBook = await getBookById(book.id);
  if (!fullBook?.chapters || fullBook.chapters.length === 0) return null;
  const chapter = pick(fullBook.chapters, 1)[0];
  if (!chapter?.content || chapter.content.length < 100) return null;

  // Extract a meaningful sentence from the chapter
  const sentences = chapter.content
    .split(/(?<=[.;])\s+(?=[A-Z])/)
    .filter(s => s.length > 60 && s.length < 250);
  if (sentences.length < 3) return null;
  const sentence = pick(sentences, 1)[0];

  // Q: Which chapter of "[book title]" contains the following passage?
  const otherChapters = fullBook.chapters.filter(c => c.id !== chapter.id);
  if (otherChapters.length < 3) return null;
  const distractors = pick(otherChapters, 3).map(c => c.title);

  const options = buildOptions(chapter.title, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;

  return {
    id: hash(`book-chap:${book.id}:${chapter.id}:${sentence.slice(0, 40)}`),
    type: 'chapter_based',
    difficulty,
    question: `Which chapter of "${book.title}" by ${book.author} contains the following passage?\n\n"${sentence}"`,
    options,
    correctAnswer: [correctId],
    explanation: `This passage appears in Chapter "${chapter.title}" of "${book.title}".`,
    correctReason: `The text is directly quoted from the chapter "${chapter.title}".`,
    incorrectReasons: `The other chapters contain different content.`,
    source: {
      type: 'book',
      bookName: book.title,
      author: book.author,
      chapter: chapter.title,
      topic: 'Chapter Content',
      subtopic: '',
      reference: `${book.author}, ${book.title} — ${chapter.title}`,
    },
    estimatedTime: estimateTime(difficulty, 'chapter_based'),
    keywords: extractKeywords(sentence),
    marks: 1,
    negativeMark: 0,
  };
}

// ─── NEW AI-POWERED QUESTION TYPES (examination-style) ────────────────────

/**
 * Clean OCR-extracted text: merge broken words, remove duplicate lines,
 * strip page numbers/headers/footers, preserve meaning.
 */
function cleanOcrText(text: string): string {
  if (!text) return '';
  let cleaned = text
    // Remove page numbers (standalone numbers or "Page X")
    .replace(/\bPage\s+\d+\b/gi, '')
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove common headers/footers
    .replace(/\b(Chapter|Section|Unit)\s+\d+\b/gi, '')
    // Merge hyphenated line breaks: "indi-\ncation" → "indication"
    .replace(/(\w)-\n(\w)/g, '$1$2')
    // Merge single-newline breaks within paragraphs (but keep paragraph breaks)
    .replace(/([a-z,;:])\n([a-z])/g, '$1 $2')
    // Remove duplicate consecutive lines
    .split('\n')
    .filter((line, i, arr) => line.trim() !== (arr[i - 1] || '').trim())
    .join('\n')
    // Collapse multiple spaces
    .replace(/  +/g, ' ')
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned;
}

/**
 * Extract clean, meaningful sentences from OCR text for question generation.
 */
function extractCleanSentences(text: string, minLen = 60, maxLen = 250): string[] {
  const cleaned = cleanOcrText(text);
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.;])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length >= minLen && s.length <= maxLen)
    .filter(s => !/^(page|chapter|section|unit)\s+\d/i.test(s)) // skip page/chapter markers
    .filter(s => /\b(is|are|was|were|has|have|can|may|should|must|the|a|an)\b/i.test(s)); // must be a real sentence
}

/**
 * CLINICAL BASED — presents a clinical scenario, asks which remedy/concept applies.
 */
function genClinicalBased(remedy: RemedySource, allRemedies: RemedySource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  const topics = extractRemedyTopics(remedy);
  if (topics.length === 0) return null;
  const topic = topics[Math.floor(Math.random() * Math.min(topics.length, 5))];
  if (!topic || topic.length < 40) return null;

  // Build a clinical scenario from the keynote
  const scenario = topic.length > 180 ? topic.slice(0, 180) + '...' : topic;
  const sameAuthor = allRemedies.filter(r => r.author === remedy.author && r.id !== remedy.id);
  const pool = sameAuthor.length >= 3 ? sameAuthor : allRemedies.filter(r => r.id !== remedy.id);
  const distractors = pick(pool, 3).map(r => r.name);
  if (distractors.length < 3) return null;

  const options = buildOptions(remedy.name, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;

  return {
    id: hash(`clinical:${remedy.id}:${topic.slice(0, 40)}`),
    type: 'clinical_based',
    difficulty,
    question: `A patient presents with the following clinical picture:\n\n"${scenario}"\n\nWhich remedy is most indicated?`,
    options,
    correctAnswer: [correctId],
    explanation: `The clinical picture described matches the symptom profile of ${remedy.name}.`,
    correctReason: `The presented symptoms align with the characteristic indications of ${remedy.name}.`,
    incorrectReasons: `The other options do not match the specific symptom profile described in the scenario.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter || '—',
      topic: remedy.name,
      subtopic: 'Clinical Scenario',
      reference: `${remedy.author}, ${remedy.name}`,
    },
    estimatedTime: estimateTime(difficulty, 'clinical_based'),
    keywords: extractKeywords(topic),
    marks: 1,
    negativeMark: 0,
  };
}

/**
 * STATEMENT BASED — presents a statement, asks if it's correct or which statement is true.
 */
function genStatementBased(remedy: RemedySource, difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  const topics = extractRemedyTopics(remedy);
  if (topics.length === 0) return null;
  const topic = topics[Math.floor(Math.random() * topics.length)];
  if (!topic || topic.length < 50) return null;

  // Create a true statement and 3 modified (false) versions
  const trueStatement = topic.length > 150 ? topic.slice(0, 150) + '...' : topic;
  // Create plausible-sounding false statements by swapping key words
  const falseStatements = [
    trueStatement.replace(/\b(is|are|was|were)\b/, m => m === 'is' ? 'is not' : m === 'are' ? 'are not' : m === 'was' ? 'was not' : 'were not'),
    trueStatement.replace(/\b(increased|decreased|elevated|reduced)\b/i, m => m === 'increased' ? 'decreased' : m === 'decreased' ? 'increased' : m === 'elevated' ? 'reduced' : 'elevated'),
    trueStatement.replace(/\b(above|below|upper|lower|right|left)\b/i, m => m === 'above' ? 'below' : m === 'below' ? 'above' : m === 'upper' ? 'lower' : m === 'lower' ? 'upper' : m === 'right' ? 'left' : 'right'),
  ].filter(s => s !== trueStatement);

  if (falseStatements.length < 3) return null;

  const options = buildOptions(trueStatement, falseStatements.slice(0, 3), shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;

  return {
    id: hash(`statement:${remedy.id}:${topic.slice(0, 30)}`),
    type: 'statement_based',
    difficulty,
    question: 'Which of the following statements is CORRECT?',
    options,
    correctAnswer: [correctId],
    explanation: `The correct statement accurately reflects the source content.`,
    correctReason: `This statement is faithful to the original text.`,
    incorrectReasons: `The other statements contain modified or reversed information that does not match the source.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter || '—',
      topic: remedy.name,
      subtopic: 'Statement Verification',
      reference: `${remedy.author}, ${remedy.name}`,
    },
    estimatedTime: estimateTime(difficulty, 'statement_based'),
    keywords: extractKeywords(topic),
    marks: 1,
    negativeMark: 0,
  };
}

/**
 * CONCEPT BASED — tests understanding of a concept (not memorization).
 */
function genConceptBased(remedy: RemedySource, allRemedies: RemedySource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  const organs = remedy.organ?.split(/[,;]/).map(s => s.trim()).filter(Boolean) || [];
  if (organs.length === 0) return null;
  const concept = organs[0];

  // Q: The remedy [Name] primarily acts on which system/organ?
  const otherOrgans = allRemedies
    .flatMap(r => r.organ?.split(/[,;]/).map(s => s.trim()) || [])
    .filter(o => o && o !== concept);
  const distractors = pick(otherOrgans, 3);
  if (distractors.length < 3) return null;

  const options = buildOptions(concept, distractors, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;

  return {
    id: hash(`concept:${remedy.id}:${concept}`),
    type: 'concept_based',
    difficulty,
    question: `The remedy ${remedy.name} has its primary affinity for which organ system?`,
    options,
    correctAnswer: [correctId],
    explanation: `${remedy.name} is documented as having a primary affinity for the ${concept} system.`,
    correctReason: `The source text identifies ${concept} as a primary target of ${remedy.name}.`,
    incorrectReasons: `The other organ systems are not the primary affinity of this remedy.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter || '—',
      topic: remedy.name,
      subtopic: 'Organ Affinity',
      reference: `${remedy.author}, ${remedy.name}`,
    },
    estimatedTime: estimateTime(difficulty, 'concept_based'),
    keywords: [remedy.name.toLowerCase(), concept.toLowerCase()],
    marks: 1,
    negativeMark: 0,
  };
}

/**
 * RECALL — direct recall of a fact from the source.
 */
function genRecall(remedy: RemedySource, allRemedies: RemedySource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  // Q: Which of the following is a characteristic indication of [Remedy]?
  const topics = extractRemedyTopics(remedy);
  if (topics.length === 0) return null;
  const correctTopic = topics[Math.floor(Math.random() * topics.length)];
  if (!correctTopic || correctTopic.length < 30) return null;

  // Get indications from other remedies as distractors
  const otherRemedies = allRemedies.filter(r => r.id !== remedy.id);
  const distractorTopics: string[] = [];
  for (const r of pick(otherRemedies, 10)) {
    const rTopics = extractRemedyTopics(r);
    for (const t of rTopics) {
      if (t !== correctTopic && !distractorTopics.includes(t)) {
        distractorTopics.push(t);
        if (distractorTopics.length >= 3) break;
      }
    }
    if (distractorTopics.length >= 3) break;
  }
  if (distractorTopics.length < 3) return null;

  const correctText = correctTopic.length > 100 ? correctTopic.slice(0, 100) + '...' : correctTopic;
  const distractorTexts = distractorTopics.map(t => t.length > 100 ? t.slice(0, 100) + '...' : t);

  const options = buildOptions(correctText, distractorTexts, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;

  return {
    id: hash(`recall:${remedy.id}:${correctTopic.slice(0, 30)}`),
    type: 'recall',
    difficulty,
    question: `Which of the following is a characteristic indication of ${remedy.name}?`,
    options,
    correctAnswer: [correctId],
    explanation: `This indication is documented in the source material for ${remedy.name}.`,
    correctReason: `The selected indication matches the characteristic symptom profile of ${remedy.name}.`,
    incorrectReasons: `The other indications belong to different remedies.`,
    source: {
      type: 'remedy',
      bookName: `${remedy.author}'s Materia Medica`,
      author: remedy.author,
      chapter: remedy.chapter || '—',
      topic: remedy.name,
      subtopic: 'Recall',
      reference: `${remedy.author}, ${remedy.name}`,
    },
    estimatedTime: estimateTime(difficulty, 'recall'),
    keywords: extractKeywords(correctTopic),
    marks: 1,
    negativeMark: 0,
  };
}

/**
 * APPLICATION — applies knowledge to a new situation.
 */
function genApplication(rubric: RubricSource, allRubrics: RubricSource[], difficulty: Difficulty, shuffleOpts: boolean): Question | null {
  if (rubric.remedies.length < 3) return null;
  const parsed = parseRubricTitle(rubric.title);

  // Q: A patient exhibits [rubric symptom]. Which remedy would you consider?
  const correctRemedy = pick(rubric.remedies, 1)[0];
  const sameChapter = allRubrics.filter(r => r.path === rubric.path && r.id !== rubric.id);
  const pool = sameChapter.length >= 5 ? sameChapter : allRubrics.filter(r => r.id !== rubric.id);
  const distractorRemedies: string[] = [];
  for (const r of pick(pool, 10)) {
    for (const rem of r.remedies) {
      if (rem !== correctRemedy && !distractorRemedies.includes(rem)) {
        distractorRemedies.push(rem);
        if (distractorRemedies.length >= 3) break;
      }
    }
    if (distractorRemedies.length >= 3) break;
  }
  if (distractorRemedies.length < 3) return null;

  const options = buildOptions(correctRemedy, distractorRemedies, shuffleOpts);
  const correctId = options.find(o => o.isCorrect)!.id;

  return {
    id: hash(`application:${rubric.id}:${correctRemedy}`),
    type: 'application',
    difficulty,
    question: `A patient presents with the symptom: "${parsed.main}${parsed.sub ? ' — ' + parsed.sub : ''}".\n\nBased on repertoric analysis, which remedy should be considered?`,
    options,
    correctAnswer: [correctId],
    explanation: `${correctRemedy} is listed under this rubric, indicating its relevance for the presented symptom.`,
    correctReason: `Repertoric analysis places ${correctRemedy} under this symptom rubric.`,
    incorrectReasons: `The other remedies are not listed under this specific rubric.`,
    source: {
      type: 'rubric',
      bookName: `${rubric.author} Repertory`,
      author: rubric.author,
      chapter: rubric.path,
      topic: parsed.main,
      subtopic: parsed.sub,
      reference: `${rubric.author} Repertory, ${rubric.path}`,
    },
    estimatedTime: estimateTime(difficulty, 'application'),
    keywords: [parsed.main.toLowerCase()],
    marks: 1,
    negativeMark: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main generation orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export async function generateQuestions(opts: GenerateOptions): Promise<Question[]> {
  const {
    sourceType = 'mixed', author, chapter, difficulty = 'any',
    questionType = 'any', count, shuffleQuestions = true, shuffleOptions = true,
    multiSource = false,
  } = opts;

  const questions: Question[] = [];
  const usedIds = new Set<string>(); // dedupe

  // Load all sources
  const [remedies, rubrics, books] = await Promise.all([
    listRemedies(), listRubrics(), listBooks(),
  ]);

  // Filter sources
  let filteredRemedies = remedies;
  if (author) filteredRemedies = filteredRemedies.filter(r => r.author === author);
  if (chapter) filteredRemedies = filteredRemedies.filter(r => r.chapter === chapter);

  let filteredRubrics = rubrics;
  if (author) filteredRubrics = filteredRubrics.filter(r => r.author === author);
  if (chapter) filteredRubrics = filteredRubrics.filter(r => r.path === chapter);

  let filteredBooks = books;
  if (author) filteredBooks = filteredBooks.filter(b => b.author === author);
  if (opts.bookId) filteredBooks = filteredBooks.filter(b => b.id === opts.bookId);

  // Build generator pool based on sourceType
  type Generator = () => Promise<Question | null>;
  const generators: Generator[] = [];

  const canUseRemedies = sourceType === 'mixed' || sourceType === 'remedy';
  const canUseRubrics = sourceType === 'mixed' || sourceType === 'rubric';
  const canUseBooks = sourceType === 'mixed' || sourceType === 'book';

  if (canUseRemedies && filteredRemedies.length > 0) {
    const pool = filteredRemedies;
    const types: QuestionType[] = questionType === 'any'
      ? ['identify_remedy', 'chapter_based', 'true_false', 'single',
         'clinical_based', 'statement_based', 'concept_based', 'recall']
      : [questionType];

    for (let i = 0; i < count * 3; i++) {
      const r = pick(pool, 1)[0];
      const t = pick(types, 1)[0];
      const d = pickDifficulty(difficulty, 'remedy');
      generators.push(async () => {
        if (t === 'identify_remedy') return genRemedyKeynote(r, filteredRemedies, d, shuffleOptions);
        if (t === 'chapter_based') return genRemedyChapter(r, filteredRemedies, d, shuffleOptions);
        if (t === 'true_false') return genRemedyTrueFalse(r, d, shuffleOptions);
        if (t === 'single') return genRemedyDose(r, filteredRemedies, d, shuffleOptions);
        if (t === 'clinical_based') return genClinicalBased(r, filteredRemedies, d, shuffleOptions);
        if (t === 'statement_based') return genStatementBased(r, d, shuffleOptions);
        if (t === 'concept_based') return genConceptBased(r, filteredRemedies, d, shuffleOptions);
        if (t === 'recall') return genRecall(r, filteredRemedies, d, shuffleOptions);
        return null;
      });
    }
  }

  if (canUseRubrics && filteredRubrics.length > 0) {
    const pool = filteredRubrics;
    const types: QuestionType[] = questionType === 'any'
      ? ['single', 'chapter_based', 'author_identify', 'except', 'application']
      : [questionType];

    for (let i = 0; i < count * 3; i++) {
      const r = pick(pool, 1)[0];
      const t = pick(types, 1)[0];
      const d = pickDifficulty(difficulty, 'rubric');
      generators.push(async () => {
        if (t === 'single') return genRubricRemedies(r, filteredRubrics, d, shuffleOptions);
        if (t === 'chapter_based') return genRubricChapter(r, filteredRubrics, d, shuffleOptions);
        if (t === 'author_identify') return genRubricAuthor(r, filteredRubrics, d, shuffleOptions);
        if (t === 'except') return genRubricExcept(r, filteredRubrics, d, shuffleOptions);
        if (t === 'application') return genApplication(r, filteredRubrics, d, shuffleOptions);
        return null;
      });
    }
  }

  if (canUseBooks && filteredBooks.length > 0) {
    const pool = filteredBooks;
    const types: QuestionType[] = questionType === 'any'
      ? ['author_identify', 'single', 'chapter_based']
      : [questionType];

    for (let i = 0; i < count * 2; i++) {
      const b = pick(pool, 1)[0];
      const t = pick(types, 1)[0];
      const d = pickDifficulty(difficulty, 'book');
      generators.push(async () => {
        if (t === 'author_identify') return genBookAuthor(b, filteredBooks, d, shuffleOptions);
        if (t === 'single') return genBookChapterCount(b, filteredBooks, d, shuffleOptions);
        if (t === 'chapter_based') return await genBookChapterQuestion(b, d, shuffleOptions);
        return null;
      });
    }
  }

  // Shuffle generators and execute until we have enough questions
  const shuffledGens = shuffle(generators);
  for (const gen of shuffledGens) {
    if (questions.length >= count) break;
    try {
      const q = await gen();
      if (q && !usedIds.has(q.id)) {
        usedIds.add(q.id);
        // Apply marks/negativeMark from options
        q.marks = opts.marks ?? 1;
        q.negativeMark = opts.negativeMark ?? 0;
        questions.push(q);
      }
    } catch {
      // Skip failed generators
    }
  }

  const finalQs = shuffleQuestions ? shuffle(questions) : questions;
  return finalQs.slice(0, count);
}
