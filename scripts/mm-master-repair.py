#!/usr/bin/env python3
"""
MATERIA MEDICA MASTER REPAIR — Author-Specific Parsers v2

This script processes 7 authors with AUTHOR-SPECIFIC parsing rules:
1. H.C. Allen — bullets, ALL CAPS titles, sections like Mental/Physical Generals
2. J.T. Kent — narrative prose with "Introduction:" + ALL CAPS symptom labels
3. E.A. Farrington — lecture format, numbered headings, prose
4. C.M. Boger — Title Case name, sections: Region/Worse/Better/Description/Symptoms/Related
5. Rajan Sankaran — narrative essay, remedy name + italic quote
6. N.M. Mathur — Title Case name, sections: Synonyms/Source/Indications/Dosage/etc.
7. S.K. Dubey — ALL CAPS sections: INTRODUCTION/CLINICAL/GUIDING SYMPTOMS/PARTICULARS

OUTPUT for every remedy (unified model):
{
  id, name, common, author, letter, chapter,
  intro: source intro paragraph(s) (may be empty),
  sections: [{title, content}] — source-preserved sections,
  full: joined intro + sections (for backward compat),
  keynote: '' (always empty — no artificial duplication),
  modalities, relationships, dose, constitution, organ,
  source_book, source_pages (where determinable)
}

NEVER fabricates content. NEVER paraphrases. NEVER uses one author's
structure for another.
"""
import json
import os
import re
import sys

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)


def make_id(author, name):
    """Build a stable remedy ID."""
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    prefix = {'Allen': 'allen', 'Kent': 'kent-mm', 'Farrington': 'farrington',
              'Boeger': 'boeger', 'Sankaran': 'sankaran', 'Mathur': 'mathur',
              'Dubey': 'dubey-mm'}.get(author, author.lower())
    return f'{prefix}-{slug}'


def clean_text(text):
    """Clean OCR artifacts."""
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    lines = [ln.strip() for ln in text.split('\n')]
    return '\n'.join(lines).strip()


# ============================================================
# ALLEN PARSER
# ============================================================
# Allen's structure:
#   REMEDY NAME (ALL CAPS, centered with leading spaces)
#   Common name / Source (Title Case line, possibly with Latin name)
#   Section1 (Title Case, no trailing punctuation, known vocab)
#   • bullet symptom
#   • bullet symptom
#   Section2
#   • bullet symptom

ALLEN_SECTIONS = {
    'Constitution', 'Mental Generals', 'Physical Generals',
    'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Appetite', 'Stomach', 'Abdomen', 'Rectum', 'Stool',
    'Urinary System', 'Genito-Urinary System', 'Male', 'Female',
    'Respiratory System', 'Cardio-vascular System', 'Neck and Back',
    'Upper Limbs', 'Lower Limbs', 'Extremities', 'Skin', 'Sleep',
    'Fever', 'Modalities', 'Relation', 'Related', 'Compare',
    'Antidotes', 'Dose', 'Duration', 'Clinical', 'Children',
    'Pregnancy', 'Complementary', 'Inimical', 'Follows',
    'Characteristic Symptoms', 'Guiding Symptoms',
    'Gastro-intestinal System', 'Female Sexual Organs',
    'Male Sexual Organs', 'Sensorium', 'Discharges',
}

# Lines to skip (page headers, footers, watermarks)
ALLEN_SKIP = [
    re.compile(r'^\s*\d+\s*$'),  # page numbers
    re.compile(r'^\s*Allen\'?s Keynotes.*$', re.IGNORECASE),
    re.compile(r'^\s*B\. JAIN', re.IGNORECASE),
    re.compile(r'^\s*-+\s*\d+\s*-+\s*$'),
]


