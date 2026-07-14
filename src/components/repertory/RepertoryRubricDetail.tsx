'use client';
/**
 * RepertoryRubricDetail — right column.
 * Shows full rubric detail with cross-references, similar rubrics, synonyms,
 * remedy list (with grade badges if available), parent/child navigation,
 * and inline note-taking.
 */
import { useState, useEffect } from 'react';
import { Loader2, Star, Copy, ChevronRight, ArrowUpRight, NotebookPen, X, ExternalLink, AlertCircle } from 'lucide-react';
import { useFavorites, useNotes } from './use-repertory-storage';

interface RemedyGrade { name: string; grade?: number; }
interface CrossRef { repertory: string; rubricId: string; title: string; overlapCount: number; }
interface SimpleRef { repertory?: string; rubricId: string; title: string; sharedRemedies?: number; remedyCount?: number; }
interface RubricDetail {
  id: string;
  repertory: string;
  chapter: string;
  main: string;
  sub: string;
  fullTitle: string;
  remedies: string[];
  crossReferences: CrossRef[];
  similarRubrics: SimpleRef[];
  synonyms: SimpleRef[];
  parentRubric?: { id: string; title: string; };
  childRubrics: SimpleRef[];
  siblingRubrics: SimpleRef[];
}

interface Props {
  rubricId: string | null;
  onSelectRubric: (r: { id: string; title: string; repertory: string; chapter: string; remedies?: string[] }) => void;
  onAddToClipboard: (r: { id: string; title: string; repertory: string; chapter: string; remedies: string[] }) => void;
}

