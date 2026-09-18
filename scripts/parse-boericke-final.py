#!/usr/bin/env python3
"""
Boericke Pocket Manual Parser — Complete rebuild from PDF source.

Parses ALL remedies from the original Boericke PDF with:
- Remedy title (ALL CAPS, centered)
- Common name (in parentheses)
- Abbreviation (right-aligned)
- Intro paragraph(s) before first section heading
- Section headings: Head.--, Stomach.--, Female.--, etc.
- Section content preserved exactly
- No duplication (keynote = empty)
- Proper section boundaries

Output: {intro, sections: [{title, content}]}
"""
import json
import os
import re

SRC = '/tmp/boericke.txt'
OUT = '/home/z/my-project/data/boericke-source-remedies-v2.json'

# Known Boericke section headings (Word.--)
KNOWN_SECTIONS = {
    'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Anus', 'Urinary', 'Genitals',
    'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back', 'Extremities',
    'Skin', 'Sleep', 'Dreams', 'Fever', 'Sweat', 'Modalities', 'Relations',
    'Relationships', 'Relationship', 'Compare', 'Comparisons', 'Antidotes',
    'Dose', 'Duration', 'Children', 'Pregnancy', 'Clinical', 'Pharmacy',
    'Source', 'Habitat', 'Preparation', 'Constitution', 'Miasms', 'Miasm',
    'Complementary', 'Inimical', 'Follows', 'Followed by', 'Worse', 'Better',
    'Characteristic Symptoms', 'Guiding Symptoms',
    'Neck', 'Liver', 'Spleen', 'Kidneys', 'Bladder', 'Prostate',
    'Trachea', 'Larynx', 'Bronchi', 'Lungs', 'Pleura', 'Pericardium',
    'Arteries', 'Veins', 'Capillaries', 'Bones', 'Joints', 'Muscles',
    'Nerves', 'Brain', 'Spine', 'Glands', 'Blood', 'Tissues',
    'Salivary Glands', 'Teeth', 'Tongue', 'Oesophagus', 'Duodenum',
    'Intestines', 'Nails', 'Hair', 'Voice', 'Cough', 'Expectoration',
    'Respiration', 'Circulation', 'Pulse', 'Temperature',
    'Vertigo', 'Vision', 'Sensorium', 'Discharges',
    'Gastro-intestinal System', 'Genito-urinary System',
    'Cardio-vascular System', 'Neck and Back', 'Upper Limbs', 'Lower Limbs',
    'Respiratory System', 'Urinary System', 'Female Sexual Organs',
    'Male Sexual Organs', 'Mental Generals', 'Physical Generals',
    'Glandular System', 'Lymphatic System', 'Nervous System',
    'Circulatory System', 'Digestive System', 'Reproductive System',
    'Endocrine System', 'Immune System', 'Skeletal System',
}

SKIP_PATTERNS = [
    re.compile(r'^\s*Similibis India\s*$', re.IGNORECASE),
    re.compile(r'^\s*\d+\s*$'),
    re.compile(r'^\s*-+\s*\d+\s*-+\s*$'),
    re.compile(r'^\s*MATERIA MEDICA\s*$', re.IGNORECASE),
    re.compile(r'^\s*REPERTORY\s*$', re.IGNORECASE),
    re.compile(r'^\s*Drug Affinities\s*$', re.IGNORECASE),
    re.compile(r'^\s*RELATIONSHIP\s+OF\s*$', re.IGNORECASE),
    re.compile(r'^\s*REMEDIES AND\s*$', re.IGNORECASE),
    re.compile(r'^\s*SIDES OF THE BODY\s*$', re.IGNORECASE),
    re.compile(r'^\s*Cham\.\s*$'),
    re.compile(r'^\s*Staph\.\s*$'),
    re.compile(r'^\s*Verat\.\s*$'),
    re.compile(r'^\s*Acon\.\s*$'),
    re.compile(r'^\s*[A-Z][a-z]+\.\s*\d+\s*$'),  # TOC entries
]

REMEDY_TITLE = re.compile(r'^\s{2,}([A-Z][A-Z\s\-\.]{2,60}(?:—[A-Z\s\-\.]+)?(?:\s+OR\s+[A-Z\s\-\.]+)?)\.?\s*[A-Za-z\.\-]*\s*$')
COMMON_NAME = re.compile(r'^\s*\(([^)]+)\)\s*(?:[A-Z][a-z]+\-?[a-z]?\.?)?\s*$')
SECTION_HEADING = re.compile(r'^\s{0,8}([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[—–\-]+\s*(.+)$')


def is_skip_line(line):
    for pat in SKIP_PATTERNS:
        if pat.match(line):
            return True
    return False