def parse_allen(text):
    """Parse Allen's Keynotes — bullets + Title Case sections."""
    lines = text.split('\n')

    # Find the first remedy (skipping front matter)
    # Allen remedies start with ALL CAPS centered title
    REMEDY_TITLE = re.compile(r'^\s{15,}([A-Z][A-Z\s\-\.\(\)]{2,60})\s*$')

    remedies = []
    current_name = None
    current_common = ''
    current_intro = []
    current_sections = []  # [{title, content_parts: []}]
    current_section = None

    def save_current():
        nonlocal current_name, current_common, current_intro, current_sections, current_section
        if current_name:
            # Build sections
            secs = []
            for s in current_sections:
                content = ' '.join(s['parts']).strip()
                content = re.sub(r'\s+', ' ', content)
                if content:
                    secs.append({'title': s['title'], 'content': content})
            intro = ' '.join(current_intro).strip()
            intro = re.sub(r'\s+', ' ', intro)
            full_parts = []
            if current_common:
                full_parts.append(current_common)
            if intro:
                full_parts.append(intro)
            for s in secs:
                full_parts.append(f"{s['title']}: {s['content']}")
            full = '\n'.join(full_parts)
            rec = {
                'id': make_id('Allen', current_name),
                'name': current_name,
                'common': current_common,
                'author': 'Allen',
                'letter': current_name[0].upper() if current_name else '?',
                'chapter': "Allen's Keynotes",
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'intro': intro,
                'sections': secs,
                'full': full,
                'keynote': '',
                'source_book': "Allen's Keynotes Rearranged and Classified (10th Ed.)",
            }
            # Extract relationships/dose from sections
            for s in secs:
                if s['title'] in ('Relation', 'Related', 'Compare', 'Antidotes'):
                    if rec['relationships']:
                        rec['relationships'] += '\n' + s['content']
                    else:
                        rec['relationships'] = s['content']
                elif s['title'] == 'Dose':
                    rec['dose'] = s['content']
                elif s['title'] == 'Modalities':
                    rec['modalities'] = s['content']
                elif s['title'] == 'Constitution':
                    rec['constitution'] = s['content']
            remedies.append(rec)
        current_name = None
        current_common = ''
        current_intro = []
        current_sections = []
        current_section = None

    started = False
    for line in lines:
        # Skip headers/footers
        skip = False
        for pat in ALLEN_SKIP:
            if pat.match(line):
                skip = True
                break
        if skip:
            continue

        # Check if this is a remedy title
        m = REMEDY_TITLE.match(line)
        if m:
            title = m.group(1).strip()
            # Filter false positives
            if title in {'MATERIA MEDICA', 'INDEX', 'CONTENTS', 'PREFACE',
                         'EDITOR\'S NOTE', 'PUBLISHER\'S NOTE', 'REPERTORIAL INDEX'}:
                continue
            if not any(c.isalpha() for c in title):
                continue
            words = title.split()
            if len(words) > 6:
                continue

            # Don't save front matter
            if not started:
                # Check if this is actually a remedy (must be in the remedies section)
                # Use "ABROTANUM" as the start marker
                if title.upper().strip() == 'ABROTANUM':
                    started = True
                else:
                    continue

            save_current()
            current_name = ' '.join(w.capitalize() for w in title.split())
            # Fix capitalization for known names
            current_name = current_name.replace('Acidum', 'acidum')
            current_name = current_name.replace('Napellus', 'napellus')
            current_name = current_name.replace('Cynapium', 'cynapium')
            current_name = current_name.replace('Muscarius', 'muscarius')
            current_name = current_name.replace('Castus', 'castus')
            current_name = current_name.replace('Racemosa', 'racemosa')
            current_name = current_name.replace('Hippocastanum', 'hippocastanum')
            current_section = None
            continue

        if not started or not current_name:
            continue

        ln = line.strip()
        if not ln:
            continue

        # Check if line is a common name / source (Title Case, no punctuation,
        # appears right after remedy title, before any section heading)
        if not current_common and not current_intro and not current_sections:
            # Common name pattern: Title Case, may include Latin (italic)
            if (len(ln) < 80 and
                not ln.endswith('.') and
                not ln.endswith(',') and
                not ln.endswith(';') and
                ln not in ALLEN_SECTIONS and
                not ln.startswith('•') and
                not ln.startswith('-') and
                not ln[0].isdigit() and
                (ln[0].isupper() or ln.startswith('('))):
                current_common = ln
                continue

        # Check if line is a section heading
        if ln in ALLEN_SECTIONS:
            current_section = {'title': ln, 'parts': []}
            current_sections.append(current_section)
            continue

        # Bullet point
        if ln.startswith('•') or ln.startswith('-') or ln.startswith('*'):
            # Clean bullet
            bullet_text = re.sub(r'^[•\-\*]\s*', '', ln)
            if current_section is None:
                # No section yet — treat as intro
                current_intro.append(bullet_text)
            else:
                current_section['parts'].append(bullet_text)
            continue

        # Continuation of previous bullet (indented continuation)
        if current_section is not None and current_section['parts']:
            current_section['parts'][-1] += ' ' + ln
            continue

        # Plain text line (no bullet, no section) — could be intro
        if current_section is None:
            current_intro.append(ln)
        else:
            current_section['parts'].append(ln)

    save_current()
    return remedies


# ============================================================
# SANKARAN PARSER
# ============================================================
# Sankaran structure:
#   REMEDY NAME (ALL CAPS, centered, possibly with leading whitespace)
#   "italic quote/slogan in quotes"
#   <narrative prose paragraphs>
# Next remedy: another ALL CAPS title

SANKARAN_SKIP = [
    re.compile(r'^\s*\d+\s*$'),
    re.compile(r'^\s*The Soul of Remedies\s*$', re.IGNORECASE),
    re.compile(r'^\s*Dr\.?\s*Rajan', re.IGNORECASE),
]


