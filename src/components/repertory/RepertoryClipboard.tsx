'use client';
/**
 * RepertoryClipboard — bottom drawer / collapsible panel.
 * Shows all rubrics added to clipboard, with remedy aggregation for analysis.
 *
 * Features:
 *   - List of clipboard rubrics (each removable)
 *   - Aggregate remedy list with frequency (how many rubrics each remedy covers)
 *   - Sort remedies by coverage (highest first)
 *   - Export to clipboard (CSV)
 *   - Clear all
 */
import { useState, useMemo } from 'react';
import { Trash2, X, ChevronDown, ChevronUp, Download, ClipboardList, BarChart3 } from 'lucide-react';
import type { ClipboardEntry } from './use-repertory-storage';

interface Props {
  items: ClipboardEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onSelectRubric: (r: { id: string; title: string; repertory: string; chapter: string }) => void;
}

export function RepertoryClipboard({ items, onRemove, onClear, onSelectRubric }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [view, setView] = useState<'rubrics' | 'analysis'>('rubrics');
  const [minCoverage, setMinCoverage] = useState(1);

  // Aggregate remedy coverage
  const analysis = useMemo(() => {
    const map = new Map<string, { name: string; count: number; rubrics: string[] }>();
    for (const entry of items) {
      for (const rem of entry.remedies) {
        const key = rem.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { name: rem, count: 0, rubrics: [] });
        }
        const e = map.get(key)!;
        e.count += 1;
        if (!e.rubrics.includes(entry.title)) e.rubrics.push(entry.title);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [items]);

  const filteredAnalysis = analysis.filter(a => a.count >= minCoverage);

  function exportCsv() {
    const rows = [
      ['Remedy', 'Coverage Count', 'Rubrics'],
      ...filteredAnalysis.map(a => [a.name, String(a.count), a.rubrics.join(' | ')]),
    ];
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    navigator.clipboard.writeText(csv).catch(() => {});
  }

  return (
    <div className="bg-stone-100 border-t-2 border-amber-300 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-200">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-emerald-900"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <ClipboardList className="h-4 w-4 text-amber-700" />
          Clipboard ({items.length} rubrics, {analysis.length} remedies)
        </button>
        <div className="flex items-center gap-2">
          {expanded && (
            <>
              <div className="flex gap-1">
                <button
                  onClick={() => setView('rubrics')}
                  className={`px-2 py-0.5 text-xs rounded ${view === 'rubrics' ? 'bg-emerald-700 text-white' : 'bg-stone-300 text-stone-700'}`}
                >
                  Rubrics
                </button>
                <button
                  onClick={() => setView('analysis')}
                  className={`px-2 py-0.5 text-xs rounded ${view === 'analysis' ? 'bg-emerald-700 text-white' : 'bg-stone-300 text-stone-700'}`}
                >
                  <BarChart3 className="h-3 w-3 inline mr-1" />Analysis
                </button>
              </div>
              {view === 'analysis' && (
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-700 text-white rounded hover:bg-amber-600"
                >
                  <Download className="h-3 w-3" /> Copy CSV
                </button>
              )}
              <button
                onClick={onClear}
                className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-700 text-white rounded hover:bg-red-600"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </>
          )}
        </div>
      </div>
      {/* Body */}
      {expanded && (
        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-stone-500">
              Clipboard is empty. Use the <ClipboardList className="h-3 w-3 inline" /> icon next to any rubric to add it here.
            </div>
          ) : view === 'rubrics' ? (
            <ul className="divide-y divide-stone-200">
              {items.map(entry => (
                <li key={entry.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-stone-50">
                  <button
                    onClick={() => onSelectRubric({ id: entry.id, title: entry.title, repertory: entry.repertory, chapter: entry.chapter })}
                    className="flex-1 text-left text-sm text-stone-700 hover:text-emerald-900 hover:underline truncate"
                  >
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 mr-1">{entry.repertory}</span>
                    {entry.title}
                  </button>
                  <span className="text-xs text-stone-400">{entry.remedies.length} rem</span>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="text-stone-400 hover:text-red-600 p-1"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3">
              <div className="flex items-center gap-3 mb-2 text-xs text-stone-600">
                <span>Min coverage:</span>
                <select
                  value={minCoverage}
                  onChange={e => setMinCoverage(Number(e.target.value))}
                  className="px-1.5 py-0.5 border rounded text-xs"
                >
                  <option value={1}>≥ 1</option>
                  <option value={2}>≥ 2</option>
                  <option value={3}>≥ 3</option>
                  <option value={4}>≥ 4</option>
                  <option value={5}>≥ 5</option>
                </select>
                <span className="text-stone-400">Showing {filteredAnalysis.length} of {analysis.length}</span>
              </div>
              {filteredAnalysis.length === 0 ? (
                <p className="text-sm text-stone-500">No remedies match the filter.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {filteredAnalysis.map(a => {
                    const isAbbrev = a.name === a.name.toLowerCase() && a.name.length <= 8;
                    const intensity = Math.min(4, a.count);
                    const bgClasses = [
                      'bg-emerald-50 text-emerald-800 border-emerald-200',
                      'bg-emerald-100 text-emerald-900 border-emerald-300',
                      'bg-emerald-200 text-emerald-900 border-emerald-400 font-semibold',
                      'bg-emerald-700 text-white border-emerald-800 font-bold',
                    ];
                    return (
                      <span
                        key={a.name}
                        className={`inline-flex items-center px-2 py-1 text-xs rounded border ${bgClasses[intensity - 1]} ${isAbbrev ? 'font-mono' : ''}`}
                        title={`Covers ${a.count} rubric(s):\n${a.rubrics.join('\n')}`}
                      >
                        {a.name}
                        <span className="ml-1 text-xs opacity-75">({a.count})</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
