#!/usr/bin/env python3
"""
Fresh OCR rebuild of Kent's Materia Medica — uses existing remedy names as
boundary markers, extracts fresh text between them, and cleans the formatting.

Strategy:
1. Use pdftotext -layout to extract text from the source PDF (fresh extraction).
2. Clean page artifacts (Nalanda headers, page numbers, excessive blank lines).
3. Use the 167 known Kent remedy names (from remedies.json) as boundaries.
4. For each remedy, extract the text between its name and the next remedy name.
5. Clean the text: join broken lines, format section headings as bold.
6. Save as data/kent-remedies-fresh.json with the same schema.
7. Replace Kent entries in data/remedies.json with the fresh data.
"""
import subprocess
import re
import json
import os
import sys

PDF = "/home/z/my-project/upload/5 Kent MM.pdf"
RAW_TXT = "/home/z/my-project/work/kent-ocr/kent-raw-fresh.txt"
CLEAN_TXT = "/home/z/my-project/work/kent-ocr/kent-clean-fresh.txt"
REMEDIES_JSON = "/home/z/my-project/data/remedies.json"
OUTPUT_JSON = "/home/z/my-project/data/kent-remedies-fresh.json"

os.makedirs("/home/z/my-project/work/kent-ocr", exist_ok=True)


def clean_remedy_content(content):
    """Clean OCR text: join broken lines, format headings, remove artifacts."""
    # 1. Remove excessive blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    # 2. Remove leading/trailing whitespace per line
    lines = [line.strip() for line in content.split('\n')]
    content = '\n'.join(lines)

    # 3. Remove lines that are only whitespace
    content = re.sub(r'\n[ \t]+\n', '\n\n', content)

    # 4. Join continuation lines (PDF breaks sentences across lines)
    lines = content.split('\n')
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Skip empty lines
        if not line:
            if merged and merged[-1] != '':
                merged.append('')
            i += 1
            continue

        # Check if this line ends with sentence-ending punctuation
        ends_with_sentence = bool(re.search(r'[.!?;:]$', line))

        # Check if next line is a section heading (Word: format)
        next_is_heading = False
        if i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            # Heading pattern: "Word:" or "Word word:" at start of line
            if re.match(r'^[A-Z][a-z]+(?:\s+[a-z]+)?:\s*$', next_line):
                next_is_heading = True

        # If line doesn't end with sentence punctuation and next isn't a heading,
        # join with next line if next line starts with lowercase
        if (not ends_with_sentence and not next_is_heading and
            i + 1 < len(lines) and lines[i + 1].strip()):

            next_line = lines[i + 1].strip()

            # Join if next line starts with lowercase
            if next_line[0].islower():
                merged.append(line + ' ' + next_line)
                i += 2
                continue

            # Join if current line is very short (< 40 chars) and next line continues
            if len(line) < 40 and not re.search(r'[.!?]$', line):
                # Check if next line looks like a continuation (not a new heading)
                if not re.match(r'^[A-Z][a-z]+:', next_line):
                    merged.append(line + ' ' + next_line)
                    i += 2
                    continue

        merged.append(line)
        i += 1

    content = '\n'.join(merged)

    # 5. Format section headings as markdown bold (## Heading)
    # Kent uses "Heading:" format (e.g., "Mind:", "Chest:", "Marasmus:")
    headings = [
        'Introduction', 'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face',
        'Mouth', 'Throat', 'Stomach', 'Abdomen', 'Rectum', 'Urinary Organs',
        'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back',
        'Extremities', 'Sleep', 'Fever', 'Skin', 'Generalities',
        'Marasmus', 'Metastasis', 'Suppression', 'Relations',
        'Clinical', 'Symptoms', 'Modalities', 'Dose',
    ]
    for heading in headings:
        # Convert "Heading:" or "Heading :" to "## Heading"
        content = re.sub(
            r'^' + re.escape(heading) + r'\s*:\s*$',
            f'## {heading}',
            content,
            flags=re.MULTILINE
        )
        # Also handle "Heading: text on same line"
        content = re.sub(
            r'^' + re.escape(heading) + r'\s*:\s*',
            f'## {heading}\n',
            content,
            flags=re.MULTILINE
        )

    # 6. Final cleanup
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = content.strip()

    return content

# ============================================================
# STEP 1: Fresh PDF text extraction
# ============================================================
print("=" * 70)
print("STEP 1: Fresh PDF text extraction")
print("=" * 70)

print(f"Running pdftotext -layout on Kent source PDF...")
result = subprocess.run(
    ["pdftotext", "-layout", PDF, RAW_TXT],
    capture_output=True, text=True
)
if result.returncode != 0:
    print(f"ERROR: pdftotext failed: {result.stderr}")
    sys.exit(1)

raw_size = os.path.getsize(RAW_TXT)
print(f"  Extracted {raw_size:,} bytes")

# ============================================================
# STEP 2: Clean page artifacts
# ============================================================
print("\n" + "=" * 70)
print("STEP 2: Clean page artifacts")
print("=" * 70)

with open(RAW_TXT, "r", encoding="utf-8", errors="replace") as f:
    text = f.read()

