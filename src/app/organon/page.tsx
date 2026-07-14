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

// Philosophy subsection content — extracted from BK Sarkar's Organon
const PHILOSOPHY_CONTENT = `PHILOSOPHY OF HOMOEOPATHY

The philosophical foundation of homoeopathy rests upon the inductive method of reasoning, which Hahnemann applied to the study of medicine. This approach marked a radical departure from the speculative systems that dominated medical thought in his time.

INDUCTIVE LOGIC

Hahnemann's Organon is a critique of medical philosophy underlying the art of medicine. An analytic study of Organon, as well as that of the history of Homoeopathy and the life-story of its founder, clearly shows that Homoeopathy is a product of inductive logic applied to the subject of medicine. Inductive logic proceeds from the particular to the general, from observed facts to general principles. Hahnemann observed the effects of medicines on healthy individuals (provings), the symptoms of diseases in patients, and the results of applying similar remedies to similar disease conditions. From these observations, he derived the general principle: "Similia similibus curentur" — let like be cured by like.

THE DYNAMIC CONCEPTION OF LIFE

Hahnemann conceived of life as a dynamic, spiritual principle — the vital force. The material organism is animated by this spiritual vital force. Without it, the body is dead. Disease is not a material entity but a dynamic derangement of the vital force. Medicines act not through their material substance but through their dynamic influence on the vital force. This dynamic conception distinguishes homoeopathy from materialistic systems of medicine that seek to explain all phenomena in terms of physical and chemical processes.

THE VITAL FORCE

The vital force (Lebenskraft) is the central concept in Hahnemann's philosophy. It is the spiritual principle that animates the material organism, maintaining harmonious function during health and producing symptoms during disease. The vital force is:

- Immaterial and spiritual in nature
- The source of all sensation and function
- The reactive principle that produces symptoms when deranged
- The target of medicinal action (dynamic, not chemical)
- Self-limiting in acute diseases but overwhelmed by chronic miasms

DISEASE AS DYNAMIC DERANGEMENT

In Hahnemann's philosophy, disease is not a thing or entity but a condition — a dynamic derangement of the vital force. The symptoms we observe are the outward expression of this internal derangement. Disease is not localized to an organ or tissue but affects the whole organism through the vital force. This is why homoeopathy treats the patient as a whole, not the disease as a separate entity.

MEDICINE AS DYNAMIC AGENT

Just as disease is dynamic, so too is the action of medicine. Hahnemann discovered that the curative power of a medicine lies not in its chemical properties but in its dynamic influence on the vital force. Through the process of potentisation (serial dilution and succussion), the medicinal substance is liberated from its material constraints, and its dynamic healing power is enhanced. The minimum dose — just sufficient to gently stimulate the vital force — is the homoeopathic dose.

THE LAW OF SIMILARS

The fundamental law of homoeopathy — "Similia similibus curentur" — is derived from observation of nature. A weaker dynamic affection is permanently extinguished by a stronger one, if the latter is very similar in its manifestations. This is not a mere theory but a natural law, observable in many phenomena:

- The extinguishing of one disease by another similar disease
- The action of medicines on the healthy producing symptoms similar to the disease
- The cure of disease by medicines that can produce similar symptoms in the healthy

INDIVIDUALISATION

Hahnemann's philosophy demands individualisation — the recognition that every patient is unique. No two cases of the same disease are exactly alike, because each patient's vital force reacts differently. The physician must observe and record every peculiar and characteristic symptom that individualises the patient, and match these to the remedy that has produced similar symptoms in provings. This is why homoeopathy does not treat "diseases" by name but treats individual patients.

THE PHYSICIAN'S MISSION

Hahnemann defines the physician's mission in the opening aphorisms of the Organon: "The physician's high and only mission is to restore the sick to health, to cure, as it is termed." Cure must be:
- Rapid — not unnecessarily prolonged
- Gentle — not violent or harmful
- Permanent — not merely palliative
- Based on easily comprehensible principles — not guesswork

This defines the ethical and practical foundation of homoeopathic philosophy — the physician exists to cure, not to theorise or experiment on the patient.

THE DIRECTION OF CURE

Hahnemann observed that cure follows a definite direction, later systematised by Constantine Hering as "Hering's Law of Cure":
- From above downward (head to feet)
- From within outward (internal organs to skin)
- From a more important organ to a less important organ
- In the reverse order of the appearance of symptoms

This principle helps the physician determine whether the patient is truly healing or merely experiencing symptom suppression.

SUMMARY

The philosophy of homoeopathy, as expounded in Hahnemann's Organon and annotated by B.K. Sarkar, represents a complete system of rational medicine based on:
1. Inductive logic and careful observation
2. The dynamic conception of life, disease, and medicine
3. The law of similars as the fundamental therapeutic principle
4. Individualisation of each case
5. The minimum dose and potentisation
6. The direction of cure as a guide to treatment

This philosophical framework distinguishes homoeopathy from all other systems of medicine and provides a rational, ethical, and practical approach to the restoration of health.`;

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
              <div className="prose prose-stone max-w-none">
                <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{PHILOSOPHY_CONTENT}</p>
              </div>
            </div>

            <div className="bg-[#F5EFE0] rounded-lg p-4 mb-4 border border-[#E8DCC3]">
              <p className="text-xs text-[#7C8F6E] text-center">
                This Philosophy subsection is part of the Organon of Medicine section. Content based on B.K. Sarkar's translation and annotation of Hahnemann's Organon.
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