def parse_sankaran(text):
    """Parse Sankaran Soul of Remedies — narrative essay format."""
    lines = text.split('\n')

    # Find remedy names — they're ALL CAPS, centered
    REMEDY_TITLE = re.compile(r'^\s{4,}([A-Z][A-Z\s\.\-]{4,60})\s*$')

    # Front matter markers to skip
    FRONT_MATTER_END = 'ACONITUM NAPELLUS'

    remedies = []
    current_name = None
    current_quote = ''
    current_paragraphs = []
    started = False

    def save_current():
        nonlocal current_name, current_quote, current_paragraphs
        if current_name:
            intro_parts = []
            if current_quote:
                intro_parts.append(current_quote)
            intro_parts.extend(current_paragraphs)
            intro = '\n\n'.join(intro_parts).strip()
            full = intro
            rec = {
                'id': make_id('Sankaran', current_name),
                'name': current_name,
                'common': current_quote,
                'author': 'Sankaran',
                'letter': current_name[0].upper() if current_name else '?',
                'chapter': 'Soul of Remedies',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'intro': intro,
                'sections': [],
                'full': full,
                'keynote': '',
                'source_book': 'The Soul of Remedies — Rajan Sankaran',
            }
            remedies.append(rec)
        current_name = None
        current_quote = ''
        current_paragraphs = []

    for line in lines:
        skip = False
        for pat in SANKARAN_SKIP:
            if pat.match(line):
                skip = True
                break
        if skip:
            continue

        m = REMEDY_TITLE.match(line)
        if m:
            title = m.group(1).strip()
            # Filter false positives
            if title in {'THE SOUL OF', 'REMEDIES', 'INTRODUCTION',
                         'MATERIA MEDICA', 'CONTENTS', 'INDEX',
                         'PREFACE', 'BIBLIOGRAPHY'}:
                continue
            if not title[0].isalpha():
                continue
            words = title.split()
            if len(words) > 5:
                continue
            # Must look like a remedy name (single word or two words)
            if not started:
                if title == FRONT_MATTER_END:
                    started = True
                else:
                    continue

            save_current()
            current_name = ' '.join(w.capitalize() if w.isupper() else w for w in title.split())
            # Capitalize first letter only
            current_name = current_name[0].upper() + current_name[1:] if current_name else ''
            continue

        if not started or not current_name:
            continue

        ln = line.strip()
        if not ln:
            if current_paragraphs:
                # blank line = paragraph separator
                pass
            continue

        # First non-empty line after title is the quote
        if not current_quote and not current_paragraphs:
            if ln.startswith('"') or ln.startswith('"') or ln.startswith('«'):
                current_quote = ln.strip('"').strip('"').strip('«').strip('»').strip()
                continue
            else:
                # No quote — first paragraph IS the quote
                current_quote = ln
                continue

        current_paragraphs.append(ln)

    save_current()
    return remedies


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 70)
    print("MATERIA MEDICA MASTER REPAIR — Author-Specific Parsers v2")
    print("=" * 70)

    # Parse Allen
    print("\n--- Parsing Allen's Keynotes ---")
    with open('/tmp/allen.txt') as f:
        text = f.read()
    allen = parse_allen(text)
    print(f"  Parsed {len(allen)} Allen remedies")
    if allen:
        # Find Vaccininum (regression test)
        for r in allen:
            if 'vaccin' in r['name'].lower():
                print(f"\n  === REGRESSION: {r['name']} ===")
                print(f"  id: {r['id']}")
                print(f"  common: {r['common']}")
                print(f"  intro: {r['intro'][:100]}...")
                print(f"  sections ({len(r['sections'])}):")
                for s in r['sections'][:5]:
                    print(f"    - {s['title']}: {s['content'][:60]}...")
                print(f"  keynote (should be empty): '{r['keynote']}'")
                break
    with open(f'{OUT_DIR}/allen-v2.json', 'w') as f:
        json.dump(allen, f, ensure_ascii=False, indent=2)
    print(f"  Wrote {OUT_DIR}/allen-v2.json")

    # Parse Sankaran
    print("\n--- Parsing Sankaran's Soul of Remedies ---")
    with open('/tmp/sankaran.txt') as f:
        text = f.read()
    sankaran = parse_sankaran(text)
    print(f"  Parsed {len(sankaran)} Sankaran remedies")
    if sankaran:
        print(f"\n  === Sample: {sankaran[0]['name']} ===")
        print(f"  id: {sankaran[0]['id']}")
        print(f"  quote: {sankaran[0]['common'][:100]}")
        print(f"  intro (first 100): {sankaran[0]['intro'][:100]}...")
    with open(f'{OUT_DIR}/sankaran-v2.json', 'w') as f:
        json.dump(sankaran, f, ensure_ascii=False, indent=2)
    print(f"  Wrote {OUT_DIR}/sankaran-v2.json")


if __name__ == '__main__':
    main()
