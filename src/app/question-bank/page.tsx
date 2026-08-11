'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * AI-Powered Homeopathy Question Bank
 *
 * Features:
 *   - 25 free MCQs/day, unlimited for premium (admin/staff)
 *   - Source metadata is NEVER shown (security)
 *   - Simplified answer format: Question, A/B/C/D, Correct Answer, Reason
 *   - Bookmark + Review Later
 *   - Daily limit reached → upgrade CTA
 *   - Question + option shuffling
 */
type Phase = 'setup' | 'quiz' | 'results' | 'limit_reached';

interface QuestionOption { id: string; text: string; isCorrect: boolean; }
interface ClientQuestion {
  id: string; type: string; difficulty: string;
  question: string; options: QuestionOption[];
  correctAnswer: string[]; reason: string;
  estimatedTime: number; marks: number; negativeMark: number;
}

interface UsageInfo {
  generated: number; limit: number; remaining: number; premium: boolean;
}

export default function QuestionBankPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [reviewLater, setReviewLater] = useState<Set<string>>(new Set());

  // Quiz settings
  const [sourceType, setSourceType] = useState<'mixed' | 'remedy' | 'rubric' | 'book'>('mixed');
  const [difficulty, setDifficulty] = useState<'any' | 'easy' | 'medium' | 'hard'>('any');
  const [questionType, setQuestionType] = useState('any');
  const [count, setCount] = useState(10);
  const [timerMinutes, setTimerMinutes] = useState(0);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      setSession(d);
    });
  }, [router]);

  useEffect(() => {
    if (session) loadUsage();
  }, [session]);

  useEffect(() => {
    if (phase === 'quiz' && timeLeft > 0) {
      const t = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { setTimeout(() => finishQuiz(), 0); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [phase, timeLeft]);

  async function loadUsage() {
    try {
      const r = await fetch('/api/question-bank/usage');
      const d = await r.json();
      setUsage(d);
    } catch {}
  }

  async function startQuiz() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/question-bank/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType, difficulty, questionType, count,
        }),
      });
      const d = await r.json();
      if (d.error === 'DAILY_LIMIT_REACHED') {
        setPhase('limit_reached');
        setLoading(false);
        loadUsage();
        return;
      }
      if (d.error) throw new Error(d.message || d.error);
      if (!d.questions || d.questions.length === 0) {
        throw new Error('No questions could be generated. Try different settings.');
      }
      setQuestions(d.questions);
      setAnswers({});
      setCurrentIdx(0);
      setStartTime(Date.now());
      if (timerMinutes > 0) setTimeLeft(timerMinutes * 60);
      setPhase('quiz');
      loadUsage(); // refresh usage count
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [qId]: [optionId] }));
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
    else finishQuiz();
  }

  function prevQuestion() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }

  function finishQuiz() {
    setPhase('results');
    // Submit attempt
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    let correct = 0, incorrect = 0, skipped = 0;
    for (const q of questions) {
      const ans = answers[q.id];
      if (!ans || ans.length === 0) { skipped++; continue; }
      const correctSet = new Set(q.correctAnswer);
      const ansSet = new Set(ans);
      if (correctSet.size === ansSet.size && Array.from(correctSet).every(x => ansSet.has(x))) correct++;
      else incorrect++;
    }
    fetch('/api/question-bank/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalQuestions: questions.length, correct, incorrect, skipped,
        score: correct, percentage: Math.round((correct / questions.length) * 100), timeTaken,
        settings: { sourceType, difficulty, questionType, count },
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
    loadUsage();
  }

  async function toggleBookmark(q: ClientQuestion) {
    const isBookmarked = bookmarks.has(q.id);
    if (isBookmarked) {
      setBookmarks(prev => { const n = new Set(prev); n.delete(q.id); return n; });
      fetch(`/api/question-bank/bookmark?id=${encodeURIComponent(q.id)}`, { method: 'DELETE' }).catch(() => {});
    } else {
      setBookmarks(prev => new Set(prev).add(q.id));
      fetch('/api/question-bank/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, questionData: q }),
      }).catch(() => {});
    }
  }

  async function toggleReviewLater(q: ClientQuestion) {
    const isInReview = reviewLater.has(q.id);
    if (isInReview) {
      setReviewLater(prev => { const n = new Set(prev); n.delete(q.id); return n; });
      fetch(`/api/question-bank/review?id=${encodeURIComponent(q.id)}`, { method: 'DELETE' }).catch(() => {});
    } else {
      setReviewLater(prev => new Set(prev).add(q.id));
      const ans = answers[q.id] || [];
      const isCorrect = ans.length > 0 && q.correctAnswer.length === ans.length && q.correctAnswer.every(x => ans.includes(x));
      fetch('/api/question-bank/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, questionData: q, userAnswer: ans, isCorrect }),
      }).catch(() => {});
    }
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
  // PHASE: DAILY LIMIT REACHED
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'limit_reached') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="font-serif text-2xl text-[#173B2D] mb-3">Daily Free Limit Reached</h1>
            <p className="text-sm text-[#7C8F6E] mb-6">
              You&apos;ve used all {usage?.limit || 25} free MCQs for today.
              Come back tomorrow or upgrade for unlimited access.
            </p>
            <div className="bg-[#173B2D] rounded-lg p-6 mb-6 text-left">
              <h2 className="font-serif text-lg text-[#C8A24A] mb-3 text-center">⭐ Premium Benefits</h2>
              <ul className="text-sm text-stone-200 space-y-2">
                <li className="flex items-center gap-2"><span className="text-[#C8A24A]">✓</span> Unlimited Daily MCQs</li>
                <li className="flex items-center gap-2"><span className="text-[#C8A24A]">✓</span> Unlimited Practice Sessions</li>
                <li className="flex items-center gap-2"><span className="text-[#C8A24A]">✓</span> Unlimited Mock Tests</li>
                <li className="flex items-center gap-2"><span className="text-[#C8A24A]">✓</span> Unlimited Random Papers</li>
                <li className="flex items-center gap-2"><span className="text-[#C8A24A]">✓</span> Advanced Analytics</li>
                <li className="flex items-center gap-2"><span className="text-[#C8A24A]">✓</span> Priority Question Generation</li>
              </ul>
            </div>
            <button className="w-full bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] font-bold py-3 rounded uppercase tracking-wider text-sm mb-3">
              ⭐ Upgrade to Premium
            </button>
            <button onClick={resetQuiz} className="w-full bg-white border border-[#E8DCC3] text-[#173B2D] py-2 rounded text-sm hover:bg-[#F5EFE0]">
              ← Back to Setup
            </button>
          </div>
        </main>
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
            <h1 className="font-serif text-3xl text-[#173B2D]">AI Question Bank</h1>
            <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">
              Powered by your library content
            </p>
            <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
          </header>

          {/* Usage bar */}
          {usage && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">
                  {usage.premium ? '⭐ Premium Account' : 'Free Plan'}
                </span>
                <span className="text-xs text-[#173B2D]">
                  {usage.premium ? 'Unlimited' : `${usage.generated} / ${usage.limit} used today`}
                </span>
              </div>
              {!usage.premium && (
                <div className="w-full h-2 bg-[#E8DCC3] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C8A24A] transition-all"
                    style={{ width: `${Math.min(100, (usage.generated / usage.limit) * 100)}%` }} />
                </div>
              )}
              {!usage.premium && usage.remaining > 0 && (
                <p className="text-xs text-[#7C8F6E] mt-1">{usage.remaining} MCQs remaining today</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-[#6E2A3A]/10 border border-[#6E2A3A]/30 text-[#6E2A3A] rounded p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-5 space-y-4">
            <h2 className="font-serif text-lg text-[#173B2D] border-b border-[#E8DCC3] pb-2">Quiz Settings</h2>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]">
                  <option value="any">Any (random)</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Question Type</label>
                <select value={questionType} onChange={e => setQuestionType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]">
                  <option value="any">Any (mixed)</option>
                  <option value="single">Single Correct</option>
                  <option value="clinical_based">Clinical Based</option>
                  <option value="statement_based">Statement Based</option>
                  <option value="assertion_reason">Assertion & Reason</option>
                  <option value="concept_based">Concept Based</option>
                  <option value="recall">Recall</option>
                  <option value="application">Application</option>
                  <option value="true_false">True / False</option>
                  <option value="except">EXCEPT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Question Count</label>
                <input type="number" min={1} max={50} value={count} onChange={e => setCount(Math.min(50, Math.max(1, +e.target.value)))}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#7C8F6E] font-semibold">Timer (min)</label>
                <input type="number" min={0} max={180} value={timerMinutes} onChange={e => setTimerMinutes(Math.min(180, Math.max(0, +e.target.value)))}
                  className="w-full mt-1 px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D]" />
                <p className="text-[0.6rem] text-[#7C8F6E] mt-0.5">0 = no timer</p>
              </div>
            </div>

            <button onClick={startQuiz} disabled={loading}
              className="w-full bg-[#173B2D] hover:bg-[#2a5443] text-[#F5EFE0] font-semibold py-3 rounded uppercase tracking-wider text-sm disabled:opacity-50">
              {loading ? '⏳ Generating...' : `🚀 Start Quiz (${count} questions)`}
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
    if (!q) {
      return (
        <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
          <Navbar />
          <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full text-center">
            <p className="text-sm text-[#7C8F6E]">No questions available.</p>
            <button onClick={resetQuiz} className="mt-4 px-6 py-2 bg-[#173B2D] text-[#F5EFE0] rounded text-sm">← Back to Setup</button>
          </main>
          <Footer />
        </div>
      );
    }
    const answered = Object.keys(answers).length;
    const isBookmarked = bookmarks.has(q.id);
    const isInReview = reviewLater.has(q.id);

    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full">
          {/* Progress */}
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

          {/* Question card — NO source metadata shown */}
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F5EFE0] text-[#173B2D]">
                {q.type.replace(/_/g, ' ')}
              </span>
              <span className={`text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                q.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>{q.difficulty}</span>
              {/* Bookmark + Review buttons */}
              <div className="ml-auto flex gap-1">
                <button onClick={() => toggleBookmark(q)}
                  className={`text-xs px-2 py-1 rounded ${isBookmarked ? 'bg-[#C8A24A] text-[#173B2D]' : 'bg-[#E8DCC3] text-[#7C8F6E] hover:bg-[#D9C9A8]'}`}
                  title="Bookmark">
                  {isBookmarked ? '★' : '☆'}
                </button>
                <button onClick={() => toggleReviewLater(q)}
                  className={`text-xs px-2 py-1 rounded ${isInReview ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-[#E8DCC3] text-[#7C8F6E] hover:bg-[#D9C9A8]'}`}
                  title="Review Later">
                  📋
                </button>
              </div>
            </div>
            {/* Question text */}
            <p className="font-serif text-lg text-[#173B2D] whitespace-pre-wrap mb-4">{q.question}</p>

            {/* Options A B C D */}
            <div className="space-y-2">
              {q.options.map(opt => {
                const selected = (answers[q.id] || []).includes(opt.id);
                return (
                  <button key={opt.id} onClick={() => selectAnswer(q.id, opt.id)}
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
                  ✓ Finish
                </button>
              )}
            </div>
          </div>

          {/* Question grid */}
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
  // PHASE: RESULTS — Simplified format: Question, A/B/C/D, Correct, Reason
  // ═══════════════════════════════════════════════════════════════════════════
  const timeTaken = Math.round((Date.now() - startTime) / 1000);
  let correct = 0, incorrect = 0, skipped = 0;
  for (const q of questions) {
    const ans = answers[q.id];
    if (!ans || ans.length === 0) { skipped++; continue; }
    const correctSet = new Set(q.correctAnswer);
    const ansSet = new Set(ans);
    if (correctSet.size === ansSet.size && Array.from(correctSet).every(x => ansSet.has(x))) correct++;
    else incorrect++;
  }
  const percentage = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <header className="mb-6 text-center">
          <h1 className="font-serif text-3xl text-[#173B2D]">Quiz Results</h1>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3 mx-auto"></div>
        </header>

        {/* Score */}
        <div className="bg-[#173B2D] rounded-lg p-6 mb-6 text-center">
          <div className="text-5xl font-bold font-serif text-[#C8A24A] mb-2">{percentage}%</div>
          <div className="text-sm text-stone-300">{correct} correct / {questions.length} total</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
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
            <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E]">Time</div>
          </div>
        </div>

        {/* Per-question review — SIMPLIFIED FORMAT (no source metadata) */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-serif text-lg text-[#173B2D] mb-4">Question Review</h3>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const ans = answers[q.id] || [];
              const isCorrect = ans.length > 0 && q.correctAnswer.length === ans.length && q.correctAnswer.every(x => ans.includes(x));
              const isSkipped = ans.length === 0;
              return (
                <div key={q.id} className={`border-l-4 p-4 rounded ${isSkipped ? 'border-[#7C8F6E] bg-[#F5EFE0]/50' : isCorrect ? 'border-green-600 bg-green-50' : 'border-[#6E2A3A] bg-[#6E2A3A]/5'}`}>
                  {/* Question */}
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-bold text-[#7C8F6E]">Q{i + 1}.</span>
                    <p className="text-sm text-[#173B2D] flex-1 whitespace-pre-wrap font-medium">{q.question}</p>
                    <span className="text-xs">{isSkipped ? '⏭️' : isCorrect ? '✅' : '❌'}</span>
                  </div>

                  {/* Options A B C D */}
                  <div className="ml-6 space-y-1 mb-3">
                    {q.options.map(opt => {
                      const isAns = ans.includes(opt.id);
                      const isCorrectOpt = q.correctAnswer.includes(opt.id);
                      return (
                        <div key={opt.id} className={`text-xs px-2 py-1 rounded ${isCorrectOpt ? 'bg-green-100 text-green-800 font-semibold' : isAns ? 'bg-red-100 text-red-800' : 'text-[#7C8F6E]'}`}>
                          <span className="font-bold mr-1">{opt.id.toUpperCase()}.</span>
                          {opt.text}
                          {isCorrectOpt && ' ✓'}
                          {isAns && !isCorrectOpt && ' ✗'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Correct Answer */}
                  <div className="ml-6 mb-2 p-2 bg-green-50 rounded">
                    <p className="text-xs text-green-800">
                      <strong>✅ Correct Answer:</strong>{' '}
                      {q.correctAnswer.map(id => id.toUpperCase()).join(', ')}
                    </p>
                  </div>

                  {/* Reason */}
                  <div className="ml-6 p-2 bg-[#F5EFE0] rounded">
                    <p className="text-xs text-[#173B2D]">
                      <strong>Reason:</strong> {q.reason}
                    </p>
                  </div>

                  {/* NO source metadata shown — security requirement */}
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