def parse_boericke(text):
    lines = text.split('\n')
    start_idx = 0
    end_idx = len(lines)

    # Find start: first "ABIES CANADENSIS"
    for i, line in enumerate(lines):
        if 'ABIES CANADENSIS' in line and REMEDY_TITLE.match(line):
            start_idx = i
            break

    # Find end: "RELATIONSHIP OF" or "Drug Affinities"
    for i, line in enumerate(lines):
        if i < 1000:
            continue
        stripped = line.strip()
        if re.match(r'^RELATIONSHIP\s+OF\s*$', stripped, re.IGNORECASE):
            end_idx = i
            break
        if 'Drug Affinities' in line:
            end_idx = i
            break

    remedies = []
    current_name = None
    current_common = ''
    current_intro = []
    current_sections = []
    current_section = None

    def save_current():
        nonlocal current_name, current_common, current_intro, current_sections, current_section
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
            if current_common:
                full_parts.append(current_common)
            if intro:
                full_parts.append(intro)
            for s in secs:
                full_parts.append(f"{s['title']}.-- {s['content']}")
            full = '\n'.join(full_parts)
            rec = {
                'id': '',  # Will be set below
                'name': current_name,
                'common': current_common,
                'author': 'Boericke',
                'letter': current_name[0].upper() if current_name else '?',
                'chapter': 'Boericke MM',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'intro': intro,
                'sections': secs,
                'full': full,
                'keynote': '',
                'source_book': "Boericke's Pocket Manual of Homoeopathic Materia Medica & Repertory",
            }
            for s in secs:
                if s['title'] == 'Dose':
                    rec['dose'] = s['content']
                elif s['title'] in ('Relations', 'Relationships', 'Relationship', 'Compare', 'Comparisons', 'Antidotes'):
                    if rec['relationships']:
                        rec['relationships'] += '\n' + s['content']
                    else:
                        rec['relationships'] = s['content']
                elif s['title'] in ('Modalities', 'Worse', 'Better'):
                    if rec['modalities']:
                        rec['modalities'] += '\n' + s['content']
                    else:
                        rec['modalities'] = s['content']
            slug = re.sub(r'[^a-z0-9]+', '-', current_name.lower()).strip('-')
            rec['id'] = f'boericke-mm-{slug}'
            remedies.append(rec)
        current_name = None
        current_common = ''
        current_intro = []
        current_sections = []
        current_section = None

    for line in lines[start_idx:end_idx]:
        if is_skip_line(line):
            continue

        m = REMEDY_TITLE.match(line)
        if m:
            title = m.group(1).strip()
            if title in {'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH',
                'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'STOOL', 'URINARY',
                'GENITALS', 'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART',
                'BACK', 'EXTREMITIES', 'SKIN', 'SLEEP', 'FEVER', 'MODALITIES',
                'RELATIONSHIP', 'DOSE', 'PREFACE', 'INDEX', 'CHAPTER', 'CONTENTS',
                'MATERIA MEDICA', 'REPERTORY'}:
                continue
            words = title.split()
            if len(words) > 6:
                continue
            letters = sum(1 for c in title if c.isalpha())
            if letters < 3:
                continue
            save_current()
            # Parse name — handle em-dash separator for Latin names
            if '—' in title:
                parts = title.split('—')
                name_part = parts[0].strip()
                latin_part = parts[1].strip() if len(parts) > 1 else ''
            elif '--' in title:
                parts = title.split('--')
                name_part = parts[0].strip()
                latin_part = parts[1].strip() if len(parts) > 1 else ''
            else:
                name_part = title
                latin_part = ''
            # Convert to Title Case
            name = ' '.join(w.capitalize() if w.isupper() else w for w in name_part.split())
            current_name = name
            continue

        if not current_name:
            continue

        ln = line.strip()
        if not ln:
            continue

        # Common name line
        if not current_common and not current_intro and not current_sections:
            if (len(ln) < 80 and not ln.endswith('.') and not ln.endswith(',')
                and not ln.endswith(';') and ln not in KNOWN_SECTIONS
                and not ln.startswith('•') and not ln.startswith('-')
                and not ln[0].isdigit() and (ln[0].isupper() or ln.startswith('('))):
                if ln.startswith('('):
                    m2 = COMMON_NAME.match(ln)
                    if m2:
                        current_common = m2.group(1).strip()
                        continue
                else:
                    current_common = ln
                    continue

        # Section heading
        sh = None
        m2 = SECTION_HEADING.match(ln)
        if m2:
            heading = m2.group(1).strip()
            if heading in KNOWN_SECTIONS:
                sh = (heading, m2.group(2).strip())
        if not sh:
            if ln in KNOWN_SECTIONS:
                sh = (ln, '')

        if sh:
            current_section = {'title': sh[0], 'parts': [sh[1]] if sh[1] else []}
            current_sections.append(current_section)
            continue

        # Body text
        if current_section is None:
            current_intro.append(ln)
        else:
            current_section['parts'].append(ln)

    save_current()
    return remedies


def main():
    print("=" * 60)
    print("Boericke Pocket Manual Parser — Complete rebuild")
    print("=" * 60)

    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()
    print(f"Loaded {len(text):,} chars from {SRC}")

    remedies = parse_boericke(text)
    print(f"\nParsed {len(remedies)} remedies")

    # Stats
    has_sections = sum(1 for r in remedies if r['sections'])
    has_intro = sum(1 for r in remedies if r['intro'].strip())
    empty_keynote = sum(1 for r in remedies if not r['keynote'].strip())
    print(f"\nWith sections: {has_sections}/{len(remedies)}")
    print(f"With intro: {has_intro}/{len(remedies)}")
    print(f"Empty keynote: {empty_keynote}/{len(remedies)}")

    # Show sample
    for r in remedies:
        if 'abies can' in r['name'].lower():
            print(f"\n=== REGRESSION: {r['name']} ===")
            print(f"  id: {r['id']}")
            print(f"  common: {r['common']}")
            print(f"  intro: {r['intro'][:150]}...")
            print(f"  sections ({len(r['sections'])}):")
            for s in r['sections']:
                print(f"    [{s['title']}] {s['content'][:60]}...")
            print(f"  keynote: '{r['keynote']}'")
            print(f"  dose: '{r['dose']}'")
            break

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

    # Duplication check
    dup = 0
    for r in remedies:
        if r['keynote'] and r['keynote'] in r['full']:
            dup += 1
    print(f"\nDuplication check: {dup} (should be 0)")


if __name__ == '__main__':
    main()
