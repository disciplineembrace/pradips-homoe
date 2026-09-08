#!/usr/bin/env python3
"""
Process '5 Kent MM.pdf' — extract and structure all remedies.

Output: data/books/kent-mm.json
Format: same as Patil book (chapters array with title + content)
"""
import json
import re
import os

INPUT_TXT = '/tmp/kent-mm-raw.txt'
OUTPUT_JSON = '/home/z/my-project/data/books/kent-mm.json'

with open(INPUT_TXT, 'r', encoding='utf-8', errors='replace') as f:
    raw = f.read()

print(f"Raw text size: {len(raw):,} chars")

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Remove page headers/footers
# ─────────────────────────────────────────────────────────────────────────────
text = re.sub(r'^\s*Nalanda Digital Library[^\n]*\n', '', raw, flags=re.MULTILINE)
text = re.sub(r'^\s*Public Domain Text[^\n]*\n', '', text, flags=re.MULTILINE)
text = re.sub(r'^\s*\d{1,4}\s*$', '', text, flags=re.MULTILINE)
text = re.sub(r'^\s*LECTURES ON HOM[ŒO]PATHIC MATERIA MEDICA\s*$', '', text, flags=re.MULTILINE)
text = re.sub(r'^\s*by JAMES TYLER KENT[^\n]*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
text = re.sub(r'^\s*Preface by[^\n]*$', '', text, flags=re.MULTILINE | re.IGNORECASE)

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Find all potential remedy headers in the content
# ─────────────────────────────────────────────────────────────────────────────
# A remedy header is a line that:
#   - Is 3-40 chars long
#   - Contains only Title Case words (e.g., "Bryonia Alba", "Aconitum Napellus")
#   - Has no punctuation (no period, comma, semicolon, colon)
#   - Is not a common English word or known non-remedy header

# Common false positives to skip
SKIP_WORDS = {
    'Materia Medica', 'Lectures On', 'Homoeopathic Materia', 'Public Domain',
    'Nalanda Digital', 'Regional Engineering', 'College Calicut',
    'James Tyler Kent', 'Preface', 'Index', 'Contents', 'Introduction',
    'Troublesome Hemorrhoids', 'Membranous Formations', 'It Was',
    'Materia', 'B', 'C', 'A', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
}

# Pattern: line with 1-3 Title Case words, no punctuation, 3-40 chars
# Title Case = first letter uppercase, rest lowercase
header_pattern = re.compile(
    r'^([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2})\s*$',
    re.MULTILINE
)

# Find all potential headers
candidates = []
for m in header_pattern.finditer(text):
    name = m.group(1).strip()
    if name in SKIP_WORDS:
        continue
    if len(name) < 4 or len(name) > 40:
        continue
    candidates.append((m.start(), m.end(), name))

print(f"Candidate headers found: {len(candidates)}")

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Filter candidates to keep only actual remedy headers
# ─────────────────────────────────────────────────────────────────────────────
# A real remedy header is followed by substantial content (not another header immediately)
# and is preceded by a blank line or the start of a section

# Sort by position
candidates.sort()

# Filter: keep only headers where the next ~100 chars contain actual content
# (letters, not just whitespace/other headers)
filtered = []
for i, (start, end, name) in enumerate(candidates):
    # Get content after this header
    next_pos = candidates[i + 1][0] if i + 1 < len(candidates) else len(text)
    content_after = text[end:min(end + 500, next_pos)]
    # Must have at least 100 chars of actual content (letters)
    alpha_count = sum(1 for c in content_after if c.isalpha())
    if alpha_count < 100:
        continue
    # Must not be immediately followed by another header (within 50 chars)
    if i + 1 < len(candidates) and candidates[i + 1][0] - end < 50:
        # Could be a sub-heading — skip if the next candidate is too close
        # But keep if this one has more content
        pass

    filtered.append((start, end, name))

print(f"Filtered headers: {len(filtered)}")

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Dedupe by name (keep first occurrence with most content)
# ─────────────────────────────────────────────────────────────────────────────
seen_names = set()
deduped = []
for start, end, name in filtered:
    if name.lower() in seen_names:
        continue
    seen_names.add(name.lower())
    deduped.append((start, end, name))

print(f"After dedup: {len(deduped)}")

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Extract and clean each remedy's content
# ─────────────────────────────────────────────────────────────────────────────
def clean_content(text: str) -> str:
    """Clean OCR artifacts."""
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


def format_remedy_content(name: str, content: str) -> str:
    """Format with bold remedy name and section headings."""
    formatted = f"**{name}**\n\n"
    lines = content.split('\n')
    formatted_lines = []
    for line in lines:
        # Bold section headings: "Introduction: ..." → "**Introduction:** ..."
        m = re.match(r'^([A-Z][a-zA-Z]+(?:\s+[a-z]+)?):\s*(.*)$', line)
        if m and len(m.group(1)) < 30:
            heading = m.group(1)
            rest = m.group(2).strip()
            formatted_lines.append(f"**{heading}:** {rest}".strip())
        else:
            formatted_lines.append(line)
    formatted += '\n'.join(formatted_lines)
    return formatted


remedies = []
for i, (start, end, name) in enumerate(deduped):
    next_start = deduped[i + 1][0] if i + 1 < len(deduped) else len(text)
    content = text[end:next_start]
    content = clean_content(content)
    formatted = format_remedy_content(name, content)
    remedies.append({
        'id': f'kent-{i+1:03d}',
        'name': name,
        'title': name,
        'author': 'James Tyler Kent',
        'category': 'Materia Medica',
        'content': formatted,
        'rawContent': content,
        'chapterIndex': i,
    })

print(f"\nRemedies processed: {len(remedies)}")

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Build the final book JSON
# ─────────────────────────────────────────────────────────────────────────────
# Group into chapters of 10 remedies each
chapters = []
for i in range(0, len(remedies), 10):
    batch = remedies[i:i+10]
    chapter_content = '\n\n---\n\n'.join(r['content'] for r in batch)
    chapter_num = (i // 10) + 1
    chapters.append({
        'id': f'kent-section-{chapter_num}',
        'title': f'Section {chapter_num} (Remedies {i+1}-{min(i+10, len(remedies))})',
        'content': chapter_content,
    })

book = {
    'id': 'kent-mm',
    'title': "Lectures on Homoeopathic Materia Medica",
    'author': 'James Tyler Kent',
    'category': 'Materia Medica',
    'description': 'Complete lectures on homoeopathic materia medica',
    'totalChapters': len(chapters),
    'chapters': chapters,
    'remedies': [{'id': r['id'], 'name': r['name'], 'content': r['content']} for r in remedies],
    'source': '5 Kent MM.pdf (OCR processed)',
}

os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(book, f, ensure_ascii=False, indent=2)

print(f"\n✓ Saved to: {OUTPUT_JSON}")
print(f"  Total remedies: {len(remedies)}")
print(f"  Total chapters: {len(chapters)}")
print(f"  File size: {os.path.getsize(OUTPUT_JSON):,} bytes")

# List all remedies
print(f"\n=== All {len(remedies)} remedies ===")
for i, r in enumerate(remedies, 1):
    content_len = len(r['content'])
    print(f"  {i:3d}. {r['name']:30s} ({content_len:,} chars)")

# Show first remedy sample
print(f"\n=== Sample: First remedy ({remedies[0]['name']}) ===")
print(remedies[0]['content'][:1000])
