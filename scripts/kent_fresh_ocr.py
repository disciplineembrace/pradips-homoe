#!/usr/bin/env python3
"""
Fresh Kent Materia Medica OCR parser — v3 (production quality).

Produces clean, structured text with:
- Proper paragraph rejoining (no mid-sentence breaks)
- Section headings preserved (Mind, Head, Eyes, Chest, etc.)
- No control characters
- No Nalanda noise
- No OCR artifacts
- Complete sentences with proper punctuation

Output: data/kent-remedies-fresh.json
"""
import json
import re
import os

RAW_FILE = "/home/z/my-project/work/kent-fresh/kent-raw.txt"
OUTPUT = "/home/z/my-project/data/kent-remedies-fresh.json"

# Kent section headings — these appear in the text as standalone words
SECTION_HEADINGS = {
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
}

# Heading aliases — maps TOC name to actual heading text in the body
HEADING_ALIASES = {
    'Aceticum acidum': ['Acetic Acidum', 'Aceticum acidum', 'Acetic acid'],
    'Actea racemosa': ['Actea Racemosa', 'Actea racemosa', 'Cimicifuga'],
    'Benzoicum acidum': ['Benzoicum acidum', 'Benzoic acid', 'Benzoic Acid'],
    'Cadmium sulfuricum': ['Cadmium sulfuricum', 'Cadmium sulphuricum'],
    'Calcarea sulfurica': ['Calcarea sulfurica', 'Calcarea sulphurica'],
    'Camphora': ['Camphora', 'Camphor'],
    'Carboneum sulfuratum': ['Carboneum sulfuratum', 'Carboneum sulphuratum'],
    'Cinnabaris': ['Cinnabaris', 'Cinnabar'],
    'Cistus canadensis': ['Cistus Canadensis', 'Cistus canadensis'],
    'Crotalus horridus': ['Crotalus horridus', 'Crotalus'],
    'Eupatorium perfoliatum': ['Eupatorium perfoliatum', 'Eupatorium', 'Eupatorium Perfoliatum'],
    'Hepar sulfuris calcareum': ['Hepar sulfuris calcareum', 'Hepar sulphuris', 'Hepar sulphur', 'Hepar sulfur'],
    'Iodum (Iodine)': ['Iodine', 'Iodum'],
    'Ipecacuanha': ['Ipecacuanha', 'Ipeca', 'Ipecac'],
    'Kalium sulfuricum': ['Kalium sulfuricum', 'Kali sulphuricum', 'Kali sulfuricum'],
    'Kalmia': ['Kalmia', 'Kalmia Latifolia'],
    'Lillium tigrinum': ['Lillium tigrinum', 'Lilium tigrinum', 'Lilium tig'],
    'Mercurius iodatus flavus': ['Mercurius Iodatus Flavus', 'Mercurius iodatus flavus'],
    'Mercurius iodatus ruber': ['Mercurius Iodatus Ruber', 'Mercurius iodatus ruber'],
    'Mercurius sulphuricus': ['Mercurius sulphuricus', 'Mercurius sulfuricus'],
    'Platina': ['Platina', 'Platinum'],
    'Spigelia anthelmia': ['Spigelia', 'Spigelia Anthelmintica', 'Spigelia anthelmia'],
    'Sulfur': ['Sulfur', 'Sulphur'],
    'Sulfuricum acidum': ['Sulfuricum acidum', 'Sulphuricum acidum', 'Sulphuric acid'],
    'Syphillinum': ['Syphillinum', 'Syphilinum'],
    'Tarentula hispana': ['Tarentula hispana', 'Tarentula Hispanica', 'Tarentula'],
    'Thuya occidentalis': ['Thuya occidentalis', 'Thuja', 'Thuja Occidentalis', 'Thuya'],
}

# Noise line patterns
NOISE_PATTERNS = [
    re.compile(r'^Nalanda Digital Library.*$'),
    re.compile(r'^Public Domain Text.*$'),
    re.compile(r'^LECTURES ON HOM[ŒOE]PATHIC'),
    re.compile(r'^MATERIA MEDICA\s*$'),
    re.compile(r'^by JAMES TYLER KENT'),
    re.compile(r'^Late Professor'),
    re.compile(r'^College, Chicago'),
    re.compile(r'^James Tyler Kent'),
    re.compile(r'^Guiding Symptoms'),
    re.compile(r'^\s*\d{1,4}\s*$'),  # Page numbers
]

