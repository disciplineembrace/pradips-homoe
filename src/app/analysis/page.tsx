'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type RubricSuggestion = {
  id: string; title: string; path: string; author: string;
  remedies: string[]; remedyCount: number;
  matchScore: number; matchedKeywords: string[];
};

type SelectedRubric = {
  id: string; title: string; path: string; author: string;
  remedies: string[];
  intensity: 'low' | 'medium' | 'high';
  category: 'mental' | 'general' | 'particular';
};

type RankedRemedy = {
  name: string; totalScore: number; murphyScore: number; phatakScore: number; kentScore: number;
  rubricsCovered: string[]; rubricCount: number; sources: string[]; sourceCount: number;
  keynoteMatch: boolean; mmMatch: boolean; avgGrade: string;
  confidence: string; confidencePercent: number;
};

type AnalysisResult = {
  totalRubrics: number; totalRemedies: number;
  rankedRemedies: RankedRemedy[]; explanation: string; disclaimer: string;
};

export default function AnalysisPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const rf = useReaderFeatures();

  // Left panel: search
  const [symptomText, setSymptomText] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string[]>(['Murphy', 'Phatak', 'Kent']);
  const [suggestions, setSuggestions] = useState<RubricSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Middle panel: clipboard
  const [clipboard, setClipboard] = useState<SelectedRubric[]>([]);

  // Right panel: results
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedRemedyDetail, setSelectedRemedyDetail] = useState<any>(null);
  const [compareRemedies, setCompareRemedies] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      setSession(d);
    });
  }, [router]);

  // AI rubric suggestion
  async function suggestRubrics() {
    if (!symptomText.trim()) return;
    setSearching(true);
    setSearchError('');
    setSuggestions([]);
    try {
      const r = await fetch('/api/ai/suggest-rubrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptomText, sources: sourceFilter }),
      });
      const d = await r.json();
      if (!r.ok) { setSearchError(d.error || 'Search failed'); return; }
      setSuggestions(d.suggestions || []);
    } catch { setSearchError('Network error'); }
    finally { setSearching(false); }
  }

  // Add rubric to clipboard
  function addRubric(s: RubricSuggestion) {
    const exists = clipboard.find(c => c.id === s.id && c.author === s.author);
    if (exists) return;
    setClipboard([...clipboard, {
      id: s.id, title: s.title, path: s.path, author: s.author,
      remedies: s.remedies,
      intensity: 'medium', category: 'general',
    }]);
  }

  // Remove rubric from clipboard
  function removeRubric(index: number) {
    setClipboard(clipboard.filter((_, i) => i !== index));
  }

  // Update rubric in clipboard
  function updateRubric(index: number, field: string, value: any) {
    const next = [...clipboard];
    (next[index] as any)[field] = value;
    setClipboard(next);
  }

  // Run analysis
  async function runAnalysis() {
    if (clipboard.length === 0) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const r = await fetch('/api/analysis/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubrics: clipboard }),
      });
      const d = await r.json();
      if (!r.ok) { setSearchError(d.error || 'Analysis failed'); return; }
      setAnalysis(d);
    } catch { setSearchError('Network error'); }
    finally { setAnalyzing(false); }
  }

  // Load remedy detail (keynotes + MM)
  async function loadRemedyDetail(remedyName: string) {
    setSelectedRemedyDetail({ loading: true, name: remedyName });
    try {
      // Search for remedy by name
      const searchR = await fetch(`/api/search?q=${encodeURIComponent(remedyName)}`);
      const searchD = await searchR.json();
      const match = (searchD.results || []).find((r: any) => r.type === 'remedy' && r.name.toLowerCase().includes(remedyName.toLowerCase()));
      if (!match) { setSelectedRemedyDetail({ name: remedyName, error: 'Remedy not found in database' }); return; }

      const [knR, mmR] = await Promise.all([
        fetch(`/api/remedies/${match.id}/keynotes`).then(r => r.json()),
        fetch(`/api/remedies/${match.id}/materia-medica`).then(r => r.json()),
      ]);
      setSelectedRemedyDetail({ name: remedyName, id: match.id, ...mmR, keynotes: knR });
    } catch { setSelectedRemedyDetail({ name: remedyName, error: 'Failed to load' }); }
  }

  if (!session) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-[#7C8F6E]">Loading analysis platform...</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-[1600px] mx-auto px-4 py-4 w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-serif text-2xl text-[#173B2D]">Integrated Repertory Analysis Platform</h1>
          <p className="text-xs text-[#7C8F6E]">AI-assisted repertorization using Murphy, Phatak & Kent — Final decision rests with the practitioner</p>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '70vh' }}>

          {/* LEFT PANEL: Search */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col" style={{ maxHeight: '80vh' }}>
            <h2 className="font-serif text-sm text-[#173B2D] mb-3 uppercase tracking-wider">🔍 Rubric Search</h2>

            {/* Symptom input */}
            <textarea
              value={symptomText}
              onChange={e => setSymptomText(e.target.value)}
              placeholder="Enter patient symptoms in natural language... e.g., 'anxiety at night, fear of death, restlessness, thirst for small quantities'"
              rows={4}
              className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D] mb-3"
            />

            {/* Source filter */}
            <div className="flex gap-2 mb-3">
              {['Murphy', 'Phatak', 'Kent'].map(src => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])}
                  className={`px-2 py-1 text-xs rounded font-semibold ${sourceFilter.includes(src) ? 'bg-[#173B2D] text-[#C8A24A]' : 'bg-[#F5EFE0] text-[#7C8F6E]'}`}
                >{src}</button>
              ))}
            </div>

            <button
              onClick={suggestRubrics}
              disabled={searching || !symptomText.trim()}
              className="bg-[#173B2D] hover:bg-[#2a5443] disabled:opacity-50 text-white py-2 rounded font-semibold text-sm mb-3"
            >{searching ? 'Searching...' : 'Suggest Rubrics →'}</button>

            {searchError && <div className="text-red-600 text-xs bg-red-50 p-2 rounded mb-3">{searchError}</div>}

            {/* Suggestions */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {suggestions.length === 0 && !searching && (
                <p className="text-xs text-[#7C8F6E] italic text-center py-4">Enter symptoms and click "Suggest Rubrics" to see matching rubrics from your database</p>
              )}
              {suggestions.map((s, i) => {
                const added = clipboard.find(c => c.id === s.id && c.author === s.author);
                return (
                  <div key={`${s.id}-${s.author}-${i}`} className={`p-2 rounded border ${added ? 'bg-[#C8A24A]/10 border-[#C8A24A]' : 'bg-[#FAF6EC] border-[#E8DCC3]'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#173B2D]">{s.title}</div>
                        <div className="text-xs text-[#7C8F6E]">{s.path} · {s.author}</div>
                        <div className="text-xs text-[#C8A24A]">{s.remedyCount} remedies · Match: {s.matchScore}</div>
                      </div>
                      <button
                        onClick={() => addRubric(s)}
                        disabled={!!added}
                        className={`text-xs px-2 py-1 rounded font-semibold ${added ? 'bg-[#C8A24A]/30 text-[#7C8F6E]' : 'bg-[#173B2D] text-white hover:bg-[#2a5443]'}`}
                      >{added ? '✓ Added' : '+ Add'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MIDDLE PANEL: Clipboard */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col" style={{ maxHeight: '80vh' }}>
            <h2 className="font-serif text-sm text-[#173B2D] mb-3 uppercase tracking-wider">📋 Selected Rubrics ({clipboard.length})</h2>

            {clipboard.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-[#7C8F6E] italic text-center">No rubrics selected yet. Search and add rubrics from the left panel.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {clipboard.map((r, i) => (
                    <div key={`${r.id}-${r.author}-${i}`} className="p-2 rounded border border-[#E8DCC3] bg-[#FAF6EC]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#173B2D]">{r.title}</div>
                          <div className="text-xs text-[#7C8F6E]">{r.path} · {r.author}</div>
                        </div>
                        <button onClick={() => removeRubric(i)} className="text-xs text-[#6E2A3A] hover:underline">✕</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[0.6rem] text-[#7C8F6E] uppercase">Intensity</label>
                          <select value={r.intensity} onChange={e => updateRubric(i, 'intensity', e.target.value)} className="w-full text-xs px-2 py-1 border border-[#E8DCC3] rounded">
                            <option value="low">Low ×1</option>
                            <option value="medium">Medium ×1.5</option>
                            <option value="high">High ×2</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[0.6rem] text-[#7C8F6E] uppercase">Category</label>
                          <select value={r.category} onChange={e => updateRubric(i, 'category', e.target.value)} className="w-full text-xs px-2 py-1 border border-[#E8DCC3] rounded">
                            <option value="mental">Mental ×1.5</option>
                            <option value="general">General ×1.2</option>
                            <option value="particular">Particular ×1.0</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={runAnalysis}
                  disabled={analyzing || clipboard.length === 0}
                  className="bg-[#C8A24A] hover:bg-[#d4b560] disabled:opacity-50 text-[#173B2D] py-2 rounded font-bold text-sm"
                >{analyzing ? 'Analyzing...' : '⚡ Analyze Remedies'}</button>
              </>
            )}
          </div>

          {/* RIGHT PANEL: Results */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col" style={{ maxHeight: '80vh' }}>
            <h2 className="font-serif text-sm text-[#173B2D] mb-3 uppercase tracking-wider">📊 Analysis Results</h2>

            {!analysis ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-[#7C8F6E] italic text-center">Select rubrics and click "Analyze" to see remedy ranking, scores, and correlation.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {/* Summary */}
                <div className="bg-[#173B2D] text-[#C8A24A] p-3 rounded mb-3">
                  <p className="text-xs font-serif italic">{analysis.explanation}</p>
                </div>

                {/* Ranking table */}
                <div className="space-y-1 mb-4">
                  {analysis.rankedRemedies.map((r, i) => (
                    <div key={i} className={`p-2 rounded border ${i === 0 ? 'border-[#C8A24A] bg-[#C8A24A]/10' : 'border-[#E8DCC3] bg-[#FAF6EC]'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C8A24A]">#{i + 1}</span>
                          <button onClick={() => loadRemedyDetail(r.name)} className="text-sm font-semibold text-[#173B2D] hover:text-[#C8A24A] hover:underline">{r.name}</button>
                          {r.keynoteMatch && <span className="text-[0.6rem] bg-[#C8A24A] text-[#173B2D] px-1 rounded">★ KN</span>}
                          {r.mmMatch && <span className="text-[0.6rem] bg-[#173B2D] text-[#C8A24A] px-1 rounded">MM</span>}
                        </div>
                        <span className={`text-xs font-bold ${r.confidence === 'High' ? 'text-[#173B2D]' : r.confidence === 'Medium' ? 'text-[#C8A24A]' : 'text-[#7C8F6E]'}`}>{r.confidencePercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[0.65rem] text-[#7C8F6E]">
                        <span>Score: <b className="text-[#173B2D]">{r.totalScore}</b></span>
                        <span>Covered: <b>{r.rubricCount}/{analysis.totalRubrics}</b></span>
                        <span>Sources: <b>{r.sources.join('+')}</b></span>
                        {r.murphyScore > 0 && <span>M:{r.murphyScore}</span>}
                        {r.phatakScore > 0 && <span>P:{r.phatakScore}</span>}
                        {r.kentScore > 0 && <span>K:{r.kentScore}</span>}
                      </div>
                      {/* Score bar */}
                      <div className="h-1.5 bg-[#E8DCC3] rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${r.confidence === 'High' ? 'bg-[#173B2D]' : r.confidence === 'Medium' ? 'bg-[#C8A24A]' : 'bg-[#7C8F6E]'}`} style={{ width: `${r.confidencePercent}%` }}></div>
                      </div>
                      {/* Rubrics covered */}
                      <div className="text-[0.6rem] text-[#7C8F6E] mt-1 line-clamp-2">{r.rubricsCovered.join(' · ')}</div>
                    </div>
                  ))}
                </div>

                {/* Remedy detail */}
                {selectedRemedyDetail && (
                  <div className="border-t-2 border-[#C8A24A] pt-3">
                    <h3 className="font-serif text-sm text-[#173B2D] mb-2">📖 {selectedRemedyDetail.name}</h3>
                    {selectedRemedyDetail.loading ? (
                      <p className="text-xs text-[#7C8F6E]">Loading...</p>
                    ) : selectedRemedyDetail.error ? (
                      <p className="text-xs text-[#6E2A3A]">{selectedRemedyDetail.error}</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {selectedRemedyDetail.keynote && (
                          <div>
                            <div className="font-semibold text-[#C8A24A] uppercase text-[0.6rem]">Keynote</div>
                            <p className="text-[#173B2D] line-clamp-3">{selectedRemedyDetail.keynote}</p>
                          </div>
                        )}
                        {selectedRemedyDetail.modalities && selectedRemedyDetail.modalities.trim() && (
                          <div>
                            <div className="font-semibold text-[#C8A24A] uppercase text-[0.6rem]">Modalities</div>
                            <p className="text-[#173B2D] line-clamp-2">{selectedRemedyDetail.modalities}</p>
                          </div>
                        )}
                        {selectedRemedyDetail.full && (
                          <div>
                            <div className="font-semibold text-[#C8A24A] uppercase text-[0.6rem]">Materia Medica</div>
                            <p className="text-[#173B2D] line-clamp-4">{selectedRemedyDetail.full}</p>
                          </div>
                        )}
                        {selectedRemedyDetail.id && (
                          <Link href={`/remedy/${selectedRemedyDetail.id}`} className="block text-xs text-[#C8A24A] hover:underline mt-2">View full Materia Medica →</Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="text-[0.6rem] text-[#7C8F6E] mt-3 p-2 bg-[#F5EFE0] rounded">
                  ⚠️ {analysis.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Correlation Table (below 3-column layout) */}
        {analysis && analysis.rankedRemedies.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow p-4 overflow-x-auto">
            <h2 className="font-serif text-sm text-[#173B2D] mb-3 uppercase tracking-wider">📊 Remedy Correlation Table</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#173B2D] text-[#C8A24A]">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Remedy</th>
                  <th className="p-2 text-center">Total</th>
                  <th className="p-2 text-center">Murphy</th>
                  <th className="p-2 text-center">Phatak</th>
                  <th className="p-2 text-center">Kent</th>
                  <th className="p-2 text-center">KN</th>
                  <th className="p-2 text-center">MM</th>
                  <th className="p-2 text-center">Rubrics</th>
                  <th className="p-2 text-center">Sources</th>
                  <th className="p-2 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {analysis.rankedRemedies.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[#FAF6EC]' : 'bg-white'}>
                    <td className="p-2 font-bold text-[#C8A24A]">{i + 1}</td>
                    <td className="p-2 font-semibold text-[#173B2D]">
                      <button onClick={() => loadRemedyDetail(r.name)} className="hover:text-[#C8A24A] hover:underline">{r.name}</button>
                    </td>
                    <td className="p-2 text-center font-bold">{r.totalScore}</td>
                    <td className="p-2 text-center">{r.murphyScore || '—'}</td>
                    <td className="p-2 text-center">{r.phatakScore || '—'}</td>
                    <td className="p-2 text-center">{r.kentScore || '—'}</td>
                    <td className="p-2 text-center">{r.keynoteMatch ? '★' : '—'}</td>
                    <td className="p-2 text-center">{r.mmMatch ? '✓' : '—'}</td>
                    <td className="p-2 text-center">{r.rubricCount}</td>
                    <td className="p-2 text-center">{r.sourceCount}</td>
                    <td className={`p-2 text-center font-semibold ${r.confidence === 'High' ? 'text-[#173B2D]' : r.confidence === 'Medium' ? 'text-[#C8A24A]' : 'text-[#7C8F6E]'}`}>{r.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
