#!/usr/bin/env python3
"""
Fresh OCR import of Kent's Materia Medica — PAGE-BASED extraction.

Source: upload/5 Kent MM.pdf (3174 pages)
Extracted with: pdftotext (no -layout, preserves form feeds as page breaks)

Strategy:
  - Split text by form feed (\f) into pages
  - For each page, check if it starts with a remedy name (after header)
  - A remedy page has: Nalanda header, then remedy name as first content line
  - Collect all pages for each remedy until the next remedy starts
  - Clean and structure the content
"""
import re
import json
import os

SOURCE_TEXT = "/home/z/my-project/work/kent-ocr/kent-pages.txt"
OUTPUT_JSON = "/home/z/my-project/data/kent-remedies-fresh.json"

print("=" * 70)
print("KENT MATERIA MEDICA — FRESH OCR (PAGE-BASED)")
print("=" * 70)

with open(SOURCE_TEXT, "r", encoding="utf-8") as f:
    full_text = f.read()

pages = full_text.split('\f')
print(f"Total pages: {len(pages)}")

# Parse TOC to get the list of remedy names
toc_pattern = re.compile(r'^(\d{1,3})-\s+(.+?)\s*$', re.MULTILINE)
toc_matches = toc_pattern.findall(full_text)

remedies_toc = []
for num, name in toc_matches:
    name = name.strip()
    if len(name) > 60:
        continue
    if not re.match(r'^[A-Z][a-zA-Z\s\.\(\)\-]+$', name):
        continue
    remedies_toc.append((int(num), name))

seen = set()
unique_remedies = []
for num, name in remedies_toc:
    if num not in seen and num <= 180:
        seen.add(num)
        unique_remedies.append((num, name))

print(f"TOC remedies: {len(unique_remedies)}")

# Build a set of remedy names for matching (normalize: lowercase, strip period)
def normalize_name(name):
    """Normalize remedy name for matching."""
    n = name.lower().strip().rstrip('.')
    n = re.sub(r'\([^)]*\)', '', n).strip()
    return n

remedy_name_map = {}
for num, name in unique_remedies:
    norm = normalize_name(name)
    remedy_name_map[norm] = (num, name)
    first_word = norm.split()[0]
    if first_word not in remedy_name_map:
        remedy_name_map[first_word] = (num, name)

# Add spelling variants (old Latin spelling -> modern)
VARIANTS = {
    'sulfur': 'sulphur',
    'sulfuricum': 'sulphuricum',
    'thuya': 'thuja',
    'ipecacuanha': 'ipecac',
}
for old, new in VARIANTS.items():
    if old in remedy_name_map:
        remedy_name_map[new] = remedy_name_map[old]
    elif new in remedy_name_map:
        remedy_name_map[old] = remedy_name_map[new]

# Find remedy start pages
remedy_page_starts = []

for i, page in enumerate(pages):
    lines = page.strip().split('\n')
    content_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if 'Nalanda Digital Library' in line:
            continue
        if 'Public Domain Text' in line:
            continue
        line = line.replace('\x0e', '').replace('\x02', '').strip()
        if not line:
            continue
        content_lines.append(line)

    if not content_lines:
        continue

    first_line = content_lines[0]
    norm_first = normalize_name(first_line)

    if not re.match(r'^[A-Z][a-zA-Z\s\.\(\)\-]+$', first_line):
        continue
    if len(first_line) > 60:
        continue

    if norm_first in remedy_name_map:
        num, name = remedy_name_map[norm_first]
        remedy_page_starts.append((i, num, name))
        continue

    first_word = norm_first.split()[0]
    if first_word in remedy_name_map:
        num, name = remedy_name_map[first_word]
        actual_name = name.lower().split()[0]
        if actual_name == first_word:
            remedy_page_starts.append((i, num, name))

# For missing remedies, search more aggressively — look for the remedy name
# in the first 3 content lines of each page
found_nums = set(rs[1] for rs in remedy_page_starts)
missing_remedies = [(num, name) for num, name in unique_remedies if num not in found_nums]

