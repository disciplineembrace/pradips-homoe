'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type BookSection = {
  id: string;
  title: string;
  content: string;
};

const HAHNEMANN_QUOTE = '"The physician\'s high and only mission is to restore the sick to health, to cure, as it is termed.\n\nThe highest ideal of cure is rapid, gentle and permanent restoration of the health, or removal and annihilation of the disease in its whole extent, in the shortest, most reliable, and most harmless way, on easily comprehensible principles." — Samuel Hahnemann, Organon §1–§2';

// Organon subsections — these are the logical topics within Organon of Medicine
const ORGANON_SUBSECTIONS = [
  { id: 'org-introduction', title: 'Introduction', desc: 'Hahnemann\'s introduction to the Organon, the state of medicine in his time, and the need for a rational system of cure.', icon: '📖' },
  { id: 'org-preface', title: 'Preface', desc: 'Prefaces to the various editions of the Organon — First through Sixth Edition, with Hahnemann\'s notes on changes and improvements.', icon: '✒️' },
  { id: 'org-history', title: 'History', desc: 'Historical background of medicine from ancient times through Hahnemann\'s era — dogmatists, empirics, methodists, and the evolution of medical thought.', icon: '📜' },
  { id: 'org-philosophy', title: 'Philosophy', desc: 'The philosophical foundation of homoeopathy — inductive logic, dynamic vital force, spiritual dimension of disease and cure, and Hahnemann\'s rational approach to medicine.', icon: '🧠' },
  { id: 'org-principles', title: 'Fundamental Principles', desc: 'The core principles: similia similibus curentur, the single remedy, the minimum dose, the individualisation of the case, and the direction of cure.', icon: '⚖️' },
  { id: 'org-vital-force', title: 'Vital Force', desc: 'The material organism is animated by the vital force — without it the body is dead. Disease is primarily a dynamic disturbance of this principle.', icon: '⚡' },
  { id: 'org-dynamic-disease', title: 'Dynamic Disease', desc: 'Disease is not a material entity but a dynamic derangement of the vital force. Understanding disease as a disturbance of the spiritual principle.', icon: '🌀' },
  { id: 'org-individualization', title: 'Individualization', desc: 'Every patient is unique. The physician must individualise each case — no two cases are exactly alike, and the remedy must match the individual.', icon: '👤' },
  { id: 'org-susceptibility', title: 'Susceptibility', desc: 'The concept of susceptibility — the capacity of the organism to be affected by dynamic influences, including medicinal agents and disease agents.', icon: '🛡️' },
  { id: 'org-miasms', title: 'Miasms', desc: 'Hahnemann\'s theory of chronic miasms — psora, sycosis, and syphilis — as the fundamental underlying causes of chronic disease.', icon: '🦠' },
  { id: 'org-proving', title: 'Doctrine of Drug Proving', desc: 'The true healing power of medicines can only be discovered by observing the symptoms they produce in the healthy human body — the proving.', icon: '🧪' },
  { id: 'org-cure', title: 'Principles of Cure', desc: 'The principles governing cure — the law of similars, the single remedy, the minimum dose, and the direction of cure (Hering\'s Law).', icon: '💊' },
  { id: 'org-posology', title: 'Posology', desc: 'The science of dosage in homoeopathy — potentisation, serial dilution and succussion, and the concept of the minimum dose.', icon: '📊' },
  { id: 'org-aphorisms', title: 'Aphorisms', desc: 'The complete aphorisms of the Organon — 291 paragraphs covering the entire philosophy and practice of homoeopathy.', icon: '§' },
  { id: 'org-footnotes', title: 'Footnotes', desc: 'Hahnemann\'s extensive footnotes providing additional context, examples, and commentary on the aphorisms.', icon: '📝' },
  { id: 'org-commentary', title: 'Commentary', desc: 'B.K. Sarkar\'s commentary and annotations on the Organon — providing context, explanation, and cross-references.', icon: '💬' },
  { id: 'org-clinical', title: 'Clinical Applications', desc: 'How the principles of the Organon are applied in clinical practice — case taking, remedy selection, and follow-up.', icon: '🏥' },
  { id: 'org-comparative', title: 'Comparative Study', desc: 'Comparison of homoeopathic principles with other medical systems — allopathy, isopathy, and alternative approaches.', icon: '🔍' },
  { id: 'org-notes', title: 'Notes', desc: 'Additional notes on the Organon — historical context, translation notes, and scholarly commentary.', icon: '📌' },
  { id: 'org-references', title: 'References', desc: 'References and bibliography — sources cited in the Organon and related scholarly works.', icon: '📚' },
];

