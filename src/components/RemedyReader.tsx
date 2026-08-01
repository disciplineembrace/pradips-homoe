'use client';
/**
 * RemedyReader — Global Premium Remedy Reading Component.
 *
 * ONE component for ALL Materia Medica sources.
 * Automatically detects headings, renders full content, preserves OCR hierarchy.
 *
 * Features:
 * - Large centered remedy name (serif)
 * - Botanical name (gray italic, centered)
 * - Full source title badge (dark green, gold text, wraps to multiple lines)
 * - Auto-detects section headings from text (no hardcoding)
 * - Dark medical red bold headings
 * - Dark charcoal body text with comfortable line spacing
 * - Full-width reading card (16px margins on mobile)
 * - No truncation, no summarization — complete text displayed
 *
 * Works for ALL authors: Allen, Boericke, Kent, Phatak, Dubey, Murphy, etc.
 * Future sources automatically inherit this theme — no code changes needed.
 */
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ============================================================
// Types
// ============================================================
type RemedySection = { heading?: string; paragraphs?: string[] };

type Remedy = {
  id: string; name: string; common?: string; author: string;
  chapter?: string; organ?: string; modalities?: string;
  constitution?: string; relationships?: string; dose?: string;
  keynote?: string; full?: string; letter?: string;
  sections?: RemedySection[];
};

// ============================================================
// Source title mapping — full book names per author
// ============================================================
const SOURCE_TITLES: Record<string, string> = {
  'Allen': "Allen's Keynotes and Characteristics",
  'Phatak': "S. R. Phatak's Concise Materia Medica",
  'Kent': "Kent's Lectures on Homoeopathic Materia Medica",
  'Boericke': "Pocket Manual of Homoeopathic Materia Medica by William Boericke",
  'Dubey': "S. K. Dubey's Materia Medica",
  'Murphy': "Robin Murphy's Lotus Materia Medica",
  'Farrington': "E. A. Farrington's Clinical Materia Medica",
  'Boeger': "Boeger's Synoptic Key Materia Medica",
  'Mathur': "K. N. Mathur's Materia Medica",
  'Sankaran': "Rajan Sankaran's The Soul of Remedies",
};

function getSourceTitle(author: string): string {
  return SOURCE_TITLES[author] || `${author} Materia Medica`;
}