for num, name in missing_remedies:
    norm = normalize_name(name)
    first_word = norm.split()[0]
    variant = VARIANTS.get(first_word, first_word)

    search_terms = [norm, first_word, variant]
    abbrev = first_word[:4] + '.' if len(first_word) > 4 else first_word
    search_terms.append(abbrev.lower())

    # Also add the full name with different capitalization patterns
    # (e.g., "Ammonium Carbonicum" vs "Ammonium carbonicum")
    title_case = ' '.join(w.capitalize() for w in name.split())
    search_terms.append(title_case.lower())

    found = False
    for i, page in enumerate(pages):
        lines = page.strip().split('\n')
        content_lines = []
        for line in lines:
            line = line.strip()
            if not line or 'Nalanda' in line or 'Public Domain' in line:
                continue
            line = line.replace('\x0e', '').replace('\x02', '').strip()
            if line:
                content_lines.append(line)
        if not content_lines:
            continue

        # Check first 10 content lines (was 3)
        for line in content_lines[:10]:
            line_lower = line.lower().rstrip('.').strip()
            # Exact match
            if line_lower in search_terms:
                remedy_page_starts.append((i, num, name))
                found = True
                break
            # Line IS the remedy name (with possible trailing words)
            for term in [norm, first_word, variant, title_case.lower()]:
                if line_lower == term or line_lower.startswith(term + ' '):
                    if len(line) < 80:  # Avoid matching long sentences
                        remedy_page_starts.append((i, num, name))
                        found = True
                        break
            if found:
                break
        if found:
            break

# Deduplicate — keep only the first occurrence of each remedy number
seen_nums = set()
unique_starts = []
for page_idx, num, name in remedy_page_starts:
    if num not in seen_nums:
        seen_nums.add(num)
        unique_starts.append((page_idx, num, name))

# Sort by page index
unique_starts.sort(key=lambda x: x[0])

print(f"Found remedy start pages: {len(unique_starts)}")
for page_idx, num, name in unique_starts[:5]:
    print(f"  Page {page_idx+1}: #{num} {name}")
print(f"  ...")
for page_idx, num, name in unique_starts[-3:]:
    print(f"  Page {page_idx+1}: #{num} {name}")

# Extract content for each remedy (all pages from its start to the next remedy's start)
remedy_contents = []

for i, (page_idx, num, name) in enumerate(unique_starts):
    if i + 1 < len(unique_starts):
        next_page_idx = unique_starts[i + 1][0]
    else:
        next_page_idx = len(pages)

    # Collect all pages for this remedy
    content_pages = pages[page_idx:next_page_idx]
    raw_content = '\n'.join(content_pages)

    remedy_contents.append((num, name, raw_content))

print(f"\nExtracted content for {len(remedy_contents)} remedies")

