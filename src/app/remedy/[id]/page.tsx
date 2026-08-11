'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatRemedyText, parseInlineMarkers, type MMBlock, type InlineSpan } from '@/lib/mm-formatter';
import { HighlightToolbar } from '@/components/HighlightToolbar';
import { HighlightLayer } from '@/components/HighlightLayer';

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
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) router.push('/login');
    });
    fetch(`/api/remedies/${params.id}`).then(r => {
      if (r.status === 401) { router.push('/login'); return null; }
      return r.json();
    }).then(d => {
      if (d?.error) setError(d.error);
      else setRemedy(d);
      setLoading(false);
    });
  }, [router, params.id]);

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

  const articleRef = useRef<HTMLElement>(null) as React.RefObject<HTMLElement>;
  const [highlightVersion, setHighlightVersion] = useState(0);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-emerald-950 text-stone-100 sticky top-0 z-10 shadow border-b-2 border-amber-700/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded">← Back</Link>
          <h1 className="font-serif italic text-amber-200 tracking-wide">Pradip&apos;s Homoe</h1>
          <span className="text-xs text-stone-400">{remedy.author}</span>
        </div>
      </header>

      {/* User highlight toolbar — appears on text selection */}
      <HighlightToolbar
        remedyId={remedy.id}
        articleRef={articleRef}
        onHighlightChange={() => setHighlightVersion(v => v + 1)}
      />

      <article ref={articleRef} className="max-w-4xl mx-auto px-4 py-6">
        <HighlightLayer key={highlightVersion} remedyId={remedy.id}>
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
        </HighlightLayer>
      </article>

      {/* Study hint — shows on first visit */}
      <div className="max-w-4xl mx-auto px-4 pb-6 text-center">
        <p className="text-xs text-stone-400">
          Select any text to highlight (Yellow/Green/Pink), add notes, copy, or bookmark.
          Your highlights are saved on this device.
        </p>
      </div>
    </div>
  );
}