FALSE_POSITIVES = {
    'Materia', 'Medica', 'Preface', 'College', 'Chicago',
    'Index', 'Contents', 'Chapter', 'Page', 'Part',
    'Section', 'Book', 'Volume', 'Introduction',
    'Homoeopathy', 'Nalanda', 'Library', 'Regional',
    'Engineering', 'Calicut', 'India', 'James', 'Tyler',
    'Kent', 'Hering', 'Public', 'Domain', 'Text',
}


def is_noise(line):
    stripped = line.strip()
    if not stripped:
        return False
    for pat in NOISE_PATTERNS:
        if pat.match(stripped):
            return True
    return False


def load_toc_names(text):
    """Extract remedy names from Table of Contents."""
    pattern = re.compile(r'^\d{1,3}-\s+(.+?)\s*$', re.MULTILINE)
    matches = pattern.findall(text)
    names = []
    for name in matches:
        name = re.sub(r'[\x00-\x1F\x7F]', '', name)
        name = re.sub(r'\s+', ' ', name.strip()).rstrip('.').strip()
        if name and len(name) > 2:
            names.append(name)
    seen = set()
    unique = []
    for n in names:
        if n not in seen:
            unique.append(n)
            seen.add(n)
    return unique


def clean_and_rejoin(text):
    """
    Clean OCR artifacts and rejoin paragraphs.

    The -layout mode inserts blank lines and control chars mid-sentence.
    We:
    1. Remove all control characters
    2. Remove noise lines
    3. Rejoin lines into paragraphs (new paragraph only when prev ends
       with sentence punctuation AND next starts with capital)
    4. Preserve section headings on their own lines
    """
    # Remove control chars
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)

    lines = text.split('\n')

    # Pass 1: normalize and remove noise
    cleaned = []
    for line in lines:
        if is_noise(line):
            continue
        line = re.sub(r' {2,}', ' ', line).rstrip()
        cleaned.append(line)

    # Pass 2: rejoin into paragraphs
    result = []
    current_para = []
    prev_ended_sentence = False

    for line in cleaned:
        stripped = line.strip()

        # Skip blank lines (layout mode inserts them randomly)
        if not stripped:
            continue

        # Section heading = its own line
        if stripped in SECTION_HEADINGS:
            if current_para:
                result.append(' '.join(current_para))
                current_para = []
            result.append(stripped)
            prev_ended_sentence = False
            continue

        # Check if this starts a new paragraph
        if current_para:
            this_starts_capital = bool(re.match(r'^[A-Z]', stripped))
            if prev_ended_sentence and this_starts_capital:
                result.append(' '.join(current_para))
                current_para = [stripped]
            else:
                current_para.append(stripped)
        else:
            current_para = [stripped]

        prev_ended_sentence = bool(re.search(r'[.!?:;]\s*$', stripped))

    if current_para:
        result.append(' '.join(current_para))

    # Add blank lines between elements for readability
    final = []
    for i, line in enumerate(result):
        final.append(line)
        if i < len(result) - 1:
            final.append('')

    return '\n'.join(final).strip()


def identify_inline_headings(text):
    """Split out 'Heading: text' patterns onto separate lines."""
    lines = text.split('\n')
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped in SECTION_HEADINGS:
            result.append(stripped)
            continue
        # Check "Heading: rest" pattern
        match = re.match(r'^(' + '|'.join(re.escape(h) for h in SECTION_HEADINGS) + r'):\s*(.+)$', stripped)
        if match:
            result.append(match.group(1))
            if match.group(2).strip():
                result.append(match.group(2).strip())
        else:
            result.append(line)
    return '\n'.join(result)


