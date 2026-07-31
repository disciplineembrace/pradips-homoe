#!/usr/bin/env python3
"""
Fresh Kent Materia Medica OCR parser — v2 (improved paragraph rejoining).

Uses pdftotext -layout output (which preserves visual structure) and then
intelligently rejoins lines into proper paragraphs.

Key improvements over v1:
  - Rejoins lines that are part of the same sentence (no blank line between them)
  - Preserves blank lines as paragraph separators
  - Better heading detection
  - Removes Nalanda noise lines that appear mid-remedy
"""
import json
import re
import os

RAW_FILE = "/home/z/my-project/work/kent-fresh/kent-raw.txt"
OUTPUT = "/home/z/my-project/data/kent-remedies-fresh.json"

# Known section headings in Kent's Materia Medica
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
    'Prostate', 'Ovaries', 'Uterus', 'Vagina', 'Larynx',
    'Trachea', 'Bronchi', 'Lungs', 'Pericardium', 'Arteries',
    'Veins', 'Nerves', 'Muscles', 'Bones', 'Joints',
    'Spine', 'Limbs', 'Hands', 'Feet', 'Fingers', 'Toes',
    'Hair', 'Nails', 'Teeth', 'Tongue', 'Gums', 'Saliva',
    'Voice', 'Speech', 'Hearing', 'Vision', 'Smell', 'Taste',
    'Appetite', 'Thirst', 'Vomiting', 'Nausea', 'Eructations',
    'Hiccough', 'Flatulence', 'Constipation', 'Stool',
    'Urine', 'Micturition', 'Semen', 'Sexual', 'Menstruation',
    'Leucorrhoea', 'Conception', 'Parturition', 'Infant',
    'Old age', 'Children', 'Women', 'Men',
}

# Remedy name pattern: standalone capitalized word on its own line
REMEDY_NAME_RE = re.compile(r'^[A-Z][a-z]{2,25}\s*$')

# Noise patterns — lines to remove completely
NOISE_LINE_PATTERNS = [
    re.compile(r'^Nalanda Digital Library.*$'),
    re.compile(r'^Public Domain Text.*$'),
    re.compile(r'^LECTURES ON HOM[ŒOE]PATHIC\s*$'),
    re.compile(r'^MATERIA MEDICA\s*$'),
    re.compile(r'^by JAMES TYLER KENT.*$'),
    re.compile(r'^Late Professor.*$'),
    re.compile(r'^College, Chicago\..*$'),
    re.compile(r'^James Tyler Kent.*$'),
    re.compile(r'^Guiding Symptoms.*$'),
    re.compile(r'^Homoeopathy$'),
    re.compile(r'^Materia Medica$'),
    re.compile(r'^\s*\d{1,4}\s*$'),  # Page numbers
]

# Words that look like remedy names but aren't
FALSE_POSITIVES = {
    'Materia', 'Medica', 'Preface', 'College', 'Chicago',
    'Index', 'Contents', 'Chapter', 'Page', 'Part',
    'Section', 'Book', 'Volume', 'Introduction',
    'Homoeopathy', 'Hom[oe]opathy', 'Nalanda', 'Library',
    'Regional', 'Engineering', 'Calicut', 'India',
    'James', 'Tyler', 'Kent', 'Hering', 'Chicago',
    'Public', 'Domain', 'Text', 'Converted', 'Format',
}


def is_noise_line(line):
    """Check if a line is noise (header/footer/page number)."""
    stripped = line.strip()
    if not stripped:
        return False  # Blank lines are NOT noise — they separate paragraphs
    for pat in NOISE_LINE_PATTERNS:
        if pat.match(stripped):
            return True
    return False


def clean_control_chars(text):
    """Remove control characters except \n, \t, \r."""
    return re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)


def normalize_whitespace(line):
    """Collapse runs of spaces to single space, strip trailing."""
    # Replace runs of 2+ spaces with single space
    line = re.sub(r' {2,}', ' ', line)
    return line.rstrip()