// Philosophy subsection content — word-for-word from BK Sarkar's Organon OCR + structured formatting
const PHILOSOPHY_CONTENT = `PHILOSOPHY OF HOMOEOPATHY
(From B.K. Sarkar's Translation & Annotation of Hahnemann's Organon of Medicine)

═══════════════════════════════════════════
1. INDUCTIVE LOGIC AND THE SCIENTIFIC SPIRIT
═══════════════════════════════════════════

The fetters of academic scholasticism appeared in the person of Lord Bacon of England. He through his inductive method of Logic and "Novum Organum," inaugurated the modern scientific era.

The scientific spirit means a certain attitude of mind with the following characteristics:

• It is the spirit of 'Inquiry'. All the established beliefs which we encounter belong to two categories:
  (a) the priceless results of generations of experience;
  (b) heirloom rubbish.
  Towards this whole body of belief the scientific attitude of mind is one of unprejudiced inquiry.

• It is not the spirit of iconoclasm, as some would believe, but an examination of the foundations of belief. The spirit which resents inquiry into any belief, however cherished, is the narrow spirit of dogmatism; and is as far removed from the true scientific attitude as the shallow-minded rejection of all belief.

Hahnemann's Organon is a critique of medical philosophy underlying the art of Medicine. An analytic study of Organon, as well as that of the history of Homoeopathy and the life-story of its founder, clearly shows that Homoeopathy is a product of inductive logic applied to the subject of medicine.

═══════════════════════════════════════════
2. THE VITAL FORCE (Lebenskraft)
═══════════════════════════════════════════

In the last edition, the "vital force" occupies quite a different and a much more important position in regard to disease, its cause and cure. The doctrine of dynamisation of medicines by the pharmaceutical processes peculiar to homoeopathy, which had only been hinted at in previous editions, is in this edition distinctly stated.

Key principles from the Organon:

• It is only by the spiritual influences of morbific noxa that our spirit-like vital force can become ill; and in like manner, only by the spirit-like (dynamic) operation of medicines that it can be again restored to health.

• The practitioner, therefore, only needs to take away the totality of the disease-signs, and he has removed the entire disease.

• During health a spiritual power (autocracy, vital force) animates the organism and keeps it in harmonious order.

• The material organism derives all its sensations and performs all its functions solely by means of the immaterial being (the vital principle) which animates the material organism in health and disease.

═══════════════════════════════════════════
3. DYNAMIC DISEASE — SPIRIT-LIKE DERANGEMENT
═══════════════════════════════════════════

Diseases are not caused by any substance, any acridity, that is to say, any disease-matter, but that they are solely spirit-like (dynamic) derangements of the spirit-like power (the vital force) that animates the human body.

Homoeopathy knows that a cure can only take place by the reaction of the vital force against the rightly chosen remedy that has been ingested, and that the cure will be certain and rapid in proportion to the strength with which the vital force still prevails in the patient.

Hence Homoeopathy avoids everything in the slightest degree enfeebling, and as much as possible every excitation of pain, for pain always diminishes the strength.

═══════════════════════════════════════════
4. THE LAW OF SIMILARS — Similia Similibus Curentur
═══════════════════════════════════════════

Homoeopathy sheds not a drop of blood, administers no emetics, purgatives, laxatives or diaphoretics, drives off no external affection by external means, prescribes no warm baths or medicated clysters, applies no Spanish flies or mustard plasters, no setons, no issues, excites no ptyalism, burns not with cauteries.

It administers a medicine whose medicinal power (its medicinal disease) is capable of removing the natural disease in question by similarity (similia similibus), and this it administers to the patient in simple form, but in rare and minute doses — so small that, without occasioning pain or weakening, they just suffice to remove the natural malady by means of the reacting energy of the vital force.

═══════════════════════════════════════════
5. DYNAMISATION OF MEDICINES
═══════════════════════════════════════════

The doctrine of dynamisation of medicines by the pharmaceutical processes peculiar to homoeopathy, which had only been hinted at in previous editions, is in the fifth edition distinctly stated.

The dynamic spiritual power of altering man's health, hidden in the invisible interior of medicines, is never maifested by mere tasting or smelling them. It requires that the substances be processed through serial dilution and succussion — the process Hahnemann called potentisation.

Through this process, the medicinal substance is liberated from its material constraints, and its dynamic healing power is enhanced. The minimum dose — just sufficient to gently stimulate the vital force — is the homoeopathic dose.

═══════════════════════════════════════════
6. CHRONIC MIASMS — Psora, Sycosis, Syphilis
═══════════════════════════════════════════

The worst kinds of chronic diseases are those produced by chronic miasms.

Chronic diseases proper; they all arise from chronic miasms:

• Psora — it is the mother of all true chronic diseases except the syphilitic and sycotic.
• Syphilis
• Sycosis

Among the more specific remedies discovered for these chronic miasms, especially for psora, the selection of those for the cure of each individual case of chronic disease is to be conducted all the more carefully.

═══════════════════════════════════════════
7. THE PHYSICIAN'S MISSION
═══════════════════════════════════════════

The story of life and mission of Hahnemann is the story of science applied to Medicine. During his time there was so much of phantastic theories and so little of science that after two years of practice since his winning the Doctorate of Medicine, he is reported to have written to one of his friends about his disillusionment with the medical practice of his day.

The physician's high and only mission is to restore the sick to health, to cure, as it is termed.

The highest ideal of cure is rapid, gentle and permanent restoration of the health, or removal and annihilation of the disease in its whole extent, in the shortest, most reliable, and most harmless way, on easily comprehensible principles.

═══════════════════════════════════════════
8. INDIVIDUALISATION OF THE CASE
═══════════════════════════════════════════

The physician must individualise each case. No two patients are exactly alike, for each patient's vital force reacts differently to disease and to medicines.

The practitioner only needs to take away the totality of the disease-signs, and he has removed the entire disease. This totality of symptoms — the outward expression of the internal derangement of the vital force — is what guides the physician to the selection of the simillimum, the most similar remedy.

═══════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════

The philosophy of homoeopathy, as expounded in Hahnemann's Organon and annotated by B.K. Sarkar, represents a complete system of rational medicine based on:

1. Inductive logic and careful observation — the scientific spirit of unprejudiced inquiry
2. The dynamic conception of life, disease, and medicine — the vital force as spiritual principle
3. The law of similars (Similia Similibus Curentur) as the fundamental therapeutic law
4. Individualisation of each case — treating the patient, not the disease
5. The minimum dose and potentisation — dynamic, not material, action
6. The theory of chronic miasms — psora, sycosis, syphilis
7. The physician's mission — rapid, gentle, permanent cure on rational principles

— Source: B.K. Sarkar, Translation & Annotation of Hahnemann's Organon of Medicine (Fifth & Sixth Edition)`;

