#!/usr/bin/env python3
"""
Mathur v2 Parser — handles OCR artifacts (ti → space).

Mathur's structure:
- Remedy name (Title Case, no leading dash, e.g., "Abrotanum")
- "- Synonyms : ..."
- "- Source : ..."
- "- Habitat : ..."
- "- Prepara on :" (OCR of "Preparation")
- "- Proved by ..."
- "Indica ons" (OCR of "Indications")
- "- bullet symptoms"
- "DOSAGE :" (ALL CAPS with colon)
- "REPETITION :"
- "DURATION OF ACTION :"
- "Rela onship" (OCR of "Relationship")
- "- COMPLEMENTARY : ..."
- "- ANTIDOTES : ..."
- "Comparison"
- "- bullet comparisons"
- "Causes & diseases"
- "- bullet causes"

OCR artifacts to handle:
- "ti" → " " (e.g., "Indica ons" = "Indications", "Prepara on" = "Preparation")
- "ﬁ" → "fi" (ligature)
- "ﬂ" → "fl" (ligature)
- "œ" → "oe" (ligature)
"""
import json
import os
import re

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)


def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f'mathur-{slug}'


# Fix common OCR artifacts
def fix_ocr(text):
    """Fix common OCR character substitutions."""
    # Ligatures
    text = text.replace('ﬁ', 'fi')
    text = text.replace('ﬂ', 'fl')
    text = text.replace('ﬀ', 'ff')
    text = text.replace('ﬃ', 'ffi')
    text = text.replace('ﬄ', 'ffl')
    text = text.replace('œ', 'oe')
    text = text.replace('æ', 'ae')
    text = text.replace('Æ', 'AE')
    text = text.replace('Œ', 'OE')
    return text


# Section headings — handle OCR variants (ti → space)
# Map OCR variant → canonical name
SECTION_HEADING_MAP = {
    # Direct matches
    'Synonyms': 'Synonyms',
    'Source': 'Source',
    'Habitat': 'Habitat',
    'Preparation': 'Preparation',
    'Prepara on': 'Preparation',  # OCR: ti → space
    'Indications': 'Indications',
    'Indica ons': 'Indications',  # OCR: ti → space
    'Dosage': 'Dosage',
    'DOSAGE': 'Dosage',
    'Repetition': 'Repetition',
    'REPETITION': 'Repetition',
    'Duration of Action': 'Duration of Action',
    'DURATION OF ACTION': 'Duration of Action',
    'Relationship': 'Relationship',
    'Rela onship': 'Relationship',  # OCR: ti → space
    'Comparison': 'Comparison',
    'Causes & diseases': 'Causes & diseases',
    'Clinical': 'Clinical',
    'Modalities': 'Modalities',
    'Aggravation': 'Aggravation',
    'Aggrava on': 'Aggravation',  # OCR: ti → space
    'Amelioration': 'Amelioration',
    'Antidotes': 'Antidotes',
    'Complementary': 'Complementary',
    'Inimical': 'Inimical',
    'Follows': 'Follows',
    'Related': 'Related',
    'Compare': 'Compare',
    'Dose': 'Dose',
}


SKIP_PATTERNS = [
    re.compile(r'^\s*-?\s*\d+\s*$'),
    re.compile(r'^\s*Dr\.?\s*[Kk]\.?\s*[Nn]', re.IGNORECASE),
    re.compile(r'^\s*Life sketch', re.IGNORECASE),
    re.compile(r'^\s*Publishers', re.IGNORECASE),
    re.compile(r'^\s*Preface', re.IGNORECASE),
    re.compile(r'^\s*-?\s*NEW DELHI', re.IGNORECASE),
    re.compile(r'^\s*-?\s*HANUMAN', re.IGNORECASE),
    re.compile(r'^\s*-?\s*DIWAN', re.IGNORECASE),
    re.compile(r'^\s*Materia medica\s*$', re.IGNORECASE),
    re.compile(r'^\s*M\.?\s*B\.?', re.IGNORECASE),
    re.compile(r'^\s*D\.?\s*T\.?', re.IGNORECASE),
    # Page headers
    re.compile(r'^\s*SYSTEMATIC MATERIA', re.IGNORECASE),
    re.compile(r'^\s*K\.?\s*N\.?\s*Mathur', re.IGNORECASE),
]


def is_skip_line(line):
    for pat in SKIP_PATTERNS:
        if pat.match(line):
            return True
    return False