print(f"  Raw: {len(text):,} chars, {text.count(chr(10)):,} lines")

# Remove Nalanda digital library headers/footers (appear on every page)
text = re.sub(r'Nalanda Digital Library.*?Calicut.*?India', '', text, flags=re.DOTALL)
text = re.sub(r'Public Domain Text Converted into PDF Format by Nalanda\s*\d*', '', text)
text = re.sub(r'LECTURES ON HOM[ŒÆ]OPATHIC MATERIA MEDICA', '', text)

# Remove standalone page numbers
text = re.sub(r'\n\s*\d{1,4}\s*\n', '\n', text)

# Collapse multiple blank lines
text = re.sub(r'\n{3,}', '\n\n', text)

# Strip trailing whitespace from each line
lines = [line.rstrip() for line in text.split('\n')]
text = '\n'.join(lines)

# Remove lines that are only whitespace
text = re.sub(r'\n[ \t]+\n', '\n\n', text)
text = re.sub(r'\n{3,}', '\n\n', text)

print(f"  Cleaned: {len(text):,} chars, {text.count(chr(10)):,} lines")

with open(CLEAN_TXT, "w", encoding="utf-8") as f:
    f.write(text)
print(f"  Saved to {CLEAN_TXT}")

# ============================================================
# STEP 3: Get remedy names from existing remedies.json
# ============================================================
print("\n" + "=" * 70)
print("STEP 3: Load existing Kent remedy names as boundaries")
print("=" * 70)

with open(REMEDIES_JSON, "r", encoding="utf-8") as f:
    all_remedies = json.load(f)

kent_remedies = [r for r in all_remedies if r.get('author') == 'Kent']
print(f"  Found {len(kent_remedies)} existing Kent remedies in remedies.json")

# Sort alphabetically by name
kent_remedies.sort(key=lambda r: r['name'].lower())

# ============================================================
# STEP 4: Find each remedy in the text and extract content
# ============================================================
print("\n" + "=" * 70)
print("STEP 4: Extract fresh text for each remedy")
print("=" * 70)

# Build a list of (name, search_variants) for each remedy
# Kent PDF may use slightly different names (e.g., "Aloe" vs "Aloe socotrina")
def get_search_variants(name):
    variants = [name]
    # Common abbreviations/alternates in Kent
    alternates = {
        'Aloe socotrina': ['Aloe', 'Aloe socotrina', 'Aloe soc.'],
        'Actaea racemosa': ['Actaea racemosa', 'Actea racemosa', 'Cimicifuga racemosa'],
        'Cinchona officinalis': ['Cinchona officinalis', 'China officinalis', 'Cinchona'],
        'Hepar sulphur': ['Hepar sulphur', 'Hepar sulph.', 'Hepar sulphuris'],
        'Lycopodium clavatum': ['Lycopodium clavatum', 'Lycopodium'],
        'Lachesis mutus': ['Lachesis mutus', 'Lachesis'],
        'Mercurius vivus': ['Mercurius vivus', 'Mercurius'],
        'Pulsatilla nigricans': ['Pulsatilla nigricans', 'Pulsatilla', 'Pulsatilla nig.'],
        'Sulphur': ['Sulphur', 'Sulfur'],
        'Bryonia alba': ['Bryonia alba', 'Bryonia'],
        'Belladonna': ['Belladonna', 'Belladonna atropa'],
        'Nux vomica': ['Nux vomica', 'Nux vom.'],
        'Phosphorus': ['Phosphorus', 'Phos.'],
        'Apis mellifica': ['Apis mellifica', 'Apis'],
        'Argentum nitricum': ['Argentum nitricum', 'Argentum nit.'],
        'Arsenicum album': ['Arsenicum album', 'Arsenicum alb.'],
        'Calcarea carbonica': ['Calcarea carbonica', 'Calcarea carb.', 'Calcarea'],
        'Causticum': ['Causticum', 'Caust.'],
        'Ignatia amara': ['Ignatia amara', 'Ignatia'],
        'Ipecacuanha': ['Ipecacuanha', 'Ipecac'],
        'Kali carbonicum': ['Kali carbonicum', 'Kali carb.'],
        'Natrum muriaticum': ['Natrum muriaticum', 'Natrum mur.'],
        'Nux moschata': ['Nux moschata', 'Nux mosch.'],
        'Sepia officinalis': ['Sepia officinalis', 'Sepia'],
        'Silicea terra': ['Silicea terra', 'Silicea', 'Silica'],
        'Spongia tosta': ['Spongia tosta', 'Spongia'],
        'Thuja occidentalis': ['Thuja occidentalis', 'Thuja'],
        'Rhus toxicodendron': ['Rhus toxicodendron', 'Rhus tox.'],
    }
    if name in alternates:
        variants = alternates[name]
    return variants

# Find all remedy positions in text
print(f"  Searching for {len(kent_remedies)} remedies in {len(text):,} chars of text...")

remedy_data = []  # List of (position, name, original_remedy)
found_count = 0
not_found = []

