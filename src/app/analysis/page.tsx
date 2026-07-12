'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type Result = { type: 'remedy' | 'rubric'; id: string; name: string; author: string };
type Ranked = { id: string; name: string; author: string; type: string; score: number };

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for',
  'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
  'this', 'that', 'these', 'those', 'from', 'as', 'when', 'where', 'while', 'about',
  'into', 'over', 'under', 'after', 'before', 'between', 'than', 'then', 'so', 'such',
  'no', 'not', 'nor', 'only', 'own', 'same', 'too', 'very', 's', 't', 'can', 'just',
  'feel', 'feeling', 'feels', 'feeling', 'with', 'very', 'much', 'also',
]);

export default function AnalysisPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [error, setError] = useState('');

  // Auth check
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  async function analyze() {
    const text = symptoms.trim();
    if (text.length < 3) {
      setError('Please enter at least a few words describing the symptoms.');
      return;
    }
    setError('');
    setAnalyzing(true);
    setRanked([]);
    try {
      const words = text
        .toLowerCase()
        .split(/[\s,.\/\\;:'"!?()[\]{}]+/)
        .map(w => w.trim())
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      const uniqueWords = Array.from(new Set(words)).slice(0, 15);

      if (uniqueWords.length === 0) {
        setError('No usable keywords found in input.');
        setAnalyzing(false);
        return;
      }

      // Query /api/search in parallel for each unique word
      const searches = await Promise.all(
        uniqueWords.map(w =>
          fetch(`/api/search?q=${encodeURIComponent(w)}`)
            .then(r => r.json())
            .then(d => (d.results || []) as Result[])
            .catch(() => [] as Result[])
        )
      );

      // Tally matches per remedy id
      const counts = new Map<string, Ranked>();
      searches.forEach((results, idx) => {
        for (const r of results) {
          if (r.type !== 'remedy') continue;
          const existing = counts.get(r.id);
          if (existing) {
            existing.score += 1;
          } else {
            counts.set(r.id, {
              id: r.id,
              name: r.name,
              author: r.author || '',
              type: r.type,
              score: 1,
            });
          }
        }
        // suppress idx-unused warning
        void idx;
      });

      const list = Array.from(counts.values()).sort((a, b) => b.score - a.score).slice(0, 15);
      setRanked(list);
      if (list.length === 0) {
        setError('No matching remedies found. Try different keywords.');
      }
    } catch {
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  const maxScore = ranked.length > 0 ? ranked[0].score : 1;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Analysis...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Symptom Analysis</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Enter symptoms to find matching remedies ranked by score</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Input */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">
            Describe the symptoms
          </label>
          <textarea
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="e.g. throbbing headache worse on right side, better from cold applications, worse in warm room..."
            rows={6}
            className="w-full px-4 py-3 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D] resize-y"
          />
          <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
            <p className="text-xs text-[#7C8F6E]">
              The analyzer splits your input into keywords, queries the search index, and ranks remedies by how many keywords they match.
            </p>
            <button
              onClick={analyze}
              disabled={analyzing || symptoms.trim().length < 3}
              className="px-5 py-2 bg-[#173B2D] hover:bg-[#2a5443] disabled:opacity-40 disabled:cursor-not-allowed text-[#F5EFE0] rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
            >
              {analyzing ? 'Analyzing...' : '🔍 Analyze'}
            </button>
          </div>
          {error && (
            <div className="mt-3 text-sm text-[#6E2A3A] bg-[#6E2A3A]/10 border border-[#6E2A3A]/30 rounded p-3">
              {error}
            </div>
          )}
        </section>

        {/* Results */}
        {analyzing && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-[#7C8F6E]">Searching the materia medica...</p>
          </div>
        )}

        {!analyzing && ranked.length > 0 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-serif text-xl text-[#173B2D] mb-1">Remedy Ranking</h2>
            <p className="text-xs text-[#7C8F6E] mb-4">
              {ranked.length} matching remedies — ranked by keyword match score
            </p>
            <div className="space-y-3">
              {ranked.map((r, i) => (
                <div key={r.id} className="border border-[#E8DCC3] rounded-lg p-3 hover:bg-[#F5EFE0] transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-[#C8A24A] text-[#173B2D]' : i < 3 ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-[#E8DCC3] text-[#173B2D]'
                      }`}>{i + 1}</span>
                      <div className="min-w-0">
                        <Link href={`/remedy/${r.id}`} className="font-serif text-base text-[#173B2D] hover:text-[#C8A24A] truncate block">
                          {r.name}
                        </Link>
                        <p className="text-[0.65rem] text-[#7C8F6E] uppercase tracking-wider">{r.author || '—'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-[#173B2D]">{r.score}</div>
                      <div className="text-[0.6rem] text-[#7C8F6E] uppercase tracking-wider">matches</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#E8DCC3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#173B2D] to-[#C8A24A] rounded-full transition-all"
                      style={{ width: `${Math.max(8, Math.round((r.score / maxScore) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
