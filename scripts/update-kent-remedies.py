#!/usr/bin/env python3
"""
Update Kent remedies in data/remedies.json with new OCR-processed data
from data/books/kent-mm.json.

Strategy:
  1. Load existing remedies.json
  2. Load new Kent MM book data (163 remedies with clean OCR)
  3. Remove ALL existing Kent author entries from remedies.json
  4. Convert new Kent remedies to the remedies.json format
  5. Insert the new Kent remedies
  6. Save back

CRITICAL:
  - Only Kent author remedies are affected (252 old → 163 new)
  - All other authors (Boericke, Phatak, Murphy, Allen, etc.) are UNTOUCHED
  - No data loss for non-Kent remedies
"""
import json
import re
import os

REMEDIES_FILE = '/home/z/my-project/data/remedies.json'
KENT_BOOK_FILE = '/home/z/my-project/data/books/kent-mm.json'

# Load existing remedies
print("Loading existing remedies.json...")
with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
    remedies = json.load(f)
print(f"  Total remedies: {len(remedies)}")

# Count by author
from collections import Counter
author_counts = Counter(r.get('author', '?') for r in remedies)
print(f"  Authors: {dict(author_counts)}")

# Load new Kent MM data
print("\nLoading new Kent MM book data...")
with open(KENT_BOOK_FILE, 'r', encoding='utf-8') as f:
    kent_book = json.load(f)
new_kent_remedies = kent_book.get('remedies', [])
print(f"  New Kent remedies: {len(new_kent_remedies)}")

# ─────────────────────────────────────────────────────────────────────────────
# Convert new Kent remedies to remedies.json format
# ─────────────────────────────────────────────────────────────────────────────
def clean_content(text: str) -> str:
    """Final OCR cleanup for the remedy content."""
    # Merge hyphenated breaks
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    # Merge single newlines within paragraphs
    text = re.sub(r'([a-z,;:.)])\n([a-z])', r'\1 \2', text)
    # Collapse blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Strip each line
    text = '\n'.join(line.strip() for line in text.split('\n'))
    return text.strip()


def extract_keynote(content: str) -> str:
    """Extract a keynote (summary) from the remedy content.
    Use the Introduction section, or first 1000 chars if no Introduction."""
    # Try to find Introduction section
    intro_match = re.search(r'\*\*Introduction:\*\*\s*(.*?)(?=\*\*[A-Z]|\Z)', content, re.DOTALL)
    if intro_match:
        keynote = intro_match.group(1).strip()
    else:
        # Use first 1000 chars (after the remedy name header)
        # Remove the **Remedy Name** header
        keynote = re.sub(r'^\*\*[^*]+\*\*\s*', '', content)
        keynote = keynote[:1000]

    # Clean up
    keynote = clean_content(keynote)
    return keynote


def extract_organ(content: str) -> str:
    """Extract organ systems from section headings."""
    organs = []
    # Common Kent section headings that represent organ systems
    organ_headings = ['Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
                      'Stomach', 'Abdomen', 'Rectum', 'Urinary', 'Male', 'Female',
                      'Respiratory', 'Heart', 'Chest', 'Back', 'Extremities', 'Sleep',
                      'Skin', 'Fever', 'Generals', 'Sexual', 'Marasmus', 'Metastasis',
                      'Suppression', 'Chest']
    for heading in organ_headings:
        pattern = rf'\*\*{heading}:?\*\*'
        if re.search(pattern, content):
            organs.append(heading)
    return ', '.join(organs[:5])  # Limit to 5


def make_remedy_id(name: str) -> str:
    """Generate a remedy ID from the name."""
    slug = name.lower().replace(' ', '-').replace('.', '').replace(',', '')
    # Remove non-alphanumeric
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    return f'kent-mm-{slug}'


