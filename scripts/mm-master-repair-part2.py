#!/usr/bin/env python3
"""
MATERIA MEDICA MASTER REPAIR — Part 2
Parsers for: Farrington, Boger, Mathur, Kent, Dubey (convert existing)

Each author has its OWN source-aware parsing rules.
"""
import json
import os
import re
import sys

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)


def make_id(author, name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    prefix = {'Allen': 'allen', 'Kent': 'kent-mm', 'Farrington': 'farrington',
              'Boeger': 'boeger', 'Sankaran': 'sankaran', 'Mathur': 'mathur',
              'Dubey': 'dubey-mm'}.get(author, author.lower())
    return f'{prefix}-{slug}'


# ============================================================
# FARRINGTON PARSER — lecture format
# ============================================================
# Structure:
#   LECTURE XX.
#   REMEDY NAME. (ALL CAPS, centered, may end with period)
#   1. Blood.
#   2. Serous Membranes.
#   ... (outline)
#   <prose paragraphs>
# Next remedy: another "LECTURE XX." marker

FARRINGTON_SECTIONS = {
    'Blood', 'Serous Membranes', 'Muscles', 'Skin', 'Mucous Membranes',
    'Organs', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Urinary', 'Genitals',
    'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back',
    'Extremities', 'Sleep', 'Fever', 'Modalities', 'Relations',
    'Relationship', 'Compare', 'Antidotes', 'Dose',
    'Mental', 'Mind', 'Nervous System', 'Sensory System',
    'Glandular System', 'Circulatory System', 'Digestive System',
    'Lymphatic System', 'Reproductive System',
}

FARRINGTON_SKIP = [
    re.compile(r'^\s*\d+\s*$'),
    re.compile(r'^\s*A CLINICAL MATERIA MEDICA', re.IGNORECASE),
    re.compile(r'^\s*BOERICKE', re.IGNORECASE),
    re.compile(r'^\s*PHILADELPHIA', re.IGNORECASE),
    re.compile(r'^\s*Copyright', re.IGNORECASE),
]


def parse_farrington(text):
    """Parse Farrington — lecture format with prose."""
    lines = text.split('\n')

    # Find remedy boundaries — "LECTURE XX." followed by remedy name
    LECTURE_MARKER = re.compile(r'^\s*LECTURE\s+[IVXLC]+\.\s*$')
    REMEDY_TITLE = re.compile(r'^\s{4,}([A-Z][A-Z\s\.\-]{4,60})\.?\s*$')

    remedies = []
    current_name = None
    current_intro = []
    current_sections = []
    current_section = None
    started = False

    def save_current():
        nonlocal current_name, current_intro, current_sections, current_section
        if current_name:
            secs = []
            for s in current_sections:
                content = ' '.join(s['parts']).strip()
                content = re.sub(r'\s+', ' ', content)
                if content:
                    secs.append({'title': s['title'], 'content': content})
            intro = ' '.join(current_intro).strip()
            intro = re.sub(r'\s+', ' ', intro)
            full_parts = []
            if intro:
                full_parts.append(intro)
            for s in secs:
                full_parts.append(f"{s['title']}: {s['content']}")
            full = '\n'.join(full_parts)
            rec = {
                'id': make_id('Farrington', current_name),
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
                'sections': secs,
                'full': full,
                'keynote': '',
                'source_book': 'Clinical Materia Medica — E.A. Farrington',
            }
            for s in secs:
                if s['title'] in ('Relations', 'Relationship', 'Compare', 'Antidotes'):
                    if rec['relationships']:
                        rec['relationships'] += '\n' + s['content']
                    else:
                        rec['relationships'] = s['content']
                elif s['title'] == 'Dose':
                    rec['dose'] = s['content']
                elif s['title'] == 'Modalities':
                    rec['modalities'] = s['content']
            remedies.append(rec)
        current_name = None
        current_intro = []
        current_sections = []
        current_section = None

    # Find first lecture marker
    for i, line in enumerate(lines):
        skip = False
        for pat in FARRINGTON_SKIP:
            if pat.match(line):
                skip = True
                break
        if skip:
            continue

        # Detect lecture marker
        if LECTURE_MARKER.match(line):
            # Look ahead for remedy name
            for j in range(i+1, min(i+5, len(lines))):
                m = REMEDY_TITLE.match(lines[j])
                if m:
                    title = m.group(1).strip().rstrip('.')
                    if not started:
                        started = True
                    save_current()
                    # Title Case it
                    current_name = ' '.join(w.capitalize() if w.isupper() else w for w in title.split())
                    current_name = current_name[0].upper() + current_name[1:] if current_name else ''
                    break
            continue

        if not started or not current_name:
            continue

        ln = line.strip()
        if not ln:
            continue

        # Numbered heading (e.g., "1. Blood." or "2. Serous Membranes.")
        m = re.match(r'^(\d+)\.\s+([A-Z][A-Za-z\s\-]+)\.?\s*$', ln)
        if m:
            heading = m.group(2).strip().rstrip('.')
            current_section = {'title': heading, 'parts': []}
            current_sections.append(current_section)
            continue

        # Plain section heading
        if ln in FARRINGTON_SECTIONS:
            current_section = {'title': ln, 'parts': []}
            current_sections.append(current_section)
            continue

        # Sub-heading (e.g., "a. Rash; Measles.")
        if re.match(r'^[a-z]\.\s+', ln):
            if current_section is None:
                current_section = {'title': 'Details', 'parts': []}
                current_sections.append(current_section)
            current_section['parts'].append(ln)
            continue

        # Plain text
        if current_section is None:
            current_intro.append(ln)
        else:
            current_section['parts'].append(ln)

    save_current()
    return remedies


# ============================================================
# BOGER PARSER — synoptic key format
# ============================================================
# Structure:
#   RemedyName (Title Case, e.g., "Abrotanum")
#   Region
#   <text>
#   Worse
#   <text>
#   Better
#   <text>
#   Description
#   <text>
#   Symptoms
#   <bullets>
#   Related
#   <text>

BOGER_SECTIONS = {
    'Region', 'Worse', 'Better', 'Description', 'Symptoms',
    'Related', 'Modalities', 'Dose', 'Compare', 'Antidotes',
    'Complementary', 'Inimical', 'Follows',
}

BOGER_SKIP = [
    re.compile(r'^\s*\d+\s*$'),
    re.compile(r'^\s*Materia medica\s*$', re.IGNORECASE),
    re.compile(r'^\s*MODALITIES:', re.IGNORECASE),
    re.compile(r'^\s*MIND:', re.IGNORECASE),
    re.compile(r'^\s*SENSATIONS:', re.IGNORECASE),
    re.compile(r'^\s*BOGER', re.IGNORECASE),
    re.compile(r'^\s*[A-Z][a-z]+\.\.\.\s*\d+\s*$'),  # TOC entries
    re.compile(r'^\s*Parkersburg'),
    re.compile(r'^\s*Cyrus'),
]


def parse_boger(text):
    """Parse Boger's Synoptic Key."""
    lines = text.split('\n')

    # Find "Materia medica" section start — must be the LAST occurrence
    # (the first is in the Table of Contents)
    start_idx = 0
    for i, line in enumerate(lines):
        if line.strip() == 'Materia medica':
            start_idx = i + 1  # keep searching to find the last one
    # start_idx is now the line AFTER the last "Materia medica"

    # Remedy names are Title Case, single or multi-word, no punctuation
    REMEDY_TITLE = re.compile(r'^([A-Z][a-z]+(?:\s+[a-z]+)?(?:\s+[a-z]+)?)\s*$')

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
                'id': make_id('Boeger', current_name),
                'name': current_name,
                'common': '',
                'author': 'Boeger',
                'letter': current_name[0].upper() if current_name else '?',
                'chapter': 'Synoptic Key',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'intro': '',
                'sections': secs,
                'full': full,
                'keynote': '',
                'source_book': 'Boeger Synoptic Key Materia Medica — C.M. Boger',
            }
            for s in secs:
                if s['title'] in ('Related', 'Compare', 'Antidotes'):
                    if rec['relationships']:
                        rec['relationships'] += '\n' + s['content']
                    else:
                        rec['relationships'] = s['content']
                elif s['title'] == 'Dose':
                    rec['dose'] = s['content']
                elif s['title'] in ('Worse', 'Better'):
                    if rec['modalities']:
                        rec['modalities'] += '\n' + s['content']
                    else:
                        rec['modalities'] = s['content']
            remedies.append(rec)
        current_name = None
        current_sections = []
        current_section = None

    # Look for first remedy
    for i, line in enumerate(lines[start_idx:], start=start_idx):
        skip = False
        for pat in BOGER_SKIP:
            if pat.match(line):
                skip = True
                break
        if skip:
            continue

        ln = line.rstrip()
        stripped = ln.strip()
        if not stripped:
            continue

        # CHECK 1: Is this line a known section heading?
        # (must check BEFORE remedy title — "Region" is Title Case and
        # would otherwise be matched as a remedy name)
        if stripped in BOGER_SECTIONS:
            if started and current_name:
                current_section = {'title': stripped, 'parts': []}
                current_sections.append(current_section)
            continue

        # CHECK 2: Is this a remedy title?
        # Must be Title Case, NOT a known section name, AND the next
        # non-empty line must be either:
        # - "Region" (Boger's universal first section), OR
        # - ALL CAPS (alternate/short name like "ACONITE"), OR
        # - another known Boger section (Worse, Better, Description, etc.)
        m = REMEDY_TITLE.match(stripped)
        if m and not any(c.isdigit() for c in m.group(1)):
            title = m.group(1).strip()
            # Must start with uppercase, contain only letters/spaces
            if title[0].isupper() and re.match(r'^[A-Z][a-z]+(?:\s+[a-z]+)?$', title):
                # Skip known section names
                if title in BOGER_SECTIONS or len(title) < 3:
                    continue
                # Check if next non-empty line indicates a remedy start
                next_is_remedy_start = False
                for j in range(i+1, min(i+10, len(lines))):
                    next_ln = lines[j].strip()
                    if not next_ln:
                        continue
                    # Acceptable next lines: "Region" (most common section),
                    # ALL CAPS alternate name (e.g., "ACONITE" or "ACTEA SPICATA"),
                    # or another known Boger section
                    if (next_ln == 'Region' or
                        next_ln in BOGER_SECTIONS or
                        (next_ln.isupper() and len(next_ln) >= 3 and
                         all(w.isalpha() for w in next_ln.split()))):
                        next_is_remedy_start = True
                    break
                if next_is_remedy_start:
                    if not started:
                        started = True
                    save_current()
                    current_name = title
                    continue

        if not started or not current_name:
            continue

        # Plain text — append to current section
        if current_section is not None:
            current_section['parts'].append(stripped)

    save_current()
    return remedies


