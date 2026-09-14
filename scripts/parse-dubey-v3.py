#!/usr/bin/env python3
"""
Dubey v3 Parser — preserves sub-sections and paragraph spacing.

Issues fixed (v2 → v3):
1. GUIDING SYMPTOMS: numbered items were merged into one string with no
   line breaks. Now each numbered item is preserved as a separate paragraph.
2. PARTICULARS: sub-section headings like "Stomach", "Female genital Organs",
   "Chest:", "Relation:" were merged into paragraph text. Now detected as
   sub-section headings and stored with proper structure.
3. Frontend rendering: content now uses \n\n between paragraphs so the
   renderer can display proper spacing.

Output format:
{
  sections: [{
    title: "GUIDING SYMPTOMS",
    content: "1) ...\n\n2) ...\n\n3) ..."  ← paragraphs separated by \n\n
  }, {
    title: "PARTICULARS",
    subsections: [
      { heading: "Stomach", content: "Gastric symptoms..." },
      { heading: "Female genital Organs", content: "Uterine prolapsus..." }
    ],
    content: "Stomach\nGastric symptoms...\n\nFemale genital Organs\nUterine prolapsus..."
  }]
}

The `content` field keeps the legacy flat string for backward compat,
but `subsections` provides structured sub-section data for the renderer.
"""
import json
import os
import re
import glob

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)

# Main section headings (ALL CAPS in Dubey)
MAIN_SECTIONS = {
    'INTRODUCTION', 'CLINICAL', 'SPHERES OF ACTION', 'SPHERES OF ACTION & PATHOGENESIS',
    'GUIDING SYMPTOMS', 'PARTICULARS', 'RELATION', 'RELATIONSHIP',
    'COMPARE', 'ANTIDOTES', 'DOSE', 'MODALITIES', 'AGGRAVATION',
    'AMELIORATION', 'CLINICAL CONDITIONS', 'CAUSES & DISEASES',
}

# Sub-section heading patterns within PARTICULARS
# These appear on their own line, Title Case or Title Case with colon
SUBSECTION_PATTERNS = [
    re.compile(r'^(Stomach|Female genital Organs|Male genital Organs|Chest|Heart|Respiratory system|Cardiovascular system|Gastrointestinal Symptoms|Gastro-intestinal Symptoms|Urinary system|Genito-urinary system|Nervous system|Skin|Head|Eyes|Ears|Nose|Face|Mouth|Throat|Rectum|Abdomen|Back|Extremities|Upper limbs|Lower limbs|Sleep|Fever|Mind|Brain|Spinal cord|Liver|Spleen|Kidneys|Bladder|Prostate|Uterus|Ovaries|Testes|Lungs|Bronchi|Trachea|Larynx|Pharynx|Oesophagus|Intestines|Duodenum|Pancreas|Gall bladder|Spleen|Blood|Lymphatics|Glands|Bones|Joints|Muscles|Nerves|Teeth|Tongue|Salivary glands|Tonsils|Lymph nodes|Endocrine system|Immune system)\s*:?\s*$', re.IGNORECASE),
    re.compile(r'^(Relation\s*:|Compare\s*:|Antidote\s*:|Complementary\s*:|Inimical\s*:|Follows\s*:|Duration\s*:|Repetition\s*:|Dose\s*:|Potency\s*:)\s*$', re.IGNORECASE),
]


def is_subsection_heading(line):
    """Check if a line is a sub-section heading within PARTICULARS."""
    stripped = line.strip()
    if not stripped or len(stripped) > 60:
        return None
    for pat in SUBSECTION_PATTERNS:
        m = pat.match(stripped)
        if m:
            return m.group(1).strip().rstrip(':')
    # Also detect "Word:" pattern (e.g., "Chest:", "Relation:")
    if re.match(r'^[A-Z][a-z]+(?:\s+[a-z]+)*\s*:\s*$', stripped):
        # Must be short (1-4 words)
        words = stripped.rstrip(':').strip().split()
        if 1 <= len(words) <= 4:
            return stripped.rstrip(':').strip()
    return None


