'use client';
/// ============================================================
/// Remedy Reverse Lookup — Kent Repertory
///
/// Inside the existing Repertory section, this component provides:
///   • Search input for any remedy name (e.g., "Belladonna", "bell")
///   • Returns ALL Kent rubrics where the searched remedy appears
///   • Results grouped alphabetically A-Z (by chapter → rubricText)
///   • Each result card shows:
///       - Chapter (e.g., MIND, ABDOMEN)
///       - Full rubric hierarchy (rubricText preserves " — " separator)
///       - Searched remedy highlighted with grade badge
///       - Total remedies in that rubric
///   • Click any result → opens original Kent rubric detail modal
///
/// ARCHITECTURE:
///   - Uses existing /api/rubrics/by-remedy endpoint (Kent data only)
///   - Reuses existing Kent Repertory design system (cream/green theme)
///   - Mobile-first responsive layout
///   - Long rubric paths word-wrap (don't break layout)
///   - Sidebar navigation works normally (no Back button needed)
/// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type MatchedRemedy = { abbrev: string; grade: number };

export type ReverseLookupRubric = {
  id: string;
  chapter: string;
  level: number;
  rubricText: string;
  fullPath: string;
  fullPathParts: string[];
  entryType: string;
  crossReference: string | null;
  remedies: string[];
  remediesGraded: { abbrev: string; grade: number }[];
  remedyCount: number;
  singleRemedy: boolean;
  pdfPage: number;
  matchedRemedies: MatchedRemedy[];
};

type ApiResponse = {
  remedy: string;
  grade: number;
  author: string;
  total: number;
  rubrics: ReverseLookupRubric[];
  matchedVariants: string[];
  note?: string;
};

// ============================================================
// GRADE COLORS — matches existing Repertory page convention
// ============================================================
const GRADE_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  4: { bg: '#DC2626', text: '#FFFFFF', label: 'G4' },
  3: { bg: '#166534', text: '#FFFFFF', label: 'G3' },
  2: { bg: '#1E40AF', text: '#FFFFFF', label: 'G2' },
  1: { bg: '#374151', text: '#FFFFFF', label: 'G1' },
};

function GradeBadge({ abbrev, grade }: { abbrev: string; grade: number }) {
  const meta = GRADE_COLORS[grade] || GRADE_COLORS[1];
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.65rem] font-mono font-semibold"
      style={{ backgroundColor: meta.bg, color: meta.text }}
      title={`${abbrev} — Grade ${grade}`}
    >
      {abbrev}
      <span className="text-[0.5rem] opacity-80">{meta.label}</span>
    </span>
  );
}

