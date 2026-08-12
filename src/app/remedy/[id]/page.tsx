'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatRemedyText, parseInlineMarkers, type MMBlock, type InlineSpan } from '@/lib/mm-formatter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type Remedy = {
  id: string; name: string; common?: string; author: string;
  chapter?: string; organ?: string; modalities?: string;
  constitution?: string; relationships?: string; dose?: string;
  keynote?: string; full?: string; letter?: string;
};

export default function RemedyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params?.id) {
      setError('Invalid remedy ID');
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (cancelled) return;
      if (!d.authenticated) { router.push('/login'); return; }
    }).catch(() => {
      // Session check failed — continue anyway, the remedy fetch will handle auth
    });

    fetch(`/api/remedies/${params.id}`).then(r => {
      if (cancelled) return null;
      if (r.status === 401) { router.push('/login'); return null; }
      return r.json();
    }).then(d => {
      if (cancelled) return;
      if (!d) { setLoading(false); return; }
      if (d.error) { setError(d.error); setLoading(false); return; }
      // Defensive: ensure all fields have safe defaults
      const safeRemedy: Remedy = {
        id: d.id || params.id,
        name: d.name || 'Unknown Remedy',
        common: d.common || '',
        author: d.author || 'Unknown',
        chapter: d.chapter || '',
        organ: d.organ || '',
        modalities: d.modalities || '',
        constitution: d.constitution || '',
        relationships: d.relationships || '',
        dose: d.dose || '',
        keynote: d.keynote || '',
        full: d.full || '',
        letter: d.letter || '',
      };
      setRemedy(safeRemedy);
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      console.error('Failed to load remedy:', err);
      setError('Failed to load remedy. Please try again.');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [router, params?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-emerald-950 text-stone-300">Loading remedy...</div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 text-stone-300 flex-col gap-4">
      <p>{error}</p>
      <Link href="/dashboard" className="bg-amber-700 hover:bg-amber-600 px-4 py-2 rounded">← Back to Dashboard</Link>
    </div>
  );
  if (!remedy) return null;

  // Render an inline span — preserves bold/italic/underline markers if present,
  // and applies system highlights (yellow/green/pink) for keynote sentences.
  function renderInline(text: string): React.ReactNode {
    const spans = parseInlineMarkers(text);
    return spans.map((span: InlineSpan, idx: number) => {
      switch (span.kind) {
        case 'bold':
          return <strong key={idx} className="font-bold text-stone-900">{span.text}</strong>;
        case 'italic':
          return <em key={idx} className="italic">{span.text}</em>;
        case 'underline':
          return <u key={idx}>{span.text}</u>;
        case 'emphasis':
          return <span key={idx} className="font-semibold text-stone-900">{span.text}</span>;
        case 'highlight-yellow':
          // System highlight — yellow for keynote/characteristic sentences
          return (
            <mark key={idx} className="bg-yellow-100 text-stone-900 rounded px-0.5 border-l-2 border-yellow-400" title="Keynote / characteristic point">
              {span.text}
            </mark>
          );
        case 'highlight-green':
          // System highlight — green for important clinical/characteristic
          return (
            <mark key={idx} className="bg-green-100 text-stone-900 rounded px-0.5 border-l-2 border-green-400" title="Important clinical point">
              {span.text}
            </mark>
          );
        case 'highlight-pink':
          // System highlight — pink for striking/differentiating (modalities)
          return (
            <mark key={idx} className="bg-pink-100 text-stone-900 rounded px-0.5 border-l-2 border-pink-400" title="Striking / differentiating point">
              {span.text}
            </mark>
          );
        default:
          return <span key={idx}>{span.text}</span>;
      }
    });
  }

  // Render the structured Materia Medica blocks.
  // - remedy_title  → RED + BOLD, large
  // - subtitle      → RED + BOLD, medium
  // - paragraph     → readable body text, inline markers preserved
  // - page_number   → small grey "[p. N]" marker (NOT deleted — flagged)
  // - raw           → plain text fallback
  function renderBlocks(blocks: MMBlock[]): React.ReactNode {
    return blocks.map((block, idx) => {
      switch (block.type) {
        case 'remedy_title':
          // Main remedy title — RED + BOLD per spec
          // Skip if name is already shown in the header card below
          return null;
        case 'subtitle':
          return (
            <h4
              key={idx}
              className="mm-subtitle font-bold text-red-700 text-base mt-4 mb-1.5 uppercase tracking-wide"
            >
              {block.text}
            </h4>
          );
        case 'paragraph':
          return (
            <p
              key={idx}
              className="text-stone-700 whitespace-pre-line leading-relaxed mb-2 text-[0.95rem]"
            >
              {renderInline(block.text)}
            </p>
          );
        case 'page_number':
          // OCR artifact — flagged but NOT deleted. Render subtly so reader
          // can mentally skip it. Source review will decide on removal.
          return (
            <span
              key={idx}
              className="mm-page-number inline-block text-[0.6rem] text-stone-400 mx-1 align-middle select-none"
              title="OCR page-number artifact — flagged for source review"
            >
              [p. {block.text}]
            </span>
          );
        case 'raw':
          return (
            <p key={idx} className="text-stone-700 whitespace-pre-line leading-relaxed mb-2">
              {block.text}
            </p>
          );
        default:
          return null;
      }
    });
  }

  // Format the remedy full text using the author-aware formatter
  const blocks = remedy.full
    ? formatRemedyText({ name: remedy.name, author: remedy.author, full: remedy.full })
    : [];

  // Reader features: favourite, bookmark, notes
  const reader = useReaderFeatures();
  const [isFav, setIsFav] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notesList, setNotesList] = useState<any[]>([]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (reader && remedy) {
      setIsFav(reader.isFavorite(remedy.id));
      setIsBookmarked(reader.isBookmarked(remedy.id));
      setNotesList(reader.getNotes(remedy.id));
    }
  }, [reader, remedy?.id]);

  const handleFavourite = () => {
    if (!reader || !remedy) return;
    reader.toggleFavorite({
      id: remedy.id, type: 'remedy', title: remedy.name,
      href: `/remedy/${remedy.id}`, author: remedy.author,
    });
    setIsFav(!isFav);
  };

  const handleBookmark = () => {
    if (!reader || !remedy) return;
    reader.toggleBookmark({
      id: remedy.id, type: 'remedy', title: remedy.name,
      href: `/remedy/${remedy.id}`, author: remedy.author,
    });
    setIsBookmarked(!isBookmarked);
  };

  const handleSaveNote = () => {
    if (!reader || !remedy || !noteText.trim()) {
      setShowNoteInput(false);
      return;
    }
    reader.addNote({
      itemId: remedy.id, type: 'remedy', text: noteText.trim(),
    });
    setNoteText('');
    setShowNoteInput(false);
    setNotesList(reader.getNotes(remedy.id));
  };

  const handleDeleteNote = (noteId: string) => {
    if (!reader) return;
    reader.removeNote(noteId);
    setNotesList(reader.getNotes(remedy.id));
  };

  const handleCopy = async () => {
    if (!remedy) return;
    const textToCopy = `${remedy.name}\n${remedy.common || ''}\n\n${remedy.full || remedy.keynote || ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus('✓ Copied!');
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopyStatus('✓ Copied!');
      } catch {
        setCopyStatus('Copy failed');
      }
      document.body.removeChild(textarea);
    }
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-stone-100">
      <header className="bg-emerald-950 text-stone-100 sticky top-0 z-10 shadow border-b-2 border-amber-700/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded">← Back</Link>
          <h1 className="font-serif italic text-amber-200 tracking-wide">Pradip&apos;s Homoe</h1>
          <span className="text-xs text-stone-400">{remedy.author}</span>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-t-amber-700">
          {/* REMEDY MAIN TITLE — RED + BOLD per spec */}
          <div className="border-b border-stone-200 pb-4 mb-6">
            <h1 className="mm-remedy-title font-serif text-3xl font-bold text-red-700 leading-tight">
              {remedy.name}
            </h1>
            {remedy.common && <p className="text-sm italic text-stone-500 mt-1">{remedy.common}</p>}
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              {remedy.author && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">{remedy.author}</span>}
              {remedy.chapter && <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">{remedy.chapter}</span>}
              {remedy.organ && <span className="bg-stone-200 text-stone-700 px-2 py-1 rounded">{remedy.organ}</span>}
            </div>
          </div>

          {/* ACTION BAR — Favourite, Bookmark, Note, Copy, Print */}
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-stone-50 rounded-lg border border-stone-200">
            <button
              onClick={handleFavourite}
              title={isFav ? 'Remove from favourites' : 'Add to favourites'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                isFav ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              <span>{isFav ? '★' : '☆'}</span>
              <span>{isFav ? 'Favourited' : 'Favourite'}</span>
            </button>
            <button
              onClick={handleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                isBookmarked ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              <span>🔖</span>
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              title="Add note"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-white text-stone-600 border border-stone-300 hover:bg-stone-100 transition-colors"
            >
              <span>📝</span>
              <span>Note</span>
              {notesList.length > 0 && (
                <span className="bg-amber-600 text-white text-xs px-1.5 rounded-full">{notesList.length}</span>
              )}
            </button>
            <button
              onClick={handleCopy}
              title="Copy remedy text"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-white text-stone-600 border border-stone-300 hover:bg-stone-100 transition-colors"
            >
              <span>📋</span>
              <span>{copyStatus || 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print remedy"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-white text-stone-600 border border-stone-300 hover:bg-stone-100 transition-colors"
            >
              <span>🖨️</span>
              <span>Print</span>
            </button>
          </div>

          {/* NOTE INPUT — collapsible */}
          {showNoteInput && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Add a note for this remedy</h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type your note here..."
                className="w-full p-2 border border-amber-300 rounded text-sm focus:outline-none focus:border-amber-600"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold rounded transition-colors"
                >
                  Save Note
                </button>
                <button
                  onClick={() => { setShowNoteInput(false); setNoteText(''); }}
                  className="px-4 py-1.5 bg-white text-stone-600 text-sm font-semibold rounded border border-stone-300 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* SAVED NOTES LIST */}
          {notesList.length > 0 && (
            <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <h3 className="text-sm font-semibold text-stone-700 mb-2">My Notes ({notesList.length})</h3>
              <div className="space-y-2">
                {notesList.map((note: any) => (
                  <div key={note.id} className="p-2 bg-white rounded border border-stone-200 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{note.text}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {new Date(note.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded flex-shrink-0"
                      title="Delete note"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {remedy.keynote && (
            <section className="mb-6">
              <h2 className="font-serif text-xl text-emerald-800 mb-2">Keynote</h2>
              <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.keynote}</p>
            </section>
          )}

          {remedy.constitution && (
            <section className="mb-6">
              <h2 className="font-serif text-xl text-emerald-800 mb-2">Constitution</h2>
              <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.constitution}</p>
            </section>
          )}

          {remedy.full && (
            <section className="mb-6">
              <h2 className="font-serif text-xl text-emerald-800 mb-2">Full Description</h2>
              {renderBlocks(blocks)}
            </section>
          )}

          {remedy.modalities && remedy.modalities.trim() && (
            <section className="mb-6">
              <h2 className="font-serif text-xl text-emerald-800 mb-2">Modalities</h2>
              <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.modalities}</p>
            </section>
          )}

          {remedy.relationships && remedy.relationships.trim() && remedy.relationships !== '—' && (
            <section className="mb-6">
              <h2 className="font-serif text-xl text-emerald-800 mb-2">Relationships</h2>
              <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.relationships}</p>
            </section>
          )}

          {remedy.dose && (
            <section className="mb-6">
              <h2 className="font-serif text-xl text-emerald-800 mb-2">Dose</h2>
              <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.dose}</p>
            </section>
          )}
        </div>
      </article>
    </div>
    </ErrorBoundary>
  );
}