// ============================================================
// Known section headings (for auto-detection from text)
// ============================================================
const KNOWN_HEADINGS = new Set<string>([
  // Standard homeopathic sections
  'Introduction', 'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face',
  'Mouth', 'Throat', 'Stomach', 'Abdomen', 'Rectum', 'Urinary Organs',
  'Urinary', 'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back',
  'Extremities', 'Sleep', 'Fever', 'Skin', 'Generalities',
  'Modalities', 'Relationships', 'Relationship', 'Relations',
  'Compare', 'Comparison', 'Clinical', 'Clinical Use',
  'Keynotes', 'Keynote', 'Characteristics', 'Characteristic',
  'Constitution', 'Dose', 'Potency', 'Caution', 'Summary',
  'Worse', 'Better', 'Related', 'Complementary', 'Inimical',
  'Antidote', 'Antidotes', 'Collateral',
  // Dubey-style
  'INTRODUCTION', 'CLINICAL', 'CLINICAL USE', 'PARTICULARS', 'PARTICULAR',
  'PERTICULARS', 'GUIDING SYMPTOMS', 'SPHERES OF ACTION', 'SPHERE OF ACTION',
  'SPHERES OF ACTION & PATHOGENESIS', 'SPHERE OF ACTION & PATHOGENESIS',
  'SPHERES OF ACTION AND PATHOGENESIS', 'SPHERE OF ACTION AND PATHOGENESIS',
  'PATHOGENESIS', 'RELATIONS', 'RELATION', 'RELATIONSHIP',
  'REMEDY RELATIONSHIP', 'CHARACTERISTIC INDICATIONS', 'PHYSIOLOGICAL ACTION',
  'PREPARATION AND DOSE', 'BIOCHEMIC SYSTEM', 'GENERAL MODALITY', 'MODALITIES',
  'AGGRAVATION', 'AMELIORATION', 'CAUSATION', 'DRUG ACTION', 'DRUG PICTURE',
  'ORGAN AFFINITY', 'CHARACTERISTIC', 'CHARACTERISTICS', 'IMPORTANT SYMPTOMS',
  'SUMMARY', 'BIOCHEMIC', 'GLOSSARY', 'COMPLEMENTARY', 'INIMICAL', 'ANTIDOTE',
  'ANTIDOTES', 'COLLATERAL', 'COMPARE', 'COMPARISON', 'DOSE', 'POTENCY',
  'MIASMATIC', 'MIASM', 'THERAPEUTIC', 'THERAPEUTICS', 'KEYNOTE', 'KEYNOTES',
  'PROVING', 'OBSERVATION', 'OBSERVATIONS',
  'THE TWELVE TISSUE SALTS', 'WINE RELATION',
  // Phatak ALL CAPS
  'GENERALITIES', 'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE',
  'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'URINARY',
  'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART', 'BACK',
  'EXTREMITIES', 'SLEEP', 'FEVER', 'SKIN', 'MODALITIES',
  'RELATIONSHIPS', 'DOSE', 'CLINICAL', 'KEYNOTES',
  // Kent extra
  'Marasmus', 'Croup', 'Diarrhoea', 'Dysentery', 'Pneumonia',
  'Rheumatism', 'Neuralgia', 'Convulsions', 'Delirium',
  'Menses', 'Pregnancy', 'Childbirth', 'Lactation',
  'Vertigo', 'Headache', 'Cough', 'Expectoration',
  'Palpitation', 'Pulse', 'Sweat', 'Chill', 'Heat',
  'Discharges', 'Ulcers', 'Eruptions', 'Warts', 'Tumors',
  'Cancer', 'Tuberculosis', 'Typhoid', 'Malaria',
  'Metastasis', 'Circulation', 'Sensations', 'Tissues',
  'Glands', 'Blood', 'Liver', 'Kidneys', 'Bladder',
  'Spine', 'Limbs', 'Hands', 'Feet', 'Hair', 'Nails',
  'Teeth', 'Tongue', 'Voice', 'Speech', 'Hearing', 'Vision',
  'Appetite', 'Thirst', 'Vomiting', 'Nausea', 'Constipation',
  'Stool', 'Urine', 'Semen', 'Sexual', 'Menstruation',
  'Leucorrhoea', 'Children', 'Women', 'Men',
  'Suppression', 'Neck', 'Larynx', 'Trachea',
  'Bronchi', 'Lungs', 'Pericardium', 'Arteries', 'Veins',
  'Nerves', 'Muscles', 'Bones', 'Joints',
  // Sankaran-specific section markers (The Soul of Remedies)
  'Rubrics', 'Phatak', 'Phatak Rubrics',
  'Physical concomitants', 'Physical concomitants are',
  // Sankaran structural headings
  'Source', 'Kingdom', 'Group', 'Miasm', 'Group Background',
  'Central Theme', 'Soul of the Remedy', 'Basic Delusion',
  'Inner Perception', 'Remedy Situation', 'Reaction',
  'Coping Pattern', 'Emotional State', 'Characteristic Behaviour',
  'Fears', 'Imaginations', 'Physical Characteristics',
  'Pathology', 'Desires', 'Cravings', 'Aversions',
  'Aggravations', 'Ameliorations',
  'Clinical Observations', 'Differential Remedies',
  'Concluding Essence', 'Original Source Text',
  // Murphy-specific section markers (Lotus Materia Medica)
  'PHARMACY', 'HERBAL', 'HOMEOPATHIC', 'COMMENTS', 'COMMENTARY',
  'REFERENCES', 'RELATIONS',
  // Murphy Title Case body parts
  'Constitutions', 'Causations', 'Sensations', 'Temperature',
  'Vertigo', 'Food', 'Perspiration', 'Breasts', 'Limbs',
  'Kidneys', 'Lungs', 'Vision', 'Cough', 'Blood',
  'Stool', 'Stools', 'Neck', 'Liver', 'Teeth', 'Tongue',
  'Bladder', 'Pregnancy', 'Expectoration', 'Glands',
]);