# Clean OCR text
def clean_ocr_text(text, remedy_name):
    """Clean OCR artifacts from extracted text."""
    if not text:
        return ""

    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        line = line.strip()
        # Remove control chars
        line = line.replace('\x0e', '').replace('\x02', '').replace('\x0c', '')
        line = line.strip()

        if not line:
            continue

        # Skip page headers/footers
        if 'Nalanda Digital Library' in line:
            continue
        if 'Public Domain Text' in line:
            continue
        if re.match(r'^\d+$', line):  # page numbers
            continue

        # Skip the remedy name line (it appears at the top of each page section)
        if line.lower() == remedy_name.lower().rstrip('.'):
            continue

        # Remove excessive leading whitespace
        line = re.sub(r'^\s{8,}', '', line)

        cleaned_lines.append(line)

    # Join lines into paragraphs
    # A new paragraph starts when:
    # - Previous line ends with . : ; ? !
    # - Current line starts with a section label (Word:)
    # - Current line starts with a capital letter and previous ended with punctuation
    paragraphs = []
    current_para = []

    for line in cleaned_lines:
        # Check if this line is a section header (e.g., "Mind:", "Chest:")
        is_section = bool(re.match(r'^[A-Z][a-zA-Z\s]+:', line))

        if current_para:
            prev = current_para[-1]
            should_break = (
                prev.endswith('.') or
                prev.endswith(':') or
                prev.endswith(';') or
                prev.endswith('?') or
                prev.endswith('!') or
                is_section
            )
            if should_break:
                paragraphs.append(' '.join(current_para))
                current_para = [line]
            else:
                current_para.append(line)
        else:
            current_para = [line]

    if current_para:
        paragraphs.append(' '.join(current_para))

    # Join paragraphs with double newlines
    result = '\n\n'.join(paragraphs)

    # Fix OCR issues
    result = result.replace('œ', 'oe').replace('Œ', 'OE')
    result = re.sub(r' {2,}', ' ', result)
    result = re.sub(r'\s+([,.;:!?])', r'\1', result)
    result = re.sub(r'\(\s+', '(', result)
    result = re.sub(r'\s+\)', ')', result)

    # Fix "Introduction:" spacing (common OCR issue: "Introduction:This" -> "Introduction: This")
    result = re.sub(r'([a-z]):([A-Z])', r'\1: \2', result)

    return result.strip()

print("Cleaning OCR text...")
cleaned_remedies = []
for num, name, content in remedy_contents:
    cleaned = clean_ocr_text(content, name)
    cleaned_remedies.append((num, name, cleaned))

# Build remedy objects
def slugify(name):
    slug = re.sub(r'\([^)]*\)', '', name)
    slug = slug.rstrip('.')
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', slug.strip())
    return slug.lower().strip('-')

print("Building remedy objects...")
remedies = []
for num, name, content in cleaned_remedies:
    slug = slugify(name)
    remedy_id = f"kent-mm-{slug}"
    letter = name[0].upper() if name else '?'
    remedy = {
        "id": remedy_id,
        "name": name.rstrip('.'),
        "common": "",
        "author": "Kent",
        "letter": letter,
        "chapter": "Kent MM",
        "organ": "—",
        "modalities": "",
        "constitution": "",
        "relationships": "—",
        "dose": "",
        "keynote": content[:500] + "..." if len(content) > 500 else content,
        "full": content,
    }
    remedies.append(remedy)

# Sort by name
remedies.sort(key=lambda r: r['name'].lower())

# Write output
print(f"Writing {len(remedies)} remedies to {OUTPUT_JSON}")
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(remedies, f, ensure_ascii=False, indent=2)

file_size = os.path.getsize(OUTPUT_JSON)
print(f"File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")

# Verification
print("\n" + "=" * 70)
print("VERIFICATION")
print("=" * 70)
empty = [r for r in remedies if not r['full']]
print(f"Remedies with empty content: {len(empty)}")
if empty:
    for r in empty:
        print(f"  ⚠️ {r['name']}")

names = [r['name'] for r in remedies]
dupes = [n for n in names if names.count(n) > 1]
print(f"Duplicate names: {len(set(dupes))}")

ids = [r['id'] for r in remedies]
dup_ids = [i for i in ids if ids.count(i) > 1]
print(f"Duplicate IDs: {len(set(dup_ids))}")

lengths = [len(r['full']) for r in remedies if r['full']]
if lengths:
    print(f"\nContent length stats (non-empty only):")
    print(f"  Count: {len(lengths)}")
    print(f"  Min: {min(lengths)} chars")
    print(f"  Max: {max(lengths)} chars")
    print(f"  Avg: {sum(lengths) // len(lengths)} chars")
    print(f"  Total: {sum(lengths):,} chars")

# Show samples
if remedies:
    print(f"\nSample (first remedy):")
    r = remedies[0]
    print(f"  ID: {r['id']}")
    print(f"  Name: {r['name']}")
    print(f"  Length: {len(r['full'])} chars")
    print(f"  Preview: {r['full'][:300]}...")

print("\n" + "=" * 70)
print("DONE")
print("=" * 70)
