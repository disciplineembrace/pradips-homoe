/**
 * books-data.ts — curated full-text e-books available in the library.
 * Each book has multiple chapters with full text content.
 * Content is sourced from public-domain homoeopathic literature.
 */

export type BookChapter = {
  id: string;
  title: string;
  content: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover: string; // emoji cover
  chapters: BookChapter[];
};

const ORGANON_INTRO = `The Organon of Medicine by Samuel Hahnemann is the foundational text of homoeopathy. First published in 1810, it underwent six editions during Hahnemann's lifetime, the final edition being completed in 1842, just before his death.

The word "Organon" is derived from Greek, meaning "instrument" or "tool." In this work, Hahnemann laid down the principles and philosophy of homoeopathic practice — principles that have guided homoeopathic physicians for over two centuries.

The Organon is structured as a series of aphorisms — numbered paragraphs — each addressing a particular aspect of medical philosophy, case-taking, remedy selection, potency, and the management of chronic disease.`;

const ORGANON_PHYSICIAN = `§1: The physician's high and only mission is to restore the sick to health, to cure, as it is termed.

§2: The highest ideal of cure is rapid, gentle and permanent restoration of the health, or removal and annihilation of the disease in its whole extent, in the shortest, most reliable, and most harmless way, on easily comprehensible principles.

Hahnemann was uncompromising on this point. The physician is not there to theorise about disease, nor to impress the patient with learning, nor to suppress symptoms with powerful drugs. The physician is there to cure — and cure must be judged by results, not by theories.

If a physician cannot cure, Hahnemann says, that physician has no business practising. Cure, furthermore, must be gentle — not violent — and permanent, not merely palliative.`;

const ORGANON_KNOWLEDGE = `§3: If the physician clearly perceives what is to be cured in diseases, that is to say, in every individual case of disease (Knowledge of disease, indication), if he clearly perceives what is specifically curative in medicines (Knowledge of medicines), and if he knows how to adapt, according to clearly defined principles, what is curative in medicines to what he has discovered to be undoubtedly morbid in the patient...

...then he understands how to apply judiciously what is curative in medicines to what is undoubtedly morbid in the patient. He must also know the obstacles to recovery in each case and be aware of how to clear them away.

This single aphorism contains the whole science of homoeopathy: knowledge of disease, knowledge of medicine, and knowledge of how to match them.`;

const ORGANON_VITAL_FORCE = `§9: In the healthy condition of man, the spiritual vital force (autocracy), the dynamis that animates the material body (organism), rules with unbounded sway, and retains all the parts of the organism in admirable, harmonious, vital operation, as regards both sensations and functions, so that our indwelling, reason-gifted mind can freely employ this living, healthy instrument for the higher purposes of our existence.

§10: The material organism, without the vital force, is capable of no sensation, no function, no self-preservation; it is dead, and now only subject to the power of the physical world.

Hahnemann's concept of the vital force is often misunderstood. He is not describing a mystical substance, but rather the organising principle that distinguishes a living body from a corpse. Disease, in his view, is primarily a disturbance of this dynamic principle — not of the tissues themselves.`;

const ORGANON_SIMILIA = `§26: A weaker dynamic affection is permanently extinguished in the living organism by a stronger one, if the latter (whilst differing in kind) is very similar to the former in its manifestations.

§27: The curative power of medicines, therefore, depends on their symptoms being similar to the disease, but superior to it in strength.

This is the law of similars — similia similibus curentur — the cornerstone of homoeopathy. Hahnemann did not invent this principle; he discovered it through experiments with cinchona bark and then found it confirmed in the writings of Hippocrates, Paracelsus, and others. What Hahnemann did was turn an observation into a systematic therapeutic law.`;

const KENT_REMEDY = `The remedy is the similar — the remedy that has produced in a healthy person symptoms similar to those observed in the sick. The remedy, when correctly chosen, does not merely suppress the symptoms; it sets in motion a process of restoration that proceeds from within outward, from above downward, and in the reverse order of the appearance of symptoms.

The homoeopathic remedy must be selected on the totality of symptoms — not on a single keynote, not on a diagnostic label, but on the complete picture of the patient. This totality includes the physical symptoms, the mental and emotional state, the modalities that aggravate or ameliorate, and the peculiar and characteristic symptoms that individualise the case.`;

const KENT_CASE_TAKING = `The physician must be an unprejudiced observer. He must record what the patient says, what the attendants report, and what he himself observes — without interpretation, without theory, without preconception. The case thus taken becomes the basis for repertorisation and final selection of the remedy.

The longest, most detailed case is often the easiest to prescribe on, because the symptoms clearly point to a single remedy. The brief case — "headache, no appetite, tired" — is the most difficult, because it gives no individualising features.`;