def parse_dubey_ocr_page(page_text):
    """Parse a single Dubey OCR page into structured sections."""
    lines = page_text.split('\n')

    sections = []
    current_section = None  # {'heading': '', 'paragraphs': [], 'subsections': []}
    current_subsection = None  # {'heading': '', 'paragraphs': []}
    current_para = []

    def flush_para():
        nonlocal current_para, current_subsection, current_section
        if current_para:
            text = ' '.join(current_para).strip()
            text = re.sub(r'\s+', ' ', text)
            if text:
                if current_subsection is not None:
                    current_subsection['paragraphs'].append(text)
                elif current_section is not None:
                    current_section['paragraphs'].append(text)
            current_para = []

    def flush_subsection():
        nonlocal current_subsection, current_section
        flush_para()
        if current_subsection and current_subsection['paragraphs']:
            current_section['subsections'].append(current_subsection)
        current_subsection = None

    for line in lines:
        ln = line.rstrip()
        stripped = ln.strip()

        # Skip empty lines (paragraph break)
        if not stripped:
            flush_para()
            continue

        # Check if main section heading (ALL CAPS)
        if stripped.upper() == stripped and stripped in MAIN_SECTIONS:
            flush_subsection()
            flush_para()
            current_section = {
                'heading': stripped,
                'paragraphs': [],
                'subsections': [],
            }
            sections.append(current_section)
            current_subsection = None
            continue

        # Check if sub-section heading (only within PARTICULARS or similar)
        if current_section and current_section['heading'] in ('PARTICULARS', 'GUIDING SYMPTOMS', 'CLINICAL CONDITIONS'):
            sub = is_subsection_heading(stripped)
            if sub:
                flush_subsection()
                flush_para()
                current_subsection = {'heading': sub, 'paragraphs': []}
                continue

        # Numbered symptom item (e.g., "1) ...", "2) ...") — start new paragraph
        if re.match(r'^\d+\)\s+', stripped):
            flush_para()
            current_para.append(stripped)
            continue

        # Regular text — accumulate
        current_para.append(stripped)

    flush_subsection()
    flush_para()
    return sections


def build_remedy(remedy_name, common_name, pages_text, source_pages):
    """Build a structured remedy record from multiple OCR pages."""
    all_sections = []
    seen_headings = set()

    for page_text in pages_text:
        page_sections = parse_dubey_ocr_page(page_text)
        for sec in page_sections:
            if sec['heading'] in seen_headings:
                # Merge into existing section
                for existing in all_sections:
                    if existing['heading'] == sec['heading']:
                        existing['paragraphs'].extend(sec['paragraphs'])
                        existing['subsections'].extend(sec['subsections'])
                        break
            else:
                all_sections.append(sec)
                seen_headings.add(sec['heading'])

    # Convert to unified format
    unified_sections = []
    for sec in all_sections:
        # Build content string with \n\n between paragraphs
        parts = []
        for p in sec['paragraphs']:
            parts.append(p)
        for sub in sec['subsections']:
            parts.append(sub['heading'])
            parts.extend(sub['paragraphs'])
        content = '\n\n'.join(parts).strip()
        content = re.sub(r'\n{3,}', '\n\n', content)

        # Also build subsections array for structured rendering
        subsections_data = []
        for sub in sec['subsections']:
            sub_content = '\n\n'.join(sub['paragraphs']).strip()
            sub_content = re.sub(r'\s+', ' ', sub_content)
            if sub_content:
                subsections_data.append({
                    'heading': sub['heading'],
                    'content': sub_content,
                })

        if content or subsections_data:
            unified_sections.append({
                'title': sec['heading'],
                'content': content,
                'subsections': subsections_data,
            })

    # Build full text
    full_parts = []
    if common_name:
        full_parts.append(common_name)
    for s in unified_sections:
        full_parts.append(f"{s['title']}: {s['content']}")
    full = '\n'.join(full_parts)

    # Build record
    slug = re.sub(r'[^a-z0-9]+', '-', remedy_name.lower()).strip('-')
    rec = {
        'id': f'dubey-mm-{slug}',
        'name': remedy_name,
        'common': common_name,
        'author': 'Dubey',
        'letter': remedy_name[0].upper() if remedy_name else '?',
        'chapter': "Dubey Text Book of Materia Medica",
        'organ': '',
        'modalities': '',
        'constitution': '',
        'relationships': '',
        'dose': '',
        'intro': '',
        'sections': unified_sections,
        'full': full,
        'keynote': '',
        'source_book': "S.K. Dubey Text Book of Materia Medica (7th Ed.)",
        'source_pages': source_pages,
    }

    # Extract dose/relationships from sections
    for s in unified_sections:
        t = s['title']
        if t in ('RELATION', 'RELATIONSHIP', 'COMPARE', 'ANTIDOTES'):
            if rec['relationships']:
                rec['relationships'] += '\n' + s['content']
            else:
                rec['relationships'] = s['content']
        elif t == 'DOSE':
            rec['dose'] = s['content']
        elif t in ('MODALITIES', 'AGGRAVATION', 'AMELIORATION'):
            if rec['modalities']:
                rec['modalities'] += '\n' + s['content']
            else:
                rec['modalities'] = s['content']

    return rec


