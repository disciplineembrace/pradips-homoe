'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RemedyReader } from '@/components/RemedyReader';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type Remedy = {
  id: string; name: string; common?: string; author: string;
  chapter?: string; organ?: string; modalities?: string;
  constitution?: string; relationships?: string; dose?: string;
  keynote?: string; full?: string; letter?: string;
  sections?: { heading?: string; paragraphs?: string[] }[];
};

export default function RemedyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const rf = useReaderFeatures();

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) router.push('/login');
    });
    fetch(`/api/remedies/${params.id}`).then(r => {
      if (r.status === 401) { router.push('/login'); return null; }
      return r.json();
    }).then(d => {
      if (d?.error) setError(d.error);
      else { setRemedy(d); rf.addHistory({ id: d.id, type: 'remedy', name: d.name }); }
      setLoading(false);
    });
  }, [router, params.id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-[#7C8F6E]">Loading remedy...</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-[#6E2A3A] flex-col gap-4">
        <p>{error}</p>
        <a href="/materia-medica" className="bg-[#C8A24A] text-[#173B2D] px-4 py-2 rounded">← Back to Materia Medica</a>
      </div>
      <Footer />
    </div>
  );

  if (!remedy) return null;

  const isFav = rf.isFavorite(remedy.id, 'remedy');
  const isBm = rf.isBookmarked(remedy.id, 'remedy');
  const remedyNotes = rf.notes.filter(n => n.refId === remedy.id);

  function copyToClipboard() {
    const text = `${remedy!.name}\n${remedy!.common || ''}\n\n${remedy!.full || remedy!.keynote || ''}`;
    navigator.clipboard.writeText(text);
    alert('Remedy copied to clipboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <RemedyReader
        remedy={remedy}
        isFavorite={isFav}
        isBookmark={isBm}
        notes={remedyNotes}
        onFavorite={() => rf.toggleFavorite({ id: remedy.id, type: 'remedy', name: remedy.name })}
        onBookmark={() => rf.toggleBookmark({ id: remedy.id, type: 'remedy', name: remedy.name })}
        onCopy={copyToClipboard}
        onPrint={() => window.print()}
        onNoteSubmit={(text) => rf.addNote({ type: 'remedy', refId: remedy.id, refName: remedy.name, text })}
        onNoteDelete={(id) => rf.removeNote(id)}
      />
      <Footer />
    </div>
  );
}