def rejoin_paragraphs(text):
    """
    Rejoin lines that are part of the same paragraph.

    The -layout mode inserts blank lines and control chars mid-sentence.
    We need to:
    1. Remove all control chars first
    2. Remove noise lines
    3. Treat a REAL paragraph break as: previous line ends with . ! ? : ;
       AND next non-blank line starts with a capital letter or heading
    4. Blank lines between non-sentence-ending lines are just layout artifacts
    """
    # First: remove ALL control characters
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)

    lines = text.split('\n')

    # First pass: normalize whitespace and remove noise
    cleaned = []
    for line in lines:
        if is_noise_line(line):
            continue
        line = normalize_whitespace(line)
        cleaned.append(line)

    # Second pass: merge lines into paragraphs
    # A new paragraph starts when:
    #   - The previous content line ends with sentence punctuation (. ! ? : ;)
    #   - AND the next content line starts with a capital letter
    # Blank lines are NOT paragraph breaks by themselves (layout mode inserts them randomly)
    result = []
    current_para = []
    prev_ended_sentence = False

    for line in cleaned:
        stripped = line.strip()

        # Skip blank lines (don't treat as paragraph break — layout mode inserts them)
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

        # Decide if this line starts a new paragraph
        if current_para:
            this_starts_capital = bool(re.match(r'^[A-Z]', stripped))
            this_is_short_heading = len(stripped) < 80

            if prev_ended_sentence and this_starts_capital and this_is_short_heading:
                # New paragraph
                result.append(' '.join(current_para))
                current_para = [stripped]
            else:
                # Continue current paragraph
                current_para.append(stripped)
        else:
            current_para = [stripped]

        # Check if this line ends with sentence punctuation
        prev_ended_sentence = bool(re.search(r'[.!?:;]\s*$', stripped))

    if current_para:
        result.append(' '.join(current_para))

    # Add blank lines between paragraphs and headings for readability
    final_lines = []
    for i, line in enumerate(result):
        final_lines.append(line)
        # Add blank line after headings and after paragraphs (except last)
        if i < len(result) - 1:
            final_lines.append('')

    text = '\n'.join(final_lines)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()


def load_toc_remedy_names():
    """
    Extract the full list of remedy names from the Table of Contents.
    Also includes alternate heading names found in the text.

    Returns a list of (toc_name, heading_variants) tuples.
    """
    with open(RAW_FILE, 'r', encoding='utf-8') as f:
        text = f.read()

    # Match lines like "01- Abrotanum" or "66- Aconitum napellus"
    pattern = re.compile(r'^\d{1,3}-\s+(.+?)\s*$', re.MULTILINE)
    matches = pattern.findall(text)

    # Clean up: remove control chars, trailing spaces, trailing periods
    names = []
    for name in matches:
        # Remove control characters first (they appear in some TOC entries)
        name = re.sub(r'[\x00-\x1F\x7F]', '', name)
        name = re.sub(r'\s+', ' ', name.strip()).rstrip('.').strip()
        if name and len(name) > 2:
            names.append(name)

    # Deduplicate
    seen = set()
    unique = []
    for n in names:
        if n not in seen:
            unique.append(n)
            seen.add(n)

    return unique


