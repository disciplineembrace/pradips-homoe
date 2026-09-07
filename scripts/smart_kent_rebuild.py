#!/usr/bin/env python3
"""
Smart Kent rebuild — merge fresh OCR with existing data.

Strategy:
1. Keep all 167 existing Kent remedies (preserve their IDs and metadata).
2. For each remedy, try to find it in the fresh OCR text.
3. If found AND the fresh text is cleaner/longer, replace the 'full' field.
4. If not found, keep the existing text (don't lose data).
5. Apply consistent heading formatting to ALL remedies.
"""
import json
import re
import os
import sys

REMEDIES_JSON = "/home/z/my-project/data/remedies.json"
FRESH_JSON = "/home/z/my-project/data/kent-remedies-fresh.json"
CLEAN_TXT = "/home/z/my-project/work/kent-ocr/kent-clean-fresh.txt"
OUTPUT_JSON = "/home/z/my-project/data/kent-remedies-final.json"


def clean_remedy_content(content):
    """Clean and format remedy text — applied to both fresh and existing text."""
    if not content:
        return ''

    # 1. Remove excessive blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    # 2. Remove leading/trailing whitespace per line
    lines = [line.strip() for line in content.split('\n')]

    # 3. Join broken lines — PDF formatting breaks sentences across multiple lines
    # Strategy: if a line doesn't end with sentence punctuation and the next line
    # isn't a heading, join them with a space.
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line:
            if merged and merged[-1] != '':
                merged.append('')
            i += 1
            continue

        # Check if this is a heading (## Heading format)
        is_heading = line.startswith('## ')

        # Check if line ends with sentence-ending punctuation
        ends_sentence = bool(re.search(r'[.!?;:]$', line.rstrip()))

        # Look ahead to next non-empty line
        next_line = ''
        next_idx = i + 1
        while next_idx < len(lines) and not lines[next_idx].strip():
            next_idx += 1
        if next_idx < len(lines):
            next_line = lines[next_idx].strip()

        # If not a heading, doesn't end with sentence punctuation, and there's a next line
        if (not is_heading and not ends_sentence and next_line
            and not next_line.startswith('## ')
            and not re.match(r'^[A-Z][a-z]+:\s*$', next_line)):

            # Join current line with next line
            merged.append(line + ' ' + next_line)
            # Skip to after next_line
            i = next_idx + 1
            continue

        merged.append(line)
        i += 1

    content = '\n'.join(merged)

    # 4. Clean up extra spaces (PDF has multiple spaces from layout)
    content = re.sub(r'  +', ' ', content)

    # 5. Remove lines that are only whitespace
    content = re.sub(r'\n[ \t]+\n', '\n\n', content)

    # 6. Format section headings as bold uppercase (plain text, not markdown)
    # First, strip any existing ## markdown prefixes (from prior cleaning)
    content = re.sub(r'^##\s+', '', content, flags=re.MULTILINE)

    # Kent uses "Heading:" format (e.g., "Mind:", "Chest:")
    # Convert to uppercase heading on its own line for clear visual separation
    headings = [
        'Introduction', 'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face',
        'Mouth', 'Throat', 'Stomach', 'Abdomen', 'Rectum', 'Urinary Organs',
        'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back',
        'Extremities', 'Sleep', 'Fever', 'Skin', 'Generalities',
        'Marasmus', 'Metastasis', 'Suppression', 'Relations',
        'Clinical', 'Symptoms', 'Modalities', 'Dose',
    ]
    for heading in headings:
        # Convert "Heading:" on its own line to "HEADING" (uppercase, no colon)
        content = re.sub(
            r'^' + re.escape(heading) + r'\s*:\s*$',
            f'\n{heading.upper()}',
            content,
            flags=re.MULTILINE
        )
        # Handle "Heading: text" on same line → "HEADING\ntext"
        content = re.sub(
            r'^' + re.escape(heading) + r'\s*:\s+',
            f'\n{heading.upper()}\n',
            content,
            flags=re.MULTILINE
        )

    # 7. Final cleanup
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = content.strip()

    return content

print("=" * 70)
print("SMART KENT REBUILD — merge fresh OCR with existing data")
print("=" * 70)

# Load existing remedies
with open(REMEDIES_JSON, "r", encoding="utf-8") as f:
    all_remedies = json.load(f)
kent_remedies = [r for r in all_remedies if r.get('author') == 'Kent']
print(f"Existing Kent remedies: {len(kent_remedies)}")

# Load fresh OCR data
with open(FRESH_JSON, "r", encoding="utf-8") as f:
    fresh_remedies = json.load(f)
print(f"Fresh OCR remedies: {len(fresh_remedies)}")

# Load full cleaned text for additional searches
with open(CLEAN_TXT, "r", encoding="utf-8") as f:
    full_text = f.read()
print(f"Full cleaned text: {len(full_text):,} chars")

# Build a lookup of fresh remedies by name (lowercase)
fresh_by_name = {}
for r in fresh_remedies:
    fresh_by_name[r['name'].lower()] = r

# Build a lookup of fresh remedies by first word (e.g., "Aconitum" from "Aconitum napellus")
fresh_by_first_word = {}
for r in fresh_remedies:
    first_word = r['name'].split()[0].lower()
    if first_word not in fresh_by_first_word:
        fresh_by_first_word[first_word] = r

# Process each existing Kent remedy
final_remedies = []
updated_count = 0
kept_count = 0

for remedy in kent_remedies:
    name = remedy['name']
    name_lower = name.lower()
    first_word = name.split()[0].lower()

    # Try to find fresh text
    fresh = fresh_by_name.get(name_lower) or fresh_by_first_word.get(first_word)

    if fresh and len(fresh.get('full', '')) > 200:
        # Use fresh text if it's reasonably long
        new_full = clean_remedy_content(fresh['full'])
        if len(new_full) > 200:
            remedy = {**remedy, 'full': new_full}
            updated_count += 1
        else:
            # Fresh text too short after cleaning, keep original
            remedy = {**remedy, 'full': clean_remedy_content(remedy.get('full', ''))}
            kept_count += 1
    else:
        # Not found in fresh OCR — keep existing text but clean it
        remedy = {**remedy, 'full': clean_remedy_content(remedy.get('full', ''))}
        kept_count += 1

    final_remedies.append(remedy)

print(f"\nResults:")
print(f"  Updated with fresh OCR text: {updated_count}")
print(f"  Kept existing (cleaned): {kept_count}")
print(f"  Total: {len(final_remedies)}")

# Save
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(final_remedies, f, ensure_ascii=False, separators=(',', ':'))

file_size = os.path.getsize(OUTPUT_JSON)
print(f"\nSaved to {OUTPUT_JSON}")
print(f"  File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")

# Quality check
total_chars = sum(len(r['full']) for r in final_remedies)
avg_chars = total_chars / len(final_remedies) if final_remedies else 0
short_remedies = [r for r in final_remedies if len(r['full']) < 500]
print(f"\nQuality:")
print(f"  Total text: {total_chars:,} chars")
print(f"  Average per remedy: {avg_chars:,.0f} chars")
print(f"  Short remedies (<500 chars): {len(short_remedies)}")
if short_remedies:
    for r in short_remedies[:5]:
        print(f"    - {r['name']}: {len(r['full'])} chars")

# Sample
abr = next((r for r in final_remedies if r['name'] == 'Abrotanum'), None)
if abr:
    print(f"\n=== Abrotanum sample (first 500 chars) ===")
    print(abr['full'][:500])

print("\n" + "=" * 70)
print("SMART KENT REBUILD COMPLETE")
print("=" * 70)
