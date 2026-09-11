#!/usr/bin/env python3
"""
Farrington v2 Parser — fixed boundary detection.

Farrington's structure:
- "LECTURE XX." marker (Roman numeral)
- Lecture title (ALL CAPS or Title Case, centered)
- Narrative prose (NO sections, NO bullets)
- Remedy names appear as Title Case, centered with ~27 spaces indent
  (e.g., "                           Oleander Nerium.")
- Some lectures cover ONE remedy, others cover MULTIPLE remedies

Strategy:
- Detect remedy names by centered Title Case pattern (>=20 spaces indent)
- Each remedy = narrative prose until next remedy name or lecture end
- NO sections (Farrington doesn't use them) — store as `intro` paragraph
- Filter out page headers, footers, watermarks
"""
import json
import os
import re

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)


def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f'farrington-{slug}'


# Lines to skip (page headers/footers/watermarks)
SKIP_PATTERNS = [
    re.compile(r'^\s*\d+\s*$'),                    # page numbers
    re.compile(r'^\s*A CLINICAL', re.IGNORECASE),  # running header
    re.compile(r'^\s*A CUN', re.IGNORECASE),       # OCR variant
    re.compile(r'^\s*A CIvIN', re.IGNORECASE),     # OCR variant
    re.compile(r'^\s*A ClylN', re.IGNORECASE),     # OCR variant
    re.compile(r'^\s*THE VEGETABLE', re.IGNORECASE),
    re.compile(r'^\s*THE ANIMAL', re.IGNORECASE),
    re.compile(r'^\s*THE MINERAL', re.IGNORECASE),
    re.compile(r'^\s*BOERICKE', re.IGNORECASE),
    re.compile(r'^\s*PHILADELPHIA', re.IGNORECASE),
    re.compile(r'^\s*Copyright', re.IGNORECASE),
    re.compile(r'^\s*LIBRARY', re.IGNORECASE),
    re.compile(r'^\s*CLASS\s', re.IGNORECASE),
    re.compile(r'^\s*COPY', re.IGNORECASE),
    re.compile(r'^\s*PREFACE', re.IGNORECASE),
    re.compile(r'^\s*CONTENTS', re.IGNORECASE),
    re.compile(r'^\s*LECTURE\s+[IVXLC]', re.IGNORECASE),  # lecture markers
]


def is_skip_line(line):
    for pat in SKIP_PATTERNS:
        if pat.match(line):
            return True
    return False