# Alternate heading names — maps TOC name to the actual heading text in the body
# (discovered by inspecting the raw text)
HEADING_ALIASES = {
    'Aceticum acidum': ['Acetic Acidum', 'Aceticum acidum', 'Acetic acid', 'Acetic Acid'],
    'Actea racemosa': ['Actea Racemosa', 'Actea racemosa', 'Cimicifuga'],
    'Benzoicum acidum': ['Benzoicum acidum', 'Benzoic acid', 'Benzoic Acid', 'Benzoicum Acidum'],
    'Cadmium sulfuricum': ['Cadmium sulfuricum', 'Cadmium sulphuricum', 'Cadmium Sulphuricum'],
    'Calcarea sulfurica': ['Calcarea sulfurica', 'Calcarea sulphurica', 'Calcarea Sulphurica'],
    'Camphora': ['Camphora', 'Camphor'],
    'Carboneum sulfuratum': ['Carboneum sulfuratum', 'Carboneum sulphuratum', 'Bisulfide of Carbon'],
    'Cinnabaris': ['Cinnabaris', 'Cinnabar'],
    'Cistus canadensis': ['Cistus Canadensis', 'Cistus canadensis', 'Cistus Canaden'],
    'Crotalus horridus': ['Crotalus horridus', 'Crotalus'],
    'Eupatorium perfoliatum': ['Eupatorium perfoliatum', 'Eupatorium', 'Eupatorium Perfoliatum'],
    'Hepar sulfuris calcareum': ['Hepar sulfuris calcareum', 'Hepar sulphuris', 'Hepar sulphur', 'Hepar sulfur', 'Hepar Sulphuris'],
    'Iodum (Iodine)': ['Iodine', 'Iodum', 'Iodum (Iodine)'],
    'Ipecacuanha': ['Ipecacuanha', 'Ipeca', 'Ipecac'],
    'Kalium sulfuricum': ['Kalium sulfuricum', 'Kali sulphuricum', 'Kali sulfuricum', 'Kalium Sulphuricum', 'Kali Sulphuricum'],
    'Kalmia': ['Kalmia', 'Kalmia Latifolia'],
    'Lillium tigrinum': ['Lillium tigrinum', 'Lilium tigrinum', 'Lilium tig'],
    'Mercurius iodatus flavus': ['Mercurius Iodatus Flavus', 'Mercurius iodatus flavus', 'Mercurius Iodatus Flavus (Proto-iodide'],
    'Mercurius iodatus ruber': ['Mercurius Iodatus Ruber', 'Mercurius iodatus ruber', 'Mercurius Iodatus Ruber (Bin-iodide', 'Mercurius Iodatus Ruber (Biniodide'],
    'Mercurius sulphuricus': ['Mercurius sulphuricus', 'Mercurius sulfuricus', 'Mercurius Sulphuricus', 'Mercurius Sulphuricum'],
    'Platina': ['Platina', 'Platinum', 'Platinum (Platina)'],
    'Spigelia anthelmia': ['Spigelia', 'Spigelia Anthelmintica', 'Spigelia anthelmia', 'Spigelia Anthelmia'],
    'Sulfur': ['Sulfur', 'Sulphur', 'Sulphur (Sulfur)'],
    'Sulfuricum acidum': ['Sulfuricum acidum', 'Sulphuricum acidum', 'Sulphuric acid', 'Sulphuricum Acidum', 'Acidum Sulphuricum'],
    'Syphillinum': ['Syphillinum', 'Syphilinum', 'Syphilinum (Syphillinum)'],
    'Tarentula hispana': ['Tarentula hispana', 'Tarentula Hispanica', 'Tarentula', 'Tarentula Hispana'],
    'Thuya occidentalis': ['Thuya occidentalis', 'Thuja', 'Thuja Occidentalis', 'Thuya', 'Thuya Occidentalis'],
}


def find_remedy_boundaries(text):
    """
    Find remedy boundaries using the TOC names + heading aliases.
    """
    toc_names = load_toc_remedy_names()
    print(f"  Loaded {len(toc_names)} remedy names from TOC")

    lines = text.split('\n')

    # Find content start (first Abrotanum heading after TOC)
    content_start = 0
    for i, line in enumerate(lines):
        if line.strip() == 'Abrotanum' and i > 500:
            content_start = i
            break

    # For each TOC name, find its heading in the content
    remedies = []
    for name in toc_names:
        name_clean = name.rstrip('.')
        # Get all possible heading variants for this remedy
        variants = HEADING_ALIASES.get(name_clean, [name_clean])

        found = False
        for variant in variants:
            if found:
                break
            variant_escaped = re.escape(variant.rstrip('.'))
            # Match heading as standalone line (case-insensitive)
            # Allow optional text after the name (parentheticals, subtitles)
            # e.g., "Actea Racemosa (Black Cohosh)" or "Cistus Canadensis (see too Salts of"
            pattern = re.compile(
                r'^\s*' + variant_escaped + r'(\s*\(.*|\s*\(.*\))?\.?\s*$',
                re.IGNORECASE
            )

            for i in range(content_start, len(lines)):
                if pattern.match(lines[i]):
                    # Verify followed by content
                    has_content = False
                    for j in range(i + 1, min(i + 10, len(lines))):
                        next_stripped = lines[j].strip()
                        if next_stripped and not is_noise_line(next_stripped):
                            has_content = True
                            break
                    if has_content:
                        # Use the TOC name as the canonical name
                        remedies.append((i, name_clean))
                        found = True
                        break

    # Sort by line number
    remedies.sort(key=lambda x: x[0])

    # Deduplicate
    seen = set()
    unique = []
    for i, name in remedies:
        if name not in seen:
            unique.append((i, name))
            seen.add(name)

    return unique


