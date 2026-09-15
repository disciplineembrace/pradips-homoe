#!/usr/bin/env python3
"""
Boger v4 Parser — matches source PDF structure exactly.

Boger's Synoptic Key Materia Medica structure:
1. Remedy name (Title Case, e.g., "Aconitum napellus")
2. ALL CAPS alternate name (e.g., "ACONITE") — subtitle
3. Section headings (Title Case): Region, Worse, Better, Description, Symptoms, Related
4. Sub-section headings within Region (ALL CAPS + period):
   MIND., NERVES., HEART., Viscera., Joints.
5. Sub-items under sub-sections (indented, Title Case + period):
   Brain., Medulla., Sympathetic., etc.
6. Under Worse/Better: category names (Title Case) + indented sub-items
7. Under Description: narrative symptom paragraphs
8. Under Symptoms: characteristic symptom lines
9. Under Related: remedy abbreviations

Output:
{
  name: "Aconitum napellus",
  common: "ACONITE",  // ALL CAPS alternate name stored as common
  sections: [
    { title: "Region", content: "...", subsections: [
      { heading: "MIND", content: "Brain." },
      { heading: "NERVES", content: "Medulla. Sympathetic. Vagus. Respiratory Centre." },
      { heading: "HEART", content: "Arterial. Circulation." },
      ...
    ]},
    { title: "Worse", content: "Violent Emotions. FRIGHT. SHOCK. Vexation. ..." },
    { title: "Better", content: "Open Air. Repose. Warm Sweat." },
    { title: "Description", content: "Robust habit. Sudden, violently acute..." },
    { title: "Symptoms", content: "TERROR. ANXIETY. AGONIZING FEAR..." },
    { title: "Related", content: "Bell. Cham. Cof." }
  ]
}
"""
import json
import os
import re

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)

# Main section headings in Boger
BOGER_SECTIONS = {
    'Region', 'Worse', 'Better', 'Description', 'Symptoms',
    'Related', 'Antidotes', 'Complementary', 'Compare', 'Dose',
    'Modalities', 'Inimical', 'Follows',
}

# Sub-section headings under Region (ALL CAPS + period)
# These are body systems in Boger's format
REGION_SUBSECTIONS = {
    'MIND', 'NERVES', 'HEART', 'VISCERA', 'JOINTS',
    'BLOOD', 'TISSUES', 'GLANDS', 'SKIN', 'MUCOUS MEMBRANES',
    'SEROUS MEMBRANES', 'BONES', 'MUSCLES', 'LUNGS',
    'LIVER', 'KIDNEYS', 'SPLEEN', 'STOMACH', 'INTESTINES',
    'BLADDER', 'UTERUS', 'OVARIES', 'TESTES', 'PROSTATE',
    'THYROID', 'ADRENALS', 'PANCREAS', 'LYMPHATICS',
}

# Lines to skip (page numbers, watermarks, TOC)
SKIP_PATTERNS = [
    re.compile(r'^\s*\d{1,4}\s*$'),  # page numbers
    re.compile(r'^\s*[A-Z][a-z]+\.+\s*\d+\s*$'),  # TOC entries like "Borax... 226"
    re.compile(r'^\s*BOGER', re.IGNORECASE),
    re.compile(r'^\s*Cyrus'),
    re.compile(r'^\s*Parkersburg'),
    re.compile(r'^\s*Materia medica\s*$', re.IGNORECASE),
    re.compile(r'^\s*MODALITIES:', re.IGNORECASE),
    re.compile(r'^\s*MIND:', re.IGNORECASE),
    re.compile(r'^\s*SENSATIONS:', re.IGNORECASE),
    # Page number lines that appear mid-content (e.g., "35", "36", "37")
    re.compile(r'^\s{10,}\d{1,4}\s*$'),
]


def is_skip_line(line):
    for pat in SKIP_PATTERNS:
        if pat.match(line):
            return True
    return False


def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f'boeger-{slug}'


