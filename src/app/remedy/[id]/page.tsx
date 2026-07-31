'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type RemedySection = {
  heading?: string;
  paragraphs?: string[];
};

type Remedy = {
  id: string; name: string; common?: string; author: string;
  chapter?: string; organ?: string; modalities?: string;
  constitution?: string; relationships?: string; dose?: string;
  keynote?: string; full?: string; letter?: string;
  sections?: RemedySection[];
};

export default function RemedyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
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
        <Link href="/materia-medica" className="bg-[#C8A24A] text-[#173B2D] px-4 py-2 rounded">← Back to Materia Medica</Link>
      </div>
      <Footer />
    </div>
  );
  if (!remedy) return null;

  // Helper: check if a field has meaningful content
  function hasContent(val?: string): boolean {
    if (!val) return false;
    const v = val.trim().toLowerCase();
    return v.length > 2 && v !== '—' && v !== '-' && v !== 'see full text.' && v !== 'see full text' && v !== 'n/a' && v !== ' ';
  }

  // Helper: check if field B is a duplicate of field A (first 200 chars match)
  function isDuplicateOf(a?: string, b?: string): boolean {
    if (!a || !b) return false;
    const aTrim = a.trim().substring(0, 200).toLowerCase();
    const bTrim = b.trim().substring(0, 200).toLowerCase();
    return aTrim === bTrim;
  }

  // Helper: render Dubey-style text with ALL CAPS section headers as proper subheadings
  // This parses the OCR text and renders INTRODUCTION, CLINICAL, SPHERES OF ACTION, etc.
  // as styled <h3> subheadings instead of plain text.
  function renderStructuredText(text: string): React.ReactNode {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let keyCounter = 0;

    // Known section headers from S.K. Dubey's Materia Medica
    const sectionHeaders = new Set([
      'INTRODUCTION', 'CLINICAL', 'CLINICAL USE', 'PARTICULARS', 'PARTICULAR',
      'PERTICULARS', 'GUIDING SYMPTOMS', 'SPHERES OF ACTION', 'SPHERE OF ACTION',
      'SPHERES OF ACTION & PATHOGENESIS', 'SPHERE OF ACTION & PATHOGENESIS',
      'SPHERES OF ACTION AND PATHOGENESIS', 'SPHERE OF ACTION AND PATHOGENESIS',
      'PATHOGENESIS', 'CONSTITUTION', 'RELATIONS', 'RELATION', 'RELATIONSHIP',
      'REMEDY RELATIONSHIP', 'CHARACTERISTIC INDICATIONS', 'PHYSIOLOGICAL ACTION',
      'PREPARATION AND DOSE', 'BIOCHEMIC SYSTEM', 'GENERAL MODALITY', 'MODALITIES',
      'AGGRAVATION', 'AMELIORATION', 'CAUSATION', 'DRUG ACTION', 'DRUG PICTURE',
      'ORGAN AFFINITY', 'CHARACTERISTIC', 'CHARACTERISTICS', 'IMPORTANT SYMPTOMS',
      'SUMMARY', 'BIOCHEMIC', 'GLOSSARY', 'COMPLEMENTARY', 'INIMICAL', 'ANTIDOTE',
      'ANTIDOTES', 'COLLATERAL', 'COMPARE', 'COMPARISON', 'DOSE', 'POTENCY',
      'MIASMATIC', 'MIASM', 'THERAPEUTIC', 'THERAPEUTICS', 'KEYNOTE', 'KEYNOTES',
      'PROVING', 'OBSERVATION', 'OBSERVATIONS',
      'THE TWELVE TISSUE SALTS', 'WINE RELATION',
    ]);

    function flushParagraph() {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join('\n').trim();
        if (paraText) {
          elements.push(
            <p key={`p-${keyCounter++}`} className="text-stone-700 whitespace-pre-line leading-relaxed mb-3 text-sm">
              {paraText}
            </p>
          );
        }
        currentParagraph = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        flushParagraph();
        continue;
      }
      // Check if line is an ALL CAPS section header
      const isAllCaps = line.match(/^[A-Z][A-Z\s\-\'/()&.]+$/) &&
                        line.length >= 3 &&
                        line.length <= 60 &&
                        !line.endsWith('.') &&
                        line.split(/\s+/).length <= 6;
      if (isAllCaps && (sectionHeaders.has(line) || line.split(/\s+/).length <= 4)) {
        flushParagraph();
        elements.push(
          <h3 key={`h-${keyCounter++}`} className="font-serif text-base text-[#173B2D] mt-4 mb-2 pb-1 border-b border-[#E8DCC3] font-semibold tracking-wide">
            {line}
          </h3>
        );
      } else {
        currentParagraph.push(line);
      }
    }
    flushParagraph();
    return <div>{elements}</div>;
  }

  // Helper: render Kent-style text with section headings + clickable remedy references
  // Kent's text has headings like "Introduction", "Mind", "Head", "Chest", etc.
  // Remedy names mentioned in text (Bryonia, Pulsatilla, etc.) are rendered as
  // blue italic clickable links.
  function renderKentText(text: string): React.ReactNode {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let keyCounter = 0;

    // Known Kent section headings
    const kentHeadings = new Set([
      'Introduction', 'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face',
      'Mouth', 'Throat', 'Stomach', 'Abdomen', 'Rectum', 'Urinary Organs',
      'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back',
      'Extremities', 'Sleep', 'Fever', 'Skin', 'Generalities',
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
      'Suppression', 'Clinical', 'Keynotes', 'Compare', 'Relationships',
      'Modalities', 'Summary', 'Dose', 'Caution',
    ]);

    // Helper: render text with clickable remedy references
    // Remedy names are capitalized words (Bryonia, Pulsatilla, etc.) — render as blue italic
    function renderTextWithRefs(text: string): React.ReactNode {
      // Split by known remedy name patterns (capitalized words 4+ chars)
      // This is a simplified approach — matches common remedy names
      const remedyPattern = /\b([A-Z][a-z]{3,}(?:\s+[a-z]+)?)\b/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      let partKey = 0;

      while ((match = remedyPattern.exec(text)) !== null) {
        const word = match[1];
        // Skip common non-remedy words
        const nonRemedies = new Set([
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
          'Dose', 'Potency', 'Symptoms', 'Mind', 'Head', 'Eyes', 'Ears',
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
          'See', 'See.', 'Like', 'Like.', 'Also.', 'Sometimes',
          'Many', 'Much', 'Little', 'Small', 'Large', 'Great', 'Old', 'Young',
          'New', 'Good', 'Bad', 'Better', 'Worse', 'Best', 'Worst',
          'Morning', 'Evening', 'Night', 'Afternoon', 'Noon', 'Midnight',
          'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
          'Spring', 'Summer', 'Autumn', 'Winter', 'Fall',
          'North', 'South', 'East', 'West',
          'Left', 'Right', 'Upper', 'Lower', 'Inner', 'Outer',
          'Front', 'Back', 'Side', 'Top', 'Bottom',
          'Always', 'Never', 'Sometimes', 'Often', 'Rarely', 'Usually',
          'Generally', 'Particularly', 'Especially', 'Special',
          'Long', 'Short', 'High', 'Low', 'Deep', 'Shallow',
          'Hot', 'Cold', 'Warm', 'Cool', 'Wet', 'Dry',
          'Hard', 'Soft', 'Smooth', 'Rough', 'Sharp', 'Dull',
          'Light', 'Dark', 'Bright', 'Dim', 'Pale', 'Red', 'Blue',
          'Black', 'White', 'Green', 'Yellow', 'Brown',
        ]);

        if (nonRemedies.has(word)) {
          continue;
        }

        // Add text before this match
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }

        // Render as clickable blue italic remedy reference
        // Try to find the remedy ID — use the word as a search term
        const searchUrl = `/materia-medica?q=${encodeURIComponent(word)}`;
        parts.push(
          <Link
            key={`ref-${partKey++}`}
            href={searchUrl}
            className="text-blue-600 italic hover:underline hover:text-blue-800 cursor-pointer"
          >
            {word}
          </Link>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    }

    function flushParagraph() {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          elements.push(
            <p key={`p-${keyCounter++}`} className="text-black leading-relaxed mb-4 text-sm md:text-base">
              {renderTextWithRefs(paraText)}
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

      // Check if this line is a section heading
      if (kentHeadings.has(trimmed)) {
        flushParagraph();
        elements.push(
          <h3 key={`h-${keyCounter++}`} className="font-serif text-lg font-bold text-[#6E2A3A] mt-5 mb-2 pb-1 border-b border-[#E8DCC3]">
            {trimmed}
          </h3>
        );
      } else {
        currentParagraph.push(trimmed);
      }
    }
    flushParagraph();

    return <div>{elements}</div>;
  }

  // Helper: render Boericke/Phatak-style text with dark red bold headings + clickable refs
  // Same as Kent rendering but with red headings instead of maroon
  function renderBoerickePhatakText(text: string): React.ReactNode {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let keyCounter = 0;

    // Known section headings for Boericke/Phatak
    const sectionHeadings = new Set([
      'Introduction', 'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face',
      'Mouth', 'Throat', 'Stomach', 'Abdomen', 'Rectum', 'Urinary Organs',
      'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back',
      'Extremities', 'Sleep', 'Fever', 'Skin', 'Generalities',
      'Modalities', 'Relationships', 'Compare', 'Dose', 'Clinical',
      'Keynotes', 'Summary', 'Caution', 'Marasmus', 'Croup',
      'Suppression', 'Metastasis',
      // Phatak-style headings (ALL CAPS in source)
      'GENERALITIES', 'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE',
      'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'URINARY',
      'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART', 'BACK',
      'EXTREMITIES', 'SLEEP', 'FEVER', 'SKIN', 'MODALITIES',
      'RELATIONSHIPS', 'DOSE', 'CLINICAL', 'KEYNOTES',
    ]);

    // Helper: render text with clickable remedy references (blue italic)
    function renderTextWithRefs(text: string): React.ReactNode {
      const remedyPattern = /\b([A-Z][a-z]{3,}(?:\s+[a-z]+)?)\b/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      let partKey = 0;

      const nonRemedies = new Set([
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
        'Hahnemann', 'Kent', 'Boericke', 'Allen', 'Phatak', 'Dubey',
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

      while ((match = remedyPattern.exec(text)) !== null) {
        const word = match[1];
        if (nonRemedies.has(word)) continue;

        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }

        const searchUrl = `/materia-medica?q=${encodeURIComponent(word)}`;
        parts.push(
          <Link
            key={`ref-${partKey++}`}
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

      return parts.length > 0 ? parts : text;
    }

    function flushParagraph() {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          elements.push(
            <p key={`p-${keyCounter++}`} className="text-black leading-relaxed mb-4 text-sm md:text-base">
              {renderTextWithRefs(paraText)}
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

      // Check if this line is a section heading (case-insensitive match)
      if (sectionHeadings.has(trimmed)) {
        flushParagraph();
        elements.push(
          <h3 key={`h-${keyCounter++}`} className="text-lg font-bold text-red-700 mt-5 mb-2 pb-1 border-b border-[#E8DCC3] tracking-wide">
            {trimmed}
          </h3>
        );
      } else {
        currentParagraph.push(trimmed);
      }
    }
    flushParagraph();

    return <div>{elements}</div>;
  }

  // Determine which sections to show — compare at render time, DON'T delete data
  // Keynote is always shown if it has content
  const showKeynote = hasContent(remedy.keynote);

  // Constitution: show only if it has content AND is NOT a duplicate of keynote
  const showConstitution = hasContent(remedy.constitution) && !isDuplicateOf(remedy.keynote, remedy.constitution);

  // Full: show only if it has content AND is NOT a duplicate of keynote
  // (if full starts with the same text as keynote, it's OK — full is a longer version)
  // But if full == keynote exactly (same length), don't show full
  const showFull = hasContent(remedy.full) && !isDuplicateOf(remedy.keynote, remedy.full);

  // Modalities: show only if it has real content (not placeholder)
  const showModalities = hasContent(remedy.modalities);

  // Relationships: show only if it has real content (not "—")
  const showRelationships = hasContent(remedy.relationships) && remedy.relationships.trim() !== '—';

  // Dose: show if it has content
  const showDose = hasContent(remedy.dose);

  const isFav = rf.isFavorite(remedy.id, 'remedy');
  const isBm = rf.isBookmarked(remedy.id, 'remedy');
  const remedyNotes = rf.notes.filter(n => n.refId === remedy.id);

  function copyToClipboard() {
    const text = `${remedy!.name}\n${remedy!.common || ''}\n\nKeynote:\n${remedy!.keynote || ''}\n\nFull:\n${remedy!.full || ''}`;
    navigator.clipboard.writeText(text);
    alert('Remedy copied to clipboard');
  }

  function addNote() {
    if (!noteText.trim()) return;
    rf.addNote({ type: 'remedy', refId: remedy!.id, refName: remedy!.name, text: noteText });
    setNoteText('');
    setShowNoteForm(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/materia-medica" className="text-sm bg-[#173B2D] text-white px-4 py-2 rounded hover:bg-[#2a5443]">← Back</Link>
          <div className="flex gap-2">
            <button onClick={() => rf.toggleFavorite({ id: remedy.id, type: 'remedy', name: remedy.name })} className={`text-xl ${isFav ? 'text-[#C8A24A]' : 'text-stone-400 hover:text-[#C8A24A]'}`} title="Favorite">★</button>
            <button onClick={() => rf.toggleBookmark({ id: remedy.id, type: 'remedy', name: remedy.name })} className={`text-xl ${isBm ? 'text-[#173B2D]' : 'text-stone-400 hover:text-[#173B2D]'}`} title="Bookmark">🔖</button>
            <button onClick={copyToClipboard} className="text-xl text-stone-400 hover:text-[#173B2D]" title="Copy">📋</button>
            <button onClick={() => window.print()} className="text-xl text-stone-400 hover:text-[#173B2D]" title="Print">🖨️</button>
            <button onClick={() => setShowNoteForm(!showNoteForm)} className="text-xl text-stone-400 hover:text-[#173B2D]" title="Add Note">📝</button>
          </div>
        </div>

        {/* Title */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h1 className={`font-serif text-3xl font-bold ${remedy.author === 'Kent' || remedy.author === 'Boericke' || remedy.author === 'Phatak' ? 'text-[#173B2D] text-center uppercase tracking-wide' : 'text-black'}`}>{remedy.name}</h1>
          {remedy.common && <p className={`text-sm italic mt-1 text-center ${remedy.author === 'Boericke' ? 'text-orange-600' : 'text-[#7C8F6E]'}`}>{remedy.common}</p>}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {remedy.author && <span className="text-xs bg-[#173B2D] text-[#C8A24A] px-2 py-1 rounded font-semibold">{remedy.author}</span>}
            {remedy.chapter && <span className="text-xs bg-[#C8A24A]/20 text-[#a8862f] px-2 py-1 rounded font-semibold">{remedy.chapter}</span>}
            {remedy.organ && <span className="text-xs bg-[#F5EFE0] text-[#173B2D] px-2 py-1 rounded">{remedy.organ}</span>}
          </div>
        </div>

        {/* Note form */}
        {showNoteForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-serif text-lg text-[#173B2D] mb-2">Add Note</h3>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write your note..." rows={3} className="w-full px-3 py-2 border-2 border-[#E8DCC3] rounded text-sm focus:outline-none focus:border-[#173B2D]" />
            <div className="flex gap-2 mt-2">
              <button onClick={addNote} className="bg-[#173B2D] text-white px-4 py-1.5 rounded text-sm font-semibold">Save Note</button>
              <button onClick={() => setShowNoteForm(false)} className="bg-stone-300 text-stone-700 px-4 py-1.5 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Existing notes */}
        {remedyNotes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-serif text-lg text-[#173B2D] mb-2">My Notes ({remedyNotes.length})</h3>
            <div className="space-y-2">
              {remedyNotes.map(n => (
                <div key={n.id} className="border-l-2 border-[#C8A24A] pl-3">
                  <p className="text-sm text-stone-700">{n.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#7C8F6E]">{new Date(n.ts).toLocaleString()}</span>
                    <button onClick={() => rf.removeNote(n.id)} className="text-xs text-[#6E2A3A] hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content sections — show only unique content per section, hide duplicates at render time */}
        <article className="bg-white rounded-lg shadow p-6">
          {/* For Kent remedies: render with section headings (maroon bold) +
              clickable remedy references (blue italic) */}
          {remedy.author === 'Kent' && showFull ? (
            <div>
              {renderKentText(remedy.full)}
            </div>
          ) : (remedy.author === 'Boericke' || remedy.author === 'Phatak') && showFull ? (
            <div>
              {renderBoerickePhatakText(remedy.full)}
            </div>
          ) : (remedy.author === 'Dubey' || remedy.author === 'Phatak' || remedy.author === 'Allen') && remedy.sections && remedy.sections.length > 0 ? (
            <>
              {remedy.sections.map((section, idx) => (
                <section key={idx} className="mb-6 last:mb-0">
                  {section.heading && (
                    <h3 className="text-lg font-bold text-red-700 mt-5 mb-2 tracking-wide">
                      {section.heading}
                    </h3>
                  )}
                  {section.paragraphs && section.paragraphs.map((para, pidx) => {
                    // Detect nested sub-labels: "Label :" or "Label:" at start of paragraph
                    const labelMatch = para.match(/^([A-Z][a-z]+(?:\s+[a-z]+)*\s*:) (.*)$/s);
                    if (labelMatch) {
                      return (
                        <div key={pidx} className="mb-2">
                          <span className="text-sm font-bold text-black">{labelMatch[1]}</span>{' '}
                          <span className="text-sm text-black leading-relaxed">{labelMatch[2]}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={pidx} className="text-sm text-black leading-relaxed mb-2">
                        {para}
                      </p>
                    );
                  })}
                </section>
              ))}
            </>
          ) : (
            <>
              {showKeynote && (
                <section className="mb-6 last:mb-0">
                  <h2 className="font-serif text-xl text-[#173B2D] mb-2 pb-1 border-b border-[#E8DCC3]">Keynote</h2>
                  <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.keynote}</p>
                </section>
              )}

              {showConstitution && (
                <section className="mb-6 last:mb-0">
                  <h2 className="font-serif text-xl text-[#173B2D] mb-2 pb-1 border-b border-[#E8DCC3]">Constitution</h2>
                  <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.constitution}</p>
                </section>
              )}

              {showFull && (
                <section className="mb-6 last:mb-0">
                  <h2 className="font-serif text-xl text-[#173B2D] mb-2 pb-1 border-b border-[#E8DCC3]">Full Description</h2>
                  <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.full}</p>
                </section>
              )}

              {showModalities && (
                <section className="mb-6 last:mb-0">
                  <h2 className="font-serif text-xl text-[#173B2D] mb-2 pb-1 border-b border-[#E8DCC3]">Modalities</h2>
                  <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.modalities}</p>
                </section>
              )}

              {showRelationships && (
                <section className="mb-6 last:mb-0">
                  <h2 className="font-serif text-xl text-[#173B2D] mb-2 pb-1 border-b border-[#E8DCC3]">Relationships</h2>
                  <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.relationships}</p>
                </section>
              )}

              {showDose && (
                <section className="mb-6 last:mb-0">
                  <h2 className="font-serif text-xl text-[#173B2D] mb-2 pb-1 border-b border-[#E8DCC3]">Dose</h2>
                  <p className="text-stone-700 whitespace-pre-line leading-relaxed">{remedy.dose}</p>
                </section>
              )}

              {/* If no sections have content */}
              {!showKeynote && !showConstitution && !showFull && !showModalities && !showRelationships && !showDose && (
                <p className="text-sm text-[#7C8F6E] italic text-center py-8">No detailed content available for this remedy.</p>
              )}
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
