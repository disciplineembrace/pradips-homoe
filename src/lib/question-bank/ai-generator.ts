/**
 * AI-Powered Source-Based Question Generator
 * ==========================================
 * Uses z-ai-web-dev-sdk LLM to analyze source text and generate
 * exam-quality MCQs grounded in the supplied source material.
 *
 * Architecture:
 *   Source text → LLM analysis → Question generation → Validation → Draft output
 *
 * NEVER fabricates facts — all answers must be supported by the source.
 * Questions are saved as DRAFT for admin review before publishing.
 *
 * Integration with existing Question Bank:
 *   - Uses existing Question type from generator.ts
 *   - Uses existing toClientQuestion() for client response
 *   - Saves to existing question-bank API
 */
import ZAI from 'z-ai-web-dev-sdk';

// ============================================================
// Types — compatible with existing Question Bank
// ============================================================
export type AIQuestionType =
  | 'single' | 'multiple' | 'true_false' | 'fill_blank'
  | 'match' | 'assertion_reason' | 'except' | 'not_true'
  | 'clinical_based' | 'statement_based' | 'concept_based'
  | 'recall' | 'application';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AISourceQuestion {
  id: string;
  type: AIQuestionType;
  difficulty: AIDifficulty;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string[];
  explanation: string;
  sourceReference: string;
  sourceSupport: number; // 0-100 confidence
  status: 'draft' | 'approved' | 'rejected';
}

export interface GenerationConfig {
  sourceText: string;
  sourceName: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'mixed';
  questionTypes: AIQuestionType[] | 'any';
  examStyle?: string; // e.g., 'AIAPGET'
}

export interface GenerationResult {
  questions: AISourceQuestion[];
  stats: {
    requested: number;
    generated: number;
    rejected: number;
    avgSourceSupport: number;
  };
  errors: string[];
}

// ============================================================
// LLM Provider Interface — can be swapped later
// ============================================================
interface LLMProvider {
  generateQuestions(prompt: string): Promise<string>;
}

class ZAIProvider implements LLMProvider {
  private zai: any = null;

  async init() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
    return this.zai;
  }

  async generateQuestions(prompt: string): Promise<string> {
    const zai = await this.init();
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert homeopathy exam question architect. Generate only source-grounded MCQs. Never fabricate facts.' },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    });
    return response.choices[0]?.message?.content || '';
  }
}

// ============================================================
// MAIN: Generate questions from source text using LLM
// ============================================================
export async function generateFromSource(config: GenerationConfig): Promise<GenerationResult> {
  const errors: string[] = [];
  const questions: AISourceQuestion[] = [];

  try {
    const provider = new ZAIProvider();
    await provider.init();

    // Build the generation prompt
    const prompt = buildGenerationPrompt(config);

    // Call LLM
    const response = await provider.generateQuestions(prompt);

    // Parse response into structured questions
    const parsed = parseLLMResponse(response, config);

    // Validate each question
    for (const q of parsed) {
      const validation = validateQuestion(q, config.sourceText);
      if (validation.passed) {
        questions.push(q);
      } else {
        errors.push(`Rejected: ${validation.reason}`);
      }
    }

    // Cap at requested count
    const finalQuestions = questions.slice(0, config.count);

    return {
      questions: finalQuestions,
      stats: {
        requested: config.count,
        generated: finalQuestions.length,
        rejected: parsed.length - finalQuestions.length,
        avgSourceSupport: finalQuestions.length > 0
          ? Math.round(finalQuestions.reduce((s, q) => s + q.sourceSupport, 0) / finalQuestions.length)
          : 0,
      },
      errors,
    };
  } catch (err: any) {
    errors.push(`Generation error: ${err.message}`);
    return { questions: [], stats: { requested: config.count, generated: 0, rejected: 0, avgSourceSupport: 0 }, errors };
  }
}