def main():
    print("=" * 60)
    print("Dubey v3 Parser — preserves sub-sections + paragraph spacing")
    print("=" * 60)

    # Read all OCR pages
    pages_dir = '/home/z/my-project/scripts/fresh_dubey/text'
    page_files = sorted(glob.glob(f'{pages_dir}/page-*.txt'))
    print(f"\nFound {len(page_files)} OCR page files")

    # Read all pages into a list
    all_pages = []
    for pf in page_files:
        with open(pf) as f:
            all_pages.append(f.read())

    # Join all pages and find remedy boundaries
    # Dubey remedy names appear as ALL CAPS on their own line
    full_text = '\n'.join(all_pages)

    # Split into remedy chunks
    # Remedy name pattern: ALL CAPS, standalone line, 1-4 words
    REMEDY_START = re.compile(r'^(ABIES|ABROTANUM|ABSINTHIUM|ACETICUM|ACONITE|ACONITUM|ACTAEA|ADEPIS|ADONIS|AESCULUS|AETHUSA|AGARICUS|AGNUS|AILANTHUS|ALETRIS|ALLIUM|ALOE|ALUMINA|AMBRA|AMMONIUM|ANACARDIUM|ANTIMONIUM|APIS|APOCYNUM|ARGENTUM|ARNICA|ARSENICUM|ARUM|ASARUM|ASCLEPIAS|ASTERIAS|ATROPA|AURUM|BADIAGA|BAPTISIA|BARYTA|BELLADONNA|BELLIS|BENZOICUM|BERBERIS|BILE|BISMUTHUM|BORAX|BOVISTA|BROMIUM|BRYONIA|BUFO|CACAO|CADMIUM|CACTUS|CALADIUM|CALAREA|CALCAREA|CALENDULA|CAMPHORA|CANNABIS|CANTHARIS|CAPSICUM|CARBO|CASTOREUM|CAULOPHYLLUM|CAUSTICUM|CEDRON|CELADONIA|CHAMOMILLA|CHELIDONIUM|CHININUM|CHINA|CIMICIFUGA|CINA|CLEMATIS|COCCULUS|COCCUS|COFFEA|COLCHICUM|COLLINSONIA|COLOCYNTHIS|CONIUM|CORDIA|CROTALUS|CROTON|CUBEBA|CUPRUM|CYCLAMEN|DIGITALIS|DIOSCOREA|DOLICHOS|DROsera|DULCAMARA|ELAPS|EUPATORIUM|EUPHORBIA|EUPHRASIA|FERRUM|FLUORICUM|GELSEMIUM|GLECHOMA|GLONOINUM|GRAPHITES|GUACO|GYNO|HELONIAS|HEPAR|HYDRASTIS|HYOSCYAMUS|HYPERICUM|IGNATIA|IODUM|IPECAC|IRIS|JABORANDI|JALAPA|KALI|KREOSOTUM|LACHESIS|LAC|LAMIUM|LAPIS|LEDUM|LETHROIDES|LOBELIA|LYCOPODIUM|LYSIN|MAGNESIA|MANGANUM|MEDORRHINUM|MELILOTUS|MERCURIUS|MEZEREUM|MILLEFOLIUM|MONKSHOOD|MOSCHUS|MURIATICUM|NATRUM|NITRICUM|NUX|OLEANDER|OPIUM|ORTHO|OSMIUM|OXALIC|PARIS|PEDI|PETROLEUM|PHOSPHORIC|PHOSPHORUS|PHYTOLACCA|PILOCARPUS|PINEAL|PISCI|PLATINA|PLUMBUM|PODOPHYLLUM|POTHOS|PRUNUS|PSEUDO|PSORINUM|PULSATILLA|PYROGEN|RADIUM|RANUNCULUS|RAUWOLFIA|RHODODENDRON|RHUS|ROBINIA|RUTA|SABADILLA|SABINA|SACCHARUM|SAMBUCUS|SANGUINARIA|SANICULA|SARSAPARILLA|SARS|SECALE|SELENIUM|SEMPERVIVUM|SENNA|SEPIA|SILICEA|SILICON|SPIGELIA|SPONGIA|SQUILLA|STAPHYSAGRIA|STICTA|STRAMONIUM|STRYCHNOS|SULPHONAL|SULPHUR|SYMPHYTUM|TABACUM|TARAXACUM|TEREBINTHINA|TARENTULA|TEUCRIUM|THUJA|THYROID|TONG|TRILLIUM|TROMANTIDUM|TUBERCULINUM|UREN|UVA|VACCININUM|VALERIANA|VANADIUM|VERATRUM|VERBASCUM|VIBURNUM|VINCA|VIOLA|VISION|XANTHOXYLUM|X-RAY|ZINC|ZINGIBER|ZIZYPHUS)(\s+[A-Z]+)?\s*$', re.MULTILINE)

    # Simpler approach: find ALL CAPS lines that are 1-3 words
    remedy_starts = []
    for i, page_text in enumerate(all_pages):
        for line in page_text.split('\n'):
            stripped = line.strip()
            if (stripped and stripped == stripped.upper() and
                2 <= len(stripped) <= 40 and
                not any(c.isdigit() for c in stripped) and
                stripped not in MAIN_SECTIONS and
                not stripped.startswith('TEXT') and
                stripped not in ('MATERIA', 'MEDICA', 'CONTENTS', 'INDEX', 'PREFACE',
                                'CHAPTER', 'BOOK', 'INTRODUCTION')):
                words = stripped.split()
                if 1 <= len(words) <= 3 and all(w.isalpha() for w in words):
                    remedy_starts.append((i, stripped))

    print(f"\nFound {len(remedy_starts)} potential remedy name lines")

    # Build remedies by scanning pages
    remedies = []
    seen_remedies = set()

    # Use the existing merged data for remedy names + source_pages, but re-parse
    # the content from OCR pages
    with open('/home/z/my-project/scripts/fresh_dubey/merged/dubey_remedies_clean.json') as f:
        existing = json.load(f)

    print(f"\nExisting remedies: {len(existing)}")

    for ex in existing:
        remedy_name = ex['name']
        if remedy_name in seen_remedies:
            continue
        seen_remedies.add(remedy_name)

        # Get source pages
        source_pages = ex.get('source_pages', '')
        common_name = ex.get('common', '')

        # Find the OCR pages for this remedy
        # source_pages format: "12-12" or "12-13"
        page_nums = []
        if source_pages:
            parts = source_pages.split('-')
            try:
                start = int(parts[0].strip())
                end = int(parts[1].strip()) if len(parts) > 1 else start
                page_nums = list(range(start, end + 1))
            except ValueError:
                pass

        if not page_nums:
            # Fallback: find pages by remedy name
            for i, page_text in enumerate(all_pages):
                if remedy_name.upper() in page_text.upper():
                    page_nums = [i + 1]  # 1-indexed
                    break

        if not page_nums:
            continue

        # Read the OCR pages for this remedy
        pages_text = []
        for pn in page_nums:
            page_file = f'{pages_dir}/page-{pn:04d}.txt'
            if os.path.exists(page_file):
                with open(page_file) as f:
                    pages_text.append(f.read())

        if not pages_text:
            continue

        # Build the remedy
        rec = build_remedy(remedy_name, common_name, pages_text, source_pages)
        if rec['sections']:
            remedies.append(rec)

    print(f"\nParsed {len(remedies)} Dubey remedies with structured sections")

    # Show sample
    if remedies:
        for r in remedies:
            if 'abies can' in r['name'].lower():
                print(f"\n=== REGRESSION: {r['name']} ===")
                print(f"  id: {r['id']}")
                print(f"  sections ({len(r['sections'])}):")
                for s in r['sections']:
                    print(f"    [{s['title']}]")
                    if s.get('subsections'):
                        print(f"      subsections:")
                        for sub in s['subsections']:
                            print(f"        - {sub['heading']}: {sub['content'][:60]}...")
                    print(f"      content (first 200): {s['content'][:200]}...")
                break

    with open(f'{OUT_DIR}/dubey-v3.json', 'w') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_DIR}/dubey-v3.json ({len(remedies)} remedies)")


if __name__ == '__main__':
    main()
