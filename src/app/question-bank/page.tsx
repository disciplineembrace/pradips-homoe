'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * Homeopathy Question Bank
 *
 * Independent module — reads ONLY from existing database content.
 * Does not modify any other part of the website.
 *
 * Phases:
 *   1. Setup — user selects source, difficulty, type, count
 *   2. Quiz — displays questions one-by-one with timer
 *   3. Results — score, analysis, per-question review
 */
type Phase = 'setup' | 'quiz' | 'results';

interface QuestionOption { id: string; text: string; isCorrect: boolean; }
interface Question {
  id: string; type: string; difficulty: string;
  question: string; options: QuestionOption[];
  correctAnswer: string[]; explanation: string;
  correctReason: string; incorrectReasons: string;
  source: { bookName: string; author: string; chapter: string; topic: string; subtopic: string; reference: string; };
  estimatedTime: number; keywords: string[]; marks: number; negativeMark: number;
}

interface SourceMeta {
  remedies: { count: number; authors: string[] };
  rubrics: { count: number; authors: string[]; chaptersByAuthor: Record<string, string[]> };
  books: { count: number; list: Array<{ id: string; title: string; author: string; totalChapters: number }> };
  totalSources: number;
}

export default function QuestionBankPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [sources, setSources] = useState<SourceMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Quiz settings
  const [sourceType, setSourceType] = useState<'mixed' | 'remedy' | 'rubric' | 'book'>('mixed');
  const [author, setAuthor] = useState('');
  const [chapter, setChapter] = useState('');
  const [bookId, setBookId] = useState('');
  const [difficulty, setDifficulty] = useState<'any' | 'easy' | 'medium' | 'hard' | 'expert'>('any');
  const [questionType, setQuestionType] = useState('any');
  const [count, setCount] = useState(10);
  const [marks, setMarks] = useState(1);
  const [negativeMark, setNegativeMark] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(0); // 0 = no timer

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      setSession(d);
    });
  }, [router]);

  useEffect(() => {
    if (session) loadSources();
  }, [session]);

  useEffect(() => {
    // Timer countdown
    if (phase === 'quiz' && timeLeft > 0) {
      const t = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Use setTimeout to avoid calling setState during render
            setTimeout(() => finishQuiz(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [phase, timeLeft]);

  async function loadSources() {
    try {
      const r = await fetch('/api/question-bank/sources');
      const d = await r.json();
      setSources(d);
    } catch (e: any) { setError(e.message); }
  }

  const availableAuthors = useCallback(() => {
    if (!sources) return [];
    const all = new Set<string>();
    (sources.remedies?.authors || []).forEach(a => all.add(a));
    (sources.rubrics?.authors || []).forEach(a => all.add(a));
    return Array.from(all).sort();
  }, [sources]);

  const availableChapters = useCallback(() => {
    if (!sources || !author || !sources.rubrics?.chaptersByAuthor) return [];
    return sources.rubrics.chaptersByAuthor[author] || [];
  }, [sources, author]);

  async function startQuiz() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/question-bank/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType, author: author || undefined, chapter: chapter || undefined,
          bookId: bookId || undefined, difficulty, questionType,
          count, marks, negativeMark, shuffleQuestions, shuffleOptions,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      if (!d.questions || d.questions.length === 0) {
        throw new Error('No questions could be generated from the selected source. Try different settings.');
      }
      setQuestions(d.questions);
      setAnswers({});
      setCurrentIdx(0);
      setStartTime(Date.now());
      if (timerMinutes > 0) setTimeLeft(timerMinutes * 60);
      setPhase('quiz');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qId: string, optionId: string, multi: boolean = false) {
    setAnswers(prev => {
      if (multi) {
        const cur = prev[qId] || [];
        return { ...prev, [qId]: cur.includes(optionId) ? cur.filter(x => x !== optionId) : [...cur, optionId] };
      }
      return { ...prev, [qId]: [optionId] };
    });
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      finishQuiz();
    }
  }

  function prevQuestion() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }

  function finishQuiz() {
    setPhase('results');
    // Submit to server (fire and forget)
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    let correct = 0, incorrect = 0, skipped = 0;
    for (const q of questions) {
      const ans = answers[q.id];
      if (!ans || ans.length === 0) { skipped++; continue; }
      const correctSet = new Set(q.correctAnswer);
      const ansSet = new Set(ans);
      const isCorrect = correctSet.size === ansSet.size && Array.from(correctSet).every(x => ansSet.has(x));
      if (isCorrect) correct++; else incorrect++;
    }
    const score = correct * marks - incorrect * negativeMark;
    const maxScore = questions.length * marks;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    fetch('/api/question-bank/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalQuestions: questions.length, correct, incorrect, skipped,
        score, percentage, timeTaken,
        settings: { sourceType, author, chapter, difficulty, questionType, count },
      }),
    }).catch(() => {});
  }

  function resetQuiz() {
    setPhase('setup');
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setTimeLeft(0);
    setError('');
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Question Bank...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          <header className="mb-6">
            <h1 className="font-serif text-3xl text-[#173B2D]">Homeopathy Question Bank</h1>
            <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">
              Generate quizzes from your library — {(sources?.totalSources ?? 0).toLocaleString()} sources available
            </p>
            <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
          </header>

          {error && (
            <div className="bg-[#6E2A3A]/10 border border-[#6E2A3A]/30 text-[#6E2A3A] rounded p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Sources overview */}
          {sources && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-lg shadow p-3 text-center">
                <div className="text-xl font-bold text-[#173B2D] font-serif">{(sources.remedies?.count ?? 0).toLocaleString()}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Remedies (MM)</div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 text-center">
                <div className="text-xl font-bold text-[#173B2D] font-serif">{(sources.rubrics?.count ?? 0).toLocaleString()}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Rubrics</div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 text-center">
                <div className="text-xl font-bold text-[#173B2D] font-serif">{sources.books?.count ?? 0}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Books</div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 text-center">
                <div className="text-xl font-bold text-[#173B2D] font-serif">{(sources.totalSources ?? 0).toLocaleString()}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Total Sources</div>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-5 space-y-4">
            <h2 className="font-serif text-lg text-[#173B2D] border-b border-[#E8DCC3] pb-2">Quiz Settings</h2>

            {/* Source Type */}
            <div>
              <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Source Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {(['mixed', 'remedy', 'rubric', 'book'] as const).map(st => (
                  <button key={st} onClick={() => setSourceType(st)}
                    className={`px-3 py-2 text-xs font-semibold rounded border ${sourceType === st ? 'bg-[#173B2D] text-[#F5EFE0] border-[#173B2D]' : 'bg-white text-[#173B2D] border-[#E8DCC3] hover:border-[#173B2D]'}`}>
                    {st === 'mixed' ? '📚 Mixed' : st === 'remedy' ? '💊 MM' : st === 'rubric' ? '🗂️ Repertory' : '📖 Books'}
                  </button>
                ))}
              </div>
            </div>

            {/* Author + Chapter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Author (optional)</label>
                <select value={author} onChange={e => { setAuthor(e.target.value); setChapter(''); }}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]">
                  <option value="">All authors</option>
                  {availableAuthors().map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Chapter (optional)</label>
                <select value={chapter} onChange={e => setChapter(e.target.value)} disabled={!author}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D] disabled:opacity-50">
                  <option value="">All chapters</option>
                  {availableChapters().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Book selection */}
            {sourceType === 'book' && sources && (
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Specific Book (optional)</label>
                <select value={bookId} onChange={e => setBookId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]">
                  <option value="">All books</option>
                  {sources.books.list.map(b => <option key={b.id} value={b.id}>{b.title} — {b.author} ({b.totalChapters} ch)</option>)}
                </select>
              </div>
            )}

            {/* Difficulty + Question Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]">
                  <option value="any">Any (auto-distributed)</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Question Type</label>
                <select value={questionType} onChange={e => setQuestionType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]">
                  <option value="any">Any (mixed)</option>
                  <option value="single">Single Correct Answer</option>
                  <option value="multiple">Multiple Correct</option>
                  <option value="true_false">True / False</option>
                  <option value="identify_remedy">Remedy Identification</option>
                  <option value="identify_rubric">Rubric Identification</option>
                  <option value="author_identify">Author Identification</option>
                  <option value="chapter_based">Chapter Based</option>
                  <option value="except">EXCEPT Questions</option>
                </select>
              </div>
            </div>

            {/* Count + Marks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Question Count</label>
                <input type="number" min={1} max={50} value={count} onChange={e => setCount(Math.min(50, Math.max(1, +e.target.value)))}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Marks (each)</label>
                <input type="number" min={1} max={10} value={marks} onChange={e => setMarks(Math.min(10, Math.max(1, +e.target.value)))}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Neg. Mark</label>
                <input type="number" min={0} max={5} step={0.25} value={negativeMark} onChange={e => setNegativeMark(Math.min(5, Math.max(0, +e.target.value)))}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Timer (min)</label>
                <input type="number" min={0} max={180} value={timerMinutes} onChange={e => setTimerMinutes(Math.min(180, Math.max(0, +e.target.value)))}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]" />
                <p className="text-[0.6rem] text-[#7C8F6E] mt-0.5">0 = no timer</p>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-[#173B2D]">
                <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} className="accent-[#173B2D]" />
                Shuffle Questions
              </label>
              <label className="flex items-center gap-2 text-sm text-[#173B2D]">
                <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} className="accent-[#173B2D]" />
                Shuffle Options
              </label>
            </div>

            <button onClick={startQuiz} disabled={loading}
              className="w-full bg-[#173B2D] hover:bg-[#2a5443] text-[#F5EFE0] font-semibold py-3 rounded uppercase tracking-wider text-sm disabled:opacity-50">
              {loading ? '⏳ Generating Questions...' : `🚀 Start Quiz (${count} questions)`}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/dashboard" className="text-xs text-[#7C8F6E] hover:text-[#173B2D]">← Back to Dashboard</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: QUIZ
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'quiz') {
    const q = questions[currentIdx];
    // Guard: if no question available, return to setup
    if (!q) {
      return (
        <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
          <Navbar />
          <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full text-center">
            <p className="text-sm text-[#7C8F6E]">No questions available. Returning to setup...</p>
            <button onClick={resetQuiz} className="mt-4 px-6 py-2 bg-[#173B2D] text-[#F5EFE0] rounded text-sm">← Back to Setup</button>
          </main>
          <Footer />
        </div>
      );
    }
    const answered = Object.keys(answers).length;
    const isMulti = q.type === 'multiple';

    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#7C8F6E] uppercase tracking-wider font-semibold">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-3">
              {timeLeft > 0 && (
                <span className={`text-xs font-mono px-2 py-1 rounded ${timeLeft < 60 ? 'bg-[#6E2A3A] text-white' : 'bg-[#173B2D] text-[#C8A24A]'}`}>
                  ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              )}
              <span className="text-xs text-[#7C8F6E]">{answered}/{questions.length} answered</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#E8DCC3] rounded-full mb-6">
            <div className="h-full bg-[#C8A24A] rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Question card */}
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F5EFE0] text-[#173B2D]">{q.type.replace(/_/g, ' ')}</span>
              <span className={`text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                q.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>{q.difficulty}</span>
              <span className="text-[0.6rem] text-[#7C8F6E] ml-auto">+{q.marks} / -{q.negativeMark}</span>
            </div>
            <p className="font-serif text-lg text-[#173B2D] whitespace-pre-wrap mb-4">{q.question}</p>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map(opt => {
                const selected = (answers[q.id] || []).includes(opt.id);
                return (
                  <button key={opt.id} onClick={() => selectAnswer(q.id, opt.id, isMulti)}
                    className={`w-full text-left px-4 py-3 rounded border-2 transition-colors ${selected ? 'border-[#173B2D] bg-[#173B2D]/5' : 'border-[#E8DCC3] hover:border-[#173B2D]/50'}`}>
                    <span className="font-bold text-[#C8A24A] mr-2">{opt.id.toUpperCase()}.</span>
                    <span className="text-sm text-[#173B2D]">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevQuestion} disabled={currentIdx === 0}
              className="px-4 py-2 text-sm bg-white border border-[#E8DCC3] rounded text-[#173B2D] disabled:opacity-50 hover:bg-[#F5EFE0]">
              ← Previous
            </button>
            <div className="flex gap-2">
              <button onClick={() => { setAnswers(prev => ({ ...prev, [q.id]: [] })); nextQuestion(); }}
                className="px-4 py-2 text-sm bg-[#E8DCC3] text-[#173B2D] rounded hover:bg-[#D9C9A8]">
                Skip
              </button>
              {currentIdx < questions.length - 1 ? (
                <button onClick={nextQuestion}
                  className="px-4 py-2 text-sm bg-[#173B2D] text-[#F5EFE0] rounded hover:bg-[#2a5443]">
                  Next →
                </button>
              ) : (
                <button onClick={finishQuiz}
                  className="px-4 py-2 text-sm bg-[#C8A24A] text-[#173B2D] rounded font-bold hover:bg-[#d4b560]">
                  ✓ Finish Quiz
                </button>
              )}
            </div>
          </div>

          {/* Question grid (jump to any) */}
          <div className="mt-6 flex flex-wrap gap-1.5 justify-center">
            {questions.map((qq, i) => {
              const isAnswered = answers[qq.id] && answers[qq.id].length > 0;
              const isCurrent = i === currentIdx;
              return (
                <button key={qq.id} onClick={() => setCurrentIdx(i)}
                  className={`w-8 h-8 text-xs font-mono rounded ${isCurrent ? 'bg-[#C8A24A] text-[#173B2D] font-bold' : isAnswered ? 'bg-[#173B2D] text-[#F5EFE0]' : 'bg-white border border-[#E8DCC3] text-[#7C8F6E]'}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: RESULTS
  // ═══════════════════════════════════════════════════════════════════════════
  const timeTaken = Math.round((Date.now() - startTime) / 1000);
  let correct = 0, incorrect = 0, skipped = 0;
  const topicResults: Record<string, { correct: number; total: number }> = {};
  const difficultyResults: Record<string, { correct: number; total: number }> = {};

  for (const q of questions) {
    const ans = answers[q.id];
    const topic = q.source.topic || q.source.chapter || 'Unknown';
    if (!topicResults[topic]) topicResults[topic] = { correct: 0, total: 0 };
    if (!difficultyResults[q.difficulty]) difficultyResults[q.difficulty] = { correct: 0, total: 0 };
    topicResults[topic].total++;
    difficultyResults[q.difficulty].total++;

    if (!ans || ans.length === 0) { skipped++; continue; }
    const correctSet = new Set(q.correctAnswer);
    const ansSet = new Set(ans);
    const isCorrect = correctSet.size === ansSet.size && Array.from(correctSet).every(x => ansSet.has(x));
    if (isCorrect) { correct++; topicResults[topic].correct++; difficultyResults[q.difficulty].correct++; }
    else incorrect++;
  }
  const score = correct * marks - incorrect * negativeMark;
  const maxScore = questions.length * marks;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <header className="mb-6 text-center">
          <h1 className="font-serif text-3xl text-[#173B2D]">Quiz Results</h1>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3 mx-auto"></div>
        </header>

        {/* Score card */}
        <div className="bg-[#173B2D] rounded-lg p-6 mb-6 text-center">
          <div className="text-5xl font-bold font-serif text-[#C8A24A] mb-2">{percentage}%</div>
          <div className="text-sm text-stone-300">Score: {score} / {maxScore}</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-700 font-serif">{correct}</div>
            <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Correct</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-[#6E2A3A] font-serif">{incorrect}</div>
            <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Incorrect</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-[#7C8F6E] font-serif">{skipped}</div>
            <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Skipped</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-[#173B2D] font-serif">{Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2, '0')}</div>
            <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Time Taken</div>
          </div>
        </div>

        {/* Topic-wise analysis */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-serif text-lg text-[#173B2D] mb-3">Topic-wise Performance</h3>
          <div className="space-y-2">
            {Object.entries(topicResults).sort(([,a],[,b]) => (a.correct/a.total) - (b.correct/b.total)).map(([topic, r]) => (
              <div key={topic} className="flex items-center gap-3">
                <span className="text-sm text-[#173B2D] flex-1 truncate">{topic}</span>
                <div className="w-32 h-2 bg-[#E8DCC3] rounded-full overflow-hidden">
                  <div className={`h-full ${r.correct / r.total >= 0.7 ? 'bg-green-600' : r.correct / r.total >= 0.4 ? 'bg-yellow-600' : 'bg-[#6E2A3A]'}`}
                    style={{ width: `${(r.correct / r.total) * 100}%` }} />
                </div>
                <span className="text-xs text-[#7C8F6E] w-16 text-right">{r.correct}/{r.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty analysis */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-serif text-lg text-[#173B2D] mb-3">Difficulty Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['easy', 'medium', 'hard', 'expert'].map(d => {
              const r = difficultyResults[d];
              if (!r) return null;
              return (
                <div key={d} className="text-center p-3 bg-[#F5EFE0] rounded">
                  <div className="text-xs uppercase tracking-wider text-[#7C8F6E] mb-1">{d}</div>
                  <div className="text-lg font-bold text-[#173B2D] font-serif">{r.correct}/{r.total}</div>
                  <div className="text-xs text-[#7C8F6E]">{r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-question review */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-serif text-lg text-[#173B2D] mb-4">Question Review</h3>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const ans = answers[q.id] || [];
              const isCorrect = ans.length > 0 && q.correctAnswer.length === ans.length && q.correctAnswer.every(x => ans.includes(x));
              const isSkipped = ans.length === 0;
              return (
                <div key={q.id} className={`border-l-4 p-3 rounded ${isSkipped ? 'border-[#7C8F6E] bg-[#F5EFE0]/50' : isCorrect ? 'border-green-600 bg-green-50' : 'border-[#6E2A3A] bg-[#6E2A3A]/5'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-bold text-[#7C8F6E]">Q{i + 1}.</span>
                    <p className="text-sm text-[#173B2D] flex-1 whitespace-pre-wrap">{q.question}</p>
                    <span className="text-xs">
                      {isSkipped ? '⏭️' : isCorrect ? '✅' : '❌'}
                    </span>
                  </div>
                  {/* Options with correct/incorrect marking */}
                  <div className="ml-6 space-y-1 mb-2">
                    {q.options.map(opt => {
                      const isAns = ans.includes(opt.id);
                      const isCorrectOpt = q.correctAnswer.includes(opt.id);
                      return (
                        <div key={opt.id} className={`text-xs px-2 py-1 rounded ${isCorrectOpt ? 'bg-green-100 text-green-800 font-semibold' : isAns ? 'bg-red-100 text-red-800' : 'text-[#7C8F6E]'}`}>
                          <span className="font-bold mr-1">{opt.id.toUpperCase()}.</span>
                          {opt.text}
                          {isCorrectOpt && ' ✓'}
                          {isAns && !isCorrectOpt && ' ✗ (your answer)'}
                        </div>
                      );
                    })}
                  </div>
                  {/* Explanation */}
                  <div className="ml-6 mt-2 p-2 bg-[#F5EFE0] rounded text-xs">
                    <p className="text-[#173B2D] mb-1"><strong>Explanation:</strong> {q.explanation}</p>
                    <p className="text-green-700 mb-1"><strong>Why correct:</strong> {q.correctReason}</p>
                    <p className="text-[#6E2A3A]"><strong>Why others wrong:</strong> {q.incorrectReasons}</p>
                    <p className="text-[#7C8F6E] mt-1"><strong>Source:</strong> {q.source.reference}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={startQuiz} className="px-6 py-2.5 bg-[#173B2D] text-[#F5EFE0] rounded font-semibold text-sm hover:bg-[#2a5443]">
            🔄 Retake Quiz
          </button>
          <button onClick={resetQuiz} className="px-6 py-2.5 bg-[#C8A24A] text-[#173B2D] rounded font-semibold text-sm hover:bg-[#d4b560]">
            ⚙️ New Settings
          </button>
          <Link href="/dashboard" className="px-6 py-2.5 bg-white border border-[#E8DCC3] text-[#173B2D] rounded font-semibold text-sm hover:bg-[#F5EFE0]">
            🏠 Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