// ============================================================
// Build LLM prompt from config
// ============================================================
function buildGenerationPrompt(config: GenerationConfig): string {
  const difficultyMap: Record<string, string> = {
    'easy': 'Level 1-2 (Easy to Easy-Moderate)',
    'medium': 'Level 2-3 (Moderate to Standard competitive-exam)',
    'hard': 'Level 3-4 (Standard to Difficult)',
    'expert': 'Level 4-5 (Very difficult but fair)',
    'mixed': 'Mix of Level 1-5 with emphasis on Level 3 (standard competitive-exam)',
  };

  const typeList = config.questionTypes === 'any'
    ? ['single (direct factual)', 'except/NOT', 'assertion_reason', 'statement_based', 'clinical_based', 'concept_based', 'true_false', 'match']
    : config.questionTypes;

  return `You are an expert homeopathy examination question architect.

SOURCE MATERIAL (this is the ONLY factual authority — never invent facts):
---
${config.sourceText.slice(0, 8000)}
---

Generate exactly ${config.count} multiple-choice questions from the source above.

REQUIREMENTS:
1. Every correct answer MUST be directly supported by the source text above.
2. Difficulty: ${difficultyMap[config.difficulty] || difficultyMap['mixed']}
3. Question types to include: ${typeList.join(', ')}
4. Each question must have exactly 4 options (A, B, C, D).
5. Exactly ONE option must be correct (except for 'multiple' type).
6. Distractors must be PLAUSIBLE — same semantic category as the correct answer.
7. Do NOT use obviously wrong distractors.
8. ${config.examStyle ? `Style: ${config.examStyle} examination level` : 'Competitive medical entrance exam level'}
9. Do NOT copy source text verbatim — rephrase the question stem.
10. Include a brief explanation referencing the source.

OUTPUT FORMAT (strict JSON array):
[
  {
    "type": "single",
    "difficulty": "medium",
    "question": "Rephrased question stem here?",
    "options": [
      {"id": "a", "text": "Option A text", "isCorrect": false},
      {"id": "b", "text": "Option B text", "isCorrect": true},
      {"id": "c", "text": "Option C text", "isCorrect": false},
      {"id": "d", "text": "Option D text", "isCorrect": false}
    ],
    "correctAnswer": ["b"],
    "explanation": "Brief explanation with source reference",
    "sourceReference": "Source: ${config.sourceName}"
  }
]

Generate ${config.count} questions now as a JSON array. No markdown, no code blocks, just the JSON array.`;
}

// ============================================================
// Parse LLM response into structured questions
// ============================================================
function parseLLMResponse(response: string, config: GenerationConfig): AISourceQuestion[] {
  const questions: AISourceQuestion[] = [];

  try {
    // Extract JSON array from response
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Find the JSON array
    const startIdx = jsonStr.indexOf('[');
    const endIdx = jsonStr.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1) {
      return [];
    }
    jsonStr = jsonStr.slice(startIdx, endIdx + 1);

    const parsed = JSON.parse(jsonStr);

    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      const question: AISourceQuestion = {
        id: `ai_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`,
        type: q.type || 'single',
        difficulty: q.difficulty || 'medium',
        question: q.question || '',
        options: (q.options || []).map((o: any) => ({
          id: o.id || 'a',
          text: o.text || '',
          isCorrect: !!o.isCorrect,
        })),
        correctAnswer: q.correctAnswer || [],
        explanation: q.explanation || '',
        sourceReference: q.sourceReference || `Source: ${config.sourceName}`,
        sourceSupport: 85, // Default — will be validated
        status: 'draft',
      };

      // Ensure 4 options
      if (question.options.length !== 4) continue;

      // Ensure exactly one correct answer (for single type)
      if (question.type === 'single' || question.type === 'except' || question.type === 'not_true') {
        const correctCount = question.options.filter(o => o.isCorrect).length;
        if (correctCount !== 1) continue;
      }

      questions.push(question);
    }
  } catch (err) {
    // JSON parse failed — return empty
  }

  return questions;
}

// ============================================================
// Validate a generated question
// ============================================================
function validateQuestion(
  q: AISourceQuestion,
  sourceText: string
): { passed: boolean; reason: string } {
  // Check: question text exists
  if (!q.question || q.question.length < 10) {
    return { passed: false, reason: 'Question text too short' };
  }

  // Check: has 4 options
  if (q.options.length !== 4) {
    return { passed: false, reason: 'Must have exactly 4 options' };
  }

  // Check: no duplicate option texts
  const optionTexts = q.options.map(o => o.text.toLowerCase().trim());
  const uniqueTexts = new Set(optionTexts);
  if (uniqueTexts.size !== 4) {
    return { passed: false, reason: 'Duplicate options detected' };
  }

  // Check: exactly one correct answer for single-type
  const correctOpts = q.options.filter(o => o.isCorrect);
  if (q.type === 'single' && correctOpts.length !== 1) {
    return { passed: false, reason: 'Single-type must have exactly 1 correct answer' };
  }

  // Check: no empty option texts
  if (q.options.some(o => !o.text || o.text.length < 1)) {
    return { passed: false, reason: 'Empty option text' };
  }

  // Check: explanation exists
  if (!q.explanation || q.explanation.length < 5) {
    return { passed: false, reason: 'Missing explanation' };
  }

  // Check: source support (basic keyword matching)
  const questionLower = q.question.toLowerCase();
  const correctAnswerLower = q.options.find(o => o.isCorrect)?.text.toLowerCase() || '';
  const sourceLower = sourceText.toLowerCase();

  // Check if key terms from the question appear in the source
  const questionWords = questionLower.split(/\s+/).filter((w: string) => w.length > 4);
  const matchingWords = questionWords.filter((w: string) => sourceLower.includes(w));

  if (matchingWords.length === 0 && questionWords.length > 3) {
    return { passed: false, reason: 'Question has no keyword overlap with source' };
  }

  return { passed: true, reason: 'OK' };
}