export default function OrganonPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [q, setQ] = useState('');
  const [book, setBook] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'subsections' | 'philosophy'>('sections');
  const reader = useReaderFeatures();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
        fetch('/api/books/organon-bk-sarkar')
          .then(r => r.json())
          .then(d => {
            if (d && !d.error) {
              setBook(d);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const sections: BookSection[] = useMemo(() => {
    if (!book || !book.chapters) return [];
    return book.chapters.map((ch: any) => ({
      id: ch.id,
      title: ch.title,
      content: ch.content,
    }));
  }, [book]);

  const filtered = useMemo(() => {
    if (!q) return sections;
    const s = q.toLowerCase();
    return sections.filter(sec =>
      sec.title.toLowerCase().includes(s) ||
      sec.content.toLowerCase().includes(s)
    );
  }, [q, sections]);

  const filteredSubsections = useMemo(() => {
    if (!q) return ORGANON_SUBSECTIONS;
    const s = q.toLowerCase();
    return ORGANON_SUBSECTIONS.filter(sub =>
      sub.title.toLowerCase().includes(s) ||
      sub.desc.toLowerCase().includes(s)
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
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">
            {book ? `${book.title} — by ${book.author}` : 'Samuel Hahnemann\'s foundational text — the philosophy & principles of homoeopathy'}
          </p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {/* Dark green quote card */}
        <section className="bg-[#173B2D] text-[#F5EFE0] rounded-lg shadow-lg p-6 mb-6 border-l-4 border-[#C8A24A]">
          <div className="text-4xl text-[#C8A24A] font-serif leading-none mb-2">&ldquo;</div>
          <p className="font-serif italic text-base md:text-lg leading-relaxed whitespace-pre-line text-stone-200">
            {HAHNEMANN_QUOTE}
          </p>
        </section>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-4 border-b border-[#E8DCC3]">
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-t ${activeTab === 'sections' ? 'bg-[#173B2D] text-[#C8A24A]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
          >Book Sections</button>
          <button
            onClick={() => setActiveTab('subsections')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-t ${activeTab === 'subsections' ? 'bg-[#173B2D] text-[#C8A24A]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
          >Topics</button>
          <button
            onClick={() => setActiveTab('philosophy')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-t ${activeTab === 'philosophy' ? 'bg-[#C8A24A] text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
          >📖 Philosophy</button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={activeTab === 'philosophy' ? 'Search within Philosophy...' : 'Search within Organon...'}
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8F6E]">🔍</span>
          </div>
        </div>

        {/* === TAB: Book Sections === */}
        {activeTab === 'sections' && (
          <>
            <div className="text-sm text-[#7C8F6E] mb-3">
              {filtered.length} section{filtered.length !== 1 ? 's' : ''}
              {book && ` — ${book.totalChapters} total`}
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#7C8F6E]">Loading content...</div>
            ) : sections.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-sm text-[#7C8F6E]">No content available yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {filtered.map((sec) => {
                    const bm = reader.isBookmarked(sec.id);
                    const origIdx = sections.findIndex(s => s.id === sec.id);
                    return (
                      <article
                        key={sec.id}
                        className="bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow border-t-2 border-[#173B2D] cursor-pointer"
                        onClick={() => setSelectedSection(origIdx)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#173B2D] text-[#C8A24A] flex items-center justify-center font-serif text-base">
                              {origIdx + 1}
                            </div>
                            <div>
                              <h3 className="font-serif text-lg text-[#173B2D] leading-tight">{sec.title}</h3>
                              <p className="text-[0.65rem] text-[#C8A24A] font-semibold uppercase tracking-wider">{sec.content.length.toLocaleString()} chars</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); reader.toggleBookmark({ id: sec.id, type: 'organon', name: sec.title }); }}
                            title={bm ? 'Remove bookmark' : 'Add bookmark'}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors flex-shrink-0 ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                          >🔖</button>
                        </div>
                        <p className="text-sm text-stone-600 leading-relaxed mt-2 line-clamp-3">{sec.content.substring(0, 200)}...</p>
                      </article>
                    );
                  })}
                </div>

                {sections[selectedSection] && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DCC3]">
                      <h2 className="font-serif text-xl text-[#173B2D]">{sections[selectedSection].title}</h2>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))} disabled={selectedSection === 0} className="text-xs bg-[#173B2D] text-white px-3 py-1.5 rounded disabled:opacity-30">← Prev</button>
                        <button onClick={() => setSelectedSection(Math.min(sections.length - 1, selectedSection + 1))} disabled={selectedSection === sections.length - 1} className="text-xs bg-[#173B2D] text-white px-3 py-1.5 rounded disabled:opacity-30">Next →</button>
                      </div>
                    </div>
                    <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{sections[selectedSection].content}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* === TAB: Topics (Subsections) === */}
        {activeTab === 'subsections' && (
          <>
            <div className="text-sm text-[#7C8F6E] mb-3">{filteredSubsections.length} topics</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredSubsections.map((sub) => {
                const bm = reader.isBookmarked(sub.id);
                const isActive = sub.id === 'org-philosophy';
                return (
                  <article
                    key={sub.id}
                    className={`bg-white rounded-lg shadow hover:shadow-md p-5 transition-shadow border-t-2 ${isActive ? 'border-[#C8A24A]' : 'border-[#173B2D]'} ${isActive ? 'cursor-pointer' : 'cursor-pointer'}`}
                    onClick={() => sub.id === 'org-philosophy' ? setActiveTab('philosophy') : null}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{sub.icon}</div>
                        <div>
                          <h3 className="font-serif text-base text-[#173B2D] leading-tight">{sub.title}</h3>
                          {isActive && <p className="text-[0.6rem] text-[#C8A24A] font-bold uppercase">★ Click to read</p>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); reader.toggleBookmark({ id: sub.id, type: 'organon', name: sub.title }); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${bm ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                      >🔖</button>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed mt-2">{sub.desc}</p>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* === TAB: Philosophy (NEW SUBSECTION) === */}
        {activeTab === 'philosophy' && (
          <>
            <div className="bg-[#173B2D] rounded-lg p-4 mb-4 border-l-4 border-[#C8A24A]">
              <h2 className="font-serif text-xl text-[#C8A24A]">🧠 Philosophy</h2>
              <p className="text-xs text-stone-300 mt-1">The philosophical foundation of homoeopathy — inductive logic, dynamic vital force, spiritual dimension of disease and cure, and Hahnemann's rational approach to medicine.</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DCC3]">
                <h2 className="font-serif text-xl text-[#173B2D]">Philosophy of Homoeopathy</h2>
                <button
                  onClick={() => reader.toggleBookmark({ id: 'org-philosophy', type: 'organon', name: 'Philosophy' })}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${reader.isBookmarked('org-philosophy') ? 'bg-[#173B2D]/10 text-[#173B2D]' : 'text-[#7C8F6E] hover:bg-[#F5EFE0]'}`}
                >🔖</button>
              </div>

              {/* Render Philosophy content with formatted headings, bold text, bullet points */}
              <div className="prose prose-stone max-w-none space-y-4">
                {PHILOSOPHY_CONTENT.split('\n').map((line, i) => {
                  // Section headings (═══ lines or numbered headings)
                  if (line.match(/^═+$/) || line.match(/^═+.*═+$/)) {
                    return null; // Skip separator lines
                  }
                  if (line.match(/^\d+\.\s+[A-Z]/)) {
                    return <h3 key={i} className="font-serif text-lg text-[#173B2D] font-bold mt-6 mb-2 pb-1 border-b border-[#C8A24A]/30">{line}</h3>;
                  }
                  // Main title
                  if (line.match(/^PHILOSOPHY OF/) || line.match(/^\(From B\.K\./)) {
                    if (line.startsWith('PHILOSOPHY')) {
                      return <h2 key={i} className="font-serif text-2xl text-[#173B2D] font-bold mb-2">{line}</h2>;
                    }
                    return <p key={i} className="text-sm text-[#7C8F6E] italic mb-4">{line}</p>;
                  }
                  // Summary heading
                  if (line === 'SUMMARY') {
                    return <h3 key={i} className="font-serif text-lg text-[#173B2D] font-bold mt-6 mb-2 pb-1 border-b border-[#C8A24A]/30">{line}</h3>;
                  }
                  // Bullet points
                  if (line.trim().startsWith('•')) {
                    return <p key={i} className="text-sm text-stone-700 leading-relaxed pl-4 border-l-2 border-[#C8A24A]">{line.trim().substring(1).trim()}</p>;
                  }
                  // Numbered points
                  if (line.match(/^\d+\.\s+[A-Z]/) && !line.match(/^\d+\.\s+[A-Z]{3,}/)) {
                    return <p key={i} className="text-sm text-stone-700 leading-relaxed pl-4"><span className="font-bold text-[#173B2D]">{line.split('.')[0]}.</span> {line.split('.').slice(1).join('.').trim()}</p>;
                  }
                  // Source line
                  if (line.startsWith('— Source:')) {
                    return <p key={i} className="text-xs text-[#7C8F6E] italic mt-4 pt-2 border-t border-[#E8DCC3]">{line}</p>;
                  }
                  // Regular paragraph
                  if (line.trim()) {
                    return <p key={i} className="text-sm text-stone-700 leading-relaxed">{line}</p>;
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="bg-[#F5EFE0] rounded-lg p-4 mb-4 border border-[#E8DCC3]">
              <p className="text-xs text-[#7C8F6E] text-center">
                This Philosophy subsection is part of the Organon of Medicine section. Content sourced word-for-word from B.K. Sarkar's translation and annotation of Hahnemann's Organon.
              </p>
            </div>
          </>
        )}

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