// Common non-remedy words (for clickable reference detection)
const NON_REMEDY_WORDS = new Set([
  'The', 'This', 'That', 'These', 'Those', 'There', 'Then', 'They',
  'When', 'Where', 'What', 'Which', 'Why', 'How', 'Who', 'Will',
  'Has', 'Have', 'Had', 'Been', 'Being', 'Was', 'Were', 'Are', 'Is',
  'Can', 'Could', 'Should', 'Would', 'May', 'Might', 'Must', 'Shall',
  'And', 'But', 'Or', 'Nor', 'Not', 'For', 'Yet', 'So', 'If', 'As',
  'At', 'By', 'In', 'On', 'To', 'Of', 'Up', 'Out', 'Off', 'Over',
  'Under', 'Again', 'Further', 'Once', 'Here', 'Now', 'All', 'Any',
  'Both', 'Each', 'Few', 'More', 'Most', 'Other', 'Some', 'Such',
  'Only', 'Own', 'Same', 'Than', 'Too', 'Very', 'Just', 'Also',
  'Because', 'Before', 'After', 'During', 'While', 'Since', 'Until',
  'Between', 'Through', 'Without', 'Within', 'About', 'Against',
  'Into', 'From', 'With', 'Upon', 'Toward', 'Towards',
  'It', 'Its', 'His', 'Her', 'She', 'He', 'We', 'Us', 'Our', 'You', 'Your',
  'Patient', 'Patients', 'Remedy', 'Remedies', 'Symptom', 'Symptoms',
  'Case', 'Cases', 'Drug', 'Drugs', 'Medicine', 'Medicines',
  'Dose', 'Potency', 'Mind', 'Head', 'Eyes', 'Ears',
  'Nose', 'Face', 'Mouth', 'Throat', 'Stomach', 'Abdomen',
  'Chest', 'Heart', 'Skin', 'Fever', 'Sleep', 'Generalities',
  'Introduction', 'Marasmus', 'Croup', 'Metastasis', 'Suppression',
  'Clinical', 'Keynotes', 'Compare', 'Relationships', 'Modalities',
  'Summary', 'Caution', 'Children', 'Women', 'Men',
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth',
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
  'Nine', 'Ten', 'Eleven', 'Twelve',
  'Hahnemann', 'Kent', 'Boericke', 'Allen', 'Phatak', 'Dubey',
  'Chapter', 'Section', 'Part', 'Book', 'Volume',
  'See', 'Like', 'Many', 'Much', 'Little', 'Small', 'Large', 'Great',
  'Old', 'Young', 'New', 'Good', 'Bad', 'Better', 'Worse', 'Best',
  'Morning', 'Evening', 'Night', 'Afternoon', 'Noon', 'Midnight',
  'Always', 'Never', 'Sometimes', 'Often', 'Rarely', 'Usually',
  'Generally', 'Particularly', 'Especially', 'Special',
  'Long', 'Short', 'High', 'Low', 'Deep', 'Shallow',
  'Hot', 'Cold', 'Warm', 'Cool', 'Wet', 'Dry',
  'Hard', 'Soft', 'Smooth', 'Rough', 'Sharp', 'Dull',
  'Light', 'Dark', 'Bright', 'Dim', 'Pale', 'Red', 'Blue',
  'Black', 'White', 'Green', 'Yellow', 'Brown',
  'Golden', 'Seal', 'Southern', 'Wood', 'Lady', 'Love',
  'Left', 'Right', 'Upper', 'Lower', 'Inner', 'Outer',
  'Front', 'Back', 'Side', 'Top', 'Bottom',
]);

// ============================================================
// Helper: detect if a line is a section heading
// ============================================================
function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 60) return false;
  if (trimmed.endsWith('.')) return false;
  // Check known headings
  if (KNOWN_HEADINGS.has(trimmed)) return true;
  // Check ALL CAPS pattern (Dubey style)
  if (trimmed === trimmed.toUpperCase() && !trimmed.endsWith(':') &&
      trimmed.split(/\s+/).length <= 6 && /^[A-Z][A-Z\s\-'/()&.]+$/.test(trimmed)) {
    return true;
  }
  // Check "Heading:" pattern (Phatak style)
  if (trimmed.endsWith(':') && trimmed.length > 3 && trimmed.length < 50) {
    const withoutColon = trimmed.slice(0, -1);
    if (KNOWN_HEADINGS.has(withoutColon)) return true;
    // Check if it's ALL CAPS with colon
    if (withoutColon === withoutColon.toUpperCase() && withoutColon.length > 3) return true;
  }
  return false;
}

