'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type Chapter = {
  id: string;
  number: number;
  title: string;
  summary: string;
  aphorisms: string;
};

const CHAPTERS: Chapter[] = [
  {
    id: 'org-intro',
    number: 0,
    title: 'Introduction',
    summary: 'Hahnemann introduces the Organon and the state of medicine in his time, criticising allopathic practice and laying the groundwork for a rational system of cure.',
    aphorisms: 'Preface & Introduction',
  },
  {
    id: 'org-mission',
    number: 1,
    title: "The Physician's Mission",
    summary: 'The physician\'s high and only mission is to restore the sick to health — to cure, as it is termed. Cure must be rapid, gentle, and permanent.',
    aphorisms: '§1 – §2',
  },
  {
    id: 'org-knowledge',
    number: 2,
    title: 'Knowledge of the Physician',
    summary: 'The physician must know what is to be cured in disease, what is curative in medicines, and how to apply the latter to the former according to clear principles.',
    aphorisms: '§3 – §4',
  },
  {
    id: 'org-medicine',
    number: 3,
    title: 'Knowledge of Medicines',
    summary: 'The true healing power of medicines can only be discovered by observing the symptoms they produce in the healthy human body — the proving.',
    aphorisms: '§5 – §7',
  },
  {
    id: 'org-vital-force',
    number: 4,
    title: 'The Vital Force',
    summary: 'The material organism is animated by the spiritual vital force. Without it, the body is dead. Disease is primarily a disturbance of this dynamic principle.',
    aphorisms: '§9 – §16',
  },
  {
    id: 'org-similia',
    number: 5,
    title: 'The Law of Similars',
    summary: 'A weaker dynamic affection is permanently extinguished by a stronger one, if the latter is very similar in its manifestations. Similia similibus curentur.',
    aphorisms: '§26 – §27',
  },
  {
    id: 'org-cases',
    number: 6,
    title: 'Case Taking',
    summary: 'The physician must take the case with unprejudiced observation, recording every peculiar and characteristic symptom that individualises the patient.',
    aphorisms: '§83 – §104',
  },
  {
    id: 'org-potency',
    number: 7,
    title: 'Potentisation & Dose',
    summary: 'Medicines are prepared through serial dilution and succussion. The minimum dose — just sufficient to gently stimulate the vital force — is the homoeopathic dose.',
    aphorisms: '§269 – §285',
  },
  {
    id: 'org-acute',
    number: 8,
    title: 'Acute & Chronic Diseases',
    summary: 'Hahnemann distinguishes acute diseases (self-limited) from chronic miasms (psora, sycosis, syphilis) that require deep-acting anti-miasmatic remedies.',
    aphorisms: '§72 – §81, Chronic Diseases',
  },
  {
    id: 'org-obstacles',
    number: 9,
    title: 'Obstacles to Cure',
    summary: 'The physician must identify and remove obstacles to cure: improper diet, regimen, occupation, environment, and the lingering effects of allopathic drugging.',
    aphorisms: '§259 – §268',
  },
];

const HAHNEMANN_QUOTE = '"The physician\'s high and only mission is to restore the sick to health, to cure, as it is termed.\n\nThe highest ideal of cure is rapid, gentle and permanent restoration of the health, or removal and annihilation of the disease in its whole extent, in the shortest, most reliable, and most harmless way, on easily comprehensible principles." — Samuel Hahnemann, Organon §1–§2';

export default function OrganonPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [q, setQ] = useState('');
  const reader = useReaderFeatures();

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

  const filtered = useMemo(() => {
    if (!q) return CHAPTERS;
    const s = q.toLowerCase();
    return CHAPTERS.filter(c =>
      c.title.toLowerCase().includes(s) ||
      c.summary.toLowerCase().includes(s) ||
      c.aphorisms.toLowerCase().includes(s)
    );
  }, [q]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Organon...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Organon of Medicine</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Samuel Hahnemann&apos;s foundational text — the philosophy & principles of homoeopathy</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Dark green quote card */}
        <section className="bg-[#173B2D] text-[#F5EFE0] rounded-lg shadow-lg p-6 mb-6 border-l-4 border-[#C8A24A]">
          <div className="text-4xl text-[#C8A24A] font-serif leading-none mb-2">&ldquo;</div>
          <p className="font-serif italic text-base md:text-lg leading-relaxed whitespace-pre-line text-stone-200">
            {HAHNEMANN_QUOTE}
          </p>
        </section>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chapters by title, summary, or aphorism..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
        </div>

        <div className="text-sm text-[#7C8F6E] mb-3">
          {filtered.length} chapter{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Chapter cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => {
            const bm = reader.isBookmarked(c.id);
            return (
              <article
                key={c.id}
                className="bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow border-t-2 border-[#173B2D]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#173B2D] text-[#C8A24A] flex items-center justify-center font-serif text-base">
                      {c.number === 0 ? '§' : c.number}
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-[#173B2D] leading-tight">{c.title}</h3>
                      <p className="text-[0.65rem] text-[#C8A24A] font-semibold uppercase tracking-wider">{c.aphorisms}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => reader.toggleBookmark({ id: c.id, type: 'organon', title: c.title })}
                    title={bm ? 'Remove bookmark' : 'Add bookmark'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors flex-shrink-0 ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                  >🔖</button>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed mt-2">{c.summary}</p>
              </article>
            );
          })}
        </div>

        {/* Full Book Reader Link */}
        <div className="mt-8 bg-[#173B2D] rounded-lg shadow-lg p-6 text-center border-l-4 border-[#C8A24A]">
          <h2 className="font-serif text-xl text-[#C8A24A] mb-2">📖 Complete Organon by B.K. Sarkar</h2>
          <p className="text-sm text-stone-300 mb-4">Full text of Organon of Medicine translated and annotated by B.K. Sarkar. Contains Translator&apos;s Preface, Introduction, and Hahnemann&apos;s aphorisms with commentary.</p>
          <a href="/books/organon-bk-sarkar" className="inline-block bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">Read Full Book →</a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