export function RepertoryRubricDetail({ rubricId, onSelectRubric, onAddToClipboard }: Props) {
  const [detail, setDetail] = useState<RubricDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remedyFilter, setRemedyFilter] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const { isFav, toggle: toggleFav } = useFavorites();
  const { text: noteText, setText: setNoteText, save: saveNote, updatedAt: noteUpdatedAt } = useNotes(rubricId);

  useEffect(() => {
    if (!rubricId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    setRemedyFilter('');
    fetch(`/api/repertory/rubric/${encodeURIComponent(rubricId)}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load rubric');
        return r.json();
      })
      .then(d => {
        setDetail(d);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [rubricId]);

  if (!rubricId) {
    return (
      <div className="h-full flex items-center justify-center text-stone-400 text-sm p-8 text-center">
        <div>
          <div className="text-4xl mb-3 opacity-30">📋</div>
          <p>Select a rubric to view its details, remedies, and cross-references.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading rubric detail...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600 text-sm">
        <AlertCircle className="h-4 w-4 mr-2" /> {error || 'Rubric not found'}
      </div>
    );
  }

  const fav = isFav(detail.id);
  const filteredRemedies = detail.remedies.filter(r =>
    r.toLowerCase().includes(remedyFilter.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb + actions */}
      <div className="px-4 py-2 border-b border-stone-200 bg-stone-50">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-stone-500 mb-1 flex-wrap">
          <span className="font-semibold text-emerald-800">{detail.repertory}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{detail.chapter}</span>
          {detail.parentRubric && (
            <>
              <ChevronRight className="h-3 w-3" />
              <button
                onClick={() => onSelectRubric({
                  id: detail.parentRubric!.id,
                  title: detail.parentRubric!.title,
                  repertory: detail.repertory,
                  chapter: detail.chapter,
                })}
                className="text-emerald-700 hover:underline"
              >
                {detail.parentRubric.title}
              </button>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-stone-700 font-medium">{detail.main}</span>
          {detail.sub && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700 italic">{detail.sub}</span>
            </>
          )}
        </div>
        {/* Title + actions */}
        <div className="flex items-start gap-2">
          <h1 className="flex-1 font-serif text-lg text-emerald-900 leading-tight">
            {detail.fullTitle}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFav({ id: detail.id, title: detail.fullTitle, repertory: detail.repertory, chapter: detail.chapter })}
              className={`p-1.5 rounded hover:bg-stone-200 ${fav ? 'text-amber-500' : 'text-stone-400'}`}
              title={fav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => onAddToClipboard({ id: detail.id, title: detail.fullTitle, repertory: detail.repertory, chapter: detail.chapter, remedies: detail.remedies })}
              className="p-1.5 rounded hover:bg-stone-200 text-stone-400"
              title="Add to clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowNotes(s => !s)}
              className={`p-1.5 rounded hover:bg-stone-200 ${showNotes ? 'text-emerald-700 bg-stone-200' : 'text-stone-400'}`}
              title="Notes"
            >
              <NotebookPen className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Quick stats */}
        <div className="flex gap-3 mt-1 text-xs text-stone-500">
          <span><strong className="text-stone-700">{detail.remedies.length}</strong> remedies</span>
          {detail.crossReferences.length > 0 && (
            <span><strong className="text-stone-700">{detail.crossReferences.length}</strong> cross-refs</span>
          )}
          {detail.similarRubrics.length > 0 && (
            <span><strong className="text-stone-700">{detail.similarRubrics.length}</strong> similar</span>
          )}
          {detail.childRubrics.length > 0 && (
            <span><strong className="text-stone-700">{detail.childRubrics.length}</strong> sub-rubrics</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Notes panel (collapsible) */}
        {showNotes && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-amber-900">Personal Note</h3>
              <button onClick={() => setShowNotes(false)} className="text-amber-700 hover:text-amber-900">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onBlur={() => saveNote(noteText)}
              placeholder="Write your notes about this rubric..."
              className="w-full h-24 p-2 text-sm border border-amber-300 rounded bg-white resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="text-xs text-amber-700 mt-1">
              {noteUpdatedAt ? `Saved ${new Date(noteUpdatedAt).toLocaleString()}` : 'Auto-saves on blur'}
            </div>
          </div>
        )}

        {/* Remedy list */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Remedy List</h2>
            <input
              type="text"
              placeholder="Filter remedies..."
              value={remedyFilter}
              onChange={e => setRemedyFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {filteredRemedies.length === 0 ? (
            <p className="text-sm text-stone-500">No remedies match filter.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredRemedies.map(rem => {
                const isAbbrev = rem === rem.toLowerCase() && rem.length <= 8;
                return (
                  <a
                    key={rem}
                    href={`/remedy/${encodeURIComponent(rem.toLowerCase().replace(/\s+/g, '-'))}`}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded border hover:bg-emerald-50 hover:border-emerald-300 transition-colors ${isAbbrev ? 'border-amber-300 bg-amber-50 text-amber-900 font-mono' : 'border-stone-300 bg-white text-stone-700'}`}
                    title={isAbbrev ? 'Abbreviation — click to find full remedy' : `Open ${rem} materia medica`}
                  >
                    {rem}
                    <ExternalLink className="h-2.5 w-2.5 ml-1 opacity-50" />
                  </a>
                );
              })}
            </div>
          )}
          {detail.remedies.length > filteredRemedies.length && (
            <p className="text-xs text-stone-400 mt-2">
              Showing {filteredRemedies.length} of {detail.remedies.length}
            </p>
          )}
        </section>

        {/* Child rubrics */}
        {detail.childRubrics.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-2">Sub-Rubrics</h2>
            <ul className="space-y-1">
              {detail.childRubrics.map(child => (
                <li key={child.rubricId}>
                  <button
                    onClick={() => onSelectRubric({ id: child.rubricId, title: child.title, repertory: detail.repertory, chapter: detail.chapter })}
                    className="flex items-center gap-1 text-sm text-stone-700 hover:text-emerald-900 hover:underline"
                  >
                    <ChevronRight className="h-3 w-3" />
                    <span className="flex-1 text-left">{child.title}</span>
                    <span className="text-xs text-stone-400">{child.remedyCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Cross-references */}
        {detail.crossReferences.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-2">Cross-References (Other Repertories)</h2>
            <ul className="space-y-1">
              {detail.crossReferences.map((ref, i) => (
                <li key={i}>
                  <button
                    onClick={() => onSelectRubric({ id: ref.rubricId, title: ref.title, repertory: ref.repertory, chapter: '' })}
                    className="flex items-center gap-1 text-sm text-stone-700 hover:text-emerald-900 hover:underline w-full"
                  >
                    <ArrowUpRight className="h-3 w-3 text-amber-600" />
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">{ref.repertory}</span>
                    <span className="flex-1 text-left truncate">{ref.title}</span>
                    <span className="text-xs text-stone-400">{ref.overlapCount} shared</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Similar rubrics */}
        {detail.similarRubrics.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-2">Similar Rubrics</h2>
            <ul className="space-y-1">
              {detail.similarRubrics.map((ref, i) => (
                <li key={i}>
                  <button
                    onClick={() => onSelectRubric({ id: ref.rubricId, title: ref.title, repertory: ref.repertory || detail.repertory, chapter: detail.chapter })}
                    className="flex items-center gap-1 text-sm text-stone-700 hover:text-emerald-900 hover:underline w-full"
                  >
                    <ChevronRight className="h-3 w-3 text-stone-400" />
                    <span className="flex-1 text-left truncate">{ref.title}</span>
                    {ref.sharedRemedies && <span className="text-xs text-stone-400">{ref.sharedRemedies} shared</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sibling rubrics */}
        {detail.siblingRubrics.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-2">Other Rubrics in {detail.chapter}</h2>
            <details>
              <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700">Show {detail.siblingRubrics.length} rubrics</summary>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {detail.siblingRubrics.map(sib => (
                  <li key={sib.rubricId}>
                    <button
                      onClick={() => onSelectRubric({ id: sib.rubricId, title: sib.title, repertory: detail.repertory, chapter: detail.chapter })}
                      className="flex items-center gap-1 text-xs text-stone-600 hover:text-emerald-900 hover:underline w-full"
                    >
                      <ChevronRight className="h-3 w-3" />
                      <span className="flex-1 text-left truncate">{sib.title}</span>
                      <span className="text-xs text-stone-400">{sib.remedyCount}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