def extract_and_clean_remedy(lines, start_idx, end_idx):
    """Extract text for a remedy and clean it."""
    raw = '\n'.join(lines[start_idx:end_idx])
    # Remove the remedy name from the start (it'll be in the 'name' field)
    raw = raw.lstrip()
    if raw.startswith(lines[start_idx].strip()):
        raw = raw[len(lines[start_idx].strip()):]
    return rejoin_paragraphs(raw)


def identify_inline_headings(text):
    """
    Split out inline headings like 'Mind' or 'Head' that appear at the
    start of a paragraph. Put them on their own line.
    """
    lines = text.split('\n')
    result = []
    for line in lines:
        stripped = line.strip()
        # Check if line is exactly a section heading
        if stripped in SECTION_HEADINGS:
            result.append(stripped)
            continue
        # Check "Heading: rest of text" pattern
        match = re.match(r'^(' + '|'.join(re.escape(h) for h in SECTION_HEADINGS) + r'):\s*(.+)$', stripped)
        if match:
            result.append(match.group(1))
            result.append(match.group(2))
        else:
            result.append(line)
    return '\n'.join(result)


def get_remedy_id(name):
    """Generate URL-safe ID like 'kent-mm-aconitum-napellus'."""
    slug = name.lower().replace(' ', '-').replace('.', '')
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    return f"kent-mm-{slug}"


def parse_remedy(name, text):
    """Build remedy object matching remedies.json schema."""
    # Apply heading identification
    full = identify_inline_headings(text)

    # Keynote = first non-heading paragraph, truncated
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
    print("FRESH KENT MATERIA MEDICA OCR PARSER v2")
    print("=" * 70)

    with open(RAW_FILE, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    print(f"Raw text: {len(raw_text):,} chars")

    lines = raw_text.split('\n')
    remedies = find_remedy_boundaries(raw_text)
    print(f"Found {len(remedies)} remedies")

    remedy_objects = []
    for i, (start_idx, name) in enumerate(remedies):
        end_idx = remedies[i + 1][0] if i + 1 < len(remedies) else len(lines)
        text = extract_and_clean_remedy(lines, start_idx, end_idx)
        obj = parse_remedy(name, text)
        remedy_objects.append(obj)

        if len(obj['full']) < 100:
            print(f"  ⚠️  WARNING: {name} has only {len(obj['full'])} chars")
        if i < 3 or i % 10 == 0:
            print(f"  [{i + 1}/{len(remedies)}] {name}: {len(obj['full']):,} chars")

    # Write output
    print(f"\nWriting {len(remedy_objects)} remedies to {OUTPUT}")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(remedy_objects, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(OUTPUT)
    print(f"File size: {file_size:,} bytes ({file_size / 1024 / 1024:.1f} MB)")

    # Verification
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)

    ctrl_count = sum(1 for r in remedy_objects if re.search(r'[\x00-\x08\x0E-\x1F]', r['full']))
    print(f"Remedies with control chars: {ctrl_count} (should be 0)")

    names = [r['name'] for r in remedy_objects]
    dups = [n for n in names if names.count(n) > 1]
    print(f"Duplicate remedies: {len(set(dups))} (should be 0)")

    empty = [r['name'] for r in remedy_objects if len(r['full']) < 100]
    print(f"Remedies with <100 chars: {len(empty)} (should be 0)")

    # Check for Nalanda noise in output
    noise_count = sum(1 for r in remedy_objects if 'Nalanda' in r['full'] or 'Public Domain Text' in r['full'])
    print(f"Remedies with Nalanda noise: {noise_count} (should be 0)")

    # Sample
    print(f"\n=== Sample: {remedy_objects[0]['name']} (first 800 chars) ===")
    print(remedy_objects[0]['full'][:800])

    print("\n" + "=" * 70)
    print("DONE")
    print("=" * 70)


if __name__ == '__main__':
    main()