def parse_farrington(text):
    """Parse Farrington — narrative lecture format."""
    lines = text.split('\n')

    # Remedy names: Title Case, centered with >=20 spaces indent, may end with period
    # Examples:
    #   "                           Oleander Nerium."
    #   "                           Actea Racemosa."
    #   "                           BAPTISIA TINCTORIA."  (some are ALL CAPS)
    REMEDY_TITLE = re.compile(r'^\s{20,}([A-Z][A-Za-z]+(?:\s+[A-Za-z]+)*)\.?\s*$')

    remedies = []
    current_name = None
    current_paragraphs = []
    started = False

    def save_current():
        nonlocal current_name, current_paragraphs
        if current_name:
            # Clean and join paragraphs
            intro_parts = []
            for p in current_paragraphs:
                p = p.strip()
                if p:
                    # Join hyphenated words (OCR line-break artifact)
                    p = re.sub(r'-\s+', '', p)
                    p = re.sub(r'\s+', ' ', p)
                    intro_parts.append(p)
            intro = '\n\n'.join(intro_parts).strip()
            if not intro:
                # No content — skip this entry
                current_name = None
                current_paragraphs = []
                return
            # Build full (same as intro for Farrington — no sections)
            full = intro
            rec = {
                'id': make_id(current_name),
                'name': current_name,
                'common': '',
                'author': 'Farrington',
                'letter': current_name[0].upper() if current_name else '?',
                'chapter': 'Clinical Materia Medica',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'intro': intro,
                'sections': [],  # Farrington has no sections — narrative only
                'full': full,
                'keynote': '',
                'source_book': 'Clinical Materia Medica — E.A. Farrington',
            }
            remedies.append(rec)
        current_name = None
        current_paragraphs = []

    # Track current paragraph (accumulate consecutive non-blank lines)
    current_para = []

    # Front matter skip — only start after we see the first real remedy
    # Real remedies appear after the "CONTENTS" section, typically starting
    # around line 500+ with centered Title Case names
    started = False

    def flush_para():
        nonlocal current_para
        if current_para:
            current_paragraphs.append(' '.join(current_para))
            current_para = []

    for i, line in enumerate(lines):
        if is_skip_line(line):
            continue

        # Check if this is a remedy title
        m = REMEDY_TITLE.match(line)
        if m:
            title = m.group(1).strip()
            # Filter false positives
            words = title.split()
            if len(words) > 4:
                continue
            # Skip if it's actually a section/lecture title
            title_lower = title.lower()
            # Skip common false positives (section/topic names, not remedies)
            FALSE_POSITIVES = {
                'introductory', 'animal kingdom', 'vegetable kingdom',
                'mineral kingdom', 'materia medica', 'contents',
                'preface', 'index', 'bibliography', 'being', 'page',
                'by the eate', 'reported phonographicaely by',
                'with a memorial sketch of the author, by',
                'fourth edition, revised and enlarged by',
                'aug. korndcerfer, m. d.', 'clarence bartlett, m. d.',
                'e. a. farrington, m. d.', 'harvey farrington, m. d.',
                'mrs. exiz. a. farrington', 'library of congress',
                'philadelphia:', 'boericke & tafel',
                'the ophidia', 'organs', 'lymph and its vessels',
                'glands, etc.', 'mammalia', 'vertebrata',
                'fishes', 'reptilia', 'aves', 'insecta',
                'mollusca', 'crustacea', 'arachnidaa',
                'ranunculaceae', 'papaveraceae', 'cruciferae',
                'caryophyllaceae', 'leguminosae', 'rosaceae',
                'granineae', 'liliaceae', 'compositae',
                'solanaceae', 'convolvulaceae', 'verbenaceae',
                'labiatae', 'scrophulariaceae', 'gentianaceae',
                'apocynaceae', 'asclepiadaceae', 'rubiaceae',
                'caprifoliaceae', 'valerianaceae', 'curcurbitaceae',
                'euphorbiaceae', 'urticaceae', 'polygonaceae',
                'myrtaceae', 'rosaceae', 'ranunculaceae',
                'magnoliaceae', 'menispermaceae', 'berberidaceae',
                'nymphaceae', 'papaveraceae', 'fumariaceae',
                'cruciferae', 'capparidaceae', 'caryophyllaceae',
                'portulacaceae', 'malvaceae', 'tiliaceae',
                'linaceae', 'geraniaceae', 'rutaceae',
                'zanthoxylaceae', 'simarubaceae', 'burseraceae',
                'meliaceae', 'polygalaceae', 'euphorbiaceae',
                'anacardiaceae', 'leguminosae', 'rosaceae',
                'saxifragaceae', 'droseraceae', 'crassulaceae',
                'hamamelidaceae', 'myrtaceae', 'onagraceae',
                'araliaceae', 'umbelliferae', 'cornaceae',
                'ericaceae', 'primulaceae', 'plumbaginaceae',
                'sapotaceae', 'ebenaceae', 'oleaceae',
                'apocynaceae', 'asclepiadaceae', 'loganiaceae',
                'gentianaceae', 'boraginaceae', 'convolvulaceae',
                'solanaceae', 'scrophulariaceae', 'pedaliaceae',
                'verbenaceae', 'labiatae', 'lentibulariaceae',
                'plantaginaceae', 'nyctaginaceae', 'amarantaceae',
                'chenopodiaceae', 'phytolaccaceae', 'aizoaceae',
                'portulacaceae', 'caryophyllaceae', 'illiciaceae',
                'schizandraceae', 'menispermaceae',
                'glands', 'blood', 'muscles', 'skin', 'nerves',
                'tissues', 'mucous membranes', 'serous membranes',
                'glandular system', 'nervous system', 'circulatory system',
                'digestive system', 'respiratory system', 'reproductive system',
                'urinary system', 'skeletal system', 'lymphatic system',
            }
            if title_lower in FALSE_POSITIVES:
                continue
            # Skip if starts with common English words (not remedy names)
            first_word = words[0].lower()
            if first_word in {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on',
                              'with', 'for', 'to', 'from', 'by', 'as', 'at',
                              'its', 'his', 'her', 'their', 'this', 'that',
                              'these', 'those', 'some', 'all', 'any', 'no',
                              'when', 'where', 'how', 'why', 'what', 'which',
                              'during', 'after', 'before', 'between', 'among',
                              'through', 'under', 'over', 'above', 'below',
                              'chapter', 'section', 'part', 'lecture',
                              'blood', 'serous', 'synovial', 'mucous',
                              'glandular', 'nervous', 'circulatory',
                              'digestive', 'respiratory', 'reproductive',
                              'urinary', 'skeletal', 'lymphatic',
                              'connective', 'muscular', 'osseous',
                              'organs', 'tissues', 'membranes',
                              'analysis', 'comparison', 'comparisons',
                              'relation', 'relations', 'relationship',
                              'antidotes', 'complementary', 'inimical',
                              'duration', 'dose', 'repetition',
                              'clinical', 'pharmacy', 'source', 'habitat',
                              'preparation', 'constitution', 'miasms',
                              'mind', 'head', 'eyes', 'ears', 'nose',
                              'face', 'mouth', 'throat', 'stomach',
                              'abdomen', 'rectum', 'stool', 'urinary',
                              'male', 'female', 'respiratory', 'chest',
                              'heart', 'back', 'extremities', 'skin',
                              'sleep', 'fever', 'modalities',
                              'children', 'pregnancy', 'teeth', 'neck',
                              'liver', 'spleen', 'kidneys', 'bladder',
                              'prostate', 'trachea', 'larynx', 'bronchi',
                              'lungs', 'pleura', 'pericardium',
                              'arteries', 'veins', 'capillaries',
                              'bones', 'joints', 'glands'}:
                continue
            # Skip if contains "and" or "or" (likely a section/topic, not remedy)
            title_lower = title.lower()
            if ' and ' in title_lower or ' or ' in title_lower or ' with ' in title_lower:
                continue
            # Skip if ends with plural noun (likely a topic)
            if title.endswith('s') and len(title) > 5 and not title.endswith('us'):
                # Could be "Lachesis" (ends with 'is' not 's'+'us')
                # but "Membranes", "Glands", etc. should be filtered
                if any(title.endswith(x) for x in ['es', 'as', 'is', 'us']):
                    pass  # Could be remedy (Lachesis, Rhus, etc.)
                else:
                    continue
            # Must contain at least 4 alphabetic chars total
            alpha_chars = sum(1 for c in title if c.isalpha())
            if alpha_chars < 4:
                continue
            # Skip lines that look like TOC entries (have dots and numbers)
            if '...' in line or re.search(r'\.{3,}\s*\d+', line):
                continue

            # Start once we see a real remedy (skip front matter)
            if not started:
                # First remedy must be after line 500 (past TOC)
                if i < 500:
                    continue
                started = True

            flush_para()
            save_current()
            # Convert to Title Case (handle ALL CAPS variant)
            if title.isupper():
                current_name = ' '.join(w.capitalize() for w in title.split())
            else:
                current_name = title
            # Clean up "(continued)" suffix
            current_name = re.sub(r'\s*\(continued\)\.?', '', current_name, flags=re.IGNORECASE).strip()
            continue

        if not started or not current_name:
            continue

        ln = line.rstrip()
        if not ln.strip():
            # Blank line — paragraph break
            flush_para()
            continue

        # Add to current paragraph
        current_para.append(ln.strip())

    flush_para()
    save_current()
    return remedies


def main():
    print("=" * 60)
    print("Farrington v2 Parser — narrative lecture format")
    print("=" * 60)

    with open('/tmp/farrington.txt') as f:
        text = f.read()

    remedies = parse_farrington(text)
    print(f"\nParsed {len(remedies)} Farrington remedies")

    if remedies:
        print(f"\nFirst 5 remedies:")
        for r in remedies[:5]:
            print(f"  - {r['name']} | intro_len: {len(r['intro'])}")

        # Sample — show full intro for first remedy
        print(f"\n=== Sample: {remedies[0]['name']} ===")
        print(f"  id: {remedies[0]['id']}")
        print(f"  intro (first 300 chars):")
        print(f"    {remedies[0]['intro'][:300]}...")
        print(f"  sections: {len(remedies[0]['sections'])} (Farrington has no sections — narrative only)")
        print(f"  keynote (should be empty): '{remedies[0]['keynote']}'")

    with open(f'{OUT_DIR}/farrington-v2.json', 'w') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_DIR}/farrington-v2.json")


if __name__ == '__main__':
    main()