# ============================================================
# MATHUR PARSER — systematic format
# ============================================================
# Structure:
#   RemedyName (Title Case, e.g., "Aconitum napellus")
#   - Synonyms : ...
#   - Source : ...
#   - Habitat : ...
#   - Preparation : ...
#   Indications
#   - bullet
#   - bullet
#   DOSAGE: ...
#   REPETITION : ...
#   DURATION OF ACTION : ...
#   Relationship
#   - COMPLEMENTARY : ...
#   - REMEDIES THAT FOLLOW WELL: ...
#   - ANTIDOTES : ...
#   Comparison
#   - bullet
#   - bullet

MATHUR_SECTIONS = {
    'Synonyms', 'Source', 'Habitat', 'Preparation', 'Indications',
    'Dosage', 'Repetition', 'Duration of Action', 'Relationship',
    'Comparison', 'Causes & diseases', 'Complaints & characteristics',
    'Generals & modalities', 'Modalities', 'Aggravation', 'Amelioration',
    'Clinical', 'Antidotes', 'Complementary', 'Inimical', 'Follows',
    'Related', 'Compare', 'Dose',
}

MATHUR_SKIP = [
    re.compile(r'^\s*-?\s*\d+\s*$'),
    re.compile(r'^\s*Dr\.?\s*[Kk]\.?\s*[Nn]', re.IGNORECASE),
    re.compile(r'^\s*Life sketch', re.IGNORECASE),
    re.compile(r'^\s*Publishers', re.IGNORECASE),
    re.compile(r'^\s*Preface', re.IGNORECASE),
    re.compile(r'^\s*M\.?\s*B\.?', re.IGNORECASE),
    re.compile(r'^\s*D\.?\s*T\.?', re.IGNORECASE),
    re.compile(r'^\s*-?\s*NEW DELHI', re.IGNORECASE),
    re.compile(r'^\s*-?\s*HANUMAN', re.IGNORECASE),
    re.compile(r'^\s*-?\s*DIWAN', re.IGNORECASE),
]