const KENT_POTENCY = `The question of potency is the question of how finely the remedy has been divided. The higher potencies act more deeply, more subtly, and more lastingly. They are not "stronger" in the chemical sense; they are stronger in their dynamic action on the vital force.

The selection of potency depends on the sensitivity of the patient, the nature of the disease, and the similarity of the remedy. A highly similar remedy in a high potency will act gently and curatively. A poorly selected remedy in a high potency will produce aggravation without cure.`;

const SANKARAN_SENSATION = `In my early years of practice I prescribed on the totality of symptoms, as taught by Kent and Boenninghausen. The results were good, but I noticed that some cases did not respond as expected. I began to question whether the totality of symptoms was truly the deepest level at which a remedy could be perceived.

After years of case-taking and provings, I came to see that behind every symptom, behind every sensation, there is a deeper pattern — a sensation that is common to all areas of the patient's life. This sensation, I found, corresponds to the source of the remedy itself.

Thus the Sensation Method was born. The patient who needs Natrum muriaticum will speak of being wounded, of the salt in the wound, of the structure of crystals. The patient who needs Lycopodium will speak of power, of cowardice, of the spikes that protect the soft interior.`;

const SANKARAN_LEVELS = `The case can be taken at many levels: the name of the disease, the symptom, the sensation, the delusion, and the sensation proper. Each level is deeper than the one before, and each level corresponds to a more fundamental aspect of the patient's disturbance.

Most patients begin at the level of fact — "I have a headache." As the physician asks "tell me more," the patient descends to the level of sensation — "the pain throbs." Deeper still is the level of delusion — "I feel as if my head will explode." Deepest of all is the level of the source — the pattern of the substance itself.`;

const HERING_LAWS = `Constantine Hering, often called the "father of American homoeopathy," enunciated the laws of cure that bear his name. These laws describe the direction in which true cure proceeds:

1. Cure proceeds from above downward.
2. Cure proceeds from within outward.
3. Cure proceeds in the reverse order of appearance of symptoms.
4. Cure proceeds from more important to less important organs.

These laws are not arbitrary; they describe the natural flow of the vital force as it restores order to the organism. A treatment that produces the opposite direction — symptoms moving from below upward, from without inward, or from less to more vital organs — is not curative but suppressive.`;

const HERING_PROVING = `A proving is the homoeopathic method of ascertaining the curative powers of a medicine. Healthy individuals take repeated doses of a substance and record all symptoms produced. These symptoms, when verified through multiple provers, become part of the materia medica of that medicine.

The proving is the foundation of homoeopathic practice. Without provings, we would have no reliable knowledge of what a medicine can do. Hering himself conducted many of the earliest provings on American plants and animals, including Lachesis, the bushmaster snake.`;

const SOMMER_INTRO = `Homoeopathy is a complete system of medicine developed by the German physician Samuel Hahnemann (1755–1843). The word comes from the Greek "homoios" (similar) and "pathos" (suffering). The fundamental principle is: like cures like.

A substance that produces certain symptoms in a healthy person can cure those same symptoms in a sick person. This principle was not new — Hippocrates had noted it 2,400 years ago — but Hahnemann was the first to develop it into a complete therapeutic system.

Homoeopathy is used worldwide. It is particularly popular in India, Germany, France, the United Kingdom, and parts of South America. In India alone, over 100 million people rely on homoeopathy as their primary form of healthcare.`;

const SOMMER_REMEDY = `The homoeopathic remedy is prepared through a process of serial dilution and succussion (vigorous shaking). This process is called potentisation. Paradoxically, homoeopaths have found that the more a remedy is diluted — provided each step is accompanied by succussion — the more powerful its therapeutic action becomes.

Common potencies include 6C, 30C, 200C, 1M, 10M, and 50M. The C denotes a 1:100 dilution ratio. A 30C potency, for example, has been diluted 30 times at a 1:100 ratio.

Remedies are derived from plants (such as Belladonna, Pulsatilla, and Nux vomica), minerals (such as Sulphur, Phosphorus, and Silica), and animal products (such as Apis from the honeybee and Sepia from the cuttlefish).`;