for remedy in kent_remedies:
    name = remedy['name']
    variants = get_search_variants(name)
    found = False

    for variant in variants:
        # Search for the variant as a heading (on its own line, possibly with surrounding whitespace)
        # Use a flexible pattern that allows for extra spaces
        # The PDF text may have the name with trailing spaces, tabs, or on a line with other text
        pattern = re.compile(r'^\s*' + re.escape(variant) + r'\s*$', re.MULTILINE)
        matches = list(pattern.finditer(text))

        # If exact match fails, try a more forgiving search: name at start of a line
        if not matches:
            pattern2 = re.compile(r'^' + re.escape(variant) + r'\b', re.MULTILINE)
            matches = list(pattern2.finditer(text))

        if matches:
            # Use the match that has the most content after it
            # (the TOC entry has little content; the actual section has lots)
            best_match = None
            best_content_len = 0
            for m in matches:
                pos = m.start()
                # Check content length to next known remedy
                content_after = text[pos + len(variant):pos + 10000]
                content_len = len(content_after.strip())
                if content_len > best_content_len:
                    best_content_len = content_len
                    best_match = m

            if best_match and best_content_len > 200:
                remedy_data.append({
                    'position': best_match.start(),
                    'name': name,  # Keep original name
                    'original': remedy,
                    'variant_used': variant,
                })
                found = True
                found_count += 1
                break

    if not found:
        not_found.append(name)

print(f"  Found: {found_count}/{len(kent_remedies)}")
if not_found:
    print(f"  Not found: {len(not_found)}")
    for name in not_found[:10]:
        print(f"    - {name}")

# Sort by position in text
remedy_data.sort(key=lambda x: x['position'])

# ============================================================
# STEP 5: Extract and clean each remedy's content
# ============================================================
print("\n" + "=" * 70)
print("STEP 5: Extract and clean each remedy")
print("=" * 70)

fresh_remedies = []

for i, rd in enumerate(remedy_data):
    name = rd['name']
    original = rd['original']
    variant = rd['variant_used']
    start = rd['position'] + len(variant)

    # Find end (start of next remedy, or end of text)
    if i + 1 < len(remedy_data):
        end = remedy_data[i + 1]['position']
    else:
        end = len(text)

    content = text[start:end].strip()

    # Clean the content
    content = clean_remedy_content(content)

    # Build remedy object (preserve original metadata, replace text)
    fresh_remedy = {
        'id': original.get('id', 'kent-mm-' + name.lower().replace(' ', '-')),
        'name': name,
        'common': original.get('common', ''),
        'author': 'Kent',
        'letter': name[0].upper(),
        'chapter': 'Materia Medica',
        'organ': original.get('organ', ''),
        'modalities': original.get('modalities', ''),
        'constitution': original.get('constitution', ''),
        'relationships': original.get('relationships', ''),
        'dose': original.get('dose', ''),
        'keynote': original.get('keynote', ''),
        'full': content,
    }
    fresh_remedies.append(fresh_remedy)

    if i < 3 or i >= len(remedy_data) - 2:
        print(f"  [{i+1}/{len(remedy_data)}] {name}: {len(content):,} chars")

print(f"\n  Total fresh remedies: {len(fresh_remedies)}")

# ============================================================
# STEP 6: Save fresh data
# ============================================================
print("\n" + "=" * 70)
print("STEP 6: Save fresh Kent data")
print("=" * 70)

# Backup existing file
if os.path.exists(OUTPUT_JSON):
    backup = OUTPUT_JSON + '.bak'
    if os.path.exists(backup):
        os.remove(backup)
    os.rename(OUTPUT_JSON, backup)
    print(f"  Backed up existing file")

with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(fresh_remedies, f, ensure_ascii=False, separators=(',', ':'))

file_size = os.path.getsize(OUTPUT_JSON)
print(f"  Saved {len(fresh_remedies)} remedies to {OUTPUT_JSON}")
print(f"  File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")

# ============================================================
# STEP 7: Quality check
# ============================================================
print("\n" + "=" * 70)
print("STEP 7: Quality check")
print("=" * 70)

total_chars = sum(len(r['full']) for r in fresh_remedies)
avg_chars = total_chars / len(fresh_remedies) if fresh_remedies else 0
short_remedies = [r for r in fresh_remedies if len(r['full']) < 500]
duplicate_ids = len(fresh_remedies) - len(set(r['id'] for r in fresh_remedies))

print(f"  Total remedies: {len(fresh_remedies)}")
print(f"  Total text: {total_chars:,} chars")
print(f"  Average per remedy: {avg_chars:,.0f} chars")
print(f"  Short remedies (<500 chars): {len(short_remedies)}")
if short_remedies:
    for r in short_remedies[:5]:
        print(f"    - {r['name']}: {len(r['full'])} chars")
print(f"  Duplicate IDs: {duplicate_ids}")

# Verify Abrotanum (first remedy)
abr = next((r for r in fresh_remedies if r['name'] == 'Abrotanum'), None)
if abr:
    print(f"\n  === Abrotanum sample (first 500 chars) ===")
    print(f"  {abr['full'][:500]}")

print("\n" + "=" * 70)
print("FRESH OCR IMPORT COMPLETE")
print("=" * 70)