def parse_mathur(text):
    """Parse Mathur — systematic format."""
    lines = text.split('\n')

    REMEDY_TITLE = re.compile(r'^([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s*$')

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
                'id': make_id('Mathur', current_name),
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
                'source_book': 'K N Mathur Materia Medica',
            }
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
                elif t in ('Modalities', 'Aggravation', 'Amelioration',
                           'Generals & modalities'):
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
        skip = False
        for pat in MATHUR_SKIP:
            if pat.match(line):
                skip = True
                break
        if skip:
            continue

        ln = line.strip()
        if not ln:
            continue

        # Check if remedy title (Title Case, no bullet, no leading dash)
        m = REMEDY_TITLE.match(ln)
        if m and not ln.startswith('-'):
            title = m.group(1).strip()
            # Filter false positives
            if title.lower() in {'chapter', 'index', 'contents', 'preface',
                                  'introduction', 'materia medica', 'publishers',
                                  'appendix', 'bibliography'}:
                continue
            # Must look like a remedy name (no common English phrases)
            words = title.split()
            if len(words) > 4:
                continue
            # Check first word looks Latin (Title Case, 4+ chars)
            first = words[0]
            if len(first) < 4:
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

        # Section headings: "Indications", "Relationship", "Comparison", etc.
        # These appear on their own line, no leading dash, Title Case
        if ln in MATHUR_SECTIONS:
            current_section = {'title': ln, 'parts': []}
            current_sections.append(current_section)
            continue

        # Section headings like "DOSAGE:", "REPETITION:", "DURATION OF ACTION:"
        m2 = re.match(r'^([A-Z][A-Z\s]+):\s*(.*)$', ln)
        if m2:
            heading = m2.group(1).strip().title()
            content_after = m2.group(2).strip()
            current_section = {'title': heading, 'parts': []}
            current_sections.append(current_section)
            if content_after:
                current_section['parts'].append(content_after)
            continue

        # Bullet line
        if ln.startswith('-'):
            bullet = ln.lstrip('-').strip()
            if current_section is None:
                current_section = {'title': 'Details', 'parts': []}
                current_sections.append(current_section)
            current_section['parts'].append(bullet)
            continue

        # Plain text
        if current_section is None:
            current_section = {'title': 'Details', 'parts': []}
            current_sections.append(current_section)
        current_section['parts'].append(ln)

    save_current()
    return remedies