def parse_mathur(text):
    """Parse Mathur — systematic format with OCR artifacts."""
    # Fix OCR artifacts first
    text = fix_ocr(text)
    lines = text.split('\n')

    # Remedy names: Title Case, no leading dash, standalone line
    # Must NOT start with a dash (bullets start with dash)
    REMEDY_TITLE = re.compile(r'^([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s*$')

    # Skip front matter — Mathur remedies start at "Abrotanum"
    remedies = []
    current_name = None
    current_sections = []
    current_section = None
    started = False

    def save_current():
        nonlocal current_name, current_sections, current_section
        if current_name:
            secs = []
            for s in current_sections:
                content = ' '.join(s['parts']).strip()
                content = re.sub(r'\s+', ' ', content)
                if content:
                    secs.append({'title': s['title'], 'content': content})
            full_parts = []
            for s in secs:
                full_parts.append(f"{s['title']}: {s['content']}")
            full = '\n'.join(full_parts)
            rec = {
                'id': make_id(current_name),
                'name': current_name,
                'common': '',
                'author': 'Mathur',
                'letter': current_name[0].upper() if current_name else '?',
                'chapter': 'Systematic Materia Medica',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'intro': '',
                'sections': secs,
                'full': full,
                'keynote': '',
                'source_book': 'K N Mathur Systematic Materia Medica',
            }
            # Extract modalities/relationships/dose from sections
            for s in secs:
                t = s['title']
                if t in ('Relationship', 'Antidotes', 'Complementary', 'Compare',
                         'Related', 'Inimical', 'Follows'):
                    if rec['relationships']:
                        rec['relationships'] += '\n' + s['content']
                    else:
                        rec['relationships'] = s['content']
                elif t in ('Dosage', 'Dose'):
                    rec['dose'] = s['content']
                elif t in ('Modalities', 'Aggravation', 'Amelioration'):
                    if rec['modalities']:
                        rec['modalities'] += '\n' + s['content']
                    else:
                        rec['modalities'] = s['content']
                elif t == 'Indications':
                    rec['constitution'] = s['content']
            remedies.append(rec)
        current_name = None
        current_sections = []
        current_section = None

    for i, line in enumerate(lines):
        if is_skip_line(line):
            continue

        ln = line.rstrip()
        stripped = ln.strip()
        if not stripped:
            continue

        # Check if this is a section heading (with or without trailing colon)
        # Try exact match first
        if stripped in SECTION_HEADING_MAP:
            heading = SECTION_HEADING_MAP[stripped]
            if started and current_name:
                current_section = {'title': heading, 'parts': []}
                current_sections.append(current_section)
            continue

        # Check for ALL CAPS heading with colon: "DOSAGE :", "REPETITION :"
        m_caps = re.match(r'^([A-Z][A-Z\s]+):\s*(.*)$', stripped)
        if m_caps:
            raw_heading = m_caps.group(1).strip()
            content_after = m_caps.group(2).strip()
            # Map to canonical name
            canonical = SECTION_HEADING_MAP.get(raw_heading, raw_heading.title())
            if started and current_name:
                current_section = {'title': canonical, 'parts': []}
                current_sections.append(current_section)
                if content_after:
                    current_section['parts'].append(content_after)
            continue

        # Check if remedy title (Title Case, no leading dash)
        if not stripped.startswith('-'):
            m_title = REMEDY_TITLE.match(stripped)
            if m_title:
                title = m_title.group(1).strip()
                # Filter false positives
                if title.lower() in {'chapter', 'index', 'contents', 'preface',
                                      'introduction', 'materia medica', 'publishers',
                                      'appendix', 'bibliography', 'life sketch',
                                      'materia', 'medica'}:
                    continue
                words = title.split()
                if len(words) > 4:
                    continue
                # First word must be 4+ chars (Latin remedy names)
                first = words[0]
                if len(first) < 4:
                    continue
                # Skip if first char is not a letter
                if not first[0].isalpha():
                    continue

                # Start once we see "Abrotanum"
                if not started:
                    if title == 'Abrotanum':
                        started = True
                    else:
                        continue

                save_current()
                current_name = title
                continue

        if not started or not current_name:
            continue

        # Bullet line (starts with -)
        if stripped.startswith('-'):
            bullet = stripped.lstrip('-').strip()
            if current_section is None:
                current_section = {'title': 'Details', 'parts': []}
                current_sections.append(current_section)
            current_section['parts'].append(bullet)
            continue

        # Plain text
        if current_section is None:
            current_section = {'title': 'Details', 'parts': []}
            current_sections.append(current_section)
        current_section['parts'].append(stripped)

    save_current()
    return remedies


def main():
    print("=" * 60)
    print("Mathur v2 Parser — handles OCR artifacts")
    print("=" * 60)

    with open('/tmp/mathur.txt') as f:
        text = f.read()

    remedies = parse_mathur(text)
    print(f"\nParsed {len(remedies)} Mathur remedies")

    if remedies:
        print(f"\nFirst 5 remedies:")
        for r in remedies[:5]:
            titles = [s['title'] for s in r['sections']]
            print(f"  - {r['name']} | sections: {titles[:5]}")

        print(f"\n=== Sample: {remedies[0]['name']} ===")
        print(f"  id: {remedies[0]['id']}")
        print(f"  sections ({len(remedies[0]['sections'])}):")
        for s in remedies[0]['sections'][:5]:
            print(f"    [{s['title']}] {s['content'][:60]}...")
        print(f"  keynote (should be empty): '{remedies[0]['keynote']}'")

    with open(f'{OUT_DIR}/mathur-v2.json', 'w') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_DIR}/mathur-v2.json")


if __name__ == '__main__':
    main()