// ============================================================
// Helper: render text with clickable remedy references
// ============================================================
function renderTextWithRefs(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const remedyPattern = /\b([A-Z][a-z]{3,}(?:\s+[a-z]+)?)\b/g;
  let lastIndex = 0;
  let match;
  let partKey = 0;

  while ((match = remedyPattern.exec(text)) !== null) {
    const word = match[1];
    if (NON_REMEDY_WORDS.has(word)) continue;

    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const searchUrl = `/materia-medica?q=${encodeURIComponent(word)}`;
    parts.push(
      <Link
        key={`${keyPrefix}-ref-${partKey++}`}
        href={searchUrl}
        className="text-blue-600 italic hover:underline hover:text-blue-800 cursor-pointer"
      >
        {word}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// ============================================================
// Helper: check if content is meaningful
// ============================================================
function hasContent(val?: string): boolean {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return v.length > 2 && v !== '—' && v !== '-' && v !== 'see full text.' && v !== 'see full text' && v !== 'n/a' && v !== ' ';
}

function isDuplicateOf(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const aTrim = a.trim().substring(0, 200).toLowerCase();
  const bTrim = b.trim().substring(0, 200).toLowerCase();
  return aTrim === bTrim;
}

// ============================================================
// Unified text renderer — works for ALL authors
// ============================================================
function renderRemedyText(text: string, keyPrefix: string): React.ReactNode {
  if (!text) return null;

  // If text has structured sections (Dubey/Allen style), use those
  // Otherwise, parse the full text for headings
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let keyCounter = 0;
  let quoteRendered = false;

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const paraText = currentParagraph.join(' ').trim();
      if (paraText) {
        elements.push(
          <p key={`${keyPrefix}-p-${keyCounter++}`} className="text-[#2C2C2C] leading-[1.7] mb-4 text-sm md:text-[15px]">
            {renderTextWithRefs(paraText, `${keyPrefix}-${keyCounter}`)}
          </p>
        );
      }
      currentParagraph = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Check for italic quote (Sankaran "soul of remedy" quote)
    // Quotes start with curly quote " or " or straight quote "
    if (!quoteRendered && (trimmed.startsWith('"') || trimmed.startsWith('"') || trimmed.startsWith('“'))) {
      flushParagraph();
      elements.push(
        <div key={`${keyPrefix}-quote-${keyCounter++}`} className="my-6 text-center">
          <p className="font-serif italic text-stone-700 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {trimmed}
          </p>
        </div>
      );
      quoteRendered = true;
      continue;
    }

    if (isHeading(trimmed)) {
      flushParagraph();
      // Normalize heading: remove trailing colon, convert ALL CAPS to Title Case
      let heading = trimmed.replace(/:$/, '');
      // Keep original case for known headings, Title Case for ALL CAPS
      if (heading === heading.toUpperCase() && heading.length > 3) {
        heading = heading.split(' ').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
      }
      elements.push(
        <h3 key={`${keyPrefix}-h-${keyCounter++}`} className="font-serif text-lg font-bold text-[#8B0000] mt-6 mb-3 pb-1 border-b border-[#E8DCC3] tracking-wide">
          {heading}
        </h3>
      );
    } else {
      // Check for sub-label pattern: "Label: text" or "Label :" at start
      const labelMatch = trimmed.match(/^([A-Z][a-z]+(?:\s+[a-z]+)*\s*:) (.*)$/s);
      if (labelMatch && !isHeading(trimmed)) {
        flushParagraph();
        elements.push(
          <div key={`${keyPrefix}-sl-${keyCounter++}`} className="mb-3">
            <span className="text-sm font-bold text-[#1a1a1a]">{labelMatch[1]}</span>{' '}
            <span className="text-sm text-[#2C2C2C] leading-[1.7]">{labelMatch[2]}</span>
          </div>
        );
      } else {
        currentParagraph.push(trimmed);
      }
    }
  }
  flushParagraph();

  return <div>{elements}</div>;
}

// ============================================================
// Main Component
// ============================================================
export function RemedyReader({
  remedy,
  onFavorite,
  onBookmark,
  onCopy,
  onPrint,
  onNote,
  isFavorite,
  isBookmark,
  notes,
  onNoteSubmit,
  onNoteDelete,
}: {
  remedy: Remedy;
  onFavorite?: () => void;
  onBookmark?: () => void;
  onCopy?: () => void;
  onPrint?: () => void;
  onNote?: () => void;
  isFavorite?: boolean;
  isBookmark?: boolean;
  notes?: { id: string; text: string; ts: number }[];
  onNoteSubmit?: (text: string) => void;
  onNoteDelete?: (id: string) => void;
}) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');

  const sourceTitle = getSourceTitle(remedy.author);
  const showKeynote = hasContent(remedy.keynote);
  const showConstitution = hasContent(remedy.constitution) && !isDuplicateOf(remedy.keynote, remedy.constitution);
  const showFull = hasContent(remedy.full) && !isDuplicateOf(remedy.keynote, remedy.full);
  const showModalities = hasContent(remedy.modalities);
  const showRelationships = hasContent(remedy.relationships) && remedy.relationships.trim() !== '—';
  const showDose = hasContent(remedy.dose);

  function handleNoteSubmit() {
    if (!noteText.trim()) return;
    onNoteSubmit?.(noteText);
    setNoteText('');
    setShowNoteForm(false);
  }

  // Determine what content to render
  // Priority: structured sections > full text > individual fields
  const hasStructuredSections = remedy.sections && remedy.sections.length > 0;
  const hasFullText = showFull;
  const hasIndividualFields = showKeynote || showConstitution || showModalities || showRelationships || showDose;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      {/* Premium Reading Card — full width with 16px margins */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/materia-medica" className="flex items-center gap-1.5 text-sm bg-[#173B2D] text-white px-4 py-2 rounded-lg hover:bg-[#2a5443] transition-colors">
            ← Back
          </Link>
          <div className="flex gap-1.5">
            <button onClick={onFavorite} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isFavorite ? 'text-[#C8A24A] bg-[#C8A24A]/10' : 'text-stone-400 hover:text-[#C8A24A] hover:bg-stone-100'}`} title="Favorite">★</button>
            <button onClick={onBookmark} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isBookmark ? 'text-[#173B2D] bg-[#173B2D]/10' : 'text-stone-400 hover:text-[#173B2D] hover:bg-stone-100'}`} title="Bookmark">🔖</button>
            <button onClick={onCopy} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-[#173B2D] hover:bg-stone-100 transition-colors" title="Copy">📋</button>
            <button onClick={onPrint} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-[#173B2D] hover:bg-stone-100 transition-colors" title="Print">🖨️</button>
            <button onClick={() => setShowNoteForm(!showNoteForm)} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-[#173B2D] hover:bg-stone-100 transition-colors" title="Add Note">📝</button>
          </div>
        </div>

        {/* Premium Title Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-4 border border-[#E8DCC3]">
          {/* Remedy Name — large serif centered */}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#173B2D] text-center mb-1 tracking-wide">
            {remedy.name}
          </h1>
          {/* Botanical / Common name — gray italic centered */}
          {remedy.common && (
            <p className="text-sm md:text-base text-stone-500 italic text-center mb-3">
              {remedy.common}
            </p>
          )}
          {/* Source Badge — dark green, gold text, wraps automatically */}
          <div className="flex justify-center mt-3">
            <span className="inline-block bg-[#173B2D] text-[#C8A24A] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-center max-w-full break-words leading-relaxed">
              {sourceTitle}
            </span>
          </div>
          {/* Organ badge if present */}
          {remedy.organ && remedy.organ !== '—' && (
            <div className="flex justify-center mt-2">
              <span className="text-[0.65rem] bg-[#F5EFE0] text-[#7C8F6E] px-2 py-1 rounded">
                {remedy.organ}
              </span>
            </div>
          )}
        </div>

        {/* Note Form */}
        {showNoteForm && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 border border-[#E8DCC3]">
            <h3 className="font-serif text-lg text-[#173B2D] mb-2">Add Note</h3>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Write your note..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleNoteSubmit} className="bg-[#173B2D] text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Save Note</button>
              <button onClick={() => setShowNoteForm(false)} className="bg-stone-200 text-stone-700 px-4 py-1.5 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Existing Notes */}
        {notes && notes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 border border-[#E8DCC3]">
            <h3 className="font-serif text-lg text-[#173B2D] mb-2">My Notes ({notes.length})</h3>
            <div className="space-y-2">
              {notes.map(n => (
                <div key={n.id} className="border-l-2 border-[#C8A24A] pl-3">
                  <p className="text-sm text-stone-700">{n.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#7C8F6E]">{new Date(n.ts).toLocaleString()}</span>
                    {onNoteDelete && (
                      <button onClick={() => onNoteDelete(n.id)} className="text-xs text-[#6E2A3A] hover:underline">Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Content Card — full reading area */}
        <article className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#E8DCC3]">
          {/* UNIFIED RENDERING — works for ALL authors */}
          {hasStructuredSections ? (
            <>
              {remedy.sections!.map((section, idx) => (
                <section key={idx} className="mb-6 last:mb-0">
                  {section.heading && (
                    <h3 className="font-serif text-lg font-bold text-[#8B0000] mt-5 mb-3 pb-1 border-b border-[#E8DCC3] tracking-wide">
                      {section.heading}
                    </h3>
                  )}
                  {section.paragraphs && section.paragraphs.map((para, pidx) => {
                    const labelMatch = para.match(/^([A-Z][a-z]+(?:\s+[a-z]+)*\s*:) (.*)$/s);
                    if (labelMatch) {
                      return (
                        <div key={pidx} className="mb-3">
                          <span className="text-sm font-bold text-[#1a1a1a]">{labelMatch[1]}</span>{' '}
                          <span className="text-sm text-[#2C2C2C] leading-[1.7]">{labelMatch[2]}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={pidx} className="text-sm text-[#2C2C2C] leading-[1.7] mb-3">
                        {renderTextWithRefs(para, `sec-${idx}-${pidx}`)}
                      </p>
                    );
                  })}
                </section>
              ))}
            </>
          ) : hasFullText ? (
            <div>
              {renderRemedyText(remedy.full!, 'main')}
            </div>
          ) : hasIndividualFields ? (
            <>
              {showKeynote && (
                <section className="mb-6 last:mb-0">
                  <h3 className="font-serif text-lg font-bold text-[#8B0000] mb-3 pb-1 border-b border-[#E8DCC3] tracking-wide">Keynote</h3>
                  <p className="text-[#2C2C2C] whitespace-pre-line leading-[1.7] text-sm md:text-[15px]">{remedy.keynote}</p>
                </section>
              )}
              {showConstitution && (
                <section className="mb-6 last:mb-0">
                  <h3 className="font-serif text-lg font-bold text-[#8B0000] mb-3 pb-1 border-b border-[#E8DCC3] tracking-wide">Constitution</h3>
                  <p className="text-[#2C2C2C] whitespace-pre-line leading-[1.7] text-sm md:text-[15px]">{remedy.constitution}</p>
                </section>
              )}
              {showModalities && (
                <section className="mb-6 last:mb-0">
                  <h3 className="font-serif text-lg font-bold text-[#8B0000] mb-3 pb-1 border-b border-[#E8DCC3] tracking-wide">Modalities</h3>
                  <p className="text-[#2C2C2C] whitespace-pre-line leading-[1.7] text-sm md:text-[15px]">{remedy.modalities}</p>
                </section>
              )}
              {showRelationships && (
                <section className="mb-6 last:mb-0">
                  <h3 className="font-serif text-lg font-bold text-[#8B0000] mb-3 pb-1 border-b border-[#E8DCC3] tracking-wide">Relationships</h3>
                  <p className="text-[#2C2C2C] whitespace-pre-line leading-[1.7] text-sm md:text-[15px]">{remedy.relationships}</p>
                </section>
              )}
              {showDose && (
                <section className="mb-6 last:mb-0">
                  <h3 className="font-serif text-lg font-bold text-[#8B0000] mb-3 pb-1 border-b border-[#E8DCC3] tracking-wide">Dose</h3>
                  <p className="text-[#2C2C2C] whitespace-pre-line leading-[1.7] text-sm md:text-[15px]">{remedy.dose}</p>
                </section>
              )}
            </>
          ) : (
            <p className="text-sm text-[#7C8F6E] italic text-center py-8">No detailed content available for this remedy.</p>
          )}
        </article>
      </main>
    </div>
  );
}