# ============================================================
# DUBEY CONVERTER — convert existing {heading, paragraphs[]} to unified
# ============================================================
def convert_dubey(input_path):
    """Convert existing Dubey JSON to unified {title, content} format."""
    with open(input_path) as f:
        dubey = json.load(f)

    converted = []
    for r in dubey:
        # Convert sections from {heading, paragraphs[]} to {title, content}
        new_sections = []
        for s in r.get('sections', []):
            heading = s.get('heading', '').strip()
            paragraphs = s.get('paragraphs', [])
            content = ' '.join(paragraphs).strip()
            content = re.sub(r'\s+', ' ', content)
            if heading and content:
                new_sections.append({'title': heading, 'content': content})
            elif content and not heading:
                # First section without heading is the "common name" line
                # Skip it (already in common field if available)
                pass

        # Build full
        full_parts = []
        if r.get('common'):
            full_parts.append(r['common'])
        for s in new_sections:
            full_parts.append(f"{s['title']}: {s['content']}")
        full = '\n'.join(full_parts)

        rec = {
            'id': r['id'],
            'name': r['name'],
            'common': r.get('common', ''),
            'author': 'Dubey',
            'letter': r.get('letter', r['name'][0].upper() if r['name'] else '?'),
            'chapter': "Dubey Text Book of Materia Medica",
            'organ': '',
            'modalities': '',
            'constitution': '',
            'relationships': '',
            'dose': '',
            'intro': '',
            'sections': new_sections,
            'full': full,
            'keynote': '',  # Force empty — no duplication
            'source_book': r.get('source_book', "S.K. Dubey Text Book of Materia Medica (7th Ed.)"),
            'source_pages': r.get('source_pages', ''),
        }
        # Extract dose/relationships from sections
        for s in new_sections:
            t = s['title']
            if t in ('Relation', 'Related', 'Compare', 'Antidotes'):
                if rec['relationships']:
                    rec['relationships'] += '\n' + s['content']
                else:
                    rec['relationships'] = s['content']
            elif t == 'Dose' or 'dosage' in t.lower():
                rec['dose'] = s['content']
            elif t in ('Modalities', 'Aggravation', 'Amelioration'):
                if rec['modalities']:
                    rec['modalities'] += '\n' + s['content']
                else:
                    rec['modalities'] = s['content']
        converted.append(rec)
    return converted


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 70)
    print("MATERIA MEDICA MASTER REPAIR — Part 2 (Farrington/Boger/Mathur/Dubey)")
    print("=" * 70)

    # Farrington
    print("\n--- Parsing Farrington ---")
    with open('/tmp/farrington.txt') as f:
        text = f.read()
    farrington = parse_farrington(text)
    print(f"  Parsed {len(farrington)} Farrington remedies")
    if farrington:
        print(f"  Sample: {farrington[0]['name']} | sections: {len(farrington[0]['sections'])}")
    with open(f'{OUT_DIR}/farrington-v2.json', 'w') as f:
        json.dump(farrington, f, ensure_ascii=False, indent=2)

    # Boger
    print("\n--- Parsing Boger ---")
    with open('/tmp/boger.txt') as f:
        text = f.read()
    boger = parse_boger(text)
    print(f"  Parsed {len(boger)} Boger remedies")
    if boger:
        print(f"  Sample: {boger[0]['name']} | sections: {[s['title'] for s in boger[0]['sections']]}")
    with open(f'{OUT_DIR}/boger-v2.json', 'w') as f:
        json.dump(boger, f, ensure_ascii=False, indent=2)

    # Mathur
    print("\n--- Parsing Mathur ---")
    with open('/tmp/mathur.txt') as f:
        text = f.read()
    mathur = parse_mathur(text)
    print(f"  Parsed {len(mathur)} Mathur remedies")
    if mathur:
        print(f"  Sample: {mathur[0]['name']} | sections: {[s['title'] for s in mathur[0]['sections'][:5]]}")
    with open(f'{OUT_DIR}/mathur-v2.json', 'w') as f:
        json.dump(mathur, f, ensure_ascii=False, indent=2)

    # Dubey (convert existing)
    print("\n--- Converting Dubey ---")
    dubey = convert_dubey('/home/z/my-project/scripts/fresh_dubey/merged/dubey_remedies_clean.json')
    print(f"  Converted {len(dubey)} Dubey remedies")
    if dubey:
        print(f"  Sample: {dubey[0]['name']} | sections: {[s['title'] for s in dubey[0]['sections']]}")
    with open(f'{OUT_DIR}/dubey-v2.json', 'w') as f:
        json.dump(dubey, f, ensure_ascii=False, indent=2)

    print(f"\n✓ All outputs written to {OUT_DIR}/")


if __name__ == '__main__':
    main()
