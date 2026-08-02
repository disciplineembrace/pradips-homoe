'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
  
  return (
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
          <div className="border-b border-stone-200 pb-4 mb-6">
            <h1 className="font-serif text-3xl text-emerald-900">{remedy.name}</h1>
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
              <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.full}</p>
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
  );
}