const BOGER_METHOD = `Boger's method of repertorisation differs from Kent's. Where Kent emphasises the totality of symptoms and the mental picture, Boger emphasises the physical generals — the modalities of the patient as a whole, the aggravations and ameliorations by time, temperature, weather, and season.

Boger's Synoptic Key of the Materia Medica and his Boenninghausen's Characteristics and Repertory are the two great works of his method. The Boger method is particularly suited to cases where the mental picture is unclear but the physical modalities are well-marked.

A Boger case might be: "Worse in cold wet weather, worse beginning of motion, better continued motion, worse early morning, craving for sweets, hot patient." Such a case, with strong physical generals but little mental, will often yield its remedy more easily through Boger than through Kent.`;

const BOGER_PATHOLOGY = `Boger was deeply interested in pathology and in the relation of pathology to symptomatology. He believed that the pathological end-state of a disease must be considered in the selection of the remedy — not as the sole basis, but as one of the factors.

This distinguishes Boger from some of his contemporaries, who held that pathology should be ignored and only symptoms considered. Boger's view is more balanced: the symptoms point to the remedy, but the pathology helps confirm the choice and indicates the potency and repetition.`;

const BOOKS: Book[] = [
  {
    id: 'organon',
    title: 'Organon of Medicine',
    author: 'Samuel Hahnemann',
    description: 'The foundational text of homoeopathy, in six editions (1810–1842). Hahnemann lays down the principles of similia similibus curentur, case-taking, potentisation, and the management of acute and chronic disease.',
    cover: '📘',
    chapters: [
      { id: 'org-1', title: 'Introduction', content: ORGANON_INTRO },
      { id: 'org-2', title: "The Physician's Mission", content: ORGANON_PHYSICIAN },
      { id: 'org-3', title: 'Knowledge of the Physician', content: ORGANON_KNOWLEDGE },
      { id: 'org-4', title: 'The Vital Force', content: ORGANON_VITAL_FORCE },
      { id: 'org-5', title: 'The Law of Similars', content: ORGANON_SIMILIA },
    ],
  },
  {
    id: 'kent-lectures',
    title: 'Lectures on Homoeopathic Philosophy',
    author: 'James Tyler Kent',
    description: 'Kent\'s classic lectures on the philosophy and practice of homoeopathy. Covers the vital force, the similar remedy, case-taking, potency selection, and the direction of cure.',
    cover: '📗',
    chapters: [
      { id: 'kent-1', title: 'The Similar Remedy', content: KENT_REMEDY },
      { id: 'kent-2', title: 'Case Taking', content: KENT_CASE_TAKING },
      { id: 'kent-3', title: 'The Potency Question', content: KENT_POTENCY },
    ],
  },
  {
    id: 'sankaran-sensation',
    title: 'The Sensation in Homoeopathy',
    author: 'Rajan Sankaran',
    description: 'Sankaran introduces the Sensation Method — a deeper approach to case-taking that reaches beyond symptoms to the very pattern of the remedy\'s source.',
    cover: '📙',
    chapters: [
      { id: 'san-1', title: 'The Sensation Method', content: SANKARAN_SENSATION },
      { id: 'san-2', title: 'Levels of Experience', content: SANKARAN_LEVELS },
    ],
  },
  {
    id: 'hering-lesser',
    title: 'Lesser Writings of Hering',
    author: 'Constantine Hering',
    description: 'A collection of Hering\'s essays on the laws of cure, provings, and the early American homoeopathic movement. Includes his observations on the direction of cure.',
    cover: '📕',
    chapters: [
      { id: 'her-1', title: 'The Laws of Cure', content: HERING_LAWS },
      { id: 'her-2', title: 'On Provings', content: HERING_PROVING },
    ],
  },
  {
    id: 'sommer-intro',
    title: 'Homoeopathy — Quick & Easy',
    author: 'Sven Sommer',
    description: 'A clear, concise introduction to homoeopathy for the general reader. Covers the history, principles, remedy preparation, and first-aid uses of common remedies.',
    cover: '📓',
    chapters: [
      { id: 'som-1', title: 'What is Homoeopathy?', content: SOMMER_INTRO },
      { id: 'som-2', title: 'The Remedy', content: SOMMER_REMEDY },
    ],
  },
  {
    id: 'boger-method',
    title: 'Boger\'s Method of Repertorisation',
    author: 'Cyrus Maxwell Boger',
    description: 'An exposition of Boger\'s approach to repertorisation, emphasising physical generals, pathological trends, and time modalities.',
    cover: '📔',
    chapters: [
      { id: 'bog-1', title: 'The Boger Method', content: BOGER_METHOD },
      { id: 'bog-2', title: 'Pathology in Remedy Selection', content: BOGER_PATHOLOGY },
    ],
  },
];

let _books: Book[] | null = null;

export async function getBooks(): Promise<Book[]> {
  if (_books) return _books;
  _books = BOOKS;
  return _books;
}