// ============================================================
// CHAPTER ICON — for visual chapter identification
// ============================================================
function getChapterIcon(chapter: string): string {
  const map: Record<string, string> = {
    'MIND': '🧠',
    'VERTIGO': '💫',
    'HEAD': '🧑',
    'EYE': '👁️',
    'VISION': '👁️',
    'EAR': '👂',
    'HEARING': '👂',
    'NOSE': '👃',
    'FACE': '🙂',
    'MOUTH': '👄',
    'TEETH': '🦷',
    'THROAT': '🪢',
    'EXTERNAL THROAT': '🪢',
    'STOMACH': '🍽️',
    'ABDOMEN': '🫃',
    'RECTUM': '⬇️',
    'STOOL': '⬇️',
    'URINARY ORGANS': '💧',
    'URINE': '💧',
    'GENITALIA, MALE': '♂️',
    'GENITALIA, FEMALE': '♀️',
    'PREGNANCY': '🤰',
    'LARYNX AND TRACHEA': '🗣️',
    'RESPIRATION': '🫁',
    'COUGH': '😷',
    'EXPECTORATION': '🗣️',
    'CHEST': '❤️',
    'HEART': '❤️',
    'PULSE': '💓',
    'NECK AND BACK': '🦴',
    'BACK': '🦴',
    'EXTREMITIES': '🦵',
    'LIMBS IN GENERAL': '🦵',
    'LOWER LIMBS': '🦵',
    'UPPER LIMBS': '💪',
    'SLEEP': '😴',
    'DREAMS': '💤',
    'CHILL': '🥶',
    'FEVER': '🥵',
    'PERSPIRATION': '💧',
    'SKIN': '🩹',
    'TISSUES IN GENERAL': '🩹',
    'GLANDS': '🫀',
    'SENSATIONS': '✨',
    'CONCOMITANTS': '📋',
  };
  return map[chapter?.toUpperCase()] || '📖';
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function RemedyReverseLookup({
  onSelectRubric,
}: {
  /** Called when user clicks a result card — passes the rubric entry
   *  so the parent component can open the existing rubric detail modal. */
  onSelectRubric: (rubric: ReverseLookupRubric) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults(null);
      setSearched(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/rubrics/by-remedy?name=${encodeURIComponent(trimmed)}&author=Kent`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setResults(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to search. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSearchChange = (value: string) => {
    setQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(value), 400);
  };

  // Group results by first letter of chapter (or rubricText if chapter is empty)
  const groupedResults = (() => {
    if (!results?.rubrics?.length) return [];
    const groups: Record<string, ReverseLookupRubric[]> = {};
    for (const r of results.rubrics) {
      // Use first letter of chapter (e.g., "M" for MIND)
      // If chapter empty, use first letter of rubricText
      const key = (r.chapter || r.rubricText || '?').charAt(0).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    // Sort groups alphabetically by letter
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  })();

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-3">
      {/* SEARCH INPUT */}
      <div className="bg-white rounded-lg border border-[#DEDACF] p-3 shadow-sm">
        <label className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider mb-1.5 block">
          Search Remedy
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter remedy name (e.g., Belladonna, bell, Arsenicum)"
            value={query}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#DEDACF] rounded-lg text-sm focus:outline-none focus:border-[#124C3B] text-[#243A32] bg-[#FAF8F2]"
            autoFocus
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          {query && (
            <button
              onClick={() => { setQuery(''); setResults(null); setSearched(false); setError(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C8F6E] hover:text-[#124C3B]"
              title="Clear search"
            >✕</button>
          )}
        </div>
        <p className="text-xs text-[#7C8F6E] mt-1.5">
          Returns every Kent rubric where the searched remedy appears.
        </p>
      </div>

      {/* RESULTS HEADER */}
      {searched && !loading && !error && results && (
        <div className="bg-white rounded-lg border border-[#DEDACF] p-3 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs font-semibold text-[#7C8F6E] uppercase tracking-wider">
                Kent&apos;s Repertory
              </div>
              <div className="font-serif text-lg text-[#124C3B] mt-0.5">
                Remedy: <span className="font-bold uppercase">{results.remedy}</span>
              </div>
              <div className="text-xs text-[#7C8F6E] mt-0.5">
                Grade: <span className="font-semibold text-[#124C3B]">3rd Grade</span>
                <span className="mx-2">•</span>
                Total Rubrics: <span className="font-semibold text-[#C49A3A]">{results.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#FFF8E1] border border-[#C49A3A]/30 rounded-full px-3 py-1.5">
              <span className="text-xs text-[#C49A3A]">📊</span>
              <span className="text-sm font-bold text-[#124C3B]">{results.total.toLocaleString()}</span>
              <span className="text-xs text-[#7C8F6E]">Matches</span>
            </div>
          </div>
          {results.matchedVariants && results.matchedVariants.length > 0 && (
            <div className="mt-2 text-xs text-[#7C8F6E]">
              <span className="font-semibold">Matched as:</span>{' '}
              {results.matchedVariants.slice(0, 6).map((v, i) => (
                <span key={i} className="inline-block bg-[#EAF4EF] text-[#124C3B] px-1.5 py-0.5 rounded mr-1 font-mono text-[0.65rem]">
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-white rounded-lg border border-[#DEDACF] p-8 shadow-sm text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#E8DCC3] border-t-[#124C3B] rounded-full animate-spin mb-2"></div>
          <div className="text-sm text-[#7C8F6E]">Searching Kent rubrics...</div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 shadow-sm">
          <div className="text-sm text-red-700 font-semibold">⚠ Search failed</div>
          <div className="text-xs text-red-600 mt-1">{error}</div>
          <button
            onClick={() => performSearch(query)}
            className="mt-2 text-xs text-red-700 underline hover:text-red-900"
          >Retry</button>
        </div>
      )}

      {/* EMPTY STATE — before any search */}
      {!searched && !loading && !error && (
        <div className="bg-white rounded-lg border border-[#DEDACF] p-6 shadow-sm text-center">
          <div className="text-4xl mb-2">📖</div>
          <div className="text-sm font-semibold text-[#124C3B] mb-1">
            Search a remedy to view all of its 3rd-grade Kent rubrics.
          </div>
          <div className="text-xs text-[#7C8F6E]">
            Try: <span className="font-mono text-[#124C3B]">Belladonna</span>,
            <span className="font-mono text-[#124C3B]"> bell</span>,
            <span className="font-mono text-[#124C3B]"> Aconite</span>,
            <span className="font-mono text-[#124C3B]"> Pulsatilla</span>,
            <span className="font-mono text-[#124C3B]"> Sulphur</span>
          </div>
        </div>
      )}

      {/* NO RESULTS STATE */}
      {searched && !loading && !error && results && results.total === 0 && (
        <div className="bg-white rounded-lg border border-[#DEDACF] p-6 shadow-sm text-center">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-sm font-semibold text-[#124C3B] mb-1">
            No 3rd-grade Kent rubrics found for:
          </div>
          <div className="text-base font-bold text-[#124C3B] uppercase tracking-wide">
            {results.remedy}
          </div>
          <div className="text-xs text-[#7C8F6E] mt-2">
            Try searching by abbreviation (e.g., &quot;bell&quot; for Belladonna)
            or check the spelling.
          </div>
        </div>
      )}

      {/* ALPHABETICAL GROUPED RESULTS */}
      {searched && !loading && !error && results && results.total > 0 && (
        <div className="space-y-3">
          {/* A-Z quick-jump */}
          <div className="bg-white rounded-lg border border-[#DEDACF] p-2 shadow-sm sticky top-2 z-10">
            <div className="flex flex-wrap gap-1 justify-center">
              {groupedResults.map(([letter, items]) => (
                <a
                  key={letter}
                  href={`#remedy-letter-${letter}`}
                  className="w-7 h-7 flex items-center justify-center rounded text-xs font-bold text-[#124C3B] bg-[#EAF4EF] hover:bg-[#124C3B] hover:text-white transition-colors"
                  title={`${items.length} rubrics starting with ${letter}`}
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          {/* Results grouped by letter */}
          {groupedResults.map(([letter, items]) => (
            <div key={letter} id={`remedy-letter-${letter}`} className="space-y-2">
              {/* Letter header */}
              <div className="bg-[#124C3B] text-white px-3 py-2 rounded-lg shadow-sm sticky top-12 z-10">
                <div className="flex items-center justify-between">
                  <div className="font-serif text-xl font-bold">{letter}</div>
                  <div className="text-xs text-[#C49A3A] font-semibold">
                    {items.length} rubric{items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Result cards */}
              <div className="space-y-2">
                {items.map(rubric => (
                  <ResultCard
                    key={rubric.id}
                    rubric={rubric}
                    onClick={() => onSelectRubric(rubric)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// RESULT CARD — single rubric entry with full hierarchy
// ============================================================
function ResultCard({
  rubric,
  onClick,
}: {
  rubric: ReverseLookupRubric;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-[#DEDACF] p-3 shadow-sm hover:shadow-md hover:border-[#124C3B]/40 transition-all"
    >
      {/* Chapter label */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{getChapterIcon(rubric.chapter)}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#124C3B]">
            {rubric.chapter}
          </span>
        </div>
        <div className="text-[0.65rem] text-[#7C8F6E] font-mono">
          p.{rubric.pdfPage || '?'}
        </div>
      </div>

      {/* Full rubric hierarchy (preserves " — " separators) */}
      <div className="text-sm text-[#243A32] leading-relaxed break-words">
        {rubric.rubricText.split(' — ').map((part, i, arr) => (
          <span key={i} className="block">
            <span
              className={
                i === 0
                  ? 'font-semibold text-[#124C3B]'
                  : i === arr.length - 1
                  ? 'font-medium'
                  : 'text-[#7C8F6E]'
              }
              style={{ paddingLeft: `${i * 12}px` }}
            >
              {i === 0 ? '' : '↳ '}
              {part}
            </span>
          </span>
        ))}
      </div>

      {/* Matched remedy + grade */}
      <div className="mt-2 pt-2 border-t border-[#DEDACF]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#7C8F6E]">Matched:</span>
            {rubric.matchedRemedies.map((m, i) => (
              <GradeBadge key={i} abbrev={m.abbrev} grade={m.grade} />
            ))}
          </div>
          <div className="text-xs text-[#7C8F6E]">
            {rubric.remedyCount} total remedies
          </div>
        </div>
      </div>

      {/* Footer: source attribution */}
      <div className="mt-2 pt-1.5 border-t border-[#DEDACF]/50 flex items-center justify-between">
        <div className="text-[0.65rem] text-[#7C8F6E] uppercase tracking-wider">
          Kent&apos;s Repertory
        </div>
        <div className="text-[0.65rem] text-[#124C3B] font-semibold flex items-center gap-0.5">
          View detail →
        </div>
      </div>
    </button>
  );
}