# Build new Kent remedy entries
print("\nConverting new Kent remedies to remedies.json format...")
new_entries = []
for r in new_kent_remedies:
    name = r['name']
    content = r.get('content', '')

    # Clean the content
    cleaned_content = clean_content(content)

    # Extract fields
    keynote = extract_keynote(cleaned_content)
    organ = extract_organ(cleaned_content)

    # First letter for alphabetical grouping
    letter = name[0].upper() if name else '?'

    entry = {
        'id': make_remedy_id(name),
        'name': name,
        'common': '',  # Kent doesn't have common names in the OCR
        'author': 'Kent',
        'letter': letter,
        'chapter': 'Materia Medica',
        'organ': organ,
        'modalities': ' ',
        'constitution': keynote[:500] if keynote else '',
        'relationships': '',
        'dose': '',
        'keynote': keynote,
        'full': cleaned_content,
    }
    new_entries.append(entry)

print(f"  Generated {len(new_entries)} new Kent remedy entries")

# ─────────────────────────────────────────────────────────────────────────────
# Replace Kent remedies in the main remedies array
# ─────────────────────────────────────────────────────────────────────────────
print("\nReplacing Kent remedies in remedies.json...")

# Separate non-Kent remedies (keep them unchanged)
non_kent_remedies = [r for r in remedies if r.get('author') != 'Kent']
kent_remedies_old = [r for r in remedies if r.get('author') == 'Kent']

print(f"  Non-Kent remedies (preserved): {len(non_kent_remedies)}")
print(f"  Old Kent remedies (to be replaced): {len(kent_remedies_old)}")
print(f"  New Kent remedies: {len(new_entries)}")

# Combine: non-Kent first, then new Kent
# Sort each group alphabetically by name for consistent ordering
non_kent_remedies.sort(key=lambda r: r.get('name', '').lower())
new_entries.sort(key=lambda r: r.get('name', '').lower())

updated_remedies = non_kent_remedies + new_entries

print(f"\n  Final remedy count: {len(updated_remedies)}")
print(f"  (was {len(remedies)}, now {len(updated_remedies)})")

# Verify no data loss for other authors
new_author_counts = Counter(r.get('author', '?') for r in updated_remedies)
print(f"\n  New author counts: {dict(new_author_counts)}")

# Verify all non-Kent authors preserved
for author, count in author_counts.items():
    if author == 'Kent':
        continue
    new_count = new_author_counts.get(author, 0)
    if count != new_count:
        print(f"  ⚠ DATA LOSS: {author} was {count}, now {new_count}")
    else:
        print(f"  ✅ {author}: {count} → {new_count} (preserved)")

# ─────────────────────────────────────────────────────────────────────────────
# Save
# ─────────────────────────────────────────────────────────────────────────────
print(f"\nSaving updated remedies.json...")
# Backup first
import shutil
backup_path = REMEDIES_FILE + '.bak-kent'
shutil.copy2(REMEDIES_FILE, backup_path)
print(f"  Backup saved: {backup_path}")

with open(REMEDIES_FILE, 'w', encoding='utf-8') as f:
    json.dump(updated_remedies, f, ensure_ascii=False, indent=2)

new_size = os.path.getsize(REMEDIES_FILE)
print(f"  Updated file size: {new_size:,} bytes")
print(f"\n✓ Done! Kent remedies updated with new OCR data.")
print(f"  Old Kent count: {len(kent_remedies_old)}")
print(f"  New Kent count: {len(new_entries)}")
print(f"  Total remedies: {len(updated_remedies)}")

# Show a sample
print(f"\n=== Sample: Updated Kent remedy (Agnus Castus) ===")
sample = next((r for r in updated_remedies if r.get('name') == 'Agnus Castus' and r.get('author') == 'Kent'), None)
if sample:
    print(f"  ID: {sample['id']}")
    print(f"  Name: {sample['name']}")
    print(f"  Author: {sample['author']}")
    print(f"  Letter: {sample['letter']}")
    print(f"  Chapter: {sample['chapter']}")
    print(f"  Organ: {sample['organ']}")
    print(f"  Keynote length: {len(sample['keynote'])}")
    print(f"  Full length: {len(sample['full'])}")
    print(f"  Keynote preview:")
    print(f"    {sample['keynote'][:300]}...")