def parse_boger(text):
    """Parse Boger's Synoptic Key — matches source structure exactly."""
    lines = text.split('\n')

    # Find the LAST "Materia medica" occurrence (first is in TOC)
    start_idx = 0
    for i, line in enumerate(lines):
        if line.strip() == 'Materia medica':
            start_idx = i + 1
    # start_idx is now after the last "Materia medica"

    # Remedy name: Title Case, standalone line (no leading spaces, no punctuation)
    # Examples: "Abrotanum", "Aconitum napellus", "Belladonna"
    REMEDY_TITLE = re.compile(r'^([A-Z][a-z]+(?:\s+[a-z]+)?)\s*$')

    remedies = []
    current_name = None
    current_alt_name = ''  # ALL CAPS alternate name (e.g., "ACONITE")
    current_sections = []
    current_section = None  # {'title': '', 'parts': [], 'subsections': []}
    current_subsection = None  # {'heading': '', 'parts': []}

    def flush_subsection():
        nonlocal current_subsection, current_section
        if current_subsection:
            # Save subsection even if it has no parts (e.g., "Joints." with no sub-items)
            content = ' '.join(current_subsection['parts']).strip()
            content = re.sub(r'\s+', ' ', content)
            # Save the heading even if content is empty — the heading itself is meaningful
            current_section['subsections'].append({
                'heading': current_subsection['heading'],
                'content': content or '(no specific sub-items)',
            })
        current_subsection = None

    def save_current():
        nonlocal current_name, current_alt_name, current_sections, current_section
        flush_subsection()
        if current_name:
            secs = []
            for s in current_sections:
                # Build content from parts
                content = ' '.join(s['parts']).strip()
                content = re.sub(r'\s+', ' ', content)
                # Also build subsection content
                subsections = []
                for sub in s.get('subsections', []):
                    sub_content = sub['content']
                    if sub_content:
                        subsections.append({
                            'heading': sub['heading'],
                            'content': sub_content,
                        })
                if content or subsections:
                    secs.append({
                        'title': s['title'],
                        'content': content,
                        'subsections': subsections,
                    })

            # Build full text
            full_parts = []
            if current_alt_name:
                full_parts.append(current_alt_name)
            for s in secs:
                full_parts.append(f"{s['title']}: {s['content']}")
            full = '\n'.join(full_parts)

            rec = {
                'id': make_id(current_name),
                'name': current_name,
                'common': current_alt_name,
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

            # Extract modalities, relationships, dose from sections
            for s in secs:
                t = s['title']
                if t in ('Related', 'Compare', 'Antidotes'):
                    if rec['relationships']:
                        rec['relationships'] += '\n' + s['content']
                    else:
                        rec['relationships'] = s['content']
                elif t == 'Dose':
                    rec['dose'] = s['content']
                elif t in ('Worse', 'Better'):
                    if rec['modalities']:
                        rec['modalities'] += '\n' + s['content']
                    else:
                        rec['modalities'] = s['content']

            remedies.append(rec)

        current_name = None
        current_alt_name = ''
        current_sections = []
        current_section = None

    for i, line in enumerate(lines[start_idx:], start=start_idx):
        if is_skip_line(line):
            continue

        ln = line.rstrip()
        stripped = ln.strip()
        if not stripped:
            continue

        # CHECK 1: Is this a known section heading?
        if stripped in BOGER_SECTIONS:
            flush_subsection()
            current_section = {
                'title': stripped,
                'parts': [],
                'subsections': [],
            }
            current_sections.append(current_section)
            continue

        # CHECK 2: Is this a remedy name (Title Case, standalone)?
        # Must be followed by either:
        # - ALL CAPS alternate name (e.g., "ACONITE")
        # - A known section heading (Region, Worse, etc.)
        m = REMEDY_TITLE.match(stripped)
        if m and stripped not in BOGER_SECTIONS:
            title = m.group(1).strip()
            words = title.split()
            # Filter: must be 1-2 words, first word 4+ chars
            if len(words) <= 2 and len(words[0]) >= 3:
                # Check next non-empty line
                next_line = ''
                for j in range(i+1, min(i+5, len(lines))):
                    next_stripped = lines[j].strip()
                    if next_stripped:
                        next_line = next_stripped
                        break

                # Accept if next line is: ALL CAPS alternate name, OR a known section
                is_remedy_start = False
                if next_line in BOGER_SECTIONS:
                    is_remedy_start = True
                elif (next_line.isupper() and len(next_line) >= 3 and
                      all(w.isalpha() for w in next_line.split()) and
                      len(next_line.split()) <= 3):
                    is_remedy_start = True

                if is_remedy_start:
                    save_current()
                    current_name = title
                    # If next line is ALL CAPS, it's the alternate name
                    if next_line.isupper() and next_line not in BOGER_SECTIONS:
                        current_alt_name = next_line
                        # Skip the next line (already consumed as alt name)
                        # We'll handle this by checking on next iteration
                    continue

        # CHECK 3: Is this a sub-section heading under Region?
        # Pattern 1: ALL CAPS word(s) ending with period (e.g., "MIND.", "NERVES.")
        # Pattern 2: Title Case word ending with period, standalone (e.g., "Viscera.", "Joints.")
        if current_section and current_section['title'] == 'Region':
            # Check for ALL CAPS sub-heading (e.g., "MIND.", "HEART.")
            sub_match = re.match(r'^([A-Z]{3,})\.?\s*$', stripped)
            if sub_match:
                heading = sub_match.group(1).rstrip('.')
                if heading in REGION_SUBSECTIONS or len(heading) >= 3:
                    flush_subsection()
                    current_subsection = {'heading': heading, 'parts': []}
                    continue
            # Check for Title Case sub-heading (e.g., "Viscera.", "Joints.")
            # Must be a single word, Title Case, ending with period, standalone
            # CRITICAL: Must NOT have leading indentation (indented items are sub-items, not headings)
            sub_match2 = re.match(r'^([A-Z][a-z]+)\.\s*$', stripped)
            if sub_match2 and not line.startswith(' '):
                heading = sub_match2.group(1)
                # Known Title Case sub-headings in Boger's Region
                if heading in {'Viscera', 'Joints', 'Glands', 'Bones', 'Muscles',
                               'Blood', 'Tissues', 'Skin', 'Mucous', 'Serous',
                               'Lungs', 'Liver', 'Spleen', 'Stomach', 'Intestines',
                               'Bladder', 'Uterus', 'Ovaries', 'Testes', 'Prostate',
                               'Thyroid', 'Pancreas', 'Lymphatics',
                               # Also Title Case body systems (Abrotanum etc.)
                               'Nerves', 'Nutrition', 'Veins', 'Mind', 'Head',
                               'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
                               'Neck', 'Back', 'Chest', 'Abdomen', 'Rectum',
                               'Kidneys', 'Heart', 'Brain', 'Spine',
                               'Respiratory', 'Circulatory', 'Digestive',
                               'Urinary', 'Genital', 'Reproductive',
                               'Endocrine', 'Immune', 'Nervous'}:
                    flush_subsection()
                    current_subsection = {'heading': heading, 'parts': []}
                    continue

        # Regular text — add to current section or subsection
        if current_section:
            if current_subsection is not None:
                current_subsection['parts'].append(stripped)
            else:
                current_section['parts'].append(stripped)
        # If no section yet and we have a remedy name, skip (content before first section)

    save_current()
    return remedies


def main():
    print("=" * 60)
    print("Boger v4 Parser — exact source structure match")
    print("=" * 60)

    with open('/tmp/boger.txt') as f:
        text = f.read()

    remedies = parse_boger(text)
    print(f"\nParsed {len(remedies)} Boger remedies")

    if remedies:
        # Show first 5
        print(f"\nFirst 5 remedies:")
        for r in remedies[:5]:
            titles = [s['title'] for s in r['sections']]
            sub_count = sum(len(s.get('subsections', [])) for s in r['sections'])
            print(f"  {r['name']} ({r.get('common','')}) | sections: {titles} | subsections: {sub_count}")

        # Detailed view of first remedy
        print(f"\n=== DETAILED: {remedies[0]['name']} ===")
        print(f"  id: {remedies[0]['id']}")
        print(f"  common (alt name): {remedies[0]['common']}")
        print(f"  sections ({len(remedies[0]['sections'])}):")
        for s in remedies[0]['sections']:
            print(f"    [{s['title']}]")
            if s.get('subsections'):
                print(f"      subsections:")
                for sub in s['subsections']:
                    print(f"        - {sub['heading']}: {sub['content'][:60]}")
            print(f"      content: {s['content'][:100]}...")
        print(f"  keynote: '{remedies[0]['keynote']}'")

    with open(f'{OUT_DIR}/boger-v4.json', 'w') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_DIR}/boger-v4.json ({len(remedies)} remedies)")


if __name__ == '__main__':
    main()