def find_remedies(text):
    """Find remedy boundaries using TOC names + aliases."""
    toc_names = load_toc_names(text)
    print(f"  TOC names: {len(toc_names)}")

    lines = text.split('\n')

    # Find content start (first Abrotanum after TOC)
    content_start = 0
    for i, line in enumerate(lines):
        if line.strip() == 'Abrotanum' and i > 500:
            content_start = i
            break

    remedies = []
    for name in toc_names:
        name_clean = name.rstrip('.')
        variants = HEADING_ALIASES.get(name_clean, [name_clean])

        found = False
        for variant in variants:
            if found:
                break
            variant_clean = variant.rstrip('.')
            pattern = re.compile(
                r'^\s*' + re.escape(variant_clean) + r'(\s*\(.*|\s*\(.*\))?\.?\s*$',
                re.IGNORECASE
            )
            for i in range(content_start, len(lines)):
                if pattern.match(lines[i]):
                    # Verify followed by content
                    has_content = False
                    for j in range(i + 1, min(i + 10, len(lines))):
                        next_stripped = lines[j].strip()
                        if next_stripped and not is_noise(next_stripped):
                            has_content = True
                            break
                    if has_content:
                        remedies.append((i, name_clean))
                        found = True
                        break

    remedies.sort(key=lambda x: x[0])

    # Deduplicate
    seen = set()
    unique = []
    for i, name in remedies:
        if name not in seen:
            unique.append((i, name))
            seen.add(name)

    return unique


def get_remedy_id(name):
    slug = re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-').replace('.', ''))
    return f"kent-mm-{slug}"


def parse_remedy(name, text):
    """Build remedy object."""
    full = identify_inline_headings(text)

    # Keynote = first non-heading paragraph
    keynote = ''
    for line in full.split('\n'):
        line = line.strip()
        if line and line not in SECTION_HEADINGS:
            keynote = line[:300]
            break

    return {
        'id': get_remedy_id(name),
        'name': name,
        'common': '',
        'author': 'Kent',
        'letter': name[0].upper() if name else '?',
        'chapter': 'Kent MM',
        'organ': '—',
        'modalities': '',
        'constitution': '',
        'relationships': '—',
        'dose': '',
        'keynote': keynote,
        'full': full,
    }


def main():
    print("=" * 70)
    print("FRESH KENT MATERIA MEDICA OCR PARSER v3")
    print("=" * 70)

    with open(RAW_FILE, 'r', encoding='utf-8') as f:
        raw_text = f.read()
    print(f"Raw text: {len(raw_text):,} chars")

    lines = raw_text.split('\n')
    remedies = find_remedies(raw_text)
    print(f"Found {len(remedies)} remedies")

    remedy_objects = []
    for i, (start_idx, name) in enumerate(remedies):
        end_idx = remedies[i + 1][0] if i + 1 < len(remedies) else len(lines)
        raw = '\n'.join(lines[start_idx:end_idx])
        # Remove remedy name from start
        raw = raw.lstrip()
        if raw.startswith(name):
            raw = raw[len(name):]
        text = clean_and_rejoin(raw)
        obj = parse_remedy(name, text)
        remedy_objects.append(obj)

        if len(obj['full']) < 100:
            print(f"  ⚠️  WARNING: {name} has only {len(obj['full'])} chars")
        if i < 3 or i % 20 == 0:
            print(f"  [{i+1}/{len(remedies)}] {name}: {len(obj['full']):,} chars")

    # Write
    print(f"\nWriting {len(remedy_objects)} remedies to {OUTPUT}")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(remedy_objects, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(OUTPUT)
    print(f"File size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")

    # Verify
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)

    ctrl = sum(1 for r in remedy_objects if re.search(r'[\x00-\x08\x0E-\x1F]', r['full']))
    print(f"Control chars: {ctrl} (should be 0)")

    names = [r['name'] for r in remedy_objects]
    dups = [n for n in names if names.count(n) > 1]
    print(f"Duplicates: {len(set(dups))} (should be 0)")

    empty = [r for r in remedy_objects if len(r['full']) < 100]
    print(f"Empty (<100 chars): {len(empty)} (should be 0)")

    noise = sum(1 for r in remedy_objects if 'Nalanda' in r['full'] or 'Public Domain Text' in r['full'])
    print(f"Nalanda noise: {noise} (should be 0)")

    # Sample
    print(f"\n=== Sample: {remedy_objects[0]['name']} (first 600 chars) ===")
    print(remedy_objects[0]['full'][:600])

    print("\n" + "=" * 70)
    print("DONE")
    print("=" * 70)


if __name__ == '__main__':
    main()
